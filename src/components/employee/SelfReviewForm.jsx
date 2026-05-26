import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/axios';
import { Save, Download, CheckCircle, ArrowLeft, Info, Search, XCircle, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../common/ConfirmModal';

const DOCX_PREVIEW_STYLES = `
  .docx-preview table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .docx-preview th, .docx-preview td { border: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: top; }
  .docx-preview th { background: #f1f5f9; font-weight: 600; }
  .docx-preview thead th { background: #e2e8f0; text-align: center; }
  .docx-preview thead th:nth-child(1) { width: 5%; }
  .docx-preview thead th:nth-child(2) { width: 40%; }
  .docx-preview thead th:nth-child(3) { width: 15%; }
  .docx-preview thead th:nth-child(4) { width: 15%; }
  .docx-preview thead th:nth-child(5) { width: 25%; }
  .docx-preview td:has(input) { padding: 0; vertical-align: middle; height: 1px; }
  .docx-preview input.score-input,
  .docx-preview input.note-input { width: 100%; height: 100%; min-height: 34px; display: block; border: none; border-radius: 0; padding: 0 8px; font-size: 12px; background: #fff; outline: none; box-sizing: border-box; transition: background 0.15s, box-shadow 0.15s; }
  .docx-preview input.score-input { text-align: center; }
  .docx-preview input.score-input::-webkit-inner-spin-button,
  .docx-preview input.score-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .docx-preview input.score-input { -moz-appearance: textfield; }
  .docx-preview input.score-input:hover,
  .docx-preview input.note-input:hover { background: #f5f3ff; }
  .docx-preview input.score-input:focus,
  .docx-preview input.note-input:focus { background: #eef2ff; box-shadow: inset 0 0 0 2px #6366f1; }
  .docx-preview p { margin: 0; line-height: 1.4; }
`;

const inputClass = "h-7 border-b border-slate-300 bg-transparent outline-none px-1.5 text-slate-800 font-semibold focus:border-blue-500 transition-colors placeholder:font-normal placeholder:text-slate-400";

export default function SelfReviewForm({ period, onBack, employeeProfile = null, readOnly = false, isManagerMode = false, isLeader = false, onTotalScoreChange, onApprove }) {
  const { user: currentUserProfile } = useAuth();
  const toast = useToast();
  const formRef = useRef(null);
  const savedFeedbackRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [templateHtml, setTemplateHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [commanderName, setCommanderName] = useState('');
  const [commanderRank, setCommanderRank] = useState('');
  const [commanderPosition, setCommanderPosition] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [commanderTotalScore, setCommanderTotalScore] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  
  const isAdmin = (currentUserProfile?.roles && currentUserProfile.roles.includes("Admin")) || (profile?.roles && profile.roles.includes("Admin"));
  const actualIsLeader = isLeader || (profile?.roles && profile.roles.includes("Leader")) || ['Trưởng phòng', 'Phó trưởng phòng', 'Phó phòng'].includes(profile?.position);
  const isReadOnly = (readOnly || isSubmitted) && (!isManagerMode || (actualIsLeader && !isAdmin));

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });

  const reviewId = period?.Reviews?.[0]?.id;
  const periodId = period?.id;
  const targetUserId = employeeProfile?.id;

  useEffect(() => {
    fetchData();
  }, [periodId, reviewId, targetUserId]);

  // Manually inject HTML and configure inputs - only run when template or basic state changes
  useEffect(() => {
    if (formRef.current && !isLoading) {
      if (templateHtml) {
        // IMPORTANT: We only want to inject if it's currently empty or the template itself changed
        // This prevents wiping out user input on re-renders caused by score updates
        if (!formRef.current.innerHTML || formRef.current.getAttribute('data-template-id') !== period?.templateId) {
          formRef.current.innerHTML = templateHtml;
          formRef.current.setAttribute('data-template-id', period?.templateId);
          
          // Initial configuration of inputs
          const allInputs = formRef.current.querySelectorAll('input.score-input, input.note-input');
          allInputs.forEach(input => {
            const isCommanderScore = input.classList.contains('commander-score');
            
            // Determine if this specific input should be readonly/disabled based on role
            let shouldBeReadOnly = isReadOnly;
            if (!isReadOnly) {
              if (isManagerMode) {
                // Manager can edit commander-score AND note-input
                const isNoteInput = input.classList.contains('note-input');
                shouldBeReadOnly = !(isCommanderScore || isNoteInput);
              } else {
                // Employee can edit score (non-commander) and notes
                shouldBeReadOnly = isCommanderScore;
              }
            }

            input.readOnly = shouldBeReadOnly;
            if (shouldBeReadOnly) {
              input.classList.add('bg-slate-50', 'cursor-not-allowed');
              input.setAttribute('disabled', 'true');
            } else {
              input.classList.remove('bg-slate-50', 'cursor-not-allowed');
              input.removeAttribute('disabled');
            }

            // Prevent scroll wheel from modifying number inputs
            if (input.type === 'number') {
              input.addEventListener('wheel', (e) => {
                e.preventDefault();
              }, { passive: false });
            }
          });
          
          // Apply saved feedback if exists
          if (savedFeedbackRef.current && savedFeedbackRef.current.tableData) {
            const parsedFeedback = savedFeedbackRef.current;
            const scoreInputs = formRef.current.querySelectorAll('.score-input');
            const noteInputs = formRef.current.querySelectorAll('.note-input');
            
            parsedFeedback.tableData.scores?.forEach((val, i) => {
              if (scoreInputs[i]) scoreInputs[i].value = val;
            });
            parsedFeedback.tableData.notes?.forEach((val, i) => {
              if (noteInputs[i]) noteInputs[i].value = val;
            });
            
            // clear it so it doesn't re-apply if they change periods without unmounting
            savedFeedbackRef.current = null;
            
            setTimeout(() => calculateTree(), 50);
          }
        }
      } else {
        formRef.current.innerHTML = '<p class="text-center text-slate-500 py-10">Không tìm thấy nội dung biểu mẫu.</p>';
      }
    }
  }, [templateHtml, isLoading, isReadOnly, period?.templateId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch CURRENT logged in user (who is viewing this form)
      const currentUserRes = await api.get('/users/profile');
      const currentUser = currentUserRes.data;

      // 2. Determine whose review this is
      let reviewedUser = employeeProfile;
      if (!reviewedUser) {
        reviewedUser = currentUser;
      }
      setProfile(reviewedUser);

      // 3. Determine Commander Name
      // If the viewer is a Manager/Admin, they are the commander
      if ((currentUser.roles && (currentUser.roles.includes("Manager") || currentUser.roles.includes("Admin")))) {
        setCommanderName(currentUser.fullName);
      } else {
        // Otherwise use the employee's manager
        setCommanderName(reviewedUser.managerName || '');
      }

      // Fetch Template HTML
      if (period?.templateId) {
        const tplRes = await api.get(`/templates/${period.templateId}/preview`);
        setTemplateHtml(tplRes.data.html);
      }

      // Prepopulate existing review data if any
      if (period?.Reviews?.[0]) {
        const review = period.Reviews[0];
        setTotalScore(review.selfScore || 0);
        setCommanderTotalScore(review.score || 0);
        setReviewStatus(review.status || '');
        
        if (review.status && review.status !== 'Draft') {
          setIsSubmitted(true);
        }
        
        try {
          const parsedFeedback = typeof review.feedback === 'string' ? JSON.parse(review.feedback) : (review.feedback || {});
          savedFeedbackRef.current = parsedFeedback;
          if (parsedFeedback.commander) {
            setCommanderName(parsedFeedback.commander);
            setCommanderRank(parsedFeedback.commanderRank || '');
            setCommanderPosition(parsedFeedback.commanderPosition || '');
          } else if (isManagerMode && !isReadOnly) {
            setCommanderName(currentUser.fullName || '');
            setCommanderRank(currentUser.rank || '');
            setCommanderPosition(currentUser.position || '');
          }
        } catch(e) {}
      }
    } catch (err) {
      console.error('[FETCH-DATA-ERROR]', err);
      toast.error('Lỗi tải dữ liệu: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTree = () => {
    if (!formRef.current) return;
    const inputs = Array.from(formRef.current.querySelectorAll('.score-input'));
    
    // 1. Identify which inputs are parents (they have children pointing to them)
    const parentIds = new Set();
    inputs.forEach(input => {
      const parentId = input.getAttribute('data-parent-id');
      if (parentId && parentId !== 'root') {
        parentIds.add(parentId);
      }
    });

    // 2. Mark parents as readonly to prevent manual overriding of calculated sums
    inputs.forEach(input => {
      const id = input.getAttribute('data-id');
      if (parentIds.has(id)) {
        if (!input.readOnly) {
          input.readOnly = true;
          input.placeholder = "...";
        }
      }
    });

    // 3. Recursive function to calculate and update node values
    const getValue = (nodeId) => {
      const nodeInput = inputs.find(i => i.getAttribute('data-id') === nodeId);
      if (!nodeInput) return 0;

      const children = inputs.filter(i => i.getAttribute('data-parent-id') === nodeId);
      if (children.length > 0) {
        let sum = 0;
        children.forEach(child => {
          sum += getValue(child.getAttribute('data-id'));
        });
        nodeInput.value = sum; // Update parent's DOM
        return sum;
      } else {
        return Number(nodeInput.value) || 0;
      }
    };

    // 4. Calculate final totals for both employee and commander
    const calcRootSum = (rootFilterId) => {
      const roots = inputs.filter(i => i.getAttribute('data-parent-id') === rootFilterId);
      if (roots.length === 0) return 0;
      
      let total = 0;
      let valI = 0;
      let valII = 0;
      let isIIFilled = false;

      const checkIsFilled = (nodeId) => {
        const nodeInput = inputs.find(i => i.getAttribute('data-id') === nodeId);
        if (!nodeInput) return false;
        const children = inputs.filter(i => i.getAttribute('data-parent-id') === nodeId);
        if (children.length > 0) {
          return children.some(child => checkIsFilled(child.getAttribute('data-id')));
        } else {
          return nodeInput.value !== '';
        }
      };

      roots.forEach(child => {
         const val = getValue(child.getAttribute('data-id'));
         const row = child.closest('tr');
         const firstCellText = row?.querySelector('td')?.textContent.trim().toUpperCase() || '';
         
         if (firstCellText === 'I') {
           valI = val;
         } else if (firstCellText === 'II') {
           valII = val;
           isIIFilled = checkIsFilled(child.getAttribute('data-id')) || val > 0;
         } else if (firstCellText === 'III' || firstCellText.includes('CỘNG')) {
           total += val;
         } else if (firstCellText === 'IV' || firstCellText.includes('TRỪ')) {
           total -= val;
         } else {
           total += val;
         }
      });

      if (isIIFilled) {
        total += (valI + valII) / 2;
      } else {
        total += valI;
      }
      return total;
    };

    const employeeTotal = calcRootSum('root');
    const commanderTotal = calcRootSum('root_commander');
    
    setTotalScore(employeeTotal);
    setCommanderTotalScore(commanderTotal);
    
    if (onTotalScoreChange) {
      onTotalScoreChange(isManagerMode ? commanderTotal : employeeTotal);
    }
  };

  const handleTableInput = (e) => {
    if (isReadOnly) {
       e.preventDefault();
       return;
    }
    
    if (e.target.classList.contains('score-input')) {
      // Allow only positive integers
      const oldVal = e.target.value;
      const newVal = oldVal.replace(/[^0-9]/g, '');
      if (oldVal !== newVal) {
        e.target.value = newVal;
      }
      
      calculateTree();
    }
  };

  const cloneScores = () => {
    if (!formRef.current || isReadOnly) return;
    const inputs = formRef.current.querySelectorAll('.score-input:not(.commander-score)');
    inputs.forEach(input => {
      const id = input.getAttribute('data-id');
      if (id) {
        const commanderInput = formRef.current.querySelector(`.commander-score[data-id="${id}_commander"]`);
        if (commanderInput && !commanderInput.readOnly) {
          commanderInput.value = input.value;
        }
      }
    });
    calculateTree();
    toast.success("Đã sao chép điểm tự chấm sang điểm chỉ huy!");
  };

  const handleTableKeyDown = (e) => {
    if (isReadOnly) return;
    const target = e.target;
    if (target.tagName.toLowerCase() !== 'input' || target.readOnly) return;

    const isScore = target.classList.contains('score-input');
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const colInputs = Array.from(formRef.current.querySelectorAll(`input.${isScore ? 'score-input' : 'note-input'}:not([readonly])`));
      const colIndex = colInputs.indexOf(target);
      if (colIndex === -1) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (colIndex < colInputs.length - 1) colInputs[colIndex + 1].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (colIndex > 0) colInputs[colIndex - 1].focus();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      let atStart = true;
      let atEnd = true;
      try {
        atStart = target.selectionStart === 0;
        atEnd = target.selectionStart === target.value.length;
      } catch (err) {
        // type="number" throws error on selectionStart, we just let it jump immediately
      }

      if ((e.key === 'ArrowRight' && atEnd) || (e.key === 'ArrowLeft' && atStart)) {
        const allInputs = Array.from(formRef.current.querySelectorAll('input:not([readonly])'));
        const allIndex = allInputs.indexOf(target);
        if (allIndex === -1) return;

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (allIndex < allInputs.length - 1) allInputs[allIndex + 1].focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (allIndex > 0) allInputs[allIndex - 1].focus();
        }
      }
    }
  };

  const classifyScore = (score) => {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 75) return 'Hoàn thành tốt';
    if (score >= 60) return 'Hoàn thành';
    return 'Không hoàn thành';
  };

  const handleSubmit = async () => {
    // Extract DOM data
    const tableData = { scores: [], notes: [] };
    if (formRef.current) {
       const scoreInputs = formRef.current.querySelectorAll('.score-input');
       const noteInputs = formRef.current.querySelectorAll('.note-input');
       scoreInputs.forEach(i => tableData.scores.push(i.value));
       noteInputs.forEach(i => tableData.notes.push(i.value));
    }

    try {
      await api.post('/reviews/submit-personal', {
        reviewPeriodId: period.id,
        templateId: period.templateId,
        score: totalScore,
        feedback: { 
           commander: commanderName, 
           tableData, 
           classification: classifyScore(totalScore) 
        }
      });
      toast.success('Đã nộp đánh giá cá nhân thành công!');
      if (onBack) onBack();
    } catch (err) {
      toast.error('Lỗi nộp đánh giá: ' + (err.response?.data?.message || err.message));
    }
  };

  const exportDocx = async () => {
    let scores = [];
    let notes = [];

    // Strategy: Get data from the SAVED review (most reliable) or from DOM inputs as fallback
    if (period?.Reviews?.[0]?.feedback) {
      try {
        const parsedFeedback = typeof period.Reviews[0].feedback === 'string' 
          ? JSON.parse(period.Reviews[0].feedback) 
          : (period.Reviews[0].feedback || {});
        
        if (parsedFeedback.tableData) {
          scores = parsedFeedback.tableData.scores || [];
          notes = parsedFeedback.tableData.notes || [];
        }
      } catch (e) {
        console.warn('[EXPORT] Could not parse saved feedback, falling back to DOM', e);
      }
    }
    
    // Fallback: read from DOM if no saved data
    if (scores.length === 0 && formRef.current) {
      const scoreInputs = formRef.current.querySelectorAll('.score-input');
      const noteInputs = formRef.current.querySelectorAll('.note-input');
      scores = Array.from(scoreInputs).map(i => i.value);
      notes = Array.from(noteInputs).map(i => i.value);
    }

    console.log('[EXPORT-DOCX-FE] profile:', profile);
    console.log('[EXPORT-DOCX-FE] employeeProfile:', employeeProfile);

    try {
      const toastId = toast.info('Đang tạo file Word từ biểu mẫu gốc...', { autoClose: false });
      
      const payload = {
        templateId: period?.templateId,
        scores,
        notes,
        totalScore,
        metadata: {
          fullName: employeeProfile?.fullName || profile?.fullName,
          rank: employeeProfile?.rank || profile?.rank,
          position: employeeProfile?.position || profile?.position,
          teamName: employeeProfile?.Team?.shortName || 
                    employeeProfile?.Team?.name || 
                    employeeProfile?.teamName || 
                    profile?.Team?.shortName || 
                    profile?.Team?.name || 
                    profile?.teamName || '',
          month: period?.name?.match(/Tháng\s+(\d+)/)?.[1] || new Date().getMonth() + 1,
          year: period?.name?.match(/(\d{4})/)?.[1] || new Date().getFullYear(),
          classification: classifyScore(totalScore),
          commander: commanderName || period?.Reviews?.[0]?.feedback?.commander || ''
        }
      };
      console.log('[EXPORT-DOCX-FE] Team Name to Export:', payload.metadata.teamName);
      console.log('[EXPORT-DOCX-FE] Final Metadata:', payload.metadata);
      console.log('[EXPORT-DOCX-FE] payload:', payload);

      const response = await api.post('/reviews/export-draft-docx', payload, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ban_Danh_Gia_${profile?.fullName || 'NhanVien'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss(toastId);
      toast.success('Xuất file thành công!');
    } catch (err) {
      toast.error('Lỗi xuất file docx: ' + (err.response?.data?.message || err.message));
    }
  };

  const showSubmitConfirm = () => {
    // Check if the employee has filled ALL self scores
    let allFilled = true;
    let hasInputs = false;
    if (formRef.current) {
      const selfInputs = Array.from(formRef.current.querySelectorAll('.score-input')).filter(i => 
        !i.classList.contains('commander-score') && 
        !i.hasAttribute('disabled') &&
        !i.hasAttribute('readonly')
      );
      if (selfInputs.length > 0) hasInputs = true;
      for (let i = 0; i < selfInputs.length; i++) {
        // Skip validation for specific rows
        const tr = selfInputs[i].closest('tr');
        const rowText = tr ? tr.textContent || '' : '';
        if (rowText.includes('CÔNG TÁC NGHIỆP VỤ CƠ BẢN')) {
          continue;
        }
        
        if (!selfInputs[i].value || selfInputs[i].value.trim() === '') {
          allFilled = false;
          break;
        }
      }
    }
    
    if (hasInputs && !allFilled) {
      toast.error('Vui lòng tự chấm điểm đầy đủ tất cả các tiêu chí trước khi nộp!');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Nộp Đánh Giá',
      message: 'Bạn có chắc chắn muốn gửi đánh giá cá nhân? Bạn sẽ không thể sửa đổi sau khi Chỉ huy đội đã duyệt.',
      type: 'warning',
      onConfirm: handleSubmit
    });
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Đang chuẩn bị biểu mẫu...</div>;
  }

  if (!period) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center mt-4">
        <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">Không có dữ liệu kỳ đánh giá</h2>
      </div>
    );
  }

  const reviewMonth = period.monthYear ? period.monthYear.split('-')[1] : (new Date(period.endDate).getMonth() + 1);
  const reviewYear = period.monthYear ? period.monthYear.split('-')[0] : new Date(period.endDate).getFullYear();
  let teamName = profile?.Team?.shortName || profile?.Team?.name || '';
  // Strip redundant "Đội"
  teamName = teamName.replace(/^Đội\s+/i, '');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <style>{DOCX_PREVIEW_STYLES}</style>
      
      {/* Form Header Action Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-slate-600 hover:text-blue-600 flex items-center gap-2 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>
        <div className="flex items-center gap-3 text-sm">
          {isReadOnly && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wider border border-slate-200">Chế độ xem</span>}
        </div>
      </div>

      <div className="p-0 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Layout based on Admin Preview */}
          <div className="pb-6 mb-6 border-b-2 border-dashed border-slate-200">
            <div className="flex justify-between items-start text-sm text-slate-800 mb-6">
              <div className="text-center font-bold">
                <p>PHÒNG AN NINH MẠNG VÀ PCTP</p>
                <p>SỬ DỤNG CÔNG NGHỆ CAO</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span>ĐỘI</span>
                  <input type="text" readOnly className={`${inputClass} w-32 text-center text-blue-700 font-bold`} value={' ' + teamName} />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-semibold underline underline-offset-4">Độc lập – Tự do – Hạnh phúc</p>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="font-bold text-blue-900 text-xl mb-1">BẢNG CHẤM ĐIỂM</p>
              <p className="text-sm text-slate-600 font-medium">Đánh giá kết quả thực hiện nhiệm vụ của Cán bộ chiến sĩ</p>
              <div className="flex items-center justify-center gap-2 mt-3 text-sm font-semibold text-slate-800">
                <span>Tháng</span>
                <input type="text" readOnly className={`${inputClass} w-12 text-center text-blue-700`} value={' ' + reviewMonth} />
                <span>năm</span>
                <input type="text" readOnly className={`${inputClass} w-16 text-center text-blue-700`} value={' ' + reviewYear} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm px-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 whitespace-nowrap">Họ và tên:</span>
                <input type="text" readOnly className={`${inputClass} flex-1 text-blue-700 font-bold`} value={' ' + (profile?.fullName || '')} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 whitespace-nowrap">Cấp bậc - Chức vụ:</span>
                <input type="text" readOnly className={`${inputClass} flex-1 text-blue-700 font-bold`} value={' ' + `${profile?.rank || ''} - ${profile?.position || ''}`} />
              </div>
            </div>
          </div>

          {/* Dynamic Table from DOCX */}
          <div 
            id="manager-review-form"
            ref={formRef}
            className={`docx-preview overflow-x-auto pb-4 ${isReadOnly ? 'pointer-events-none opacity-90' : ''}`} 
            onInput={handleTableInput}
            onKeyDown={handleTableKeyDown}
          />

          {/* Footer Layout based on Admin Preview */}
          <div className="pt-6 mt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between text-sm mb-8 gap-4 px-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Tổng cá nhân:</span>
                <input type="text" readOnly className={`${inputClass} w-20 text-center font-bold text-2xl text-slate-600 border-b-2`} value={totalScore} />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Tổng chỉ huy:</span>
                <input type="text" readOnly className={`${inputClass} w-20 text-center font-bold text-2xl text-blue-600 border-b-2`} value={commanderTotalScore} />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Xếp loại:</span>
                <input type="text" readOnly className={`${inputClass} w-40 font-bold text-lg text-emerald-600 border-b-2`} value={classifyScore(commanderTotalScore > 0 ? commanderTotalScore : totalScore)} />
              </div>
            </div>
            
            <div className="flex justify-end text-sm text-slate-800 px-4 mt-6">
              <div className="text-center w-64">
                <p className="font-bold mb-1">CHỈ HUY ĐỘI</p>
                <p className="text-slate-500 italic mb-2">(Ký, ghi rõ họ tên)</p>
                {commanderName || (isManagerMode && !isReadOnly) ? (
                  <div className="mt-12 space-y-1">
                    <input 
                      type="text" 
                      readOnly={isReadOnly}
                      value={commanderName}
                      onChange={e => setCommanderName(e.target.value)}
                      placeholder="Nhập họ tên chỉ huy..."
                      className="w-full text-center font-bold text-lg text-blue-800 border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none bg-transparent transition-colors placeholder:font-normal placeholder:text-slate-400 placeholder:text-sm"
                    />
                    <div className="flex justify-center items-center text-xs font-medium text-slate-500 gap-1">
                      <input 
                        type="text" 
                        readOnly={isReadOnly}
                        value={commanderRank}
                        onChange={e => setCommanderRank(e.target.value)}
                        placeholder="Cấp bậc"
                        className="w-20 text-right border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none bg-transparent placeholder:font-normal"
                      />
                      <span>-</span>
                      <input 
                        type="text" 
                        readOnly={isReadOnly}
                        value={commanderPosition}
                        onChange={e => setCommanderPosition(e.target.value)}
                        placeholder="Chức vụ"
                        className="w-24 text-left border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none bg-transparent placeholder:font-normal"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-12 text-slate-400 italic font-normal text-sm">Chưa có chữ ký</div>
                )}
              </div>
            </div>
          </div>

          {/* Scoring Rules Guide */}
          <div className="mt-10 bg-amber-50/50 border border-amber-200/60 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 space-y-2">
                <p className="font-bold text-amber-800">Quy tắc chấm điểm (Tham khảo):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2 text-xs">
                  <p>• Từ 90 điểm trở lên: <strong className="text-emerald-700">Xuất sắc</strong></p>
                  <p>• Từ 75 – 89 điểm: <strong className="text-blue-700">Hoàn thành tốt</strong></p>
                  <p>• Từ 60 – 74 điểm: <strong className="text-amber-700">Hoàn thành</strong></p>
                  <p>• Dưới 60 điểm: <strong className="text-red-600">Không hoàn thành</strong></p>
                </div>
                <p className="text-amber-700/70 mt-3 text-xs italic">* Vui lòng điền điểm vào các ô trong bảng trên. Tổng điểm sẽ được hệ thống tự động tính toán.</p>
              </div>
            </div>
          </div>
          {/* History Log */}
          {(() => {
            let historyLog = [];
            try {
              const historyStr = period?.Reviews?.[0]?.history;
              if (historyStr) {
                historyLog = JSON.parse(historyStr);
              }
            } catch (e) {}

            if (historyLog.length > 0) {
              return (
                <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-slate-500" />
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Lịch sử đánh giá</h3>
                  </div>
                  <div className="space-y-4">
                    {historyLog.map((log, index) => (
                      <div key={index} className="flex gap-4 items-start relative">
                        {index !== historyLog.length - 1 && (
                          <div className="absolute top-6 bottom-[-16px] left-[7px] w-0.5 bg-slate-200"></div>
                        )}
                        <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 mt-1 flex-shrink-0 z-10"></div>
                        <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-700 text-sm">{log.user} <span className="font-normal text-slate-500 text-xs">({log.role})</span></span>
                            <span className="text-xs text-slate-400">{new Date(log.date).toLocaleString('vi-VN')}</span>
                          </div>
                          <div className="text-sm">
                            Thao tác: <span className="font-semibold text-blue-600">
                              {log.action === 'Submitted' ? 'Chỉ huy từ chối / Chờ duyệt' : 
                               log.action === 'ManagerReviewed' ? 'Chỉ huy đã duyệt' : 
                               log.action === 'Completed' ? 'Lãnh đạo đã duyệt (Hoàn thành)' : log.action}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

        </div>
      </div>

      <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 mt-4">
        {/* Back button for Manager Mode */}
        {isManagerMode && (
          <button 
            onClick={onBack} 
            className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
          >
            Quay lại
          </button>
        )}

        {(reviewStatus === 'ManagerReviewed' || reviewStatus === 'Completed' || reviewStatus === 'Reviewed') && (
          <button onClick={exportDocx} className="px-6 py-2.5 text-slate-700 font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Xuất file Word
          </button>
        )}

        {isManagerMode && (!actualIsLeader || isAdmin) && reviewStatus === 'Submitted' && (
          <>
            <button 
              onClick={cloneScores} 
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border border-indigo-200 flex items-center gap-2"
            >
              Sao chép điểm
            </button>
            <button 
              onClick={() => {
                // Check if the commander has filled ALL scores
                let allFilled = true;
                let hasInputs = false;
                if (formRef.current) {
                  const commanderInputs = formRef.current.querySelectorAll('.commander-score:not([readonly])');
                  if (commanderInputs.length > 0) hasInputs = true;
                  for (let i = 0; i < commanderInputs.length; i++) {
                    // Skip validation for specific rows
                    const tr = commanderInputs[i].closest('tr');
                    const rowText = tr ? tr.textContent || '' : '';
                    if (rowText.includes('CÔNG TÁC NGHIỆP VỤ CƠ BẢN')) {
                      continue;
                    }

                    if (!commanderInputs[i].value || commanderInputs[i].value.trim() === '') {
                      allFilled = false;
                      break;
                    }
                  }
                }
                
                if (hasInputs && !allFilled) {
                  toast.error('Vui lòng điền đầy đủ tất cả các ô điểm của chỉ huy trước khi duyệt!');
                  return;
                }

                setConfirmConfig({
                  isOpen: true,
                  title: 'Phê Duyệt Đánh Giá',
                  message: `Bạn có chắc chắn muốn phê duyệt bản đánh giá này với tổng điểm chỉ huy là ${commanderTotalScore} điểm? Điểm số sẽ được ghi nhận.`,
                  type: 'warning',
                  onConfirm: () => onApprove('ManagerReviewed', commanderName, commanderRank, commanderPosition)
                });
              }}
              className="px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
            >
              <CheckCircle className="w-4 h-4" /> Phê duyệt
            </button>
          </>
        )}

        {isManagerMode && actualIsLeader && (reviewStatus === 'ManagerReviewed' || reviewStatus === 'Submitted') && (
          <>
            <button 
              onClick={() => {
                setConfirmConfig({
                  isOpen: true,
                  title: 'Từ Chối Đánh Giá',
                  message: 'Bạn có chắc chắn muốn từ chối bản đánh giá này? Bản đánh giá sẽ được trả lại.',
                  type: 'warning',
                  onConfirm: () => onApprove(reviewStatus === 'ManagerReviewed' ? 'Submitted' : 'Draft', commanderName)
                });
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Từ chối
            </button>
            <button 
              onClick={() => {
                setConfirmConfig({
                  isOpen: true,
                  title: 'Phê Duyệt Đánh Giá',
                  message: 'Bạn có chắc chắn muốn phê duyệt bản đánh giá này? Kết quả sẽ được ghi nhận là Hoàn thành.',
                  type: 'warning',
                  onConfirm: () => onApprove('Completed', commanderName)
                });
              }}
              className="px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
            >
              <CheckCircle className="w-4 h-4" /> Phê duyệt (Lãnh đạo)
            </button>
          </>
        )}

        {!isReadOnly && !isManagerMode && (
          <button onClick={showSubmitConfirm} className="px-8 py-2.5 text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-200">
            <Save className="w-4 h-4" /> Lưu & Nộp bản đánh giá
          </button>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
}

