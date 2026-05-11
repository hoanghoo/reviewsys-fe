import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../common/ConfirmModal';
import { Shield, Users, Award, Search, Plus, X, Trash2, Edit, UserPlus } from 'lucide-react';

const TeamManager = () => {
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingTeam, setEditingTeam] = useState(null); // null = closed, 'new' = creating, object = editing
  const [formData, setFormData] = useState({ shortName: '', fullName: '' });

  const [leaderModalTeam, setLeaderModalTeam] = useState(null); // team object for assigning leader
  const [selectedLeaderId, setSelectedLeaderId] = useState('');

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });

  const showConfirm = (title, message, type, onConfirm) => {
    setConfirmConfig({ isOpen: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        api.get('/teams'),
        api.get('/users')
      ]);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error('Không thể tải dữ liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam === 'new') {
        await api.post('/teams', formData);
        toast.success('Tạo đội thành công!');
      } else {
        await api.put(`/teams/${editingTeam.id}`, formData);
        toast.success('Cập nhật thành công!');
      }
      setFormData({ shortName: '', fullName: '' });
      setEditingTeam(null);
      fetchData();
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      'Xóa Cơ Cấu Đội',
      'Chắc chắn xóa đội này? Hành động này không thể hoàn tác.',
      'danger',
      async () => {
        try {
          await api.delete(`/teams/${id}`);
          toast.success('Đã xóa đội.');
          fetchData();
        } catch (err) {
          toast.error('Lỗi xóa: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  const handleAssignLeader = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/teams/${leaderModalTeam.id}/leader`, { userId: selectedLeaderId });
      toast.success('Phân công đội trưởng thành công!');
      setLeaderModalTeam(null);
      setSelectedLeaderId('');
      fetchData();
    } catch (err) {
      toast.error('Lỗi phân công: ' + (err.response?.data?.message || err.message));
    }
  };

  const teamsData = useMemo(() => {
    const data = teams.map(t => {
      const teamUsers = users.filter(u => u.teamId === t.id);
      
      let leader = null;
      let leaderRank = '';
      let leaderId = null;
      
      const leaderUser = teamUsers.find(u => u.position === 'Đội trưởng' || u.position === 'Phó trưởng phòng' || u.position === 'Trưởng phòng');
      if (leaderUser) {
        leader = leaderUser.fullName;
        leaderRank = leaderUser.rank;
        leaderId = leaderUser.id;
      }

      return {
        ...t,
        headcount: teamUsers.length,
        leader,
        leaderRank,
        leaderId,
        teamUsers
      };
    });

    const sorted = data.sort((a, b) => a.shortName.localeCompare(b.shortName));

    if (searchTerm) {
      return sorted.filter(t => 
        t.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.leader && t.leader.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return sorted;
  }, [teams, users, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-800">Cơ cấu Tổ chức Đội</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm tên đội hoặc chỉ huy..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button onClick={() => { setEditingTeam('new'); setFormData({ shortName: '', fullName: '' }); }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm text-sm whitespace-nowrap">
            <Plus className="w-4 h-4" /> Thêm đội
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamsData.map((team) => (
          <div key={team.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg transition-all group relative">
            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingTeam(team); setFormData({ shortName: team.shortName, fullName: team.fullName }); }} className="text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50 p-1.5 rounded-lg shadow-sm border border-slate-200">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(team.id)} className="text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 p-1.5 rounded-lg shadow-sm border border-slate-200">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-xl bg-purple-50 text-purple-600">
                <Shield className="w-8 h-8" />
              </div>
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {team.headcount} nhân sự
              </div>
            </div>
            
            <div className="mt-1 pr-6">
              <h3 className="font-bold text-slate-800 text-lg truncate" title={team.shortName}>{team.shortName}</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed min-h-[40px] line-clamp-2" title={team.fullName}>{team.fullName}</p>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 truncate mr-2">
                <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="truncate">
                  {team.leader ? (
                    <><span className="font-medium text-slate-800">{team.leader}</span> <span className="text-xs text-slate-400">({team.leaderRank})</span></>
                  ) : (
                    <span className="text-slate-400 italic">Chưa phân công</span>
                  )}
                </span>
              </div>
              <button 
                onClick={() => { setLeaderModalTeam(team); setSelectedLeaderId(team.leaderId || ''); }} 
                className="text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" /> Phân công
              </button>
            </div>
          </div>
        ))}

        {teamsData.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            Không tìm thấy thông tin cơ cấu đội nào.
          </div>
        )}
      </div>

      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-800">{editingTeam === 'new' ? 'Thêm Cơ cấu Đội' : 'Sửa thông tin Đội'}</h3>
              <button onClick={() => setEditingTeam(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTeam} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đội (ngắn gọn)</label>
                <input required value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Đội 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đầy đủ (Mô tả chức năng)</label>
                <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Tham mưu, Tổng hợp" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingTeam(null)} className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-purple-200">{editingTeam === 'new' ? 'Tạo đội' : 'Cập nhật'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {leaderModalTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-800">Phân công Đội trưởng</h3>
              <button onClick={() => setLeaderModalTeam(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignLeader} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chọn nhân sự chỉ huy cho {leaderModalTeam.shortName}</label>
                {leaderModalTeam.teamUsers.length > 0 ? (
                  <select value={selectedLeaderId} onChange={e => setSelectedLeaderId(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none">
                    <option value="">-- Hủy phân công / Bỏ trống --</option>
                    {leaderModalTeam.teamUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.rank || 'Không có cấp bậc'})</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">Đội này chưa có nhân sự nào. Vui lòng thêm nhân sự vào đội trước khi phân công.</p>
                )}
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setLeaderModalTeam(null)} className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-purple-200">Lưu phân công</button>
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

export default TeamManager;
