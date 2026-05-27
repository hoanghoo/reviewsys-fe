const fs = require('fs');
let code = fs.readFileSync('src/components/manager/TeamReview.jsx', 'utf8');

// 1. Add Power to lucide-react import
code = code.replace(
  'Download, Info, UserCheck } from \'lucide-react\';',
  'Download, Info, UserCheck, Power } from \'lucide-react\';'
);

// 2. Remove auto-selection of activePeriod
const oldFetchInitialData = `      if (propPeriodId) {
        const targetPeriod = periodsRes.data.find(p => p.id === parseInt(propPeriodId));
        setActivePeriod(targetPeriod);
      } else {
        const activeRes = await api.get('/review-periods/active');
        if (activeRes.data) {
          setActivePeriod(activeRes.data);
          setSelectedPeriodId(activeRes.data.id);
        } else if (periodsRes.data.length > 0) {
          setSelectedPeriodId(periodsRes.data[0].id);
        }
      }`;
const newFetchInitialData = `      if (propPeriodId) {
        const targetPeriod = periodsRes.data.find(p => p.id === parseInt(propPeriodId));
        setActivePeriod(targetPeriod);
        setSelectedPeriodId(parseInt(propPeriodId));
      }`;
code = code.replace(oldFetchInitialData, newFetchInitialData);

// 3. Replace !activePeriod render block
const oldActivePeriodBlock = `  if (!activePeriod) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">Không có kỳ đánh giá nào đang mở để theo dõi.</p>
      </div>
    );
  }`;
const newActivePeriodBlock = `  if (!activePeriod) {
    const now = new Date();
    const openPeriods = periods.filter(p => p.status === 'Open' && new Date(p.startDate) <= now);
    const upcomingPeriods = periods.filter(p => p.status === 'Open' && new Date(p.startDate) > now);
    const closedPeriods = periods.filter(p => p.status === 'Closed');

    const renderPeriodCard = (p) => (
      <div 
        key={p.id} 
        onClick={() => { setSelectedPeriodId(p.id); setActivePeriod(p); setPagination(prev => ({...prev, page: 1})); }}
        className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col gap-3 group"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{p.monthYear || 'N/A'}</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{p.name}</h3>
          <p className="text-sm text-slate-500 mt-1">Từ {new Date(p.startDate).toLocaleDateString('vi-VN')} đến {new Date(p.endDate).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>
    );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-7xl mx-auto">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Power className="w-5 h-5 text-emerald-500" /> Kỳ đang mở</h2>
          {openPeriods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openPeriods.map(renderPeriodCard)}
            </div>
          ) : <p className="text-slate-500 italic bg-white p-6 rounded-xl border border-slate-200 text-center">Không có kỳ đánh giá nào đang mở.</p>}
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Kỳ sắp mở</h2>
          {upcomingPeriods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPeriods.map(renderPeriodCard)}
            </div>
          ) : <p className="text-slate-500 italic bg-white p-6 rounded-xl border border-slate-200 text-center">Không có kỳ đánh giá nào sắp mở.</p>}
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-slate-500" /> Kỳ đã hoàn tất</h2>
          {closedPeriods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedPeriods.map(renderPeriodCard)}
            </div>
          ) : <p className="text-slate-500 italic bg-white p-6 rounded-xl border border-slate-200 text-center">Chưa có kỳ đánh giá nào hoàn tất.</p>}
        </div>
      </div>
    );
  }`;
code = code.replace(oldActivePeriodBlock, newActivePeriodBlock);

fs.writeFileSync('src/components/manager/TeamReview.jsx', code);
console.log('TeamReview.jsx UI modified successfully');
