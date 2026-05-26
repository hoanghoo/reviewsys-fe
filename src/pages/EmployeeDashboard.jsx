import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewList from '../components/employee/ReviewList';
import Profile from '../components/common/Profile';
import { LayoutDashboard, LogOut, User as UserIcon, Shield, Users } from 'lucide-react';
import logo from '../assets/logo.png';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserIcon },
  ];

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="font-bold text-slate-800 tracking-tight leading-none mb-0.5">KPY</h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Dashboard Cán bộ</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname.includes(`/employee/${tab.id}`);
            return (
              <Link
                key={tab.id}
                to={`/employee/${tab.id}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
            <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.rank} {user?.position ? `- ${user?.position}` : ''}</p>
          </div>
          {user?.role === 'Admin' && (
            <div className="space-y-1.5 mb-4">
              <Link
                to="/admin/teams"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 bg-white rounded-xl transition-all shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Trang Quản trị (Admin)
              </Link>
              <Link
                to="/manager/team-tracking"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 bg-white rounded-xl transition-all shadow-sm"
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Trang Quản lý (Manager)
              </Link>
            </div>
          )}
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-6 max-w-5xl mx-auto">
          <Routes>
            <Route path="overview" element={<ReviewList />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
