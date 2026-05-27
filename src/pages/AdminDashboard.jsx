import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TeamManager from '../components/admin/TeamManager';
import UserManager from '../components/admin/UserManager';
import ReviewPeriodManager from '../components/admin/ReviewPeriodManager';
import TemplateManager from '../components/admin/TemplateManager';
import Profile from '../components/common/Profile';
import { Shield, Users, Calendar, FileText, LogOut, User as UserIcon } from 'lucide-react';
import logo from '../assets/logo.png';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const tabs = [
    { id: 'teams', label: 'Cơ cấu đội', icon: Shield },
    { id: 'users', label: 'Nhân sự', icon: Users },
    { id: 'periods', label: 'Kỳ đánh giá', icon: Calendar },
    { id: 'templates', label: 'Biểu mẫu', icon: FileText },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserIcon },
  ];

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="font-bold text-slate-800 tracking-tight leading-none mb-0.5">KPI Admin Panel</h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Bảng điều khiển</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname.includes(`/admin/${tab.id}`);
            return (
              <Link
                key={tab.id}
                to={`/admin/${tab.id}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive
                    ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
            <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.roles?.includes("Admin") ? 'Quản trị viên' : user?.roles?.includes("Leader") ? "Lãnh đạo" : user?.roles?.includes("Manager") ? "Chỉ huy đội" : "Cán bộ"}</p>
          </div>
          {user?.roles?.includes("Admin") && (
            <div className="mb-4">
              <select 
                onChange={(e) => { if(e.target.value) window.location.href = e.target.value; }}
                value="/admin/teams"
                className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-purple-500 transition-all shadow-sm cursor-pointer text-center appearance-none"
              >
                {user?.roles?.includes("Employee") && <option value="/employee/overview">👤 Vai trò: Cán bộ</option>}
                {user?.roles?.includes("Manager") && !user?.roles?.includes("Leader") && <option value="/manager/team-tracking">👥 Vai trò: Chỉ huy đội</option>}
                {user?.roles?.includes("Leader") && <option value="/manager/evaluations">👥 Vai trò: Lãnh đạo phòng</option>}
                <option value="/admin/teams">🛡️ Vai trò: Quản trị</option>
              </select>
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
        <div className="p-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[calc(100vh-3rem)]">
            <Routes>
              <Route path="teams" element={<TeamManager />} />
              <Route path="users" element={<UserManager />} />
              <Route path="periods" element={<ReviewPeriodManager />} />
              <Route path="templates" element={<TemplateManager />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="users" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
