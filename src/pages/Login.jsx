import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      toast.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(username, password);
      // Redirect based on roles, prioritizing higher roles if multiple exist
      if (user.roles && user.roles.includes('Admin')) {
        navigate('/admin');
      } else if (user.roles && (user.roles.includes('Manager') || user.roles.includes('Leader'))) {
        navigate('/manager');
      } else if (user.roles && user.roles.includes('Employee')) {
        navigate('/employee');
      } else {
        navigate('/employee');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-200/60 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/80 border border-slate-100 transform transition-all relative z-10">
        <div className="text-center mb-8">
          <img src={logo} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight text-center">HỆ THỐNG CHẤM ĐIỂM, ĐÁNH GIÁ KẾT QUẢ THỰC HIỆN NHIỆM VỤ CÁ NHÂN</h2>
          <p className="text-slate-500 mt-2 text-[10px] uppercase tracking-wider font-bold">Phòng An ninh mạng & PCTP sử dụng công nghệ cao</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 ml-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
              </div>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
              </div>
              <input
                type="password"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-200/80 transform transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Đăng Nhập'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
