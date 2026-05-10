import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, Eye, CheckCircle, Clock, AlertCircle, Save, X, FileSignature, LayoutGrid, Users as UsersIcon, Calendar, Download, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import SelfReviewForm from '../employee/SelfReviewForm';

const TeamReview = ({ periodId: propPeriodId, onBack }) => {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(propPeriodId || '');
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [activePeriod, setActivePeriod] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editScore, setEditScore] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [stats, setStats] = useState({ total: 0, notStarted: 0, submitted: 0, managerReviewed: 0, completed: 0 });

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
      } else {
        const activeRes = await api.get('/review-periods/active');
        if (activeRes.data) {
          setActivePeriod(activeRes.data);
          setSelectedPeriodId(activeRes.data.id);
        } else if (periodsRes.data.length > 0) {
          setSelectedPeriodId(periodsRes.data[0].id);
        }
      }

      if (currentUser?.role === 'Admin') {
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

  const handleApprove = async () => {
    try {
      await api.put(`/reviews/${selectedReview.id}/approve`, {
        status: 'ManagerReviewed',
        score: editScore,
        feedback: editFeedback
      });
      toast.success('Đã duyệt đánh giá thành công!');
      setSelectedReview(null);
      fetchTeamData(selectedPeriodId, pagination?.page || 1);
    } catch (err) {
      toast.error('Lỗi duyệt đánh giá: ' + (err.response?.data?.message || err.message));
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
      const response = await api.get(`/reviews/export-excel?periodId=${selectedPeriodId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ket_qua_danh_gia_${activePeriod?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Thang'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Lỗi xuất Excel: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'ManagerReviewed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'Submitted': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Completed': return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold border border-emerald-100">Hoàn tất</span>;
      case 'ManagerReviewed': return <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold border border-blue-100">Chỉ huy đánh giá</span>;
      case 'Submitted': return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-100">Đã nộp</span>;
      default: return <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-xs font-medium border border-slate-100">Chưa nộp</span>;
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Đang tải danh sách đội...</div>;

  if (!activePeriod) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">Không có kỳ đánh giá nào đang mở để theo dõi.</p>
      </div>
    );
  }

  // Render Review Detail View
  if (selectedReview) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
        {/* Full Document View (ReadOnly) */}
        <SelfReviewForm 
          period={{...activePeriod, Reviews: [selectedReview]}}
          employeeProfile={selectedReview.user}
          readOnly={true}
          onBack={() => setSelectedReview(null)}
        />

        {/* Manager Approval Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
          <div className="bg-blue-50 border-b border-blue-100 p-4">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-blue-600" />
              Phê duyệt đánh giá nhân viên: {selectedReview.user.fullName}
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Điểm phê duyệt cuối cùng <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="number"
                  value={editScore}
                  onChange={e => setEditScore(e.target.value)}
                  className="w-full border-slate-300 rounded-xl p-4 pl-6 border-2 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-black text-blue-700 text-3xl transition-all shadow-inner"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-50 p-2 rounded flex gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                Mặc định là tổng điểm nhân viên tự đánh giá. Chỉ huy có thể điều chỉnh lại thành điểm cuối cùng.
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nhận xét của Chỉ huy</label>
              <textarea
                rows="4"
                value={editFeedback?.managerNote || ''}
                onChange={e => setEditFeedback({ ...editFeedback, managerNote: e.target.value })}
                className="w-full border-slate-300 rounded-xl p-3 border-2 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                placeholder="Ghi chú ý kiến đánh giá, nhận xét ưu khuyết điểm..."
              ></textarea>
            </div>
          </div>
          <div className="bg-slate-50 p-5 border-t border-slate-200 flex justify-end gap-3">
            <button 
              onClick={() => setSelectedReview(null)} 
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
            >
              Quay lại danh sách
            </button>
            <button 
              onClick={handleApprove} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Lưu & Phê duyệt biểu mẫu
            </button>
          </div>
        </div>
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
              {propPeriodId ? activePeriod?.name : 'Kết quả đánh giá theo Kỳ'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Bảng kết quả chi tiết từng cá nhân</p>
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
            {selectedPeriodId && (
              <button 
                onClick={handleExportExcel}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Xuất báo cáo Excel
              </button>
            )}

            {currentUser?.role === 'Admin' && (
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

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={selectedStatus} 
                onChange={(e) => { setSelectedStatus(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer bg-white"
              >
                <option value="">Trạng thái: Tất cả</option>
                <option value="Draft">Chưa nộp</option>
                <option value="Submitted">Đã nộp</option>
                <option value="ManagerReviewed">Chỉ huy đánh giá</option>
                <option value="Completed">Hoàn tất</option>
              </select>
            </div>

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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><UsersIcon className="w-5 h-5" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Tổng nhân sự</p><p className="text-xl font-bold text-slate-800">{stats.total}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-slate-50 p-3 rounded-xl text-slate-600"><AlertCircle className="w-4 h-4" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Chưa nộp</p><p className="text-xl font-bold text-slate-600">{stats.notStarted}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><Clock className="w-4 h-4" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Đã nộp</p><p className="text-xl font-bold text-amber-600">{stats.submitted}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><FileSignature className="w-4 h-4" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Chỉ huy duyệt</p><p className="text-xl font-bold text-indigo-600">{stats.managerReviewed}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><CheckCircle className="w-4 h-4" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Hoàn tất</p><p className="text-xl font-bold text-emerald-600">{stats.completed}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Đội</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Tự chấm</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Chỉ huy chấm</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Xếp loại</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teamData.map((member) => {
                const review = member.ReviewsReceived && member.ReviewsReceived[0];
                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {member.Team?.shortName || member.Team?.fullName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusLabel(review?.status)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">
                      {review?.selfScore || review?.score || '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50/30">
                      {review?.status !== 'Submitted' && review?.status !== 'Draft' && review?.status !== undefined
                        ? review?.score
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
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
                    <td className="px-6 py-4 text-right">
                      {review ? (
                        <button
                          onClick={() => openReviewModal(member)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" /> Xem & Duyệt
                        </button>
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
    </div>
  );
};

export default TeamReview;
