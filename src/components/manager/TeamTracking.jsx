import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Search, Users as UsersIcon, Filter, ChevronLeft, ChevronRight, Mail, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TeamTracking = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({ key: 'fullName', direction: 'asc' });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const url = `/users/team`;
      const res = await api.get(url);
      setMembers(res.data || []);
    } catch (err) {
      toast.error('Lỗi tải thông tin đội: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    let result = members.filter(m => {
      const matchSearch = (m.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.username || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchRank = filterRank ? m.rank === filterRank : true;
      const matchPosition = filterPosition ? m.position === filterPosition : true;
      return matchSearch && matchRank && matchPosition;
    });

    // Apply Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = (a[sortConfig.key] || '').toString().toLowerCase();
        const valB = (b[sortConfig.key] || '').toString().toLowerCase();
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [members, searchTerm, filterRank, filterPosition, sortConfig]);

  const uniqueRanks = [...new Set(members.map(m => m.rank).filter(Boolean))];
  const uniquePositions = [...new Set(members.map(m => m.position).filter(Boolean))];

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const currentData = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRank, filterPosition]);

  if (loading && members.length === 0) return <div className="p-12 text-center text-slate-500">Đang tải thông tin nhân sự...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-100">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Theo dõi Đội ngũ</h2>
            <p className="text-sm text-slate-500 font-medium">Quản lý và tra cứu thông tin cán bộ chiến sĩ</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Quân số Đội</p>
            <p className="text-lg font-black text-blue-600">{members.length}</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên hoặc tài khoản..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-white shadow-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 border text-sm font-bold transition-all ${
            showFilters 
            ? 'bg-blue-50 border-blue-200 text-blue-700' 
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <Filter className="w-4 h-4" />
          Bộ lọc
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cấp bậc</label>
            <select 
              value={filterRank} 
              onChange={e => setFilterRank(e.target.value)}
              className="w-full border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
            >
              <option value="">Tất cả cấp bậc</option>
              {uniqueRanks.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chức vụ</label>
            <select 
              value={filterPosition} 
              onChange={e => setFilterPosition(e.target.value)}
              className="w-full border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
            >
              <option value="">Tất cả chức vụ</option>
              {uniquePositions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => { setFilterRank(''); setFilterPosition(''); setSearchTerm(''); }}
              className="text-xs font-bold text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors w-full border border-dashed border-red-200"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('fullName')}>
                  <div className="flex items-center">Họ và tên / Tài khoản {renderSortIcon('fullName')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('rank')}>
                  <div className="flex items-center">Cấp bậc {renderSortIcon('rank')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('position')}>
                  <div className="flex items-center">Chức vụ {renderSortIcon('position')}</div>
                </th>
                <th className="px-6 py-4">Email nội bộ</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('role')}>
                  <div className="flex items-center">Vai trò {renderSortIcon('role')}</div>
                </th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {currentData.map(u => (
                <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shadow-sm group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white transition-all duration-300">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{u.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-medium tracking-tight">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                      {u.rank || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Shield className="w-3.5 h-3.5 text-slate-300" />
                      {u.position || 'Cán bộ'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-xs">{u.username}@security.gov.vn</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      (u.roles && u.roles.includes("Manager")) 
                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {(u.roles && u.roles.includes("Manager")) ? 'Chỉ huy' : 'Chiến sĩ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 shadow-none hover:shadow-sm">
                       <User className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <UsersIcon className="w-10 h-10" />
                       </div>
                       <p className="text-slate-500 font-medium italic">Không tìm thấy cán bộ nào phù hợp với yêu cầu tìm kiếm.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-bold">
            Hiển thị <span className="text-slate-800">{filteredMembers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> trên tổng số <span className="text-slate-800">{filteredMembers.length}</span> nhân sự
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
              Trang {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamTracking;
