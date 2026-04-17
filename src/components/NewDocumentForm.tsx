import React, { useState, useRef } from 'react';
import { uploadFile, submitDocument } from '../lib/api';
import { FileText, Clipboard, Upload, CheckCircle, Send, X } from 'lucide-react';

interface NewDocumentFormProps {
  onRefresh: () => void;
}

export default function NewDocumentForm({ onRefresh }: NewDocumentFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ id: string | null; name: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'memo' as 'memo' | 'general',
    date: new Date().toISOString().split('T')[0],
    desc: '',
    a1Name: '',
    a1Wa: '',
    a2Active: false,
    a2Name: '',
    a2Wa: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUpload(file);
    }
  };

  const processUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadFile(file);
      setUploadedFile({ id: result.driveId, name: result.filename });
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: result.filename.replace(/\.[^\.]+$/, '') }));
      }
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.a1Name || !formData.a1Wa) {
      alert('Required fields missing.');
      return;
    }

    setLoading(true);
    const payload = {
      title: formData.title,
      type: formData.type,
      date: new Date(formData.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      desc: formData.desc,
      driveId: uploadedFile?.id || undefined,
      a1: { name: formData.a1Name, wa: formData.a1Wa, status: 'pending' as const },
      a2: formData.a2Active ? { name: formData.a2Name, wa: formData.a2Wa, status: 'pending' as const } : null
    };

    const res = await submitDocument(payload);
    setLoading(false);

    if (res.success) {
      alert('Workflow initiated successfully.');
      onRefresh();
    } else {
      alert('Failed: ' + res.error);
    }
  };

  return (
    <div className="space-y-8 max-w-[800px]">
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-8">
        <label className="text-[12px] font-bold uppercase tracking-wider text-[#737373] mb-6 block">Google Drive Resource</label>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <input 
              readOnly
              value={uploadedFile ? uploadedFile.name : ''}
              placeholder="Upload a document to initiate workflow..."
              className="w-full px-4 py-3 bg-[#fafafa] border border-[#e5e5e5] rounded-[6px] text-sm focus:outline-none placeholder:text-[#999]"
            />
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <button 
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-[#1a1a1a] text-white text-sm font-semibold rounded-[6px] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer whitespace-nowrap"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 border border-[#e5e5e5] rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold">Google Apps Script</span>
              <div className="text-[11px] font-bold text-[#10b981] uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                Active
              </div>
            </div>
            <p className="text-[11px] text-[#737373]">Endpoint: deploy_id_8821...txt</p>
          </div>
          <div className="p-5 border border-[#e5e5e5] rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold">WhatsApp API</span>
              <div className="text-[11px] font-bold text-[#10b981] uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                Connected
              </div>
            </div>
            <p className="text-[11px] text-[#737373]">Service: Fonnte Gateway</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#e5e5e5] rounded-lg p-8 space-y-8">
        <div>
          <label className="text-[12px] font-bold uppercase tracking-wider text-[#737373] mb-4 block">Document Metadata</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <input 
                value={formData.title} 
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Document Title *"
                className="w-full px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[6px] text-sm focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={formData.type} 
                onChange={e => setFormData(p => ({ ...p, type: e.target.value as any }))}
                className="w-full px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[6px] text-sm focus:outline-none"
              >
                <option value="memo">Memo</option>
                <option value="general">General</option>
              </select>
              <input 
                type="date"
                value={formData.date} 
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[6px] text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[12px] font-bold uppercase tracking-wider text-[#737373] mb-4 block">Approval Workflow</label>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                value={formData.a1Name} 
                onChange={e => setFormData(p => ({ ...p, a1Name: e.target.value }))}
                placeholder="Approver 1 Name *"
                className="flex-1 px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[6px] text-sm focus:outline-none"
              />
              <input 
                value={formData.a1Wa} 
                onChange={e => setFormData(p => ({ ...p, a1Wa: e.target.value }))}
                placeholder="WA Number (62...)"
                className="flex-1 px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[6px] text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, a2Active: !p.a2Active }))}
                  className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${formData.a2Active ? 'bg-[#1a1a1a]' : 'bg-[#e5e5e5]'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${formData.a2Active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">Multi-stage Approval</span>
              </div>

              {formData.a2Active && (
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-top-1">
                  <input 
                    value={formData.a2Name} 
                    onChange={e => setFormData(p => ({ ...p, a2Name: e.target.value }))}
                    placeholder="Approver 2 Name *"
                    className="flex-1 px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[6px] text-sm focus:outline-none"
                  />
                  <input 
                    value={formData.a2Wa} 
                    onChange={e => setFormData(p => ({ ...p, a2Wa: e.target.value }))}
                    placeholder="WA Number (62...)"
                    className="flex-1 px-4 py-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[6px] text-sm focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-[#1a1a1a] text-white text-[13px] font-bold uppercase tracking-widest rounded-[6px] hover:opacity-90 transition-opacity flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 mt-4"
        >
          {loading ? 'Processing...' : (
            <>
              Initiate Workflow <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </section>
    </div>
  );
}
