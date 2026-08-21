import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import {
  BookOpen,
  KeyRound,
  ShieldCheck,
  Cpu,
  FileCheck2,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Server,
  Zap,
  Globe,
  Users,
  Building,
  CheckCircle2,
  Code2,
  Database
} from 'lucide-react';

interface SystemDocsViewProps {
  onNavigate: (view: string) => void;
}

export const SystemDocsView: React.FC<SystemDocsViewProps> = ({ onNavigate }) => {
  const { activeTenant, addToast } = useTenant();
  const [activeTab, setActiveTab] = useState<'access' | 'cloud_apis' | 'legal' | 'agent_runbook' | 'endpoints'>('access');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `${label} copied.`
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto text-white font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 backdrop-blur-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-indigo-400" />
              <span>Platform Documentation & Operator Runbook</span>
            </h1>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              2026.4 PRODUCTION DOCS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/50 max-w-2xl leading-relaxed">
            Authorized portal login credentials, Cloud AI Provider configurations, statutory digital signature certifications, and maintenance instructions for autonomous coding agents.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => onNavigate('cloud_apis')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <Cpu className="w-4 h-4" />
            <span>Open Cloud AI Settings</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'access'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <KeyRound className="w-4 h-4 text-indigo-300" />
          <span>Authorized Login Credentials</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud_apis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cloud_apis'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-4 h-4 text-purple-300" />
          <span>Cloud AI & Model Bridges</span>
        </button>

        <button
          onClick={() => setActiveTab('legal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'legal'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-300" />
          <span>Legal Docs & Digital Signatures</span>
        </button>

        <button
          onClick={() => setActiveTab('agent_runbook')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'agent_runbook'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Terminal className="w-4 h-4 text-amber-300" />
          <span>Autonomous Agent Instructions</span>
        </button>

        <button
          onClick={() => setActiveTab('endpoints')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'endpoints'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code2 className="w-4 h-4 text-blue-300" />
          <span>REST API Catalog</span>
        </button>
      </div>

      {/* TAB CONTENT 1: AUTHORIZED LOGIN CREDENTIALS */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold block text-white">Production Authentication Policy</span>
                <span>Administrator accounts require manual credential submission to protect workspace control. 1-Click login is reserved for staff and client demo sandboxes.</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] shrink-0 cursor-pointer"
            >
              Configure RBAC
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account 1: Super Admin */}
            <div className="backdrop-blur-xl bg-white/[0.03] border border-indigo-500/30 p-6 rounded-3xl space-y-4 relative shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    SA
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Platform Super Admin</h3>
                    <span className="text-[10px] text-indigo-400 font-mono">Role: super_admin</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  Owner
                </span>
              </div>

              <p className="text-xs text-white/60">
                Full unrestricted administrative authority over all tenants, AI model routing, Cloud API keys, and legal contract delivery.
              </p>

              <div className="space-y-2 text-xs font-mono bg-slate-950/80 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[11px]">Email:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-300 font-bold">al4tb15@gmail.com</span>
                    <button
                      onClick={() => copyToClipboard('al4tb15@gmail.com', 'Admin Email')}
                      className="text-white/40 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'Admin Email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[11px]">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/90">AdminPass2026!</span>
                    <button
                      onClick={() => copyToClipboard('AdminPass2026!', 'Admin Password')}
                      className="text-white/40 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'Admin Password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/40">Tenant Scope:</span>
                  <span className="text-white/70">All Workspaces (Cross-Tenant)</span>
                </div>
              </div>

              <div className="text-[11px] text-white/50 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Update Cloud AI Keys & Endpoints</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Execute & Seal Statutory Contracts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Switch Workspace Tenant Context</span>
                </div>
              </div>
            </div>

            {/* Account 2: Staff / Sales Closer */}
            <div className="backdrop-blur-xl bg-white/[0.03] border border-purple-500/30 p-6 rounded-3xl space-y-4 relative shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                    SJ
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Staff / Sales Operations</h3>
                    <span className="text-[10px] text-purple-400 font-mono">Role: staff / sales</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                  Demo 1-Click
                </span>
              </div>

              <p className="text-xs text-white/60">
                Staff portal persona for inbound sales, neural voice agent operation, prospect scraping, and lead pipeline progression.
              </p>

              <div className="space-y-2 text-xs font-mono bg-slate-950/80 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[11px]">Email:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 font-bold">sarah.jenkins@businesshub.app</span>
                    <button
                      onClick={() => copyToClipboard('sarah.jenkins@businesshub.app', 'Staff Email')}
                      className="text-white/40 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'Staff Email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[11px]">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/90">StaffPass2026!</span>
                    <button
                      onClick={() => copyToClipboard('StaffPass2026!', 'Staff Password')}
                      className="text-white/40 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'Staff Password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/40">Tenant Scope:</span>
                  <span className="text-white/70">Business HUB Primary Tenant</span>
                </div>
              </div>

              <div className="text-[11px] text-white/50 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Outbound Voice Dialing & Live Calls</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CRM Lead Pipeline Management</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Omnichannel Inbound Inbox</span>
                </div>
              </div>
            </div>

            {/* Account 3: Enterprise Client */}
            <div className="backdrop-blur-xl bg-white/[0.03] border border-emerald-500/30 p-6 rounded-3xl space-y-4 relative shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                    JT
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Enterprise Client Persona</h3>
                    <span className="text-[10px] text-emerald-400 font-mono">Role: client</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Demo 1-Click
                </span>
              </div>

              <p className="text-xs text-white/60">
                Client self-service portal experience for Apex Legal & Compliance Partners (viewing invoices, tax receipts, consultations).
              </p>

              <div className="space-y-2 text-xs font-mono bg-slate-950/80 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[11px]">Email:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-300 font-bold">james.thornton@apexlegal.com.au</span>
                    <button
                      onClick={() => copyToClipboard('james.thornton@apexlegal.com.au', 'Client Email')}
                      className="text-white/40 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'Client Email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[11px]">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/90">ClientPass2026!</span>
                    <button
                      onClick={() => copyToClipboard('ClientPass2026!', 'Client Password')}
                      className="text-white/40 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'Client Password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/40">Tenant Scope:</span>
                  <span className="text-white/70">Apex Legal & Compliance Tenant</span>
                </div>
              </div>

              <div className="text-[11px] text-white/50 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View & Pay Tax Invoices (GST/VAT)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Executed Legal Contracts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Book Advisory & Strategy Sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CLOUD AI & MODEL BRIDGES */}
      {activeTab === 'cloud_apis' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <span>Multi-Cloud AI Architecture & Provider Hot-Swapping</span>
              </h2>
              <button
                onClick={() => onNavigate('cloud_apis')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Manage API Keys in UI</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Business HUB supports open provider configuration. You can switch the primary reasoning engine dynamically across any of the following supported cloud endpoints:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300">1. Google Gemini</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Default</span>
                </div>
                <div className="text-white/50 text-[11px]">SDK: @google/genai (Gemini 2.5 Flash / Pro)</div>
                <div className="text-white/40 text-[10px]">High throughput, native multimodal audio/vision, live search grounding.</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">2. Anthropic Claude</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-bold">Supported</span>
                </div>
                <div className="text-white/50 text-[11px]">Claude 3.7 Sonnet & 3.5 Haiku</div>
                <div className="text-white/40 text-[10px]">Complex legal contract drafting and enterprise objection handling.</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">3. OpenAI</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-bold">Supported</span>
                </div>
                <div className="text-white/50 text-[11px]">GPT-4o & o3-mini Reasoning</div>
                <div className="text-white/40 text-[10px]">Structured JSON extraction and rapid conversational turns.</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300">4. DeepSeek AI</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-bold">Supported</span>
                </div>
                <div className="text-white/50 text-[11px]">DeepSeek R1 Reasoning & V3</div>
                <div className="text-white/40 text-[10px]">Ultra-low-cost market audits, lead scoring, and mathematical analysis.</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">5. Nous Hermes 3 405B</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-bold">Swarm Node</span>
                </div>
                <div className="text-white/50 text-[11px]">Autonomous Tool Bus Protocol</div>
                <div className="text-white/40 text-[10px]">Uncensored multi-step workflow execution and background dispatch.</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300">6. Custom vLLM / Ollama</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-bold">On-Prem VPC</span>
                </div>
                <div className="text-white/50 text-[11px]">OpenAI-compatible /v1/chat API</div>
                <div className="text-white/40 text-[10px]">Self-hosted sovereign models meeting strict Australian data residency.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: LEGAL & DIGITAL SIGNATURES */}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <span>Statutory Compliance & SHA-256 E-Signature Engine</span>
              </h2>
              <button
                onClick={() => onNavigate('legal_docs')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Legal Document Hub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Australian Statutory Framework</span>
                </h3>
                <ul className="space-y-2 text-white/60 text-[11px] leading-relaxed">
                  <li>• <strong>Electronic Transactions Act 1999 (Cth) Section 10:</strong> Validates electronic signatures as legally enforceable across all Australian states.</li>
                  <li>• <strong>Privacy Act 1988 (Cth) & 13 APPs:</strong> Enforces data sovereignty and consent recording.</li>
                  <li>• <strong>Do Not Call Register Act 2006 (Cth):</strong> Automated scrubbing of voice dialer queues.</li>
                  <li>• <strong>Spam Act 2003 (Cth):</strong> Mandatory unsubscribe and commercial consent headers.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 font-mono text-[11px]">
                <h3 className="font-bold text-white flex items-center gap-2 font-sans">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>Cryptographic Integrity Construction</span>
                </h3>
                <div className="bg-slate-950 p-3 rounded-xl border border-white/10 space-y-1">
                  <div className="text-white/40">// SHA-256 Digest Formula</div>
                  <div className="text-emerald-300">
                    payload = `${'{docId}'}:${'{email}'}:${'{timestamp}'}:${'{title}'}`;
                  </div>
                  <div className="text-indigo-300">
                    sha256 = crypto.createHash('sha256').update(payload).digest('hex');
                  </div>
                </div>
                <p className="text-white/50 font-sans text-[10px]">
                  Every executed agreement includes an Audit Certificate ID (e.g. CERT-AU-XXXXXX), client IP address, and timestamped immutable record.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: AUTONOMOUS AGENT RUNBOOK */}
      {activeTab === 'agent_runbook' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <span>Autonomous Agent Maintenance & Operational Rules</span>
            </h2>
            <p className="text-xs text-white/60">
              System instructions and constraints enforced for AI coding agents and DevOps engineers maintaining this repository:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold font-mono text-[10px] shrink-0 mt-0.5">RULE 1</span>
                <div>
                  <span className="font-bold text-white block">No Mock / Fake Placeholders</span>
                  <span className="text-white/50 text-[11px]">All components must make real REST API calls to `/api/*` endpoints backed by the database repository in `server/db.ts`.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold font-mono text-[10px] shrink-0 mt-0.5">RULE 2</span>
                <div>
                  <span className="font-bold text-white block">Hardcoded Cloud Port 3000</span>
                  <span className="text-white/50 text-[11px]">Server must bind strictly to `0.0.0.0:3000`. Never change or attempt to re-assign port numbers.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[10px] shrink-0 mt-0.5">RULE 3</span>
                <div>
                  <span className="font-bold text-white block">Single Bundled CommonJS Output (`dist/server.cjs`)</span>
                  <span className="text-white/50 text-[11px]">`esbuild` bundles `server.ts` into a standalone CommonJS file at build time, preventing ES Module runtime path resolution issues.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px] shrink-0 mt-0.5">RULE 4</span>
                <div>
                  <span className="font-bold text-white block">Strict Type Safety in `/src/types/index.ts`</span>
                  <span className="text-white/50 text-[11px]">Never declare untyped `any` signatures for domain entities. Use TypeScript interfaces.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: REST API CATALOG */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-400" />
              <span>Full REST API Route Catalog</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase">
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Endpoint</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  <tr>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">GET</td>
                    <td className="py-2.5 px-3 text-indigo-300">/api/health</td>
                    <td className="py-2.5 px-3 text-white/60 font-sans">System health, uptime, version, and tenant status</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-indigo-400 font-bold">POST</td>
                    <td className="py-2.5 px-3 text-indigo-300">/api/auth/login</td>
                    <td className="py-2.5 px-3 text-white/60 font-sans">Multi-persona authentication (admin, staff, client)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">GET</td>
                    <td className="py-2.5 px-3 text-indigo-300">/api/legal/documents</td>
                    <td className="py-2.5 px-3 text-white/60 font-sans">List statutory agreements, contracts, and NDA schedules</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-indigo-400 font-bold">POST</td>
                    <td className="py-2.5 px-3 text-indigo-300">/api/legal/documents/:id/sign</td>
                    <td className="py-2.5 px-3 text-white/60 font-sans">Digitally sign agreement with SHA-256 sealing</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-indigo-400 font-bold">POST</td>
                    <td className="py-2.5 px-3 text-indigo-300">/api/legal/documents/:id/deliver</td>
                    <td className="py-2.5 px-3 text-white/60 font-sans">Email executed legal contract to recipient</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">GET</td>
                    <td className="py-2.5 px-3 text-indigo-300">/api/cloud-apis</td>
                    <td className="py-2.5 px-3 text-white/60 font-sans">List active AI model providers (Gemini, Claude, GPT, DeepSeek)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-indigo-400 font-bold">POST</td>
                    <td className="py-2.5 px-3 text-indigo-300">/api/cloud-apis/test</td>
                    <td className="py-2.5 px-3 text-white/60 font-sans">Test latency and ping connectivity for AI key</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">GET</td>
                    <td className="py-2.5 px-3 text-indigo-300">/api/rbac/audit-logs</td>
                    <td className="py-2.5 px-3 text-white/60 font-sans">Retrieve immutable administrative audit trail</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
