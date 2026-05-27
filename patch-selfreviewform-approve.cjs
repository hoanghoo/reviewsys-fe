const fs = require('fs');
let code = fs.readFileSync('src/components/employee/SelfReviewForm.jsx', 'utf8');

code = code.replace(
  'onClick={() => onApprove(\'ManagerReviewed\')}',
  'onClick={() => onApprove(\'ManagerReviewed\', commanderName)}'
);

code = code.replace(
  'onClick={() => onApprove(\'Completed\')}',
  'onClick={() => onApprove(\'Completed\', commanderName)}'
);

fs.writeFileSync('src/components/employee/SelfReviewForm.jsx', code);
console.log('SelfReviewForm approve patched');
