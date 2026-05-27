const fs = require('fs');
let code = fs.readFileSync('src/components/employee/SelfReviewForm.jsx', 'utf8');

// 1. Add commanderTotalScore state
code = code.replace(
  'const [totalScore, setTotalScore] = useState(0);',
  'const [totalScore, setTotalScore] = useState(0);\n  const [commanderTotalScore, setCommanderTotalScore] = useState(0);'
);

// 2. Prepopulate commanderTotalScore if review.score exists
code = code.replace(
  'setTotalScore(review.selfScore || 0);',
  'setTotalScore(review.selfScore || 0);\n        setCommanderTotalScore(review.score || 0);'
);

// 3. Rewrite calculateTree starting from 'const rootChildren =' up to 'onTotalScoreChange(total); }'
const oldCalcStart = `    // 4. Calculate final total from all root-level nodes
    const rootChildren = inputs.filter(i => i.getAttribute('data-parent-id') === 'root');
    let total = 0;
    
    let valI = 0;
    let valII = 0;
    let isIIFilled = false;

    // Helper to check if a node or its children have been filled (value !== '')
    const checkIsFilled = (nodeId) => {
      const nodeInput = inputs.find(i => i.getAttribute('data-id') === nodeId);
      if (!nodeInput) return false;
      const children = inputs.filter(i => i.getAttribute('data-parent-id') === nodeId);
      if (children.length > 0) {
        return children.some(child => checkIsFilled(child.getAttribute('data-id')));
      } else {
        return nodeInput.value !== '';
      }
    };

    rootChildren.forEach(child => {
       const val = getValue(child.getAttribute('data-id'));
       const row = child.closest('tr');
       const firstCellText = row?.querySelector('td')?.textContent.trim().toUpperCase() || '';
       
       if (firstCellText === 'I') {
         valI = val;
       } else if (firstCellText === 'II') {
         valII = val;
         isIIFilled = checkIsFilled(child.getAttribute('data-id')) || val > 0;
       } else if (firstCellText === 'III' || firstCellText.includes('CỘNG')) {
         total += val; // Điểm cộng
       } else if (firstCellText === 'IV' || firstCellText.includes('TRỪ')) {
         total -= val; // Điểm trừ
       } else {
         total += val;
       }
    });

    if (isIIFilled) {
      total += (valI + valII) / 2;
    } else {
      total += valI; // If II is not filled or = 0, just add I
    }
    
    setTotalScore(total);
    if (onTotalScoreChange) {
      onTotalScoreChange(total);
    }`;

const newCalcStart = `    // 4. Calculate final totals for both employee and commander
    const calcRootSum = (rootFilterId) => {
      const roots = inputs.filter(i => i.getAttribute('data-parent-id') === rootFilterId);
      if (roots.length === 0) return 0;
      
      let total = 0;
      let valI = 0;
      let valII = 0;
      let isIIFilled = false;

      const checkIsFilled = (nodeId) => {
        const nodeInput = inputs.find(i => i.getAttribute('data-id') === nodeId);
        if (!nodeInput) return false;
        const children = inputs.filter(i => i.getAttribute('data-parent-id') === nodeId);
        if (children.length > 0) {
          return children.some(child => checkIsFilled(child.getAttribute('data-id')));
        } else {
          return nodeInput.value !== '';
        }
      };

      roots.forEach(child => {
         const val = getValue(child.getAttribute('data-id'));
         const row = child.closest('tr');
         const firstCellText = row?.querySelector('td')?.textContent.trim().toUpperCase() || '';
         
         if (firstCellText === 'I') {
           valI = val;
         } else if (firstCellText === 'II') {
           valII = val;
           isIIFilled = checkIsFilled(child.getAttribute('data-id')) || val > 0;
         } else if (firstCellText === 'III' || firstCellText.includes('CỘNG')) {
           total += val;
         } else if (firstCellText === 'IV' || firstCellText.includes('TRỪ')) {
           total -= val;
         } else {
           total += val;
         }
      });

      if (isIIFilled) {
        total += (valI + valII) / 2;
      } else {
        total += valI;
      }
      return total;
    };

    const employeeTotal = calcRootSum('root');
    const commanderTotal = calcRootSum('root_commander');
    
    setTotalScore(employeeTotal);
    setCommanderTotalScore(commanderTotal);
    
    if (onTotalScoreChange) {
      onTotalScoreChange(isManagerMode ? commanderTotal : employeeTotal);
    }`;

code = code.replace(oldCalcStart, newCalcStart);

// 4. Fix UI footer to show BOTH scores if commander score is relevant
const oldFooterUI = `              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Tổng điểm:</span>
                <input type="text" readOnly className={\`\${inputClass} w-24 text-center font-bold text-2xl text-blue-600 border-b-2\`} value={totalScore} />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Xếp loại:</span>
                <input type="text" readOnly className={\`\${inputClass} w-48 font-bold text-lg text-emerald-600 border-b-2\`} value={classifyScore(totalScore)} />
              </div>`;

const newFooterUI = `              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Tổng cá nhân:</span>
                <input type="text" readOnly className={\`\${inputClass} w-20 text-center font-bold text-2xl text-slate-600 border-b-2\`} value={totalScore} />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Tổng chỉ huy:</span>
                <input type="text" readOnly className={\`\${inputClass} w-20 text-center font-bold text-2xl text-blue-600 border-b-2\`} value={commanderTotalScore} />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Xếp loại:</span>
                <input type="text" readOnly className={\`\${inputClass} w-40 font-bold text-lg text-emerald-600 border-b-2\`} value={classifyScore(commanderTotalScore > 0 ? commanderTotalScore : totalScore)} />
              </div>`;

code = code.replace(oldFooterUI, newFooterUI);

fs.writeFileSync('src/components/employee/SelfReviewForm.jsx', code);
console.log('SelfReviewForm calculation and footer patched');
