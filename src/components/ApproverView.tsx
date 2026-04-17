import { useState } from 'react';
import { DocumentData, Status } from '../types';
import { decide } from '../lib/api';
import { Clock, CheckCircle, XCircle, FileText, Clipboard, History } from 'lucide-react';

interface ApproverViewProps {
  docs: DocumentData[];
  approverKey: 'a1' | 'a2';
  onRefresh: () => void;
}

export default function ApproverView({ docs, approverKey, onRefresh }: ApproverViewProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter pending documents for this approver
  const pendingDocs = docs.filter(d => d[approverKey]?.status === 'pending');
  const pastDocs = docs.filter(d => d[approverKey]?.status !== 'pending' && d[approverKey]?.status !== 'n/a');

  const currentDoc = pendingDocs[0];

  const handleDecision = async (docId: string, action: 'approved' | 'rejected') => {
    setLoading(true);
    const res = await decide(docId, approverKey, action, comment);
    setLoading(false);
    
    if (res.success) {
      alert(`Decision recorded: ${action.toUpperCase()}`);
      setComment('');
      onRefresh();
    } else {
      alert('Failed: ' + res.error);
    }
  };

  const getStatusBadge = (status: Status) => {
    const styles = {
      pending: 'bg-[#f0f0f0] text-[#1a1a1a]',
      partial: 'bg-[#f0f0f0] text-[#1a1a1a]',
      approved: 'bg-[#d1fae5] text-[#065f46]',
      rejected: 'bg-[#fee2e2] text-[#991b1b]',
      'n/a': 'bg-transparent text-gray-300'
    };
    return (
      <span className={`px-2 py-1 rounded-[4px] text-[10px] font-bold tracking-tight uppercase ${styles[status]}`}>
        {status === 'pending' ? 'WAITING' : status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-12 pb-20">
      {currentDoc ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-1">
                <Clock className="w-3 h-3" /> Action Required
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">{currentDoc.title}</h2>
            </div>
            {getStatusBadge(currentDoc[approverKey]?.status || 'pending')}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="aspect-[4/5] sm:aspect-video w-full bg-[#fafafa] rounded-lg border border-[#e5e5e5] overflow-hidden shadow-sm">
                {currentDoc.driveId ? (
                  <iframe 
                    className="w-full h-full border-none"
                    src={`https://drive.google.com/file/d/${currentDoc.driveId}/preview`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#737373] italic text-sm">
                    Viewer unavailable
                  </div>
                )}
              </div>
              
              {currentDoc.desc && (
                <div className="p-6 bg-[#f7f7f7] rounded-lg border border-[#e5e5e5]">
                   <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373] mb-2 block">Instructions / Context</label>
                   <p className="text-sm text-[#525252] leading-relaxed">{currentDoc.desc}</p>
                </div>
              )}
            </div>

            <div className="space-y-8">
              <section className="bg-white border border-[#e5e5e5] rounded-lg p-6 space-y-6 shadow-sm">
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#1a1a1a] block">Review Decision</label>
                <textarea 
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Optional notes for the audit trail..."
                  className="w-full p-4 bg-[#fafafa] border border-[#e5e5e5] rounded-[6px] text-sm h-32 focus:outline-none resize-none"
                />
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleDecision(currentDoc.id, 'approved')}
                    disabled={loading}
                    className="w-full py-3.5 bg-[#1a1a1a] text-white text-[12px] font-bold uppercase tracking-widest rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Document
                  </button>
                  <button 
                    onClick={() => handleDecision(currentDoc.id, 'rejected')}
                    disabled={loading}
                    className="w-full py-3.5 bg-white text-[#ef4444] border border-[#ef4444] text-[12px] font-bold uppercase tracking-widest rounded-[6px] hover:bg-[#fef2f2] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject Request
                  </button>
                </div>
              </section>

              <section className="p-6 border border-[#e5e5e5] rounded-lg bg-[#f7f7f7]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373] mb-4 block">Workflow Status</label>
                <div className="space-y-4">
                  {[
                    { data: currentDoc.a1, label: 'Stage 1', isYou: approverKey === 'a1' },
                    { data: currentDoc.a2, label: 'Stage 2', isYou: approverKey === 'a2' }
                  ].map((ap, i) => ap.data && (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${ap.isYou ? 'bg-[#1a1a1a] text-white' : 'bg-[#e5e5e5] text-[#737373]'}`}>
                          {ap.data.name[0].toUpperCase()}
                        </div>
                        <span className="text-[12px] font-medium text-[#525252]">{ap.label}</span>
                      </div>
                      {getStatusBadge(ap.data.status)}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-[#e5e5e5] rounded-xl bg-[#fcfcfc]">
          <div className="text-4xl mb-6 opacity-20">📂</div>
          <h3 className="text-lg font-medium text-[#1a1a1a] mb-1">Queue Empty</h3>
          <p className="text-sm text-[#737373]">No pending documents require your signature at this time.</p>
        </div>
      )}

      <section className="pt-8 border-t border-[#e5e5e5]">
        <label className="text-[12px] font-bold uppercase tracking-widest text-[#737373] mb-8 block flex items-center gap-2">
          <History className="w-4 h-4" /> Processing History
        </label>
        
        {pastDocs.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#737373] italic">No historical data available.</div>
        ) : (
          <div className="border border-[#e5e5e5] rounded-lg overflow-x-auto bg-white shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e5e5e5]">
                  <th className="px-6 py-3 text-[11px] font-bold text-[#737373] uppercase tracking-wider">Document Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#737373] uppercase tracking-wider">Decision</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#737373] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#737373] uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {pastDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium">{doc.title}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(doc[approverKey]!.status)}</td>
                    <td className="px-6 py-4 text-[12px] text-[#737373]">{doc.date}</td>
                    <td className="px-6 py-4">
                      <p className="text-[12px] text-[#737373] max-w-[200px] truncate group relative">
                        {doc[approverKey]?.comment || '—'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) }
      </section>
    </div>
  );
}
