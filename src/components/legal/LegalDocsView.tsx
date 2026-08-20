import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { LegalDocument } from '../../types/index.ts';
import { SignaturePadModal } from './SignaturePadModal.tsx';
import { LegalDocPreviewModal } from './LegalDocPreviewModal.tsx';
import { LegalDocumentEditorModal } from './LegalDocumentEditorModal.tsx';
import {
  ShieldCheck,
  FileText,
  FileCheck,
  Lock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Mail,
  Printer,
  ExternalLink,
  Trash2,
  Edit,
  Download,
  AlertCircle,
  Building,
  UserCheck,
  Scale,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';

export const LegalDocsView: React.FC = () => {
  const { activeTenant, addToast } = useTenant();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'executed' | 'pending_signature' | 'draft'>('all');

  // Modals state
  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);
  const [signingDoc, setSigningDoc] = useState<LegalDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.getLegalDocuments();
      setDocuments(docs);
    } catch (err: any) {
      addToast(err.message || 'Failed to load legal agreements.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeTenant.id]);

  const handleSignDocument = async (signatureData: {
    signatoryName: string;
    signatoryEmail: string;
    signatoryTitle: string;
    signatoryCompany: string;
    signatoryTaxIdOrAbn: string;
    signatureType: 'draw' | 'type' | 'crypto_certificate';
    signatureDataUrl?: string;
  }) => {
    if (!signingDoc) return;
    try {
      const res = await api.signLegalDocument(signingDoc.id, signatureData);
      addToast(`Document successfully signed and cryptographically sealed under SHA-256 cert ${res.document.signature?.auditTrailId}.`, 'success');
      setSigningDoc(null);
      await fetchDocuments();
      // Also update preview if open
      if (previewDoc?.id === signingDoc.id) {
        setPreviewDoc(res.document);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to execute digital signature.', 'error');
      throw err;
    }
  };

  const handleDeliverDocument = async (docId: string, recipientEmail: string, recipientName: string) => {
    try {
      const res = await api.deliverLegalDocument(docId, { recipientEmail, recipientName });
      addToast(`Executed legal agreement successfully dispatched to ${recipientEmail}.`, 'success');
      await fetchDocuments();
      if (previewDoc?.id === docId) {
        setPreviewDoc(res.document);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to deliver agreement.', 'error');
      throw err;
    }
  };

  const handleSaveDocument = async (data: Partial<LegalDocument>) => {
    try {
      if (editingDoc) {
        await api.updateLegalDocument(editingDoc.id, data);
        addToast('Legal document updated successfully.', 'success');
      } else {
        await api.createLegalDocument(data);
        addToast('New legal document schedule created.', 'success');
      }
      setEditingDoc(null);
      setShowCreateModal(false);
      await fetchDocuments();
    } catch (err: any) {
      addToast(err.message || 'Failed to save document.', 'error');
      throw err;
    }
  };

  const handleDeleteDocument = async (doc: LegalDocument) => {
    if (!window.confirm(`Are you sure you want to delete the agreement "${doc.title}"?`)) return;
    try {
      await api.deleteLegalDocument(doc.id);
      addToast('Document deleted.', 'info');
      await fetchDocuments();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete document.', 'error');
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.recipientCompany && doc.recipientCompany.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true : doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const executedCount = documents.filter(d => d.status === 'executed').length;
  const pendingCount = documents.filter(d => d.status === 'pending_signature').length;
  const totalCount = documents.length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Legal Documents, Terms & Digital Signature Center
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                Production Deliverable
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Statutory agreements, Australian Privacy Principles (APPs), ACMA DNCR addenda, and cryptographic e-signatures
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchDocuments}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
            title="Refresh documents"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Draft Legal Agreement
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Agreements</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalCount}</div>
          <div className="text-xs text-slate-400 mt-1">Enterprise Master Schedules</div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Executed & Sealed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{executedCount}</div>
          <div className="text-xs text-slate-400 mt-1">100% Cryptographic SHA-256 Validated</div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Pending Client Signature</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
          <div className="text-xs text-slate-400 mt-1">Awaiting digital execution</div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Jurisdiction Standard</span>
            <Building className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">New South Wales, AU</div>
          <div className="text-xs text-slate-400 mt-0.5 font-mono">ABN 84 629 104 883</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clauses, titles, tags, recipients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'executed', label: 'Executed & Signed' },
            { id: 'pending_signature', label: 'Pending Signature' },
            { id: 'draft', label: 'Drafts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Cards Grid */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs text-slate-400">Loading statutory agreements and certificates...</div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No legal documents match your filters</div>
          <div className="text-xs text-slate-500">Draft a new agreement or reset search query.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredDocs.map((doc) => {
            const isSigned = doc.status === 'executed';
            return (
              <div
                key={doc.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-sm flex flex-col justify-between space-y-5"
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2.5 rounded-xl border ${
                        isSigned
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {isSigned ? <ShieldCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider font-semibold border ${
                          isSigned
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          {doc.status === 'executed' ? 'Digitally Executed' : 'Pending Signature'}
                        </span>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {doc.version} &bull; {doc.abnOrTaxId}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setEditingDoc(doc)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Agreement"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="text-base font-bold text-slate-100 line-clamp-1 hover:text-blue-400 cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {doc.summary}
                    </p>
                  </div>

                  {/* Recipient & Signature Details */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Target Recipient:</span>
                      <strong className="text-slate-200">{doc.recipientCompany || doc.recipientName || 'Enterprise Partner'}</strong>
                    </div>

                    {isSigned && doc.signature ? (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-emerald-400 text-[11px]">
                          <span className="flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Signatory: {doc.signature.signatoryName} ({doc.signature.signatoryTitle})
                          </span>
                          <span className="font-mono">{new Date(doc.signature.signedAt).toLocaleDateString('en-AU')}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          CERT: {doc.signature.certificateHashSha256.slice(0, 24)}...
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-amber-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Ready for execution
                        </span>
                        <button
                          type="button"
                          onClick={() => setSigningDoc(doc)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
                        >
                          Sign Now &rarr;
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {doc.governingLaw}
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Preview & Export
                    </button>

                    {!isSigned && (
                      <button
                        type="button"
                        onClick={() => setSigningDoc(doc)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        Sign Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {previewDoc && (
        <LegalDocPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onOpenSignModal={(doc) => setSigningDoc(doc)}
          onDeliver={handleDeliverDocument}
        />
      )}

      {signingDoc && (
        <SignaturePadModal
          document={signingDoc}
          onClose={() => setSigningDoc(null)}
          onSign={handleSignDocument}
        />
      )}

      {(showCreateModal || editingDoc) && (
        <LegalDocumentEditorModal
          documentToEdit={editingDoc || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDoc(null);
          }}
          onSave={handleSaveDocument}
        />
      )}
    </div>
  );
};
