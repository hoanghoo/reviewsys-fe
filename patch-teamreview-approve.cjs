const fs = require('fs');
let code = fs.readFileSync('src/components/manager/TeamReview.jsx', 'utf8');

const oldHandleApprove = `  const handleApprove = async (targetStatus) => {
    if (!selectedReview) return;
    
    // Extract DOM data
    const tableData = { scores: [], notes: [] };
    const formEl = document.getElementById('manager-review-form');
    if (formEl) {
       const scoreInputs = formEl.querySelectorAll('.score-input');
       const noteInputs = formEl.querySelectorAll('.note-input');
       scoreInputs.forEach(i => tableData.scores.push(i.value));
       noteInputs.forEach(i => tableData.notes.push(i.value));
    }

    const finalFeedback = {
       ...editFeedback,
       tableData,
       commander: editFeedback.commander 
    };`;

const newHandleApprove = `  const handleApprove = async (targetStatus, formCommanderName) => {
    if (!selectedReview) return;
    
    // Extract DOM data
    const tableData = { scores: [], notes: [] };
    const formEl = document.getElementById('manager-review-form');
    if (formEl) {
       const scoreInputs = formEl.querySelectorAll('.score-input');
       const noteInputs = formEl.querySelectorAll('.note-input');
       scoreInputs.forEach(i => tableData.scores.push(i.value));
       noteInputs.forEach(i => tableData.notes.push(i.value));
    }

    const finalFeedback = {
       ...editFeedback,
       tableData,
       commander: formCommanderName || editFeedback.commander 
    };`;

code = code.replace(oldHandleApprove, newHandleApprove);

fs.writeFileSync('src/components/manager/TeamReview.jsx', code);
console.log('TeamReview handleApprove patched');
