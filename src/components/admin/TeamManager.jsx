import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../common/ConfirmModal';
import { Shield, Users, Award, Search, Plus, X, Trash2, Edit, UserPlus, ChevronDown } from 'lucide-react';

const TeamManager = () => {
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingTeam, setEditingTeam] = useState(null); // null = closed, 'new' = creating, object = editing
  const [formData, setFormData] = useState({ shortName: '', fullName: '' });

  const [leaderModalTeam, setLeaderModalTeam] = useState(null); // team object for assigning leader
  const [localTeamUsers, setLocalTeamUsers] = useState([]); // local state of team users during assignment editing
  const [selectedLeaderCandidate, setSelectedLeaderCandidate] = useState('');
  const [selectedDeputyCandidate, setSelectedDeputyCandidate] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null); // tracks currently open custom select dropdown id
  const [viewingMembersTeam, setViewingMembersTeam] = useState(null); // team object for viewing personnel popup

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
      await api.put(`/teams/${leaderModalTeam.id}/leader`, { users: localTeamUsers });
      toast.success('Phân công thành công!');
      setLeaderModalTeam(null);
      setLocalTeamUsers([]);
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
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-xl bg-purple-50 text-purple-600">
                <Shield className="w-8 h-8" />
              </div>
              <div 
                onClick={() => setViewingMembersTeam(team)}
                className="bg-slate-100 hover:bg-slate-200 cursor-pointer text-slate-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors select-none"
                title="Xem danh sách nhân sự"
              >
                <Users className="w-3.5 h-3.5" />
                {team.headcount} nhân sự
              </div>
            </div>
            
            <div className="mt-1 pr-6">
              <h3 className="font-bold text-slate-800 text-lg truncate" title={team.shortName}>{team.shortName}</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed min-h-[40px] line-clamp-2" title={team.fullName}>{team.fullName}</p>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-auto">
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => { 
                    setLeaderModalTeam(team); 
                    setLocalTeamUsers(team.teamUsers.map(u => ({ ...u }))); 
                    setSelectedLeaderCandidate('');
                    setSelectedDeputyCandidate('');
                    setActiveDropdownId(null);
                  }} 
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200 hover:border-purple-200"
                  title="Phân công chỉ huy"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Phân công
                </button>
                <button 
                  onClick={() => { setEditingTeam(team); setFormData({ shortName: team.shortName, fullName: team.fullName }); }} 
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200"
                  title="Sửa thông tin đội"
                >
                  <Edit className="w-3.5 h-3.5" /> Sửa
                </button>
                <button 
                  onClick={() => handleDelete(team.id)} 
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200"
                  title="Xóa đội"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
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

      {leaderModalTeam && (() => {
        const isLeadership = leaderModalTeam.id === 7 || leaderModalTeam.shortName === 'Ban Lãnh đạo';
        const mainLabel = isLeadership ? 'Trưởng phòng' : 'Đội trưởng';
        const subLabel = isLeadership ? 'Phó phòng' : 'Đội phó';

        const isDeputyUser = (u) => {
          const pos = (u.position || '').toLowerCase().trim();
          if (isLeadership) {
            return pos === 'phó trưởng phòng' || pos === 'phó phòng';
          } else {
            return pos === 'đội phó' || pos === 'đội phó';
          }
        };

        const handleRemoveManagedTeam = (deputyId, teamId) => {
          setLocalTeamUsers(localTeamUsers.map(u => {
            if (u.id === deputyId) {
              const currentIds = Array.isArray(u.managedTeamIds) ? u.managedTeamIds : [];
              return {
                ...u,
                managedTeamIds: currentIds.filter(id => id !== teamId)
              };
            }
            return u;
          }));
        };

        const handleAddManagedTeam = (deputyId, teamId) => {
          setLocalTeamUsers(localTeamUsers.map(u => {
            if (u.id === deputyId) {
              const currentIds = Array.isArray(u.managedTeamIds) ? u.managedTeamIds : [];
              return {
                ...u,
                managedTeamIds: [...currentIds, Number(teamId)]
              };
            }
            return u;
          }));
        };

        const getAvailableTeamsForDeputy = (deputy) => {
          const deputyManaged = Array.isArray(deputy.managedTeamIds) ? deputy.managedTeamIds : [];
          const otherDeputies = localTeamUsers.filter(u => isDeputyUser(u) && u.id !== deputy.id);
          const managedByOthers = otherDeputies.reduce((acc, u) => {
            const ids = Array.isArray(u.managedTeamIds) ? u.managedTeamIds : [];
            return [...acc, ...ids];
          }, []);

          return teams.filter(t => 
            t.id !== 7 && 
            t.shortName !== 'Ban Lãnh đạo' &&
            !managedByOthers.includes(t.id) &&
            !deputyManaged.includes(t.id)
          );
        };

        const currentLeader = localTeamUsers.find(u => (u.position || '').toLowerCase().trim() === mainLabel.toLowerCase());
        const currentDeputies = localTeamUsers.filter(isDeputyUser);

        const leaderCandidates = localTeamUsers.filter(u => 
          (u.position || '').toLowerCase().trim() !== mainLabel.toLowerCase() && 
          !isDeputyUser(u)
        );

        const deputyCandidates = localTeamUsers.filter(u => 
          (u.position || '').toLowerCase().trim() !== mainLabel.toLowerCase() && 
          !isDeputyUser(u)
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 relative overflow-visible">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Phân công Chỉ huy</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{leaderModalTeam.shortName} - {leaderModalTeam.fullName}</p>
                </div>
                <button onClick={() => setLeaderModalTeam(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAssignLeader} className="p-5 space-y-6">
                {localTeamUsers.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-center">
                    Đội này chưa có nhân sự nào. Vui lòng thêm nhân sự vào đội trước khi phân công.
                  </p>
                ) : (
                  <>
                    {/* SECTION 1: Trưởng phòng / Đội trưởng */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">{mainLabel} (Tối đa 1)</label>
                      {currentLeader ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div>
                            <p className="font-bold text-sm text-slate-800">{currentLeader.fullName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{currentLeader.rank || 'Không có cấp bậc'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setLocalTeamUsers(localTeamUsers.map(u => 
                                u.id === currentLeader.id 
                                  ? { ...u, position: 'Cán bộ', role: 'Employee' } 
                                  : u
                              ));
                              setSelectedLeaderCandidate('');
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg border border-red-200 transition-colors"
                            title="Gỡ chức vụ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => setActiveDropdownId(activeDropdownId === 'leader' ? null : 'leader')}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-left text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex justify-between items-center text-slate-700 font-medium"
                            >
                              <span>
                                {selectedLeaderCandidate ? (
                                  leaderCandidates.find(c => String(c.id) === String(selectedLeaderCandidate))?.fullName || '-- Chọn nhân sự --'
                                ) : (
                                  `-- Chọn nhân sự làm ${mainLabel} --`
                                )}
                              </span>
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>
                            {activeDropdownId === 'leader' && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                                  {leaderCandidates.length > 0 ? (
                                    leaderCandidates.map(u => (
                                      <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedLeaderCandidate(u.id);
                                          setActiveDropdownId(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 transition-colors"
                                      >
                                        {u.fullName} ({u.rank || 'Không có cấp bậc'})
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-4 py-2 text-sm text-slate-400 italic">Không có ứng viên khả dụng</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={!selectedLeaderCandidate}
                            onClick={() => {
                              if (!selectedLeaderCandidate) return;
                              setLocalTeamUsers(localTeamUsers.map(u => 
                                u.id === Number(selectedLeaderCandidate) 
                                  ? { ...u, position: mainLabel, role: 'Manager' } 
                                  : u
                              ));
                              setSelectedLeaderCandidate('');
                            }}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors flex items-center justify-center"
                            title="Thêm vị trí"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: Phó phòng / Đội phó */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">{subLabel}</label>
                      {currentDeputies.length > 0 && (
                        <div className="space-y-2">
                          {currentDeputies.map(deputy => (
                            <div key={deputy.id} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-200 gap-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-sm text-slate-800">{deputy.fullName}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{deputy.rank || 'Không có cấp bậc'}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocalTeamUsers(localTeamUsers.map(u => 
                                      u.id === deputy.id 
                                        ? { ...u, position: 'Cán bộ', role: 'Employee', managedTeamIds: [] } 
                                        : u
                                    ));
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg border border-red-200 transition-colors"
                                  title="Gỡ chức vụ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Managed Teams list for Phó phòng */}
                              {isLeadership && (
                                <div className="mt-1.5 pt-2 border-t border-slate-200/60">
                                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Đội phụ trách quản lý:</span>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {(Array.isArray(deputy.managedTeamIds) ? deputy.managedTeamIds : []).map(teamId => {
                                      const tObj = teams.find(t => t.id === teamId);
                                      if (!tObj) return null;
                                      return (
                                        <span key={teamId} className="inline-flex items-center gap-1.5 bg-purple-55 bg-purple-50 text-purple-700 border border-purple-100 text-xs px-2 py-0.5 rounded-md font-semibold select-none">
                                          {tObj.shortName}
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveManagedTeam(deputy.id, teamId)}
                                            className="text-purple-400 hover:text-purple-650 transition-colors"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </span>
                                      );
                                    })}
                                    {(Array.isArray(deputy.managedTeamIds) ? deputy.managedTeamIds : []).length === 0 && (
                                      <span className="text-xs text-slate-400 italic">Chưa phân công phụ trách đội nào</span>
                                    )}
                                  </div>

                                  {/* Custom dropdown for selecting team */}
                                  {(() => {
                                    const availableTeams = getAvailableTeamsForDeputy(deputy);
                                    const dropdownId = `managed-team-${deputy.id}`;
                                    return (
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => setActiveDropdownId(activeDropdownId === dropdownId ? null : dropdownId)}
                                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-left text-xs text-slate-500 hover:border-slate-350 transition-colors flex justify-between items-center"
                                        >
                                          <span>+ Giao quản lý đội...</span>
                                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                        {activeDropdownId === dropdownId && (
                                          <>
                                            <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-40 max-h-40 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                                              {availableTeams.length > 0 ? (
                                                availableTeams.map(t => (
                                                  <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => {
                                                      handleAddManagedTeam(deputy.id, t.id);
                                                      setActiveDropdownId(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                                                  >
                                                    {t.shortName} ({t.fullName})
                                                  </button>
                                                ))
                                              ) : (
                                                <div className="px-3 py-2 text-xs text-slate-400 italic">Không có đội khả dụng (hoặc đã bị phụ trách)</div>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <button
                            type="button"
                            onClick={() => setActiveDropdownId(activeDropdownId === 'deputy' ? null : 'deputy')}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-left text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex justify-between items-center text-slate-700 font-medium"
                          >
                            <span>
                              {selectedDeputyCandidate ? (
                                deputyCandidates.find(c => String(c.id) === String(selectedDeputyCandidate))?.fullName || '-- Chọn nhân sự --'
                              ) : (
                                `-- Chọn nhân sự làm ${subLabel} --`
                              )}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </button>
                          {activeDropdownId === 'deputy' && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                                {deputyCandidates.length > 0 ? (
                                  deputyCandidates.map(u => (
                                    <button
                                      key={u.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedDeputyCandidate(u.id);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-750 transition-colors font-medium"
                                    >
                                      {u.fullName} ({u.rank || 'Không có cấp bậc'})
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-2 text-sm text-slate-400 italic">Không có ứng viên khả dụng</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={!selectedDeputyCandidate}
                          onClick={() => {
                            if (!selectedDeputyCandidate) return;
                            setLocalTeamUsers(localTeamUsers.map(u => 
                              u.id === Number(selectedDeputyCandidate) 
                                ? { ...u, position: isLeadership ? 'Phó phòng' : 'Đội phó', role: 'Manager', managedTeamIds: [] } 
                                : u
                            ));
                            setSelectedDeputyCandidate('');
                          }}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors flex items-center justify-center"
                          title="Thêm vị trí"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                  <button type="button" onClick={() => setLeaderModalTeam(null)} className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm bg-white border border-slate-200">Hủy</button>
                  <button type="submit" disabled={localTeamUsers.length === 0} className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm">Lưu phân công</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {viewingMembersTeam && (() => {
        const getPositionWeight = (pos) => {
          if (!pos) return 5;
          const p = pos.toLowerCase().trim();
          if (p === 'trưởng phòng') return 1;
          if (p === 'phó trưởng phòng' || p === 'phó phòng') return 2;
          if (p === 'đội trưởng') return 3;
          if (p === 'đội phó' || p === 'đội phó') return 4;
          return 5;
        };

        const sortedUsers = [...viewingMembersTeam.teamUsers].sort((a, b) => {
          const wa = getPositionWeight(a.position);
          const wb = getPositionWeight(b.position);
          if (wa !== wb) return wa - wb;
          return (a.fullName || '').localeCompare(b.fullName || '');
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Thành viên {viewingMembersTeam.shortName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{viewingMembersTeam.fullName}</p>
                </div>
                <button onClick={() => setViewingMembersTeam(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 max-h-[380px] overflow-y-auto">
                {sortedUsers.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-150 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50 select-none">
                          <th className="px-4 py-3 text-center w-12">STT</th>
                          <th className="px-4 py-3">Họ tên</th>
                          <th className="px-4 py-3">Cấp bậc</th>
                          <th className="px-4 py-3">Chức vụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {sortedUsers.map((u, idx) => {
                          const weight = getPositionWeight(u.position);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{u.fullName}</td>
                              <td className="px-4 py-3 text-slate-600 font-medium">{u.rank || '-'}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1 items-start">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    weight === 1 ? 'bg-red-50 text-red-700 border-red-150' :
                                    weight === 2 ? 'bg-orange-50 text-orange-700 border-orange-150' :
                                    weight === 3 ? 'bg-blue-50 text-blue-700 border-blue-150' :
                                    weight === 4 ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                                    'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}>
                                    {u.position || 'Cán bộ'}
                                  </span>
                                  {weight === 2 && Array.isArray(u.managedTeamIds) && u.managedTeamIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1 max-w-[220px]">
                                      {u.managedTeamIds.map(teamId => {
                                        const tObj = teams.find(t => t.id === teamId);
                                        if (!tObj) return null;
                                        return (
                                          <span key={teamId} className="inline-block bg-purple-50 text-purple-700 border border-purple-100 text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                            {tObj.shortName}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 animate-pulse" />
                    <p className="text-sm font-medium">Chưa có nhân sự nào trong đội này.</p>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50">
                <button onClick={() => setViewingMembersTeam(null)} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm">Đóng</button>
              </div>
            </div>
          </div>
        );
      })()}

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
