import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/axios';
import { Save, Download, CheckCircle, ArrowLeft, Info, Search } from 'lucide-react';
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

const SelfReviewForm = ({ period, onBack, readOnly }) => {
  const toast = useToast();
  const formRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [templateHtml, setTemplateHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [commanderName, setCommanderName] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch user profile
      const profileRes = await api.get('/users/profile');
      setProfile(profileRes.data);

      // Fetch Template HTML
      if (period?.templateId) {
        const tplRes = await api.get(`/templates/${period.templateId}/preview`);
        setTemplateHtml(tplRes.data.html);
      }

      // Prepopulate existing review data if any
      if (period?.Reviews?.[0]) {
        const review = period.Reviews[0];
        setTotalScore(review.selfScore || 0);
        
        try {
          const parsedFeedback = typeof review.feedback === 'string' ? JSON.parse(review.feedback) : (review.feedback || {});
          setCommanderName(parsedFeedback.commander || '');
          
          // Wait for next tick so dangerouslySetInnerHTML mounts
          setTimeout(() => {
             if (formRef.current && parsedFeedback.tableData) {
                const scoreInputs = formRef.current.querySelectorAll('.score-input');
                const noteInputs = formRef.current.querySelectorAll('.note-input');
                
                parsedFeedback.tableData.scores?.forEach((val, i) => {
                  if (scoreInputs[i]) scoreInputs[i].value = val;
                });
                parsedFeedback.tableData.notes?.forEach((val, i) => {
                  if (noteInputs[i]) noteInputs[i].value = val;
                });
                
                calculateTotalFromDOM();
             }
          }, 100);
        } catch(e) {}
      }
    } catch (err) {
      toast.error('Lỗi tải dữ liệu: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalFromDOM = () => {
    if (!formRef.current) return;
    const inputs = formRef.current.querySelectorAll('.score-input');
    let sum = 0;
    inputs.forEach(input => {
      sum += Number(input.value) || 0;
    });
    setTotalScore(sum);
  };

  const handleTableInput = (e) => {
    if (readOnly) {
       e.preventDefault();
       return;
    }
    if (e.target.classList.contains('score-input')) {
      calculateTotalFromDOM();
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

  const showSubmitConfirm = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Nộp Đánh Giá',
      message: 'Bạn có chắc chắn muốn gửi đánh giá cá nhân? Bạn sẽ không thể sửa đổi sau khi Quản lý đã duyệt.',
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

  const reviewMonth = new Date(period.endDate).getMonth() + 1;
  const reviewYear = new Date(period.endDate).getFullYear();
  const teamName = profile?.Team?.shortName || '';

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
          {readOnly && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wider border border-slate-200">Chế độ xem</span>}
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
                  <input type="text" readOnly className={`${inputClass} w-32 text-center text-blue-700`} value={teamName} />
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
                <input type="text" readOnly className={`${inputClass} w-12 text-center text-blue-700`} value={reviewMonth} />
                <span>năm</span>
                <input type="text" readOnly className={`${inputClass} w-16 text-center text-blue-700`} value={reviewYear} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm px-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 whitespace-nowrap">Họ và tên:</span>
                <input type="text" readOnly className={`${inputClass} flex-1 text-blue-700`} value={profile?.fullName || ''} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 whitespace-nowrap">Cấp bậc - Chức vụ:</span>
                <input type="text" readOnly className={`${inputClass} flex-1 text-blue-700`} value={`${profile?.rank || ''} - ${profile?.position || ''}`} />
              </div>
            </div>
          </div>

          {/* Dynamic Table from DOCX */}
          <div 
            ref={formRef}
            className={`docx-preview overflow-x-auto pb-4 ${readOnly ? 'pointer-events-none opacity-90' : ''}`} 
            dangerouslySetInnerHTML={{ __html: templateHtml || '<p class="text-center text-slate-500 py-10">Không tìm thấy nội dung biểu mẫu.</p>' }} 
            onInput={handleTableInput}
          />

          {/* Footer Layout based on Admin Preview */}
          <div className="pt-6 mt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between text-sm mb-8 gap-4 px-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Tổng điểm:</span>
                <input type="text" readOnly className={`${inputClass} w-24 text-center font-bold text-2xl text-blue-600 border-b-2`} value={totalScore} />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Xếp loại:</span>
                <input type="text" readOnly className={`${inputClass} w-48 font-bold text-lg text-emerald-600 border-b-2`} value={classifyScore(totalScore)} />
              </div>
            </div>
            
            <div className="flex justify-end text-sm text-slate-800 px-4 mt-6">
              <div className="text-center w-64">
                <p className="font-bold mb-1">CHỈ HUY ĐỘI</p>
                <p className="text-slate-500 italic mb-12">(Ký, ghi rõ họ tên)</p>
                <input 
                  type="text" 
                  readOnly={readOnly}
                  value={commanderName}
                  onChange={e => setCommanderName(e.target.value)}
                  placeholder="Nhập họ tên chỉ huy..."
                  className="w-full text-center font-semibold text-slate-800 border-b border-slate-300 focus:border-blue-500 outline-none pb-1 bg-transparent transition-colors placeholder:font-normal placeholder:text-slate-400"
                />
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
        </div>
      </div>

      {!readOnly && (
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 mt-4">
          <button className="px-6 py-2.5 text-slate-700 font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Xuất nháp (Word)
          </button>
          <button onClick={showSubmitConfirm} className="px-8 py-2.5 text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-200">
            <Save className="w-4 h-4" /> Lưu & Nộp bản đánh giá
          </button>
        </div>
      )}

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
};

export default SelfReviewForm;

