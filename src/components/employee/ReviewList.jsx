import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, CheckCircle, AlertCircle, ChevronRight, FileEdit, Eye, History } from 'lucide-react';
import SelfReviewForm from './SelfReviewForm';

const ReviewList = () => {
  const toast = useToast();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    try {
      const res = await api.get('/reviews/my-reviews');
      setPeriods(res.data);
    } catch (err) {
      toast.error('Lỗi tải danh sách đánh giá: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (period, review) => {
    if (review) {
      switch (review.status) {
        case 'Submitted':
          return { label: 'Chờ chỉ huy duyệt', color: 'bg-blue-100 text-blue-700', icon: Clock };
        case 'ManagerReviewed':
          return { label: 'Chờ lãnh đạo duyệt', color: 'bg-purple-100 text-purple-700', icon: Clock };
        case 'Completed':
          return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
        default:
          return { label: 'Chưa hoàn thành', color: 'bg-amber-100 text-amber-700', icon: AlertCircle };
      }
    }
    
    if (period.status === 'Open') {
      return { label: 'Đang chờ', color: 'bg-orange-100 text-orange-700', icon: Clock };
    }
    
    return { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-500', icon: AlertCircle };
  };

  if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Đang tải danh sách...</div>;

  if (viewMode === 'form' && selectedPeriod) {
    return (
      <SelfReviewForm 
        period={selectedPeriod} 
        onBack={() => { setViewMode('list'); fetchMyReviews(); }} 
        readOnly={selectedPeriod.status === 'Closed' || selectedPeriod.Reviews?.[0]?.status === 'Completed'}
      />
    );
  }

  const pendingPeriods = periods.filter(p => p.status === 'Open' && (!p.Reviews?.[0] || p.Reviews?.[0].status === 'Draft'));
  const completedPeriods = periods.filter(p => p.Reviews?.[0] && p.Reviews?.[0].status !== 'Draft');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Kỳ đánh giá của tôi</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Theo dõi và thực hiện đánh giá cá nhân</p>
        </div>
      </div>

      {/* Pending Reviews */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Đang chờ thực hiện ({pendingPeriods.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingPeriods.map(p => {
            const status = getStatusInfo(p, p.Reviews?.[0]);
            const Icon = status.icon;
            return (
              <div key={p.id} className="group bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-blue-50 hover:border-blue-200 transition-all duration-300 cursor-pointer flex justify-between items-center" onClick={() => { setSelectedPeriod(p); setViewMode('form'); }}>
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{p.name}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Hạn chót: {new Date(p.endDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${status.color} flex items-center gap-1.5`}>
                    <Icon className="w-3 h-3" />
                    {status.label}
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 font-bold text-xs">
                    Thực hiện ngay
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
          {pendingPeriods.length === 0 && (
            <div className="col-span-full py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <CheckCircle className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">Bạn không có kỳ đánh giá nào đang chờ</p>
            </div>
          )}
        </div>
      </section>

      {/* Completed/History */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4" />
          Lịch sử đánh giá ({completedPeriods.length})
        </h3>
        <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <th className="px-5 whitespace-nowrap py-4">Kỳ đánh giá</th>
                <th className="px-5 whitespace-nowrap py-4">Cập nhật lần cuối</th>
                <th className="px-5 whitespace-nowrap py-4">Trạng thái</th>
                <th className="px-5 whitespace-nowrap py-4 text-center">Điểm cá nhân</th>
                <th className="px-5 whitespace-nowrap py-4 text-center">Điểm chỉ huy</th>
                <th className="px-5 whitespace-nowrap py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {completedPeriods.map(p => {
                const review = p.Reviews?.[0];
                const status = getStatusInfo(p, review);
                const Icon = status.icon;
                return (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 whitespace-nowrap py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Biểu mẫu: {p.Template?.name || 'Mặc định'}</span>
                      </div>
                    </td>
                    <td className="px-5 whitespace-nowrap py-5 text-sm text-slate-500 font-medium">
                      {new Date(review.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 whitespace-nowrap py-5">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${status.color} inline-flex items-center gap-1.5`}>
                        <Icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 whitespace-nowrap py-5 text-center">
                      <span className="font-bold text-slate-700">{review.selfScore || '-'}</span>
                    </td>
                    <td className="px-5 whitespace-nowrap py-5 text-center">
                      <span className="font-bold text-blue-700">{review.score || '-'}</span>
                    </td>
                    <td className="px-5 whitespace-nowrap py-5 text-right">
                      <button 
                        onClick={() => { setSelectedPeriod(p); setViewMode('form'); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {completedPeriods.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 whitespace-nowrap py-12 text-center text-slate-400 font-medium italic">
                    Chưa có lịch sử đánh giá
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ReviewList;
