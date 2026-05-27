import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../common/ConfirmModal';
import { Plus, Trash2, Power, PowerOff, X, Eye } from 'lucide-react';
import TeamReview from '../manager/TeamReview';

const ReviewPeriodManager = () => {
  const toast = useToast();
  const [periods, setPeriods] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', monthYear: '', startDate: '', endDate: '', status: 'Open', templateId: '', teamIds: [] });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });
  const [viewingPeriodId, setViewingPeriodId] = useState(null);

  const showConfirm = (title, message, type, onConfirm) => {
    setConfirmConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const toggleTeamSelection = (teamId) => {
    setFormData(prev => {
      const currentIds = prev.teamIds || [];
      if (currentIds.includes(teamId)) {
        return { ...prev, teamIds: currentIds.filter(id => id !== teamId) };
      } else {
        return { ...prev, teamIds: [...currentIds, teamId] };
      }
    });
  };

  const selectAllTeams = () => {
    setFormData(prev => ({ ...prev, teamIds: teams.map(t => t.id) }));
  };

  const deselectAllTeams = () => {
    setFormData(prev => ({ ...prev, teamIds: [] }));
  };

  useEffect(() => { fetchPeriods(); }, []);

  const fetchPeriods = async () => {
    try {
      const [resPeriods, resTemplates, resTeams] = await Promise.all([
        api.get('/review-periods'),
        api.get('/templates'),
        api.get('/teams')
      ]);
      setPeriods(resPeriods.data);
      setTemplates(resTemplates.data);
      setTeams(resTeams.data);
    } catch (err) {
      toast.error('Không thể tải dữ liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.templateId) {
        payload.templateId = null;
      }
      await api.post('/review-periods', payload);
      setFormData({ name: '', monthYear: '', startDate: '', endDate: '', status: 'Open', templateId: '', teamIds: [] });
      setIsModalOpen(false);
      toast.success('Tạo kỳ đánh giá thành công!');
      fetchPeriods();
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      'Xóa Kỳ Đánh Giá',
      'Chắc chắn xóa kỳ đánh giá này? Hành động này không thể hoàn tác.',
      'danger',
      async () => {
        try {
          await api.delete(`/review-periods/${id}`);
          toast.success('Đã xóa kỳ đánh giá.');
          fetchPeriods();
        } catch (err) {
          toast.error('Lỗi xóa: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  const toggleStatus = async (period) => {
    try {
      const newStatus = period.status === 'Open' ? 'Closed' : 'Open';
      await api.put(`/review-periods/${period.id}`, { ...period, status: newStatus });
      toast.success(`Kỳ đánh giá đã ${newStatus === 'Open' ? 'mở' : 'đóng'}.`);
      fetchPeriods();
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenModal = () => {
    let latestTemplateId = '';
    if (templates && templates.length > 0) {
      const latest = [...templates].sort((a, b) => b.id - a.id)[0];
      latestTemplateId = latest.id;
    }
    setFormData({ name: '', monthYear: '', startDate: '', endDate: '', status: 'Open', templateId: latestTemplateId, teamIds: [] });
    setIsModalOpen(true);
  };

  if (viewingPeriodId) {
    return <TeamReview periodId={viewingPeriodId} onBack={() => setViewingPeriodId(null)} isAdminView={true} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Danh sách Kỳ Đánh Giá</h3>
        <button onClick={handleOpenModal} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Mở kỳ đánh giá
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <th className="p-4 font-medium">Tên</th>
              <th className="p-4 font-medium">Kỳ (Tháng)</th>
              <th className="p-4 font-medium">Từ ngày</th>
              <th className="p-4 font-medium">Đến ngày</th>
              <th className="p-4 font-medium">Đối tượng</th>
              <th className="p-4 font-medium">Biểu mẫu</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periods.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{p.name}</td>
                <td className="p-4 text-slate-600 font-semibold">{p.monthYear || '---'}</td>
                <td className="p-4 text-slate-600">{new Date(p.startDate).toLocaleDateString('vi-VN')}</td>
                <td className="p-4 text-slate-600">{new Date(p.endDate).toLocaleDateString('vi-VN')}</td>
                <td className="p-4">
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {p.teamIds && p.teamIds.length > 0 
                      ? p.teamIds.map(id => teams.find(t => t.id === id)?.shortName).filter(Boolean).join(', ')
                      : 'Tất cả'}
                  </span>
                </td>
                <td className="p-4 text-slate-600">{p.Template ? p.Template.name : '-'}</td>
                <td className="p-4">
                  <button onClick={() => toggleStatus(p)} className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max transition-colors ${p.status === 'Open' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                    {p.status === 'Open' ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                    {p.status === 'Open' ? 'Đang mở' : 'Đã đóng'}
                  </button>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => setViewingPeriodId(p.id)} 
                    className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                    title="Xem kết quả"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500">Chưa có kỳ đánh giá nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-800">Mở kỳ đánh giá mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên kỳ đánh giá</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Đánh giá nhân sự Q1/2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tháng đánh giá</label>
                  <input type="month" required value={formData.monthYear} onChange={e => setFormData({...formData, monthYear: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" />
                </div>
              </div>
               <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Biểu mẫu đánh giá</label>
                  <select value={formData.templateId} onChange={e => setFormData({...formData, templateId: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none">
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Đội thực hiện (Phạm vi)</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={selectAllTeams} className="text-[10px] font-bold text-blue-600 hover:underline">Chọn tất cả</button>
                      <button type="button" onClick={deselectAllTeams} className="text-[10px] font-bold text-slate-400 hover:underline">Bỏ chọn</button>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto bg-slate-50/50 space-y-2">
                    {teams.map(t => (
                      <label key={t.id} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={formData.teamIds?.includes(t.id)}
                          onChange={() => toggleTeamSelection(t.id)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors font-medium">
                          {t.fullName} ({t.shortName})
                        </span>
                      </label>
                    ))}
                    {teams.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Không tìm thấy danh sách đội</p>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 italic">* Nếu không chọn đội nào, kỳ đánh giá sẽ áp dụng cho tất cả nhân sự.</p>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-purple-200">Tạo kỳ đánh giá</button>
              </div>
            </form>
          </div>
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

export default ReviewPeriodManager;
