const fs = require('fs');
let code = fs.readFileSync('src/pages/ManagerDashboard.jsx', 'utf8');

// 1. Rename tab
code = code.replace(
  '{ id: \'evaluations\', label: \'Quản lý đánh giá\', icon: FileSignature },',
  '{ id: \'evaluations\', label: \'Kỳ đánh giá\', icon: FileSignature },'
);

// 2. Change default redirect route
code = code.replace(
  '<Route path="*" element={<Navigate to="team-tracking" replace />} />',
  '<Route path="*" element={<Navigate to="evaluations" replace />} />'
);

fs.writeFileSync('src/pages/ManagerDashboard.jsx', code);
console.log('ManagerDashboard.jsx patched successfully');
