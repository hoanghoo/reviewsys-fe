import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { User, Key, Shield, Briefcase, Users, BadgeCheck, Lock, Save, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data);
    } catch (err) {
      toast.error('Lỗi tải thông tin cá nhân: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp');
    }
    if (pwdData.newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải từ 6 ký tự trở lên');
    }

    try {
      await api.post('/users/change-password', {
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword
      });
      toast.success('Đổi mật khẩu thành công!');
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Đang tải thông tin cá nhân...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Thông tin cá nhân</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Quản lý thông tin tài khoản và bảo mật</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar and Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-100 mb-4 transform hover:rotate-6 transition-transform cursor-default">
              {profile?.fullName?.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{profile?.fullName}</h3>
            <p className="text-sm text-slate-500 font-medium">@{profile?.username}</p>
            
            <div className="mt-6 w-full pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600 justify-center">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">{profile?.role === 'Admin' ? 'Người vận hành' : profile?.role === 'Manager' ? 'Quản lý' : 'Người dùng'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-sm ${
              showPasswordForm 
              ? 'bg-slate-800 text-white hover:bg-slate-900' 
              : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <Key className="w-4 h-4" />
            {showPasswordForm ? 'Hủy đổi mật khẩu' : 'Đổi mật khẩu'}
          </button>
        </div>

        {/* Right Column: Detailed Info or Password Form */}
        <div className="md:col-span-2">
          {!showPasswordForm ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Chi tiết hồ sơ
                </h4>
              </div>
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cấp bậc</label>
                  <div className="flex items-center gap-2 text-slate-700">
                    <BadgeCheck className="w-4 h-4 text-slate-300" />
                    <span className="font-semibold text-sm">{profile?.rank || 'Chưa cập nhật'}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chức vụ</label>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Briefcase className="w-4 h-4 text-slate-300" />
                    <span className="font-semibold text-sm">{profile?.position || 'Chưa cập nhật'}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đội công tác</label>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Users className="w-4 h-4 text-slate-300" />
                    <span className="font-semibold text-sm">{profile?.Team?.fullName || 'Chưa cập nhật'}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phòng ban</label>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Shield className="w-4 h-4 text-slate-300" />
                    <span className="font-semibold text-sm">{profile?.Department?.name || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-blue-50/30 border-t border-slate-100 italic text-[11px] text-slate-400 text-center">
                * Các thông tin trên do Người vận hành hệ thống cập nhật. Vui lòng liên hệ nếu có sai sót.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-blue-50 bg-blue-50/30">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Thiết lập mật khẩu mới
                </h4>
              </div>
              <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <input 
                      required
                      type={showCurrentPwd ? "text" : "password"}
                      value={pwdData.currentPassword}
                      onChange={e => setPwdData({...pwdData, currentPassword: e.target.value})}
                      className="w-full border-slate-200 rounded-2xl p-3.5 pr-12 border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium transition-all"
                      placeholder="Nhập mật khẩu đang dùng"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Mật khẩu mới</label>
                    <div className="relative">
                      <input 
                        required
                        type={showNewPwd ? "text" : "password"}
                        value={pwdData.newPassword}
                        onChange={e => setPwdData({...pwdData, newPassword: e.target.value})}
                        className="w-full border-slate-200 rounded-2xl p-3.5 pr-12 border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium transition-all"
                        placeholder="Tối thiểu 6 ký tự"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Xác nhận mật khẩu</label>
                    <input 
                      required
                      type="password"
                      value={pwdData.confirmPassword}
                      onChange={e => setPwdData({...pwdData, confirmPassword: e.target.value})}
                      className="w-full border-slate-200 rounded-2xl p-3.5 border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium transition-all"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordForm(false)}
                    className="px-6 py-3 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
