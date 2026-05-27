const fs = require('fs');
let code = fs.readFileSync('src/components/admin/UserManager.jsx', 'utf8');

const oldBlock = `<div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cấp bậc</label>
                  <input value={formData.rank} onChange={e => setFormData({ ...formData, rank: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Đại úy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ</label>
                  <input value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Đội trưởng" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đội</label>
                  <select value={formData.teamId} onChange={e => setFormData({ ...formData, teamId: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none">
                    <option value="">-- Chọn đội --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vai trò hệ thống</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'Employee', label: 'Cán bộ' },
                      { val: 'Manager', label: 'Quản lý' },
                      { val: 'Leader', label: 'Lãnh đạo' },
                      { val: 'Admin', label: 'Quản trị viên' }
                    ].map(r => (
                      <label key={r.val} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={formData.roles && formData.roles.includes(r.val)} onChange={(e) => {
                          const currentRoles = formData.roles || [];
                          const nextRoles = e.target.checked ? [...currentRoles, r.val] : currentRoles.filter(x => x !== r.val);
                          setFormData({ ...formData, roles: nextRoles.length ? nextRoles : ['Employee'] });
                        }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>`;

const newBlock = `<div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đội/Phòng</label>
                <select value={formData.teamId} onChange={e => {
                  setFormData({ ...formData, teamId: e.target.value, position: '' }); // reset position when team changes
                }} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none">
                  <option value="">-- Chọn đội --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cấp bậc</label>
                  <input value={formData.rank} onChange={e => setFormData({ ...formData, rank: e.target.value })} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Đại úy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ</label>
                  {(() => {
                    const selectedTeam = teams.find(t => t.id == formData.teamId);
                    const isLeadershipTeam = selectedTeam && (selectedTeam.shortName === 'Ban Lãnh đạo' || selectedTeam.id === 7);
                    const positionOptions = !formData.teamId 
                      ? [] 
                      : isLeadershipTeam 
                        ? ['Trưởng phòng', 'Phó phòng', 'Cán bộ'] 
                        : ['Đội trưởng', 'Phó đội trưởng', 'Đội phó', 'Cán bộ'];
                    
                    return (
                      <select 
                        value={formData.position} 
                        onChange={e => setFormData({ ...formData, position: e.target.value })} 
                        className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                        disabled={!formData.teamId}
                      >
                        <option value="">-- Chọn chức vụ --</option>
                        {positionOptions.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>`;

code = code.replace(oldBlock, newBlock);

const oldManagedTeams = `{((formData.roles && (formData.roles.includes("Manager") || formData.roles.includes("Leader"))) && (formData.position === 'Phó trưởng phòng' || formData.position === 'Phó phòng')) && (`;
const newManagedTeams = `{(formData.position === 'Phó trưởng phòng' || formData.position === 'Phó phòng') && (`;

code = code.replace(oldManagedTeams, newManagedTeams);

fs.writeFileSync('src/components/admin/UserManager.jsx', code);
console.log('UserManager.jsx patched');
