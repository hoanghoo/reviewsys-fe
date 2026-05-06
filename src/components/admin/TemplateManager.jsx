import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../common/ConfirmModal';
import { Upload, Trash2, FileText, Plus, X, Search, CheckCircle, Save, Eye, Info } from 'lucide-react';

const DOCX_PREVIEW_STYLES = `
  .docx-preview table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .docx-preview th, .docx-preview td { border: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: top; }
  .docx-preview th { background: #f1f5f9; font-weight: 600; }
  .docx-preview thead th { background: #e2e8f0; text-align: center; }
  .docx-preview thead th:nth-child(1) { width: 5%; }
  .docx-preview thead th:nth-child(2) { width: 40%; }
  .docx-preview thead th:nth-child(3) { width: 15%; }
  .docx-preview thead th:nth-child(4) { width: 15%; }
  .docx-preview thead th:nth-child(5) { width: 25%; }
  .docx-preview td:has(input) { padding: 0; vertical-align: middle; height: 1px; }
  .docx-preview input.score-input,
  .docx-preview input.note-input { width: 100%; height: 100%; min-height: 34px; display: block; border: none; border-radius: 0; padding: 0 8px; font-size: 12px; background: #fff; outline: none; box-sizing: border-box; transition: background 0.15s, box-shadow 0.15s; }
  .docx-preview input.score-input { text-align: center; }
  .docx-preview input.score-input::-webkit-inner-spin-button,
  .docx-preview input.score-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .docx-preview input.score-input { -moz-appearance: textfield; }
  .docx-preview input.score-input:hover,
  .docx-preview input.note-input:hover { background: #f5f3ff; }
  .docx-preview input.score-input:focus,
  .docx-preview input.note-input:focus { background: #eef2ff; box-shadow: inset 0 0 0 2px #6366f1; }
  .docx-preview p { margin: 0; line-height: 1.4; }
`;

// Fixed header component
const inputClass = "h-7 border-b border-slate-300 bg-transparent outline-none px-1.5 text-slate-800 font-semibold focus:border-blue-500 transition-colors placeholder:font-normal placeholder:text-slate-400";

const TemplateHeader = () => (
  <div className="pb-6 mb-6 border-b-2 border-dashed border-slate-200 bg-white">
    <div className="flex justify-between items-start text-sm text-slate-800 mb-6">
      <div className="text-center font-bold">
        <p>PHÒNG AN NINH MẠNG VÀ PCTP</p>
        <p>SỬ DỤNG CÔNG NGHỆ CAO</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span>ĐỘI</span>
          <input type="text" readOnly className={`${inputClass} w-32 text-center text-blue-700`} placeholder="..." />
        </div>
      </div>
      <div className="text-center">
        <p className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="font-semibold underline underline-offset-4">Độc lập – Tự do – Hạnh phúc</p>
      </div>
    </div>
    
    <div className="text-center mb-6">
      <p className="font-bold text-blue-900 text-xl mb-1">BẢNG CHẤM ĐIỂM</p>
      <p className="text-sm text-slate-600 font-medium">Đánh giá kết quả thực hiện nhiệm vụ của Cán bộ chiến sĩ</p>
      <div className="flex items-center justify-center gap-2 mt-3 text-sm font-semibold text-slate-800">
        <span>Tháng</span>
        <input type="text" readOnly className={`${inputClass} w-12 text-center text-blue-700`} placeholder="..." />
        <span>năm</span>
        <input type="text" readOnly className={`${inputClass} w-16 text-center text-blue-700`} placeholder="..." />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm px-4">
      <div className="flex items-center gap-2">
        <span className="text-slate-600 whitespace-nowrap">Họ và tên:</span>
        <input type="text" readOnly className={`${inputClass} flex-1 text-blue-700`} placeholder="..." />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-600 whitespace-nowrap">Cấp bậc - Chức vụ:</span>
        <input type="text" readOnly className={`${inputClass} flex-1 text-blue-700`} placeholder="..." />
      </div>
    </div>
  </div>
);

