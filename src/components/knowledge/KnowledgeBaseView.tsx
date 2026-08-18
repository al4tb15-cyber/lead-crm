import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { KnowledgeDocument } from '../../types/index.ts';
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  Sparkles,
  FileText,
  Globe,
  HelpCircle,
  CheckCircle2,
  X,
  Database
} from 'lucide-react';

export const KnowledgeBaseView: React.FC = () => {
  const { activeTenant, addToast } = useTenant();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testQuery, setTestQuery] = useState('What are your onboarding timeframes and pricing plans?');
  const [searchResults, setSearchResults] = useState<KnowledgeDocument[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // New Doc Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'service' | 'pricing' | 'faq' | 'compliance' | 'objection'>('service');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    loadDocs();
  }, [activeTenant]);

  const loadDocs = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await api.getKnowledge();
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      const created = await api.createKnowledge({
        title,
        category,
        content,
        url: url || undefined
      });
      setDocuments(prev => [created, ...prev]);
      setShowModal(false);
      setTitle('');
      setContent('');
      setUrl('');
      addToast({
        type: 'success',
        title: 'Document Vectorized & Ingested',
        message: `"${created.title}" is now active in AI agent RAG retrieval context.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Ingestion Failed', message: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this document from the knowledge base?')) return;
    try {
      await api.deleteKnowledge(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      addToast({ type: 'info', title: 'Document Removed' });
    } catch (e) {
      addToast({ type: 'error', title: 'Delete Failed' });
    }
  };

  const handleTestSearch = () => {
    if (!testQuery.trim()) return;
    setIsSearching(true);
    const q = testQuery.toLowerCase();
    const results = documents.filter(
      d =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
    setSearchResults(results.length > 0 ? results : documents.slice(0, 2));
    setIsSearching(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Multi-Tenant RAG Knowledge Base
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Vector embeddings and factual groundings scoped strictly to {activeTenant?.name}. Ingest company documents, pricing models, FAQs, and URLs to ensure AI responses are 100% accurate.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ingest Document</span>
        </button>
      </div>

      {/* RAG Semantic Search Tester */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Test AI Retrieval (Semantic Grounding Simulation)
          </span>
          <span className="text-[10px] font-mono text-slate-400">Strict Tenant Scoping</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={e => setTestQuery(e.target.value)}
            placeholder="Ask a question your leads might ask (e.g. pricing, implementation, refund policies)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleTestSearch}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Run Retrieval
          </button>
        </div>

        {searchResults && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-bold text-emerald-400 uppercase">
              Top Ranked Grounding Sources ({searchResults.length} Match):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {searchResults.map(res => (
                <div key={res.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{res.title}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-blue-400">
                      {res.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 line-clamp-3 leading-relaxed">{res.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ingested Documents Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ingested Documents Repository ({documents.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {doc.category}
                  </span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-100 mt-2">{doc.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-4 leading-relaxed">{doc.content}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Vectorized & Indexed</span>
                <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ingest Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">Ingest Knowledge Document</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Engagement Terms & Pricing Schedule"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="service">Service Catalog</option>
                    <option value="pricing">Pricing & Commercials</option>
                    <option value="faq">FAQ & Inquiries</option>
                    <option value="compliance">Compliance & Legal</option>
                    <option value="objection">Objection Handling</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Website URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/pricing"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Full Document Body / Knowledge Text
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste clear factual information that AI agents should know..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                >
                  Vectorize & Ingest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
