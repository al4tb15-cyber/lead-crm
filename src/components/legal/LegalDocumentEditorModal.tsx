import React, { useState } from 'react';
import { LegalDocument, LegalDocType } from '../../types/index.ts';
import {
  X,
  FileText,
  ShieldCheck,
  Building,
  Mail,
  User,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface LegalDocumentEditorModalProps {
  onClose: () => void;
  onSave: (data: Partial<LegalDocument>) => Promise<void>;
  documentToEdit?: LegalDocument;
}

const TEMPLATE_PRESETS: Record<LegalDocType, { title: string; summary: string; version: string; defaultMarkdown: string }> = {
  msa_terms: {
    title: 'Master Enterprise SaaS Services Agreement & Platform Terms',
    summary: 'Governs enterprise multi-tenant platform usage, autonomous AI agent operations, SLA guarantees, data sovereignty, billing terms, and liability allocation under Australian Law.',
    version: 'v2026.1-AU',
    defaultMarkdown: `## 1. PARTIES & RECITALS
This Master Enterprise SaaS Services Agreement ("Agreement") is made effective as of the Effective Date between **Business HUB Australia Pty Ltd** (ABN 84 629 104 883) ("Provider") and the customer specified in the execution schedule ("Client").

## 2. SERVICES & AUTONOMOUS AI AGENT INFRASTRUCTURE
2.1 **Provision of Services**: Provider grants Client a non-exclusive, non-transferable right to access and use the Business HUB Autonomous Revenue Operating System.
2.2 **Sovereign Cloud Residency**: All customer CRM records, voice transcripts, and embeddings shall reside exclusively in certified Australian data centers (AWS Sydney / Google Cloud Sydney Region).
2.3 **Service Level Commitment**: Provider warrants a monthly uptime commitment of **99.9%** ("Uptime SLA").

## 3. FEES, STRIPE AUTOMATED BILLING & TAX INVOICING
3.1 **Payment Terms**: Fees are invoiced in Australian Dollars (AUD) inclusive of 10% Goods and Services Tax (GST) under the *A New Tax System (Goods and Services Tax) Act 1999*.
3.2 **Settlement**: Automated card debit and direct debits are securely tokenized and settled via Stripe Payments with Net 14 day payment terms.

## 4. INTELLECTUAL PROPERTY & DATA PRIVACY
4.1 **Customer Data Ownership**: Client retains all right, title, and interest in and to all proprietary lead records and sales data.
4.2 **Model Training Restraint**: Provider shall NOT train public foundational AI models on Client's proprietary confidential communications.

## 5. GOVERNING LAW
This Agreement is governed by the laws of the State of New South Wales, Commonwealth of Australia.`
  },
  privacy_policy_dpa: {
    title: 'Australian Privacy Principles (APP 1988) & Global Data Processing Addendum',
    summary: 'Enforces strict compliance with the 13 Australian Privacy Principles (APPs), Notifiable Data Breaches (NDB) Scheme, and GDPR cross-border safeguards.',
    version: 'v2026.3-DPA',
    defaultMarkdown: `## 1. APPLICABLE AUSTRALIAN & GLOBAL PRIVACY LEGISLATION
This Data Processing Addendum ("DPA") supplements the Principal Agreement and ensures strict compliance with:
- The **Privacy Act 1988 (Cth)** and the **13 Australian Privacy Principles (APPs)**;
- The **Privacy Amendment (Notifiable Data Breaches) Act 2017 (Cth)**;
- General Data Protection Regulation (EU) 2016/679 ("GDPR").

## 2. DATA PROCESSING SCOPE & ENCRYPTION
2.1 **Security Standards**: AES-256 encryption at rest, TLS 1.3 in transit, and database tenant isolation.
2.2 **NDB 24h Notification**: Provider shall notify Client within 24 hours of confirmation of any eligible data breach.`
  },
  telecom_spam_dncr: {
    title: 'Australian Telecommunications & Spam Act 2003 Compliance Addendum',
    summary: 'Statutory compliance protocols covering ACMA Do Not Call Register (DNCR) real-time API scrubbing, Spam Act 2003 consent, and calling hours restriction windows.',
    version: 'v2026.2-ACMA',
    defaultMarkdown: `## 1. STATUTORY TELECOMMUNICATIONS COMPLIANCE
All automated outbound communications dispatched through Business HUB comply with:
- The **Do Not Call Register Act 2006 (Cth)** and **Telecommunications (Telemarketing and Research Calls) Industry Standard 2017**;
- The **Spam Act 2003 (Cth)**.

## 2. CALLING TIME WINDOWS & DNCR SCRUBBING
2.1 **Permitted Calling Windows**: Monday to Friday: 9:00 AM – 8:00 PM AEST; Saturday: 9:00 AM – 5:00 PM AEST; Sundays: Strictly Prohibited.
2.2 **DNCR Verification**: Real-time scrubbing against ACMA registers within 30 days prior to dialing.`
  },
  voice_ai_disclosure: {
    title: 'Autonomous AI Voice Synthesis, Cloning & Call Recording Consent Agreement',
    summary: 'Defines two-party call recording disclosures, synthetic voice cloning rights, biometric data consent, and autonomous voice agent operational boundaries.',
    version: 'v2026.4-AI',
    defaultMarkdown: `## 1. SYNTHETIC SPEECH & RECORDING DISCLOSURE
1.1 **AI Voice Identification**: At call commencement, agent states: *"Hello, this call is handled by an AI assistant on behalf of [Company Name] and may be recorded for quality and appointment confirmation."*
1.2 **Voice Cloning Rights**: Client warrants lawful ownership of all voice samples provided for neural voice cloning.`
  },
  sla_security_addendum: {
    title: 'Enterprise Security, Penetration Testing & SLA Commitment Schedule',
    summary: 'Specifies 99.9% uptime SLA service credits, SOC 2 Type II baseline controls, annual third-party CREST-certified penetration testing, and automated disaster recovery.',
    version: 'v2026.1-SEC',
    defaultMarkdown: `## 1. 99.9% UPTIME SERVICE LEVEL GUARANTEE
Provider guarantees 99.9% service availability across API endpoints, Voice Telephony gateways, and CRM databases.

## 2. DISASTER RECOVERY & PENETRATION TESTING
2.1 **Recovery Objectives**: RPO < 15 minutes, RTO < 60 minutes across Australian cloud availability zones.
2.2 **Penetration Testing**: Annual CREST-accredited third-party security audits.`
  },
  custom_client_contract: {
    title: 'Custom B2B Enterprise Client Agreement & Service Schedule',
    summary: 'Tailored commercial agreement for enterprise client onboarding, custom voice agents, and dedicated webhook bridges.',
    version: 'v2026.1-CUSTOM',
    defaultMarkdown: `## 1. SCOPE OF CUSTOM REVENUE ACCELERATION
Client engages Provider to deploy dedicated AI Voice Agents and Omnichannel Lead Enrichment pipelines.

## 2. COMMERCIAL TERMS & FEES
Custom monthly retainer and usage tier as agreed in the Schedule of Fees.`
  }
};

export const LegalDocumentEditorModal: React.FC<LegalDocumentEditorModalProps> = ({
  onClose,
  onSave,
  documentToEdit
}) => {
  const [docType, setDocType] = useState<LegalDocType>(documentToEdit?.docType || 'custom_client_contract');
  const [title, setTitle] = useState(documentToEdit?.title || TEMPLATE_PRESETS.custom_client_contract.title);
  const [version, setVersion] = useState(documentToEdit?.version || TEMPLATE_PRESETS.custom_client_contract.version);
  const [governingLaw, setGoverningLaw] = useState(documentToEdit?.governingLaw || 'New South Wales, Commonwealth of Australia');
  const [abnOrTaxId, setAbnOrTaxId] = useState(documentToEdit?.abnOrTaxId || 'ABN 84 629 104 883');
  const [summary, setSummary] = useState(documentToEdit?.summary || TEMPLATE_PRESETS.custom_client_contract.summary);
  const [recipientName, setRecipientName] = useState(documentToEdit?.recipientName || '');
  const [recipientEmail, setRecipientEmail] = useState(documentToEdit?.recipientEmail || '');
  const [recipientCompany, setRecipientCompany] = useState(documentToEdit?.recipientCompany || '');
  const [contentMarkdown, setContentMarkdown] = useState(documentToEdit?.contentMarkdown || TEMPLATE_PRESETS.custom_client_contract.defaultMarkdown);
  const [tags, setTags] = useState<string>(documentToEdit?.tags.join(', ') || 'Commercial Agreement, Client Deliverable');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTemplate = (type: LegalDocType) => {
    setDocType(type);
    const preset = TEMPLATE_PRESETS[type];
    if (preset) {
      setTitle(preset.title);
      setSummary(preset.summary);
      setVersion(preset.version);
      setContentMarkdown(preset.defaultMarkdown);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentMarkdown.trim()) {
      setError('Please provide a document title and legal content.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        docType,
        title: title.trim(),
        version: version.trim(),
        governingLaw: governingLaw.trim(),
        abnOrTaxId: abnOrTaxId.trim(),
        summary: summary.trim(),
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        recipientCompany: recipientCompany.trim(),
        contentMarkdown: contentMarkdown.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        status: documentToEdit?.status || 'draft'
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save document.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {documentToEdit ? 'Edit Legal Document' : 'Draft New Legal Agreement / Contract'}
              </h2>
              <p className="text-xs text-slate-400">
                Prepare legally binding terms under Australian Corporate Law & Compliance Frameworks
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Template Selector Preset */}
          {!documentToEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Base Legal Template Preset:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(TEMPLATE_PRESETS) as LegalDocType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelectTemplate(type)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      docType === type
                        ? 'border-blue-500 bg-blue-500/10 text-slate-100 font-semibold shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 line-clamp-1 mb-1">
                      {TEMPLATE_PRESETS[type].title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {TEMPLATE_PRESETS[type].version}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Version */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Agreement Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Master Services Agreement"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Version Schedule
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-mono"
                placeholder="v2026.1-AU"
              />
            </div>
          </div>

          {/* Governing Law & Tax ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Governing Jurisdiction
              </label>
              <input
                type="text"
                value={governingLaw}
                onChange={(e) => setGoverningLaw(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="New South Wales, Commonwealth of Australia"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Platform Tax ID / ABN
              </label>
              <input
                type="text"
                value={abnOrTaxId}
                onChange={(e) => setAbnOrTaxId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-mono"
                placeholder="ABN 84 629 104 883"
              />
            </div>
          </div>

          {/* Recipient Target Enterprise */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Client / Signatory Recipient (Optional):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={recipientCompany}
                  onChange={(e) => setRecipientCompany(e.target.value)}
                  placeholder="Apex Industrial Pty Ltd"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Signatory Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Signatory Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="sarah@apexenterprise.com.au"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Statutory Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Statutory Executive Summary
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              placeholder="High-level description of rights, data sovereignty, and compliance guarantees..."
            />
          </div>

          {/* Document Content (Markdown) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Legal Clauses & Terms Content (Markdown Format) *
            </label>
            <textarea
              rows={12}
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contract Categorization Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              placeholder="MSA, Enterprise SLA, Stripe Billing, NSW Jurisdiction"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving Agreement...' : documentToEdit ? 'Save Changes' : 'Create Legal Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
