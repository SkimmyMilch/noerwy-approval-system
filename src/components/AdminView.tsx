import { useState } from 'react';
import { DocumentData, Status } from '../types';
import { sendReminder } from '../lib/api';
import { FileText, Clipboard, Clock, CheckCircle, XCircle } from 'lucide-react';

interface AdminViewProps {
  docs: DocumentData[];
  onRefresh: () => void;
  loading?: boolean;
}

export default function AdminView({ docs, onRefresh, loading }: AdminViewProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docs[0]?.id || null);

  const getOverallStatus = (doc: DocumentData): Status => {
    if (doc.a1.status === 'rejected' || (doc.a2 && doc.a2.status === 'rejected')) return 'rejected';
    if (doc.a1.status === 'approved' && (!doc.a2 || doc.a2.status === 'approved')) return 'approved';
    if (doc.a1.status === 'approved' && doc.a2 && doc.a2.status === 'pending') return 'partial';
    return 'pending';
  };

  const getStatusBadge = (status: Status) => {
    const styles = {
      pending: 'bg-[#f0f0f0] text-[#1a1a1a]',
      partial: 'bg-[#f0f0f0] text-[#1a1a1a]',
      approved: 'bg-[#d1fae5] text-[#065f46]',
      rejected: 'bg-[#fee2e2] text-[#991b1b]',
      'n/a': 'bg-gray-100 text-gray-400'
    };
    const labels = {
      pending: 'WAITING',
      partial: 'PARTIAL',
      approved: 'APPROVED',
      rejected: 'REJECTED',
      'n/a': 'N/A'
    };
    return (
      <span className={`px-2 py-1 rounded-[4px] text-[11px] font-bold tracking-tight uppercase ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const selectedDoc = docs.find(d => d.id === selectedDocId) || docs[0];

  const handleReminder = async (docId: string) => {
    const res = await sendReminder(docId);
    if (res.success) {
      alert('Reminder sent via WhatsApp.');
    }
  };

  const stats = {
    total: docs.length,
    pending: docs.filter(d => getOverallStatus(d) === 'pending').length,
    approved: docs.filter(d => getOverallStatus(d) === 'approved').length,
  };

  if (loading && docs.length === 0) {
    return <div className="p-20 text-center text-[#737373] text-sm italic">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 border border-[#e5e5e5] rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold">Active Workflows</span>
            <div className="text-[11px] font-bold text-[#10b981] uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              System Healthy
            </div>
          </div>
          <p className="text-xs text-[#737373] mb-4">Monitoring {stats.total} total documents across all units.</p>
          <div className="flex gap-10">
            <div>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <div className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">Completed</div>
            </div>
          </div>
        </div>
        
        <div className="p-5 border border-[#e5e5e5] rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold">Fonnte WA Gateway</span>
            <div className="text-[11px] font-bold text-[#10b981] uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Connected
            </div>
          </div>
          <p className="text-xs text-[#737373] mb-4">API Token configured for automated reminders.</p>
          <button className="text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a] underline underline-offset-4 cursor-pointer">
            View API Settings
          </button>
        </div>
      </div>

      {/* Selected Doc Details */}
      {selectedDoc && (
        <div className="border border-[#e5e5e5] rounded-lg overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-[#e5e5e5] flex justify-between items-baseline">
            <h3 className="text-lg font-semibold tracking-tight">{selectedDoc.title}</h3>
            {getStatusBadge(getOverallStatus(selectedDoc))}
          </div>
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#737373] tracking-wider mb-1">Created</div>
                    <div className="text-sm">{selectedDoc.date}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#737373] tracking-wider mb-1">Type</div>
                    <div className="text-sm capitalize">{selectedDoc.type}</div>
                  </div>
                </div>
                {selectedDoc.desc && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#737373] tracking-wider mb-1">Notes</div>
                    <p className="text-sm text-[#525252] leading-relaxed">{selectedDoc.desc}</p>
                  </div>
                )}
                
                {/* Embedded Viewer */}
                <div className="aspect-video w-full bg-[#fafafa] rounded border border-[#e5e5e5] overflow-hidden">
                  {selectedDoc.driveId ? (
                    <iframe 
                      className="w-full h-full border-none"
                      src={`https://drive.google.com/file/d/${selectedDoc.driveId}/preview`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#737373]">
                      <FileText className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-xs italic">Viewer unavailable</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-[300px] space-y-6">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#737373] tracking-wider mb-3">Approver Status</div>
                  <div className="space-y-4">
                    {[selectedDoc.a1, selectedDoc.a2].map((ap, i) => ap && (
                      <div key={i} className="flex items-center justify-between p-3 border border-[#e5e5e5] rounded">
                        <div className="min-w-0 mr-2">
                          <div className="text-xs font-semibold truncate">{ap.name}</div>
                          <div className="text-[10px] text-[#737373]">{ap.wa}</div>
                        </div>
                        {getStatusBadge(ap.status)}
                      </div>
                    ))}
                  </div>
                </div>
                {(selectedDoc.a1.status === 'pending' || (selectedDoc.a2 && selectedDoc.a2.status === 'pending')) && (
                  <button 
                    onClick={() => handleReminder(selectedDoc.id)}
                    className="w-full py-2.5 bg-[#1a1a1a] text-white text-[12px] font-bold uppercase tracking-wider rounded cursor-pointer hover:opacity-90"
                  >
                    Send WA Reminder
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <section className="pt-4">
        <label className="text-[12px] font-bold uppercase tracking-widest text-[#737373] mb-6 block">Recent Activity</label>
        <div className="border border-[#e5e5e5] rounded-lg overflow-x-auto bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="px-6 py-3 text-[11px] font-bold text-[#737373] uppercase tracking-wider">Document Name</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#737373] uppercase tracking-wider">Approvers</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#737373] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#737373] uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-[#737373] italic">No active requests found.</td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr 
                    key={doc.id} 
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`hover:bg-[#fafafa] cursor-pointer transition-colors ${selectedDocId === doc.id ? 'bg-[#f7f7f7]' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {doc.type === 'memo' ? <FileText className="w-4 h-4 text-[#737373]" /> : <Clipboard className="w-4 h-4 text-[#737373]" />}
                        <span className="text-[13px] font-medium">{doc.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <div className="inline-block h-6 w-6 rounded-full border-2 border-white bg-[#f0f0f0] flex items-center justify-center text-[9px] font-bold text-[#1a1a1a]">
                          {doc.a1.name[0].toUpperCase()}
                        </div>
                        {doc.a2 && (
                          <div className="inline-block h-6 w-6 rounded-full border-2 border-white bg-[#f0f0f0] flex items-center justify-center text-[9px] font-bold text-[#1a1a1a]">
                            {doc.a2.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(getOverallStatus(doc))}</td>
                    <td className="px-6 py-4 text-right text-[12px] text-[#737373]">{doc.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
