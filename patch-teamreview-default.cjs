const fs = require('fs');
let code = fs.readFileSync('src/components/manager/TeamReview.jsx', 'utf8');

const oldState = `  const [selectedStatus, setSelectedStatus] = useState('');`;

const newState = `  const isManager = currentUser?.roles && currentUser.roles.includes("Manager");
  const [selectedStatus, setSelectedStatus] = useState(isManager && !isLeader ? 'Submitted' : '');`;

code = code.replace(oldState, newState);
fs.writeFileSync('src/components/manager/TeamReview.jsx', code);
console.log('TeamReview.jsx patched for default status');