// Footer with Tổng điểm, Xếp loại, Chỉ huy đội
const TemplateFooter = () => (
  <div className="pt-6 mt-4 border-t-2 border-dashed border-slate-200 bg-white">
    <div className="flex flex-col sm:flex-row items-center justify-between text-sm mb-8 gap-4 px-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-800 uppercase tracking-wider">Tổng điểm:</span>
        <input type="text" readOnly className={`${inputClass} w-24 text-center font-bold text-2xl text-blue-600 border-b-2`} placeholder="0" />
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-800 uppercase tracking-wider">Xếp loại:</span>
        <input type="text" readOnly className={`${inputClass} w-48 font-bold text-lg text-emerald-600 border-b-2`} placeholder="..." />
      </div>
    </div>
    
    <div className="flex justify-end text-sm text-slate-800 px-4 mt-6">
      <div className="text-center w-64">
        <p className="font-bold mb-1">CHỈ HUY ĐỘI</p>
        <p className="text-slate-500 italic mb-12">(Ký, ghi rõ họ tên)</p>
        <input 
          type="text" 
          readOnly
          placeholder="Nhập họ tên chỉ huy..."
          className="w-full text-center font-semibold text-slate-800 border-b border-slate-300 outline-none pb-1 bg-transparent placeholder:font-normal placeholder:text-slate-400"
        />
      </div>
    </div>
  </div>
);

// Fixed rules component
const ScoringRules = () => (
  <div className="mt-10 bg-amber-50/50 border border-amber-200/60 rounded-xl p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-900 space-y-2">
        <p className="font-bold text-amber-800">Quy tắc chấm điểm (Tham khảo):</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2 text-xs">
          <p>• Từ 90 điểm trở lên: <strong className="text-emerald-700">Xuất sắc</strong></p>
          <p>• Từ 75 – 89 điểm: <strong className="text-blue-700">Hoàn thành tốt</strong></p>
          <p>• Từ 60 – 74 điểm: <strong className="text-amber-700">Hoàn thành</strong></p>
          <p>• Dưới 60 điểm: <strong className="text-red-600">Không hoàn thành</strong></p>
        </div>
        <p className="text-amber-700/70 mt-3 text-xs italic">* Vui lòng điền điểm vào các ô trong bảng trên. Tổng điểm sẽ được hệ thống tự động tính toán.</p>
      </div>
    </div>
  </div>
);

// Reusable preview renderer
const DocxFormPreview = ({ html, showHeader = true, showRules = true }) => (
  <div className="bg-white p-6 md:p-8">
    {showHeader && <TemplateHeader />}
    <div className="docx-preview overflow-x-auto pb-4" dangerouslySetInnerHTML={{ __html: html }} />
    {showHeader && <TemplateFooter />}
    {showRules && <ScoringRules />}
  </div>
);

