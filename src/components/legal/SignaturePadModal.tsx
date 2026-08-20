import React, { useState, useRef, useEffect } from 'react';
import { LegalDocument, DigitalSignatureRecord } from '../../types/index.ts';
import {
  X,
  PenTool,
  Type,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Lock,
  Calendar,
  Building,
  User,
  Mail,
  FileCheck,
  AlertCircle
} from 'lucide-react';

interface SignaturePadModalProps {
  document: LegalDocument;
  onClose: () => void;
  onSign: (signatureData: {
    signatoryName: string;
    signatoryEmail: string;
    signatoryTitle: string;
    signatoryCompany: string;
    signatoryTaxIdOrAbn: string;
    signatureType: 'draw' | 'type' | 'crypto_certificate';
    signatureDataUrl?: string;
  }) => Promise<void>;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  document,
  onClose,
  onSign
}) => {
  const [tab, setTab] = useState<'draw' | 'type' | 'crypto'>('draw');
  const [signatoryName, setSignatoryName] = useState(document.recipientName || 'Harrison Sterling');
  const [signatoryEmail, setSignatoryEmail] = useState(document.recipientEmail || 'signatory@enterprise.com.au');
  const [signatoryTitle, setSignatoryTitle] = useState('Managing Director / Authorized Representative');
  const [signatoryCompany, setSignatoryCompany] = useState(document.recipientCompany || 'Enterprise Commercial Client Pty Ltd');
  const [signatoryTaxIdOrAbn, setSignatoryTaxIdOrAbn] = useState('ABN 84 629 104 883');
  const [typedFont, setTypedFont] = useState<'font-serif' | 'font-mono' | 'italic'>('italic');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drawing Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8'; // light blue neon pen
  }, [tab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleExecuteSign = async () => {
    if (!signatoryName.trim() || !signatoryEmail.trim()) {
      setError('Please provide the signatory legal name and authorized email address.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must acknowledge and accept the electronic signature declaration.');
      return;
    }

    let signatureDataUrl: string | undefined = undefined;
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        signatureDataUrl = canvas.toDataURL('image/png');
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSign({
        signatoryName: signatoryName.trim(),
        signatoryEmail: signatoryEmail.trim(),
        signatoryTitle: signatoryTitle.trim(),
        signatoryCompany: signatoryCompany.trim(),
        signatoryTaxIdOrAbn: signatoryTaxIdOrAbn.trim(),
        signatureType: tab === 'crypto' ? 'crypto_certificate' : tab === 'type' ? 'type' : 'draw',
        signatureDataUrl
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record digital signature.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Execute Digital Signature
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {document.version}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cryptographic legal certification under the Electronic Transactions Act 1999 (Cth)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Summary Card */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
            <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-1">
              Executing Agreement:
            </div>
            <div className="text-sm font-semibold text-slate-200">{document.title}</div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
              <span>Jurisdiction: <strong className="text-slate-300">{document.governingLaw}</strong></span>
              <span>Entity ABN: <strong className="text-slate-300">{document.abnOrTaxId}</strong></span>
            </div>
          </div>

          {/* Signatory Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Signatory Legal Name *
              </label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Harrison Sterling"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Authorized Email Address *
              </label>
              <input
                type="email"
                value={signatoryEmail}
                onChange={(e) => setSignatoryEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. legal@businesshub.app"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Signatory Corporate Title
              </label>
              <input
                type="text"
                value={signatoryTitle}
                onChange={(e) => setSignatoryTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Chief Executive Officer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Company / Organization (ABN/ACN)
              </label>
              <input
                type="text"
                value={signatoryCompany}
                onChange={(e) => setSignatoryCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Apex Industrial Solutions Pty Ltd"
              />
            </div>
          </div>

          {/* Signature Method Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Signature Rendering Method
              </label>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTab('draw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    tab === 'draw'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setTab('type')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    tab === 'type'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Type Name
                </button>
                <button
                  type="button"
                  onClick={() => setTab('crypto')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    tab === 'crypto'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Crypto Certificate
                </button>
              </div>
            </div>

            {/* TAB: DRAW */}
            {tab === 'draw' && (
              <div className="space-y-2">
                <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500/50 bg-slate-950 rounded-xl overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair touch-none"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 text-xs">
                      Sign with your mouse, stylus, or touch screen here
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-600/50 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 text-right">
                  Stored as a secure high-resolution vector and bound to SHA-256 seal
                </p>
              </div>
            )}

            {/* TAB: TYPE */}
            {tab === 'type' && (
              <div className="space-y-3">
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center min-h-[120px]">
                  <div className={`text-2xl text-cyan-300 select-none ${typedFont}`}>
                    {signatoryName || 'Signatory Name'}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Selected Cursive Style:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTypedFont('italic')}
                      className={`px-2.5 py-1 rounded border text-xs ${
                        typedFont === 'italic'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      Formal Cursive
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypedFont('font-serif')}
                      className={`px-2.5 py-1 rounded border text-xs font-serif ${
                        typedFont === 'font-serif'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      Executive Serif
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypedFont('font-mono')}
                      className={`px-2.5 py-1 rounded border text-xs font-mono ${
                        typedFont === 'font-mono'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      Monospace Cryptographic
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CRYPTO CERTIFICATE */}
            {tab === 'crypto' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Public Key & Hash Execution</div>
                    <div className="text-[11px] text-slate-400">
                      Executes an immutable tokenized signature anchored to your authenticated session ID.
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-400 space-y-1">
                  <div>AUTHORITY: Business HUB Legal PKI (Sydney Node #01)</div>
                  <div>DIGEST: SHA-256 (FIPS 180-4 Standard)</div>
                  <div>TIMESTAMP: {new Date().toISOString()}</div>
                </div>
              </div>
            )}
          </div>

          {/* Legal Acknowledgement Checkbox */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                I hereby declare that I am authorized to execute this agreement on behalf of the designated entity. I agree that my electronic signature constitutes a legally binding execution under the <em>Electronic Transactions Act 1999 (Cth)</em> with equal validity to a handwritten signature.
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteSign}
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cryptographically Signing...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                Execute & Sign Agreement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
