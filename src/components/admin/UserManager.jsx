import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, X, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const UserManager = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterTeamId, setFilterTeamId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [formData, setFormData] = useState({
    username: '', password: '', fullName: '', role: 'Employee', rank: '', position: '', teamId: ''
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const targetDepartment = departments.length > 0 ? departments[0] : null;
      await api.post('/users', { ...formData, departmentId: targetDepartment?.id });
      setFormData({ username: '', password: '', fullName: '', role: 'Employee', rank: '', position: '', teamId: '' });
      setIsModalOpen(false);
      toast.success('Tạo nhân sự thành công!');
      fetchData();
    } catch (err) {
      toast.error('Lỗi tạo nhân sự: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Chắc chắn xóa?')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('Đã xóa nhân sự.');
        fetchData();
      } catch (err) {
        toast.error('Lỗi xóa: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.username || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterRole ? u.role === filterRole : true;
      const matchRank = filterRank ? u.rank === filterRank : true;
      const matchPosition = filterPosition ? u.position === filterPosition : true;
      const matchTeam = filterTeamId ? u.teamId?.toString() === filterTeamId : true;

      return matchSearch && matchRole && matchRank && matchPosition && matchTeam;
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
          <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm text-sm whitespace-nowrap">
            <Plus className="w-4 h-4" /> Thêm nhân sự
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
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
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
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.role === 'Admin' ? 'bg-red-100 text-red-700' : u.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <h3 className="font-semibold text-lg text-slate-800">Tạo tài khoản nhân sự</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Nhập họ và tên đầy đủ" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Tên đăng nhập" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Mật khẩu" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cấp bậc</label>
                  <input value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Đại úy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ</label>
                  <input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Đội trưởng" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đội</label>
                  <select value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none">
                    <option value="">-- Chọn đội --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò hệ thống</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none">
                    <option value="Employee">Cán bộ/Nhân viên</option>
                    <option value="Manager">Cấp lãnh đạo</option>
                    <option value="Admin">Admin Hệ thống</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-purple-200">Tạo mới</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
