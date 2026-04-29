import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Upload, Trash2, FileText, Table, Plus, X } from 'lucide-react';

const TemplateManager = () => {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('Word');

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch (err) {
      toast.error('Không thể tải dữ liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Chưa chọn file');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('type', type);

    try {
      await api.post('/templates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      setName('');
      setIsModalOpen(false);
      toast.success('Tải lên template thành công!');
      fetchTemplates();
    } catch (err) {
      toast.error('Lỗi tải lên: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Xóa template này?')) {
      try {
        await api.delete(`/templates/${id}`);
        toast.success('Đã xóa template.');
        fetchTemplates();
      } catch (err) {
        toast.error('Lỗi xóa: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Danh sách Template</h3>
        <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tải lên Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map(t => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between">
              <div className={`p-3.5 rounded-xl ${t.type === 'Word' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {t.type === 'Word' ? <FileText className="w-8 h-8" /> : <Table className="w-8 h-8" />}
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-1">
              <h3 className="font-bold text-slate-800 text-lg truncate" title={t.name}>{t.name}</h3>
              <p className="text-sm text-slate-500 mt-1 truncate" title={t.filePath.split('/').pop()}>{t.filePath.split('/').pop()}</p>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            Chưa có template nào được tải lên.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-800">Tải lên Template mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Template</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="Ví dụ: Mẫu đánh giá hiệu suất..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại file</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500 outline-none">
                  <option value="Word">Word Document (.docx)</option>
                  <option value="Excel">Excel Spreadsheet (.xlsx)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chọn file từ máy tính</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                  <input type="file" required onChange={e => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">{file ? file.name : "Kéo thả hoặc click để chọn file"}</p>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-purple-200 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Bắt đầu tải lên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
