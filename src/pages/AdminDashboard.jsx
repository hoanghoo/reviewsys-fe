import React, { useState } from 'react';
import { Shield, Users, Calendar, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TeamManager from '../components/admin/TeamManager';
import UserManager from '../components/admin/UserManager';
import ReviewPeriodManager from '../components/admin/ReviewPeriodManager';
import TemplateManager from '../components/admin/TemplateManager';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'teams', label: 'Cơ cấu đội', icon: Shield },
    { id: 'users', label: 'Nhân sự', icon: Users },
    { id: 'periods', label: 'Kỳ đánh giá', icon: Calendar },
    { id: 'templates', label: 'Biểu mẫu', icon: FileText },
  ];

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
            <span className="text-white font-bold text-lg">i</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 tracking-tight">iPRS Admin</h1>
            <p className="text-xs text-slate-500 font-medium">System Management</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                  ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
            <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.role === 'Admin' ? 'Người vận hành' : user?.role === 'Manager' ? 'Quản lý' : 'Người dùng'}</p>
          </div>
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
            {activeTab === 'teams' && <TeamManager />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'periods' && <ReviewPeriodManager />}
            {activeTab === 'templates' && <TemplateManager />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
