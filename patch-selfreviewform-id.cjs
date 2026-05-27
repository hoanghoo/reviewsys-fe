const fs = require('fs');
let code = fs.readFileSync('src/components/employee/SelfReviewForm.jsx', 'utf8');

// Add id to the form container
code = code.replace(
  '<div \n            ref={formRef}',
  '<div \n            id="manager-review-form"\n            ref={formRef}'
);

fs.writeFileSync('src/components/employee/SelfReviewForm.jsx', code);
console.log('SelfReviewForm.jsx ID patched');
