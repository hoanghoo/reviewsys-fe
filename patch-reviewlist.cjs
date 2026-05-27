const fs = require('fs');
let code = fs.readFileSync('src/components/employee/ReviewList.jsx', 'utf8');

const oldStatusInfo = `  const getStatusInfo = (period, review) => {
    if (review) {
      switch (review.status) {
        case 'Submitted':
          return { label: 'Đã nộp', color: 'bg-blue-100 text-blue-700', icon: Clock };
        case 'ManagerReviewed':
          return { label: 'Đã đánh giá', color: 'bg-purple-100 text-purple-700', icon: CheckCircle };
        case 'Completed':
          return { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };`;

const newStatusInfo = `  const getStatusInfo = (period, review) => {
    if (review) {
      switch (review.status) {
        case 'Submitted':
          return { label: 'Chờ chỉ huy duyệt', color: 'bg-blue-100 text-blue-700', icon: Clock };
        case 'ManagerReviewed':
          return { label: 'Chờ lãnh đạo duyệt', color: 'bg-purple-100 text-purple-700', icon: Clock };
        case 'Completed':
          return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };`;

code = code.replace(oldStatusInfo, newStatusInfo);

const oldHeaders = `<th className="px-8 py-4">Kỳ đánh giá</th>
                <th className="px-8 py-4">Ngày hoàn thành</th>
                <th className="px-8 py-4">Trạng thái</th>
                <th className="px-8 py-4 text-center">Điểm</th>
                <th className="px-8 py-4 text-right">Thao tác</th>`;

const newHeaders = `<th className="px-8 py-4">Kỳ đánh giá</th>
                <th className="px-8 py-4">Cập nhật lần cuối</th>
                <th className="px-8 py-4">Trạng thái</th>
                <th className="px-8 py-4 text-center">Điểm cá nhân</th>
                <th className="px-8 py-4 text-center">Điểm chỉ huy</th>
                <th className="px-8 py-4 text-right">Thao tác</th>`;

code = code.replace(oldHeaders, newHeaders);

const oldCells = `<td className="px-8 py-5 text-center">
                      <span className="font-bold text-slate-700">{review.score || review.selfScore || '-'}</span>
                    </td>`;

const newCells = `<td className="px-8 py-5 text-center">
                      <span className="font-bold text-slate-700">{review.selfScore || '-'}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="font-bold text-blue-700">{review.score || '-'}</span>
                    </td>`;

code = code.replace(oldCells, newCells);

const oldColspan = `<tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-medium italic">`;

const newColspan = `<tr>
                  <td colSpan="6" className="px-8 py-12 text-center text-slate-400 font-medium italic">`;

code = code.replace(oldColspan, newColspan);

fs.writeFileSync('src/components/employee/ReviewList.jsx', code);
console.log('ReviewList.jsx patched');
