import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, Eye, CheckCircle, Clock, AlertCircle, Save, X, FileSignature, LayoutGrid, Users as UsersIcon, Calendar, Download, Info, UserCheck, Power, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import SelfReviewForm from '../employee/SelfReviewForm';

const removeVietnameseTones = (str) => {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/[^a-zA-Z0-9 ]/g, "");
  str = str.replace(/\s+/g, "_");
  return str;
};

const TeamReview = ({ periodId: propPeriodId, onBack, isAdminView = false }) => {
  const { user: currentUser } = useAuth();
  const isLeader = (currentUser?.roles && currentUser.roles.includes("Leader")) || 
                   ['Trưởng phòng', 'Phó trưởng phòng', 'Phó phòng'].includes(currentUser?.position);
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [stats, setStats] = useState({ total: 0, notStarted: 0, submitted: 0, managerReviewed: 0, completed: 0 });
  const [selectedReview, setSelectedReview] = useState(null);
  const [editScore, setEditScore] = useState('');
  const [editFeedback, setEditFeedback] = useState({ managerNote: '', commander: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const isManager = currentUser?.roles && currentUser.roles.includes("Manager");
  const [selectedStatus, setSelectedStatus] = useState(isManager && !isLeader ? 'Submitted' : '');
  const [selectedPeriodId, setSelectedPeriodId] = useState(propPeriodId || '');
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportTeamId, setExportTeamId] = useState('all');

  const reviewPeriodProps = useMemo(() => {
    if (!activePeriod || !selectedReview) return null;
    return { ...activePeriod, Reviews: [selectedReview] };
  }, [activePeriod, selectedReview]);

  const availableYears = useMemo(() => {
    if (!periods || periods.length === 0) return [new Date().getFullYear()];
    const years = periods.map(p => new Date(p.endDate).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  }, [periods]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(parseInt(exportYear))) {
      setExportYear(availableYears[0]);
    }
  }, [availableYears]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchTeamData(selectedPeriodId, pagination?.page || 1);
    }
  }, [selectedPeriodId, selectedDeptId, selectedTeamId, selectedStatus, searchTerm, pagination?.page]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const periodsRes = await api.get('/review-periods');
      setPeriods(periodsRes.data);

      if (propPeriodId) {
        const targetPeriod = periodsRes.data.find(p => p.id === parseInt(propPeriodId));
        setActivePeriod(targetPeriod);
        setSelectedPeriodId(parseInt(propPeriodId));
      }

      if ((currentUser?.roles && currentUser.roles.includes("Admin"))) {
        const teamsRes = await api.get('/teams');
        setDepartments(teamsRes.data);
      }
    } catch (err) {
      toast.error('Lỗi tải kỳ đánh giá: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async (periodId, pageNum = 1) => {
    try {
      setLoading(true);
      let url = `/reviews/team?periodId=${periodId}&page=${pageNum}&limit=10`;
      if (selectedTeamId !== 'all') {
        url += `&teamId=${selectedTeamId}`;
      } else if (selectedDeptId !== 'all') {
        url += `&departmentId=${selectedDeptId}`;
      }
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      const teamRes = await api.get(url);
      setTeamData(teamRes.data.data || []);
      setPagination(teamRes.data.pagination || { page: 1, totalPages: 1, total: 0 });
      setStats(teamRes.data.stats || { total: 0, notStarted: 0, submitted: 0, managerReviewed: 0, completed: 0 });
    } catch (err) {
      toast.error('Lỗi tải danh sách đội: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (user) => {
    const review = user.ReviewsReceived && user.ReviewsReceived[0];
    if (!review) return;

    setSelectedReview({ ...review, user });
    setEditScore(review.score);

    const fb = typeof review.feedback === 'string' ? JSON.parse(review.feedback) : review.feedback;
    setEditFeedback(fb);
  };

  const handleApprove = async (targetStatus, formCommanderName, formCommanderRank, formCommanderPosition, formCommanderScore) => {
    if (!selectedReview) return;
    
    let tableData = { scores: [], notes: [] };
    const formEl = document.querySelector('.docx-preview');
    if (formEl) {
       const scoreInputs = formEl.querySelectorAll('.score-input');
       const noteInputs = formEl.querySelectorAll('.note-input');
       
       scoreInputs.forEach(i => tableData.scores.push(i.value));
       noteInputs.forEach(i => tableData.notes.push(i.value));
    }

    const finalFeedback = {
       ...editFeedback,
       tableData,
       commander: formCommanderName || editFeedback.commander,
       commanderRank: formCommanderRank || editFeedback.commanderRank,
       commanderPosition: formCommanderPosition || editFeedback.commanderPosition
    };

    const finalScore = targetStatus === 'ManagerReviewed' || targetStatus === 'Completed' 
                       ? (formCommanderScore !== undefined ? formCommanderScore : editScore) 
                       : editScore;

    try {
      await api.put(`/reviews/${selectedReview.id}/approve`, {
        status: targetStatus,
        score: finalScore,
        feedback: finalFeedback
      });
      toast.success(targetStatus === 'Submitted' ? 'Đã trả lại đánh giá cho chỉ huy!' : 'Đã duyệt đánh giá thành công!');
      setSelectedReview(null);
      fetchTeamData(selectedPeriodId, pagination?.page || 1);
    } catch (err) {
      toast.error('Lỗi thao tác đánh giá: ' + (err.response?.data?.message || err.message));
    }
  };

  const getFormattedFileName = (fileName, member) => {
    const ext = fileName ? fileName.substring(fileName.lastIndexOf('.')) : '.docx';
    const periodName = activePeriod?.name ? removeVietnameseTones(activePeriod.name) : 'Ky_Danh_Gia';
    let rawTeamName = member?.Team?.shortName || member?.Team?.fullName || member?.Team?.name || '';
    const teamName = removeVietnameseTones(rawTeamName) || 'Doi';
    const fullName = removeVietnameseTones(member?.fullName || 'NhanVien');
    return `${periodName}_${teamName}_${fullName}_Document${ext}`;
  };

  const handleDownloadAttachment = (reviewId, fileName, member) => {
    api.get(`/reviews/${reviewId}/attachment`, { responseType: 'blob' })
      .then(res => {
        const finalFileName = getFormattedFileName(fileName, member);
        
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', finalFileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Đã tải file đính kèm!');
      })
      .catch(err => {
        console.error('Download error:', err);
        toast.error('Lỗi tải file đính kèm: ' + (err.response?.data?.message || err.message));
      });
  };

  const handleExportWord = async (member) => {
    const review = member.ReviewsReceived?.[0];
    if (!review) return;

    try {
      const feedbackData = typeof review.feedback === 'string' ? JSON.parse(review.feedback) : (review.feedback || {});
      const tableData = feedbackData.tableData || { scores: [], notes: [] };
      
      const res = await api.post('/reviews/export-draft-docx', {
        templateId: review.templateId,
        scores: tableData.scores,
        notes: tableData.notes,
        totalScore: review.score,
        metadata: {
          fullName: member.fullName,
          rank: member.rank,
          position: member.position,
          teamName: member.Team?.fullName || '',
          month: new Date(activePeriod?.endDate).getMonth() + 1,
          year: new Date(activePeriod?.endDate).getFullYear(),
          classification: review.score >= 90 ? 'Hoàn thành xuất sắc nhiệm vụ' : 
                          review.score >= 70 ? 'Hoàn thành tốt nhiệm vụ' :
                          review.score >= 50 ? 'Hoàn thành nhiệm vụ' : 'Không hoàn thành nhiệm vụ',
          commander: feedbackData.commander || ''
        }
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ban_Danh_Gia_${member.username}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Đang tải file Word...');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Lỗi xuất file: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePeriodChange = (e) => {
    const periodId = e.target.value;
    setSelectedPeriodId(periodId);
    const period = periods.find(p => p.id === parseInt(periodId));
    setActivePeriod(period);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExportExcel = async () => {
    try {
      toast.info('Đang tạo báo cáo Excel...');
      let url = `/reviews/export-excel?year=${exportYear}`;
      if ((currentUser?.roles && currentUser.roles.includes("Admin")) && exportTeamId !== 'all') {
        url += `&teamId=${exportTeamId}`;
      }
      
      const response = await api.get(url, {
        responseType: 'blob'
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Ket_qua_danh_gia_Nam_${exportYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportModal(false);
    } catch (error) {
      toast.error('Lỗi xuất Excel: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
      case 'ManagerReviewed': 
      case 'Reviewed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'Submitted': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Completed':
      case 'Reviewed': return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold border border-emerald-100">Hoàn tất</span>;
      case 'ManagerReviewed': return <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold border border-blue-100">Chờ Lãnh đạo duyệt</span>;
      case 'Submitted': return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-100">Chờ chỉ huy duyệt</span>;
      default: return <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-xs font-medium border border-slate-100">Chưa nộp</span>;
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Đang tải danh sách đội...</div>;

  if (!activePeriod) {
    const now = new Date();
    const openPeriods = periods.filter(p => p.status === 'Open' && new Date(p.startDate) <= now);
    const upcomingPeriods = periods.filter(p => p.status === 'Open' && new Date(p.startDate) > now);
    const closedPeriods = periods.filter(p => p.status === 'Closed');

    const renderPeriodCard = (p) => (
      <div 
        key={p.id} 
        onClick={() => { setSelectedPeriodId(p.id); setActivePeriod(p); setPagination(prev => ({...prev, page: 1})); }}
        className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col gap-3 group"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{p.monthYear || 'N/A'}</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{p.name}</h3>
          <p className="text-sm text-slate-500 mt-1">Từ {new Date(p.startDate).toLocaleDateString('vi-VN')} đến {new Date(p.endDate).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>
    );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-7xl mx-auto">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Power className="w-5 h-5 text-emerald-500" /> Kỳ đang mở</h2>
          {openPeriods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openPeriods.map(renderPeriodCard)}
            </div>
          ) : <p className="text-slate-500 italic bg-white p-6 rounded-xl border border-slate-200 text-center">Không có kỳ đánh giá nào đang mở.</p>}
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Kỳ sắp mở</h2>
          {upcomingPeriods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPeriods.map(renderPeriodCard)}
            </div>
          ) : <p className="text-slate-500 italic bg-white p-6 rounded-xl border border-slate-200 text-center">Không có kỳ đánh giá nào sắp mở.</p>}
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-slate-500" /> Kỳ đã hoàn tất</h2>
          {closedPeriods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedPeriods.map(renderPeriodCard)}
            </div>
          ) : <p className="text-slate-500 italic bg-white p-6 rounded-xl border border-slate-200 text-center">Chưa có kỳ đánh giá nào hoàn tất.</p>}
        </div>
      </div>
    );
  }

  // Render Review Detail View
  if (selectedReview && activePeriod) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
        <SelfReviewForm 
          period={reviewPeriodProps}
          employeeProfile={selectedReview.user}
          readOnly={selectedReview.status === 'Reviewed' || selectedReview.status === 'Completed' || isAdminView || (currentUser?.roles?.includes("Admin") && !currentUser?.roles?.includes("Manager") && !currentUser?.roles?.includes("Leader"))}
          isManagerMode={true}
          isLeader={isLeader}
          isAdminMode={isAdminView || (currentUser?.roles?.includes("Admin") && !currentUser?.roles?.includes("Manager") && !currentUser?.roles?.includes("Leader"))}
          onTotalScoreChange={(score) => setEditScore(score)}
          onApprove={handleApprove}
          onBack={() => setSelectedReview(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
              <X className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              {propPeriodId ? activePeriod?.name : 'Quản lý đánh giá'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Theo dõi tiến độ và phê duyệt biểu mẫu</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm tên nhân viên..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowExportModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Xuất báo cáo Excel
            </button>

            {(currentUser?.roles && currentUser.roles.includes("Admin")) && (
              <div className="relative">
                <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selectedTeamId} 
                  onChange={(e) => { setSelectedTeamId(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                  className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer bg-white"
                >
                  <option value="all">Tất cả các Đội</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.shortName || d.fullName}</option>
                  ))}
                </select>
              </div>
            )}



            {!propPeriodId && (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selectedPeriodId} 
                  onChange={handlePeriodChange}
                  className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer bg-white"
                >
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div 
          onClick={() => { setSelectedStatus(''); setPagination(prev => ({...prev, page: 1})); }}
          className={`cursor-pointer p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-4 ${
            selectedStatus === '' 
            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
            : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
          }`}
        >
          <div className={`p-3 rounded-xl ${selectedStatus === '' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}><UsersIcon className="w-5 h-5" /></div>
          <div><p className={`text-xs font-medium ${selectedStatus === '' ? 'text-blue-100' : 'text-slate-500'}`}>Tổng nhân sự</p><p className="text-xl font-bold">{stats.total}</p></div>
        </div>

        <div 
          onClick={() => { setSelectedStatus('Draft'); setPagination(prev => ({...prev, page: 1})); }}
          className={`cursor-pointer p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-4 ${
            selectedStatus === 'Draft' 
            ? 'bg-slate-700 border-slate-700 text-white shadow-md shadow-slate-200' 
            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400'
          }`}
        >
          <div className={`p-3 rounded-xl ${selectedStatus === 'Draft' ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-600'}`}><AlertCircle className="w-4 h-4" /></div>
          <div><p className={`text-xs font-medium ${selectedStatus === 'Draft' ? 'text-slate-200' : 'text-slate-500'}`}>Chưa nộp</p><p className="text-xl font-bold">{stats.notStarted}</p></div>
        </div>

        <div 
          onClick={() => { setSelectedStatus('Submitted'); setPagination(prev => ({...prev, page: 1})); }}
          className={`cursor-pointer p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-4 ${
            selectedStatus === 'Submitted' 
            ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200' 
            : 'bg-white border-slate-200 text-slate-800 hover:border-amber-300'
          }`}
        >
          <div className={`p-3 rounded-xl ${selectedStatus === 'Submitted' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}><Clock className="w-4 h-4" /></div>
          <div><p className={`text-xs font-medium ${selectedStatus === 'Submitted' ? 'text-amber-50' : 'text-slate-500'}`}>Chờ chỉ huy duyệt</p><p className="text-xl font-bold">{stats.submitted}</p></div>
        </div>

        <div 
          onClick={() => { setSelectedStatus('ManagerReviewed'); setPagination(prev => ({...prev, page: 1})); }}
          className={`cursor-pointer p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-4 ${
            selectedStatus === 'ManagerReviewed' 
            ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200' 
            : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
          }`}
        >
          <div className={`p-3 rounded-xl ${selectedStatus === 'ManagerReviewed' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}><UserCheck className="w-4 h-4" /></div>
          <div><p className={`text-xs font-medium ${selectedStatus === 'ManagerReviewed' ? 'text-blue-50' : 'text-slate-500'}`}>Chờ lãnh đạo duyệt</p><p className="text-xl font-bold">{stats.managerReviewed || 0}</p></div>
        </div>

        <div 
          onClick={() => { setSelectedStatus('Reviewed'); setPagination(prev => ({...prev, page: 1})); }}
          className={`cursor-pointer p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-4 ${
            selectedStatus === 'Reviewed' || selectedStatus === 'Completed'
            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200' 
            : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className={`p-3 rounded-xl ${selectedStatus === 'Reviewed' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle className="w-4 h-4" /></div>
          <div><p className={`text-xs font-medium ${selectedStatus === 'Reviewed' ? 'text-emerald-100' : 'text-slate-500'}`}>Hoàn tất</p><p className="text-xl font-bold">{stats.completed}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Nhân viên</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Đội</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Tự chấm</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Chỉ huy chấm</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Xếp loại</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teamData.map((member) => {
                const review = member.ReviewsReceived && member.ReviewsReceived[0];
                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {member.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{member.fullName}</p>
                          <p className="text-xs text-slate-500">{member.rank} - {member.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {member.Team?.shortName || member.Team?.fullName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusLabel(review?.status)}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-slate-600 whitespace-nowrap">
                      {review?.selfScore || review?.score || '-'}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-indigo-600 bg-indigo-50/30 whitespace-nowrap">
                      {review?.status !== 'Submitted' && review?.status !== 'Draft' && review?.status !== undefined
                        ? review?.score
                        : '-'}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${(review?.score >= 90) ? 'text-emerald-700 bg-emerald-50' :
                          (review?.score >= 70) ? 'text-blue-700 bg-blue-50' :
                            (review?.score >= 50) ? 'text-amber-700 bg-amber-50' :
                              (review?.score !== undefined) ? 'text-red-700 bg-red-50' : 'text-slate-400 bg-slate-50'
                        }`}>
                        {review?.score ? (
                          review.score >= 90 ? 'Xuất sắc' :
                            review.score >= 70 ? 'Khá' :
                              review.score >= 50 ? 'Hoàn thành' : 'Không hoàn thành'
                        ) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {review ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {review.attachmentFile && (
                            <button
                              onClick={() => handleDownloadAttachment(review.id, review.attachmentFile, member)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                              title="Tải đính kèm"
                            >
                              <FileText className="w-4 h-4" /> <span className="max-w-[120px] truncate">{getFormattedFileName(review.attachmentFile, member)}</span>
                            </button>
                          )}
                          {(review.status === 'Reviewed' || review.status === 'Completed') && (
                            <button
                              onClick={() => handleExportWord(member)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                              title="Xuất file Word"
                            >
                              <Download className="w-4 h-4" /> Xuất Word
                            </button>
                          )}
                          <button
                            onClick={() => openReviewModal(member)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" /> 
                            {review.status === 'Reviewed' || review.status === 'Completed' || isAdminView || (currentUser?.roles?.includes("Admin") && !currentUser?.roles?.includes("Manager") && !currentUser?.roles?.includes("Leader")) ? 'Xem' : 'Xem & Duyệt'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm italic">Chưa nộp</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Hiển thị <span className="text-slate-800 font-bold">{teamData.length}</span> nhân sự
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination?.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Trang trước
            </button>
            <div className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-700">
              {pagination?.page || 1} / {pagination?.totalPages || 1}
            </div>
            <button
              disabled={pagination?.page >= pagination?.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <FileSignature className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Xuất báo cáo Excel</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Chọn năm xuất báo cáo</label>
                <select 
                  value={exportYear}
                  onChange={(e) => setExportYear(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm appearance-none bg-white cursor-pointer"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>Năm {year}</option>
                  ))}
                </select>
              </div>

              {(currentUser?.roles && currentUser.roles.includes("Admin")) && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Đội (Dành cho Admin)</label>
                  <select 
                    value={exportTeamId} 
                    onChange={(e) => setExportTeamId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  >
                    <option value="all">Tất cả các Đội</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.fullName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowExportModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">
                Hủy
              </button>
              <button 
                onClick={handleExportExcel} 
                className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Xuất file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamReview;
