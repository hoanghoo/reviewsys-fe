const fs = require('fs');
let code = fs.readFileSync('src/components/employee/SelfReviewForm.jsx', 'utf8');

// 1. Add savedFeedbackRef
code = code.replace(
  'const formRef = useRef(null);',
  'const formRef = useRef(null);\n  const savedFeedbackRef = useRef(null);'
);

// 2. In fetchData, replace the setTimeout block with saving to Ref
const oldFetchDataFeedback = `        try {
          const parsedFeedback = typeof review.feedback === 'string' ? JSON.parse(review.feedback) : (review.feedback || {});
          // If we have a saved commander name in feedback, use it
          if (parsedFeedback.commander) {
            setCommanderName(parsedFeedback.commander);
          }
          
          // Wait for next tick so dangerouslySetInnerHTML mounts
          setTimeout(() => {
             if (formRef.current && parsedFeedback.tableData) {
                const scoreInputs = formRef.current.querySelectorAll('.score-input');
                const noteInputs = formRef.current.querySelectorAll('.note-input');
                
                parsedFeedback.tableData.scores?.forEach((val, i) => {
                  if (scoreInputs[i]) scoreInputs[i].value = val;
                });
                parsedFeedback.tableData.notes?.forEach((val, i) => {
                  if (noteInputs[i]) noteInputs[i].value = val;
                });
                
                calculateTree();
             }
          }, 100);
        } catch(e) {}`;

const newFetchDataFeedback = `        try {
          const parsedFeedback = typeof review.feedback === 'string' ? JSON.parse(review.feedback) : (review.feedback || {});
          savedFeedbackRef.current = parsedFeedback;
          if (parsedFeedback.commander) {
            setCommanderName(parsedFeedback.commander);
          }
        } catch(e) {}`;

code = code.replace(oldFetchDataFeedback, newFetchDataFeedback);

// 3. In the templateHtml useEffect, populate the data after injecting HTML
const oldHtmlInjection = `            if (input.type === 'number') {
              input.addEventListener('wheel', (e) => {
                e.preventDefault();
              }, { passive: false });
            }
          });
        }`;

const newHtmlInjection = `            if (input.type === 'number') {
              input.addEventListener('wheel', (e) => {
                e.preventDefault();
              }, { passive: false });
            }
          });
          
          // Apply saved feedback if exists
          if (savedFeedbackRef.current && savedFeedbackRef.current.tableData) {
            const parsedFeedback = savedFeedbackRef.current;
            const scoreInputs = formRef.current.querySelectorAll('.score-input');
            const noteInputs = formRef.current.querySelectorAll('.note-input');
            
            parsedFeedback.tableData.scores?.forEach((val, i) => {
              if (scoreInputs[i]) scoreInputs[i].value = val;
            });
            parsedFeedback.tableData.notes?.forEach((val, i) => {
              if (noteInputs[i]) noteInputs[i].value = val;
            });
            
            // clear it so it doesn't re-apply if they change periods without unmounting
            savedFeedbackRef.current = null;
            
            setTimeout(() => calculateTree(), 50);
          }
        }`;

code = code.replace(oldHtmlInjection, newHtmlInjection);

fs.writeFileSync('src/components/employee/SelfReviewForm.jsx', code);
console.log('SelfReviewForm.jsx patched');