const TemplateManager = () => {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');

  // Upload wizard states
  const [step, setStep] = useState(1);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // View preview modal (for existing templates)
  const [viewPreviewOpen, setViewPreviewOpen] = useState(false);
  const [viewPreviewHtml, setViewPreviewHtml] = useState('');
  const [viewPreviewName, setViewPreviewName] = useState('');
  const [viewPreviewLoading, setViewPreviewLoading] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => { } });

  const showConfirm = (title, message, type, onConfirm) => {
    setConfirmConfig({ isOpen: true, title, message, type, onConfirm });
  };

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch (err) {
      toast.error('Không thể tải dữ liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setFile(null);
    setName('');
    setPreviewHtml('');
    setIsPreviewing(false);
    setStep(1);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (selectedFile.size > 5 * 1024 * 1024) { toast.error('Kích thước file vượt quá 5MB'); e.target.value = ''; return; }
    if (!selectedFile.name.toLowerCase().endsWith('.docx')) { toast.error('Chỉ hỗ trợ file .docx'); e.target.value = ''; return; }
    setFile(selectedFile);
  };

  const handlePreviewAndNext = async () => {
    if (!file) return toast.error('Chưa chọn file');
    if (!name.trim()) return toast.error('Vui lòng nhập tên Template');
    setIsPreviewing(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/templates/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPreviewHtml(res.data.html);
      setStep(2);
      toast.success('Phân tích file thành công!');
    } catch (err) {
      toast.error('Lỗi trích xuất: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Chưa chọn file');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    try {
      await api.post('/templates/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      resetForm();
      setIsModalOpen(false);
      toast.success('Lưu template thành công!');
      fetchTemplates();
    } catch (err) {
      toast.error('Lỗi tải lên: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewPreview = async (template) => {
    setViewPreviewName(template.name);
    setViewPreviewHtml('');
    setViewPreviewOpen(true);
    setViewPreviewLoading(true);
    try {
      const res = await api.get(`/templates/${template.id}/preview`);
      setViewPreviewHtml(res.data.html);
    } catch (err) {
      toast.error('Lỗi xem trước: ' + (err.response?.data?.message || err.message));
      setViewPreviewOpen(false);
    } finally {
      setViewPreviewLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm('Xóa Template', 'Chắc chắn xóa template này? Hành động này không thể hoàn tác.', 'danger', async () => {
      try {
        await api.delete(`/templates/${id}`);
        toast.success('Đã xóa template.');
        fetchTemplates();
      } catch (err) {
        toast.error('Lỗi xóa: ' + (err.response?.data?.message || err.message));
      }
    });
  };

  return (
    <div className="space-y-5">
      <style>{DOCX_PREVIEW_STYLES}</style>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Danh sách Template</h3>
        <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm text-sm">
          <Plus className="w-4 h-4" /> Tải lên Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleViewPreview(t)} className="text-slate-400 hover:bg-blue-50 hover:text-blue-600 p-1.5 rounded-lg transition-all" title="Xem trước">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:bg-red-50 hover:text-red-600 p-1.5 rounded-lg transition-all" title="Xóa">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 truncate" title={t.name}>{t.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{t.filePath.split('/').pop()}</p>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-sm">
            Chưa có template nào được tải lên.
          </div>
        )}
      </div>

      {/* Upload Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`bg-white rounded-2xl shadow-xl w-full overflow-hidden my-4 transition-all duration-300 ${step === 2 ? 'max-w-5xl' : 'max-w-lg'}`}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800">
                {step === 1 ? 'Bước 1: Tải lên Template' : 'Bước 2: Xem trước biểu mẫu'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên Template</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none text-sm" placeholder="Ví dụ: Mẫu đánh giá tháng 5..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Chọn file .docx (Tối đa 5MB)</label>
                    <div className="border-2 border-dashed border-slate-300 hover:bg-slate-50 rounded-xl p-6 text-center transition-colors cursor-pointer relative">
                      <input type="file" accept=".docx" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      {file ? (
                        <div>
                          <FileText className="w-8 h-8 text-purple-500 mx-auto mb-1.5" />
                          <p className="text-sm text-slate-700 font-bold">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                          <p className="text-sm text-slate-600 font-medium">Kéo thả hoặc click để chọn file</p>
                          <p className="text-xs text-slate-400">Chỉ hỗ trợ .docx</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-sm text-emerald-800"><strong>{file?.name}</strong> – Dưới đây là bản xem trước biểu mẫu.</p>
                  </div>

                  <div className="border border-slate-200 rounded-lg max-h-[65vh] overflow-y-auto">
                    {previewHtml ? (
                      <DocxFormPreview html={previewHtml} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Search className="w-8 h-8 text-amber-400 mb-2" />
                        <p className="text-sm font-medium text-amber-700">Không thể phân tích dữ liệu</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              {step === 1 ? (
                <>
                  <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
                  <button type="button" onClick={handlePreviewAndNext} disabled={!file || !name.trim() || isPreviewing} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                    {isPreviewing ? 'Đang đọc...' : 'Tiếp tục'}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Quay lại</button>
                  <button type="button" onClick={handleUpload} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-purple-200 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Lưu Template
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Preview Modal (existing templates) */}
      {viewPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden my-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-800">Xem trước biểu mẫu</h3>
                  <p className="text-xs text-slate-500">{viewPreviewName}</p>
                </div>
              </div>
              <button onClick={() => { setViewPreviewOpen(false); setViewPreviewHtml(''); }} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="border border-slate-200 rounded-lg max-h-[75vh] overflow-y-auto">
                {viewPreviewLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-slate-500 text-sm">Đang tải biểu mẫu...</span>
                  </div>
                ) : viewPreviewHtml ? (
                  <DocxFormPreview html={viewPreviewHtml} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-sm font-medium text-amber-700">Không thể tải dữ liệu biểu mẫu</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button type="button" onClick={() => { setViewPreviewOpen(false); setViewPreviewHtml(''); }} className="px-5 py-2 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
};

export default TemplateManager;
