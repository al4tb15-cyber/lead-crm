import React, { useState } from 'react';
import { LegalDocument } from '../../types/index.ts';
import {
  X,
  Printer,
  Mail,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Lock,
  Clock,
  Building,
  User,
  ExternalLink,
  Copy,
  Check,
  Send,
  AlertCircle
} from 'lucide-react';

interface LegalDocPreviewModalProps {
  document: LegalDocument;
  onClose: () => void;
  onOpenSignModal: (doc: LegalDocument) => void;
  onDeliver: (docId: string, recipientEmail: string, recipientName: string) => Promise<void>;
}

export const LegalDocPreviewModal: React.FC<LegalDocPreviewModalProps> = ({
  document,
  onClose,
  onOpenSignModal,
  onDeliver
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [showDeliverForm, setShowDeliverForm] = useState(false);
  const [deliverEmail, setDeliverEmail] = useState(document.recipientEmail || 'client@enterprise.com.au');
  const [deliverName, setDeliverName] = useState(document.recipientName || 'Valued Client');
  const [delivering, setDelivering] = useState(false);
  const [deliverSuccess, setDeliverSuccess] = useState(false);

  const isExecuted = document.status === 'executed';

  const copyCertHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverEmail) return;
    try {
      setDelivering(true);
      await onDeliver(document.id, deliverEmail, deliverName);
      setDelivering(false);
      setDeliverSuccess(true);
      setTimeout(() => {
        setDeliverSuccess(false);
        setShowDeliverForm(false);
      }, 2500);
    } catch (err) {
      setDelivering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Top Bar - Hidden when printing */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              isExecuted 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100 line-clamp-1">
                  {document.title}
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border uppercase tracking-wider ${
                  isExecuted
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {document.status === 'executed' ? 'Digitally Executed' : 'Pending Signature'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Legal Deliverable &bull; {document.version} &bull; {document.governingLaw}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isExecuted && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignModal(document);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <FileCheck className="w-4 h-4" />
                Sign Agreement
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeliverForm(!showDeliverForm)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              Deliver PDF Copy
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              Print / Export
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Deliver Dispatch Sub-Panel */}
        {showDeliverForm && (
          <form onSubmit={handleSendDelivery} className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center gap-3 print:hidden">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-400" />
              Deliver to Recipient:
            </div>
            <input
              type="text"
              placeholder="Signatory Name"
              value={deliverName}
              onChange={(e) => setDeliverName(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <input
              type="email"
              placeholder="recipient@enterprise.com.au"
              value={deliverEmail}
              onChange={(e) => setDeliverEmail(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 flex-1 min-w-[200px]"
            />
            <button
              type="submit"
              disabled={delivering}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50"
            >
              {delivering ? 'Dispatching...' : deliverSuccess ? 'Dispatched!' : 'Send Signed Agreement'}
            </button>
          </form>
        )}

        {/* Legal Document Sheet / Container */}
        <div className="p-8 sm:p-12 space-y-8 max-h-[75vh] overflow-y-auto bg-slate-900 print:bg-white print:max-h-none print:p-6 print:text-black">
          {/* Official Document Header */}
          <div className="border-b border-slate-700 pb-6 flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="text-xs font-mono tracking-widest uppercase text-blue-400 font-bold mb-1">
                BUSINESS HUB AUSTRALIA PTY LTD &bull; LEGAL REPOSITORY
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 print:text-black tracking-tight">
                {document.title}
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-2 font-mono">
                Document Identifier: {document.id} | Schedule Version: {document.version} | Tax Entity: {document.abnOrTaxId}
              </p>
            </div>

            {/* Official Execution Stamp */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              isExecuted
                ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300 print:bg-slate-100 print:border-slate-400 print:text-slate-800'
                : 'bg-amber-950/40 border-amber-600/60 text-amber-300'
            }`}>
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold uppercase tracking-wider">
                  {isExecuted ? 'OFFICIALLY EXECUTED' : 'UNEXECUTED DRAFT'}
                </div>
                <div className="text-[11px] font-mono opacity-80">
                  {isExecuted && document.signature?.signedAt
                    ? `Date: ${new Date(document.signature.signedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}`
                    : `Effective: ${document.effectiveDate}`}
                </div>
              </div>
            </div>
          </div>

          {/* Document Summary Pill */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed print:bg-slate-50 print:border-slate-300 print:text-slate-800">
            <strong className="text-slate-100 print:text-black">Statutory Summary: </strong>
            {document.summary}
          </div>

          {/* Formatted Markdown Body */}
          <div className="prose prose-invert max-w-none text-slate-300 print:text-black text-sm leading-relaxed space-y-4">
            {document.contentMarkdown.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-base font-bold text-slate-100 print:text-black pt-3 pb-1 border-b border-slate-800 print:border-slate-300 uppercase tracking-wide">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('- ')) {
                const items = paragraph.split('\n- ');
                return (
                  <ul key={idx} className="list-disc list-inside space-y-1.5 text-slate-300 print:text-black pl-2">
                    {items.map((it, itemIdx) => (
                      <li key={itemIdx} dangerouslySetInnerHTML={{ __html: it.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    ))}
                  </ul>
                );
              }
              return (
                <p
                  key={idx}
                  className="text-slate-300 print:text-black leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }}
                />
              );
            })}
          </div>

          {/* EXECUTION & DIGITAL SIGNATURES BLOCK */}
          <div className="border-t-2 border-slate-700/80 pt-8 mt-12 space-y-6">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              EXECUTION SCHEDULE & CRYPTOGRAPHIC VERIFICATION
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Signatory Box (Customer / Client) */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 print:bg-slate-50 print:border-slate-400">
                <div className="text-xs text-slate-400 uppercase font-semibold">
                  Client Authorized Signatory:
                </div>
                {document.signature ? (
                  <div className="space-y-2">
                    {/* Rendered signature */}
                    <div className="h-16 border-b border-slate-800 flex items-center justify-center bg-slate-900/50 rounded p-2">
                      {document.signature.signatureDataUrl ? (
                        <img
                          src={document.signature.signatureDataUrl}
                          alt="Client Signature"
                          className="h-full object-contain filter invert opacity-90"
                        />
                      ) : (
                        <div className="text-lg italic text-cyan-300 font-serif">
                          {document.signature.signatoryName}
                        </div>
                      )}
                    </div>

                    <div className="text-xs space-y-1 text-slate-300">
                      <div>Name: <strong className="text-slate-100">{document.signature.signatoryName}</strong></div>
                      <div>Title: {document.signature.signatoryTitle}</div>
                      <div>Company: {document.signature.signatoryCompany} ({document.signature.signatoryTaxIdOrAbn || 'ABN Verified'})</div>
                      <div>Email: {document.signature.signatoryEmail}</div>
                      <div className="text-[11px] text-slate-400">
                        Signed: {new Date(document.signature.signedAt).toLocaleString('en-AU')} &bull; IP: {document.signature.ipAddress}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-slate-800 rounded text-center text-xs text-slate-500">
                    Awaiting digital signature from recipient
                  </div>
                )}
              </div>

              {/* Countersignature Box (Business HUB Australia) */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 print:bg-slate-50 print:border-slate-400">
                <div className="text-xs text-slate-400 uppercase font-semibold">
                  Provider Authorized Representative:
                </div>
                {document.countersignature ? (
                  <div className="space-y-2">
                    <div className="h-16 border-b border-slate-800 flex items-center justify-center bg-slate-900/50 rounded p-2">
                      <div className="text-lg italic text-emerald-300 font-serif">
                        {document.countersignature.signatoryName}
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-300">
                      <div>Name: <strong className="text-slate-100">{document.countersignature.signatoryName}</strong></div>
                      <div>Title: {document.countersignature.signatoryTitle}</div>
                      <div>Company: Business HUB Australia Pty Ltd (ABN 84 629 104 883)</div>
                      <div>Email: {document.countersignature.signatoryEmail}</div>
                      <div className="text-[11px] text-slate-400">
                        Countersigned: {new Date(document.countersignature.signedAt).toLocaleString('en-AU')} &bull; IP: {document.countersignature.ipAddress}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-slate-800 rounded text-center text-xs text-slate-500">
                    Will be countersigned upon customer execution
                  </div>
                )}
              </div>
            </div>

            {/* Cryptographic Audit Trail Strip */}
            {document.signature && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-400 space-y-2 print:bg-slate-100 print:border-slate-400 print:text-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 print:text-black">CRYPTOGRAPHIC CERTIFICATE CHECKSUM (SHA-256):</span>
                  <button
                    type="button"
                    onClick={() => copyCertHash(document.signature?.certificateHashSha256 || '')}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedHash ? 'Checksum Copied' : 'Copy Hash'}
                  </button>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 break-all text-[11px] text-emerald-400 print:bg-white">
                  {document.signature.certificateHashSha256}
                </div>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                  <span>Audit Trail Reference: {document.signature.auditTrailId}</span>
                  <span>Legal Validity: Electronic Transactions Act 1999 (Cth) Section 10</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-400">
            {document.deliveredAt ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Delivered to {document.recipientEmail} on {new Date(document.deliveredAt).toLocaleDateString('en-AU')}
              </span>
            ) : (
              <span>Not yet delivered to client inbox</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Close Preview
            </button>
            {!isExecuted && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignModal(document);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <FileCheck className="w-4 h-4" />
                Sign Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
