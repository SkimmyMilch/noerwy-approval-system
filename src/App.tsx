/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Plus, Users, Settings, MessageSquare } from 'lucide-react';
import { DocumentData } from './types';
import { loadDocuments } from './lib/api';
import AdminView from './components/AdminView';
import NewDocumentForm from './components/NewDocumentForm';
import ApproverView from './components/ApproverView';

type Tab = 'admin' | 'newdoc' | 'ap1' | 'ap2';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('admin');
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    const data = await loadDocuments();
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleRefresh = () => fetchDocs();

  return (
    <div className="flex min-h-screen bg-[#fdfdfd] text-[#1a1a1a] font-sans">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[#f7f7f7] border-r border-[#e5e5e5] p-10 px-6 flex flex-col justify-between sticky top-0 h-screen hidden md:flex">
        <div>
          <div className="flex items-center gap-2.5 font-bold text-[20px] tracking-tight mb-12">
            <div className="p-1.5 bg-[#1a1a1a] rounded-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span>DocApprove</span>
          </div>
          
          <nav className="space-y-6">
            <ul className="space-y-6">
              {[
                { id: 'admin', label: 'Dashboard', icon: FileText },
                { id: 'newdoc', label: 'New Request', icon: Plus },
                { id: 'ap1', label: 'Approver 1', icon: Users },
                { id: 'ap2', label: 'Approver 2', icon: Users },
              ].map((item) => (
                <li 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`flex items-center gap-3 text-sm font-medium cursor-pointer transition-colors ${activeTab === item.id ? 'text-[#1a1a1a]' : 'text-[#737373] hover:text-[#1a1a1a]'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 text-sm font-medium text-[#737373] hover:text-[#1a1a1a] cursor-pointer">
            <Settings className="w-4 h-4" />
            Settings & API
          </div>
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold bg-[#10b981] rounded-md text-white">
            <MessageSquare className="w-3 h-3" />
            <span>WA + Drive Connected</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-15 flex flex-col min-w-0 max-w-[1200px] mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {activeTab === 'admin' && 'Admin Dashboard'}
            {activeTab === 'newdoc' && 'Send for Approval'}
            {activeTab === 'ap1' && 'Approver 1 Portal'}
            {activeTab === 'ap2' && 'Approver 2 Portal'}
          </h1>
          <p className="text-[#737373] text-[15px]">
            {activeTab === 'admin' && 'Monitor and manage all document approval workflows.'}
            {activeTab === 'newdoc' && 'Bridge Google Drive documents to WhatsApp for rapid sign-off.'}
            {activeTab === 'ap1' && 'Review and process documents assigned to you.'}
            {activeTab === 'ap2' && 'Review and process documents assigned to your section.'}
          </p>
        </header>

        {/* Mobile Nav */}
        <div className="md:hidden flex p-1 mb-8 gap-0.5 overflow-x-auto bg-[#f7f7f7] rounded-lg border border-[#e5e5e5]">
          {(['admin', 'newdoc', 'ap1', 'ap2'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium whitespace-nowrap rounded-md ${activeTab === tab ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#737373]'}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'admin' && <AdminView docs={docs} onRefresh={handleRefresh} loading={loading} />}
              {activeTab === 'newdoc' && <NewDocumentForm onRefresh={handleRefresh} />}
              {activeTab === 'ap1' && <ApproverView docs={docs} approverKey="a1" onRefresh={handleRefresh} />}
              {activeTab === 'ap2' && <ApproverView docs={docs} approverKey="a2" onRefresh={handleRefresh} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
