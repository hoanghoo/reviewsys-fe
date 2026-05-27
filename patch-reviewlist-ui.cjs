const fs = require('fs');
let code = fs.readFileSync('src/components/employee/ReviewList.jsx', 'utf8');

// Change overflow-hidden to overflow-x-auto on the table container
code = code.replace(
  'className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"',
  'className="bg-white rounded-3xl border border-slate-200 overflow-x-auto shadow-sm"'
);

// Replace px-8 with px-5 whitespace-nowrap to give more room and prevent wrapping
code = code.replace(/px-8/g, 'px-5 whitespace-nowrap');

// Ensure the "Biểu mẫu: Mặc định" also doesn't wrap by keeping it tight, it's already inside a flex col.
fs.writeFileSync('src/components/employee/ReviewList.jsx', code);
console.log('ReviewList UI patched');
