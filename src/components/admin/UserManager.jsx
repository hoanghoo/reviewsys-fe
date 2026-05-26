import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../common/ConfirmModal';
import { Plus, Trash2, X, Search, ChevronLeft, ChevronRight, Filter, Edit, Key, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';

const UserManager = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => { } });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [previewUsers, setPreviewUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showConfirm = (title, message, type, onConfirm) => {
    setConfirmConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterTeamId, setFilterTeamId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [formData, setFormData] = useState({
    username: '', password: '', fullName: '', roles: ["Employee"], rank: '', position: '', teamId: '', managedTeamIds: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resUsers, resDepts, resTeams] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
        api.get('/teams')
      ]);
      setUsers(resUsers.data);
      setDepartments(resDepts.data);
      setTeams(resTeams.data);
    } catch (err) {
      toast.error('Không thể tải dữ liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/users/import-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Template_Import_Nhan_Su.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Tải file template thành công!');
    } catch (err) {
      toast.error('Không thể tải template: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleUploadPreview = async () => {
    if (!importFile) {
      toast.error('Vui lòng chọn một file Excel');
      return;
    }
    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('file', importFile);
      const res = await api.post('/users/import-preview', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewUsers(res.data);
      toast.success('Xem trước dữ liệu import thành công!');
    } catch (err) {
      toast.error('Không thể xem trước file Excel: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportSubmit = async () => {
    const validUsers = previewUsers.filter(u => u.isValid);
    if (validUsers.length === 0) {
      toast.error('Không có cán bộ hợp lệ nào để import');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/users/import-submit', { users: previewUsers }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Tai_khoan_nhan_su_da_tao.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Import thành công! Đã tự động tải về danh sách tài khoản mật khẩu cán bộ.`);
      setIsImportModalOpen(false);
      setImportFile(null);
      setPreviewUsers([]);
      fetchData();
    } catch (err) {
      toast.error('Không thể submit dữ liệu import: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelImport = () => {
    setImportFile(null);
    setPreviewUsers([]);
    setIsImportModalOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const targetDepartment = departments.length > 0 ? departments[0] : null;
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, { ...formData, departmentId: targetDepartment?.id });
        toast.success('Cập nhật nhân sự thành công!');
      } else {
        await api.post('/users', { ...formData, departmentId: targetDepartment?.id });
        toast.success('Tạo nhân sự thành công!');
      }
      setFormData({ username: '', password: '', fullName: '', roles: ["Employee"], rank: '', position: '', teamId: '', managedTeamIds: [] });
      setIsModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleResetPassword = async (user) => {
    showConfirm(
      'Reset Mật Khẩu',
      `Bạn có chắc chắn muốn reset mật khẩu cho tài khoản ${user.username}? Mật khẩu mới sẽ được tạo ngẫu nhiên.`,
      'warning',
      async () => {
        try {
          const newPassword = Math.random().toString(36).slice(-8); // 8 characters
          await api.put(`/users/${user.id}`, { ...user, password: newPassword });
          await navigator.clipboard.writeText(newPassword);
          toast.success(`Reset mật khẩu thành công! Mật khẩu mới đã được lưu vào clipboard.`);
        } catch (err) {
          toast.error('Lỗi reset mật khẩu: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  const handleDelete = async (id) => {
    showConfirm(
      'Xóa Nhân Sự',
      'Chắc chắn xóa người dùng này? Hành động này không thể hoàn tác.',
      'danger',
      async () => {
        try {
          await api.delete(`/users/${id}`);
          toast.success('Đã xóa nhân sự.');
          fetchData();
        } catch (err) {
          toast.error('Lỗi xóa: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  const filteredUsers = useMemo(() => {
    const teamOrder = ['ban lãnh đạo', 'đội 1', 'đội 2', 'đội 3', 'đội 4'];
    
    const getTeamWeight = (teamName) => {
      if (!teamName) return 999;
      const nameLower = teamName.toLowerCase().trim();
      const idx = teamOrder.findIndex(name => nameLower.includes(name));
      return idx === -1 ? 998 : idx;
    };

    const getPositionWeight = (pos) => {
      if (!pos) return 5;
      const p = pos.toLowerCase().trim();
      if (p === 'trưởng phòng') return 1;
      if (p === 'phó trưởng phòng' || p === 'phó phòng') return 2;
      if (p === 'đội trưởng') return 3;
      if (p === 'phó đội trưởng' || p === 'đội phó') return 4;
      return 5;
    };

    return users
      .filter(u => {
        const matchSearch = (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.username || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = filterRole ? (u.roles && u.roles.includes(filterRole)) : true;
        const matchRank = filterRank ? u.rank === filterRank : true;
        const matchPosition = filterPosition ? u.position === filterPosition : true;
        const matchTeam = filterTeamId ? u.teamId?.toString() === filterTeamId : true;

        return matchSearch && matchRole && matchRank && matchPosition && matchTeam;
      })
      .sort((a, b) => {
        const teamA = a.Team ? a.Team.shortName : '';
        const teamB = b.Team ? b.Team.shortName : '';
        const weightTeamA = getTeamWeight(teamA);
        const weightTeamB = getTeamWeight(teamB);
        if (weightTeamA !== weightTeamB) return weightTeamA - weightTeamB;

        const weightPosA = getPositionWeight(a.position);
        const weightPosB = getPositionWeight(b.position);
        if (weightPosA !== weightPosB) return weightPosA - weightPosB;

        return (a.fullName || '').localeCompare(b.fullName || '');
      });
  }, [users, searchTerm, filterRole, filterRank, filterPosition, filterTeamId]);

  const uniqueRanks = [...new Set(users.map(u => u.rank).filter(Boolean))];
  const uniquePositions = [...new Set(users.map(u => u.position).filter(Boolean))];

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const currentData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 if any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterRank, filterPosition, filterTeamId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-800">Danh sách Tài khoản</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên hoặc username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 border text-sm font-medium transition-colors ${showFilters ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="w-4 h-4" /> Lọc
          </button>
          <button onClick={() => { setEditingUser(null); setFormData({ username: '', password: '', fullName: '', roles: ["Employee"], rank: '', position: '', teamId: '', managedTeamIds: [] }); setIsModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm text-sm whitespace-nowrap">
            <Plus className="w-4 h-4" /> Thêm nhân sự
          </button>
          <button onClick={() => setIsImportModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm text-sm whitespace-nowrap">
            <FileSpreadsheet className="w-4 h-4" /> Import Excel
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Cấp bậc</label>
            <select value={filterRank} onChange={e => setFilterRank(e.target.value)} className="w-full border-slate-300 rounded-lg p-2 text-sm focus:ring-purple-500 focus:border-purple-500 outline-none">
              <option value="">Tất cả cấp bậc</option>
              {uniqueRanks.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Chức vụ</label>
            <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)} className="w-full border-slate-300 rounded-lg p-2 text-sm focus:ring-purple-500 focus:border-purple-500 outline-none">
              <option value="">Tất cả chức vụ</option>
              {uniquePositions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Đội</label>
            <select value={filterTeamId} onChange={e => setFilterTeamId(e.target.value)} className="w-full border-slate-300 rounded-lg p-2 text-sm focus:ring-purple-500 focus:border-purple-500 outline-none">
              <option value="">Tất cả các đội</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Vai trò hệ thống</label>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="w-full border-slate-300 rounded-lg p-2 text-sm focus:ring-purple-500 focus:border-purple-500 outline-none">
              <option value="">Tất cả vai trò</option>
              <option value="Admin">Người Quản trị</option>
              <option value="Leader">Lãnh đạo</option>
              <option value="Manager">Quản lý</option>
              <option value="Employee">Cán bộ</option>
            </select>
          </div>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold">Họ và tên</th>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold">Cấp bậc</th>
              <th className="px-4 py-3 font-semibold">Chức vụ</th>
              <th className="px-4 py-3 font-semibold">Đội</th>
              <th className="px-4 py-3 font-semibold">Vai trò</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {currentData.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2 font-medium text-slate-800">{u.fullName}</td>
                <td className="px-4 py-2 text-slate-600">{u.username}</td>
                <td className="px-4 py-2 text-slate-600">{u.rank || '-'}</td>
                <td className="px-4 py-2 text-slate-600">{u.position || '-'}</td>
                <td className="px-4 py-2 text-slate-600">{u.Team ? u.Team.shortName : '-'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${(u.roles && u.roles.includes("Admin")) ? 'bg-red-100 text-red-700' : (u.roles && u.roles.includes("Leader")) ? 'bg-purple-100 text-purple-700' : (u.roles && u.roles.includes("Manager")) ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {(u.roles && u.roles.includes("Admin")) ? "Quản trị" : (u.roles && u.roles.includes("Leader")) ? "Lãnh đạo" : (u.roles && u.roles.includes("Manager")) ? "Quản lý" : "Cán bộ"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditingUser(u); setFormData({ username: u.username, password: '', fullName: u.fullName, roles: Array.isArray(u.roles) ? u.roles : (u.roles ? [u.roles] : ["Employee"]), rank: u.rank || '', position: u.position || '', teamId: u.teamId || '', managedTeamIds: Array.isArray(u.managedTeamIds) ? u.managedTeamIds : [] }); setIsModalOpen(true); }} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Chỉnh sửa">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleResetPassword(u)} className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" title="Reset mật khẩu">
                      <Key className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Không tìm thấy nhân sự nào.</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50">
          <div className="text-xs text-slate-500">
            Hiển thị <span className="font-medium text-slate-800">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-slate-800">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> trong <span className="font-medium text-slate-800">{filteredUsers.length}</span> nhân sự
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-medium text-slate-700">Trang {currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-800">{editingUser ? 'Sửa thông tin nhân sự' : 'Tạo tài khoản nhân sự'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Nhập họ và tên đầy đủ" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={editingUser ? "col-span-2" : ""}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input required value={formData.username} disabled={!!editingUser} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" placeholder="Tên đăng nhập" />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Mật khẩu" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cấp bậc</label>
                  <input value={formData.rank} onChange={e => setFormData({ ...formData, rank: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Đại úy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ</label>
                  <input value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Đội trưởng" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đội</label>
                  <select value={formData.teamId} onChange={e => setFormData({ ...formData, teamId: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none">
                    <option value="">-- Chọn đội --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vai trò hệ thống</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'Employee', label: 'Cán bộ' },
                      { val: 'Manager', label: 'Quản lý' },
                      { val: 'Leader', label: 'Lãnh đạo' },
                      { val: 'Admin', label: 'Quản trị viên' }
                    ].map(r => (
                      <label key={r.val} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={formData.roles && formData.roles.includes(r.val)} onChange={(e) => {
                          const currentRoles = formData.roles || [];
                          const nextRoles = e.target.checked ? [...currentRoles, r.val] : currentRoles.filter(x => x !== r.val);
                          setFormData({ ...formData, roles: nextRoles.length ? nextRoles : ['Employee'] });
                        }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {((formData.roles && (formData.roles.includes("Manager") || formData.roles.includes("Leader"))) && (formData.position === 'Phó trưởng phòng' || formData.position === 'Phó phòng')) && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Các đội phụ trách quản lý</label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {teams.map(t => {
                      const isChecked = (formData.managedTeamIds || []).includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              const currentIds = formData.managedTeamIds || [];
                              const nextIds = e.target.checked
                                ? [...currentIds, t.id]
                                : currentIds.filter(id => id !== t.id);
                              setFormData({ ...formData, managedTeamIds: nextIds });
                            }}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>{t.fullName} ({t.shortName})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-purple-200">{editingUser ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Import cán bộ từ file Excel</h3>
                  <p className="text-xs text-slate-500">Tải lên danh sách cán bộ để tự động tạo tài khoản và mật khẩu hệ thống</p>
                </div>
              </div>
              <button onClick={handleCancelImport} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {previewUsers.length === 0 ? (
                /* Step 1: Upload File */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Instructions Panel */}
                  <div className="md:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Hướng dẫn chuẩn bị file
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
                      <li>File Excel phải chứa đúng các tiêu đề cột: <strong>Họ và tên, Cấp bậc, Chức vụ, Đội</strong>.</li>
                      <li><strong>Cấp bậc</strong>: Chỉ hỗ trợ cấp bậc công an nhân dân (Thiếu úy, Trung úy, Thượng úy, Đại úy, Thiếu tá, Trung tá, Thượng tá, Đại tá, v.v.).</li>
                      <li><strong>Chức vụ</strong>: Chỉ hỗ trợ: Trưởng phòng, Phó phòng, Đội trưởng, Phó đội trưởng, Cán bộ.</li>
                      <li><strong>Đội</strong>: Phải khớp với tên Đội trong cơ sở dữ liệu (ví dụ: Ban Lãnh đạo, Đội 1, Đội 2...).</li>
                      <li>Tài khoản (Username) sẽ được tự động tạo dựa trên tên không dấu và chữ cái đầu của họ đệm. Mật khẩu sẽ tự động được sinh ngẫu nhiên.</li>
                    </ul>
                    <div className="pt-2 border-t border-slate-200">
                      <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-all shadow-sm"
                      >
                        <Download className="w-4 h-4 text-slate-500" /> Tải file Excel template
                      </button>
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  <div className="md:col-span-2 flex flex-col justify-center items-center border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4">
                      <FileSpreadsheet className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Kéo thả file Excel vào đây hoặc click để chọn file
                    </p>
                    <p className="text-xs text-slate-400 mb-6">Hỗ trợ định dạng .xlsx, .xls tối đa 5MB</p>
                    
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="excel-file-upload"
                    />
                    <label
                      htmlFor="excel-file-upload"
                      className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm mb-4 inline-block"
                    >
                      Chọn file từ máy tính
                    </label>

                    {importFile && (
                      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm animate-in fade-in-50">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div className="truncate text-left">
                            <p className="text-xs font-semibold text-slate-700 truncate">{importFile.name}</p>
                            <p className="text-[10px] text-slate-400">{(importFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => setImportFile(null)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2: Preview & Validation Table */
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tổng số dòng</p>
                      <p className="text-xl font-bold text-slate-700">{previewUsers.length}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Hợp lệ để lưu</p>
                      <p className="text-xl font-bold text-emerald-700">{previewUsers.filter(u => u.isValid).length}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-amber-600">Trùng LDAP (Thêm hậu số)</p>
                      <p className="text-xl font-bold text-amber-700">{previewUsers.filter(u => u.warning).length}</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-red-600">Bị lỗi (Bỏ qua)</p>
                      <p className="text-xl font-bold text-red-700">{previewUsers.filter(u => !u.isValid).length}</p>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                            <th className="px-4 py-3">STT</th>
                            <th className="px-4 py-3">Họ và tên</th>
                            <th className="px-4 py-3">Cấp bậc</th>
                            <th className="px-4 py-3">Chức vụ</th>
                            <th className="px-4 py-3">Đội</th>
                            <th className="px-4 py-3">Username (Gen)</th>
                            <th className="px-4 py-3">Mật khẩu (Gen)</th>
                            <th className="px-4 py-3">Trạng thái / Cảnh báo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {previewUsers.map((u, i) => (
                            <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${!u.isValid ? 'bg-red-50/20' : u.warning ? 'bg-amber-50/20' : ''}`}>
                              <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                              <td className="px-4 py-2 font-semibold text-slate-700">{u.fullName || '-'}</td>
                              <td className="px-4 py-2 text-slate-600">{u.rank || '-'}</td>
                              <td className="px-4 py-2 text-slate-600">{u.position || '-'}</td>
                              <td className="px-4 py-2 text-slate-600">{u.teamName || '-'}</td>
                              <td className="px-4 py-2 font-mono text-purple-700 font-semibold">{u.username || '-'}</td>
                              <td className="px-4 py-2 font-mono text-slate-600">{u.password || '-'}</td>
                              <td className="px-4 py-2">
                                {!u.isValid ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Lỗi dữ liệu
                                    </span>
                                    <span className="text-[10px] text-red-500 font-medium leading-tight">{u.errors.join(', ')}</span>
                                  </div>
                                ) : u.warning ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Trùng LDAP
                                    </span>
                                    <span className="text-[10px] text-amber-500 font-medium leading-tight">{u.warning}</span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Hợp lệ
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                {previewUsers.length > 0 && (
                  <button
                    onClick={() => setPreviewUsers([])}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors"
                    disabled={isSubmitting}
                  >
                    Chọn file khác
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelImport}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors"
                  disabled={isUploading || isSubmitting}
                >
                  Hủy
                </button>
                
                {previewUsers.length === 0 ? (
                  <button
                    onClick={handleUploadPreview}
                    disabled={!importFile || isUploading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Đang đọc file...
                      </>
                    ) : (
                      'Tải lên & Xem trước'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleImportSubmit}
                    disabled={previewUsers.filter(u => u.isValid).length === 0 || isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Đang tạo & Tải về file...
                      </>
                    ) : (
                      `Tạo ${previewUsers.filter(u => u.isValid).length} tài khoản`
                    )}
                  </button>
                )}
              </div>
            </div>
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

export default UserManager;
