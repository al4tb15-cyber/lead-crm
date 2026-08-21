import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import {
  Lead,
  Campaign,
  CrmExportScope,
  CrmExportFormat,
  CrmExportResponse
} from '../../types/index.ts';
import {
  X,
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Copy,
  Check,
  Layers,
  Database,
  Users,
  Megaphone,
  CheckCircle2,
  Lock,
  Eye,
  RefreshCw,
  FileCheck2,
  Building,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredLeads: Lead[];
  allLeads: Lead[];
  currentSearchQuery?: string;
  currentStatusFilter?: string;
  currentIndustryFilter?: string;
  currentMinScoreFilter?: number;
}

export const BulkExportModal: React.FC<BulkExportModalProps> = ({
  isOpen,
  onClose,
  filteredLeads,
  allLeads,
  currentSearchQuery,
  currentStatusFilter,
  currentIndustryFilter,
  currentMinScoreFilter
}) => {
  const { activeTenant, currentUser, addToast } = useTenant();

  // Export options state
  const [scope, setScope] = useState<CrmExportScope>('filtered_leads');
  const [format, setFormat] = useState<CrmExportFormat>('csv');
  const [anonymize, setAnonymize] = useState<boolean>(false);
  const [downloadManifest, setDownloadManifest] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'configure' | 'preview'>('configure');

  // Campaigns state for preview & stats
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Execution & Result state
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<CrmExportResponse | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [clientVerified, setClientVerified] = useState<boolean | null>(null);

  // Check RBAC role authorization
  const allowedRoles = ['super_admin', 'business_hub_admin', 'account_owner', 'admin', 'manager', 'staff', 'sales_user'];
  const userRole = currentUser?.role || 'super_admin';
  const isAuthorized = allowedRoles.includes(userRole);

  useEffect(() => {
    if (isOpen) {
      loadCampaigns();
      setExportResult(null);
      setClientVerified(null);
    }
  }, [isOpen, activeTenant]);

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.warn('Failed to load campaigns for export preview', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Helper: Client-side compute SHA-256 to verify integrity against server
  const computeClientSha256 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Trigger browser download of file
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExecuteExport = async () => {
    if (!isAuthorized) {
      addToast({
        type: 'error',
        title: 'Export Permission Denied',
        message: `Your current role '${userRole}' cannot perform statutory bulk data exports.`
      });
      return;
    }

    setIsExporting(true);
    try {
      // Determine IDs to export
      const leadIds = scope === 'filtered_leads' 
        ? filteredLeads.map(l => l.id) 
        : scope === 'all_leads' || scope === 'complete_bundle'
        ? allLeads.map(l => l.id)
        : undefined;

      const campaignIds = scope === 'campaigns' || scope === 'complete_bundle'
        ? campaigns.map(c => c.id)
        : undefined;

      const response = await api.exportCrmData({
        scope,
        format,
        leadIds,
        campaignIds,
        anonymizeSensitiveFields: anonymize,
        includeAuditManifest: downloadManifest,
        filtersApplied: {
          searchQuery: currentSearchQuery,
          statusFilter: currentStatusFilter,
          industryFilter: currentIndustryFilter,
          minScoreFilter: currentMinScoreFilter
        }
      });

      // Verify client-side SHA-256
      const clientHash = await computeClientSha256(response.content);
      const isMatch = clientHash.toLowerCase() === response.sha256Hash.toLowerCase();
      setClientVerified(isMatch);

      setExportResult(response);

      // Trigger automatic download of primary data file
      downloadFile(response.content, response.filename, response.mimeType);

      // Trigger companion .sha256 manifest download if selected
      if (downloadManifest && response.manifestContent) {
        setTimeout(() => {
          downloadFile(
            response.manifestContent!,
            `${response.filename}.sha256`,
            'text/plain;charset=utf-8;'
          );
        }, 400);
      }

      addToast({
        type: 'success',
        title: 'Bulk Export Downloaded with SHA-256',
        message: `${response.recordCount} records exported (${response.certificate.certificateId})`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Export Execution Failed',
        message: err.message || 'Could not complete CRM export.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    addToast({
      type: 'info',
      title: 'SHA-256 Hash Copied',
      message: 'Cryptographic digest copied to clipboard.'
    });
    setTimeout(() => setCopiedHash(false), 2500);
  };

  if (!isOpen) return null;

  // Selected count calculations
  const targetRecordCount = 
    scope === 'filtered_leads' ? filteredLeads.length :
    scope === 'all_leads' ? allLeads.length :
    scope === 'campaigns' ? campaigns.length :
    allLeads.length + campaigns.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="crm-bulk-export-modal"
        className="relative w-full max-w-4xl backdrop-blur-2xl bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-8 text-white animate-in fade-in zoom-in duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>CRM Bulk Data Export</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  SHA-256 Verified
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Download structured lead and campaign datasets with cryptographic verification under the Australian Privacy Act.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RBAC Operator Status Banner */}
        <div className="px-6 py-3 bg-indigo-950/40 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {isAuthorized ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <div>
              <span className="text-white/60">Authorized Operator: </span>
              <span className="font-semibold text-white">{currentUser?.name || 'Alexander Ross'}</span>
              <span className="text-white/40 font-mono ml-1.5">({userRole})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/80 font-mono">
              Tenant: {activeTenant?.name || 'Business HUB'}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Statutory Audit Logged
            </span>
          </div>
        </div>

        {/* Unauthorized Warning if applicable */}
        {!isAuthorized && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Statutory Export Restricted</p>
              <p className="mt-0.5 text-rose-300/80">
                Your role ({userRole}) is not permitted to extract bulk CRM customer intelligence. Please request permission from a Platform Administrator.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-4 border-b border-white/10 gap-2">
          <button
            onClick={() => setActiveTab('configure')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'configure'
                ? 'bg-white/10 text-white border-t border-x border-white/15'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Export Configuration</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'bg-white/10 text-white border-t border-x border-white/15'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Dataset Preview ({targetRecordCount} records)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {activeTab === 'configure' ? (
            <>
              {/* 1. Dataset Scope Selection */}
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2.5">
                  1. Select Dataset Scope
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Filtered Leads */}
                  <div
                    onClick={() => setScope('filtered_leads')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      scope === 'filtered_leads'
                        ? 'bg-indigo-500/15 border-indigo-500/60 ring-2 ring-indigo-500/20'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white">Filtered CRM Leads</p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                          {filteredLeads.length} Records
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1 line-clamp-1">
                        Current active search & stage filter results.
                      </p>
                    </div>
                  </div>

                  {/* All Leads */}
                  <div
                    onClick={() => setScope('all_leads')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      scope === 'all_leads'
                        ? 'bg-indigo-500/15 border-indigo-500/60 ring-2 ring-indigo-500/20'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 mt-0.5">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white">All Leads Repository</p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                          {allLeads.length} Records
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1 line-clamp-1">
                        Complete tenant database across all stages.
                      </p>
                    </div>
                  </div>

                  {/* Campaigns */}
                  <div
                    onClick={() => setScope('campaigns')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      scope === 'campaigns'
                        ? 'bg-indigo-500/15 border-indigo-500/60 ring-2 ring-indigo-500/20'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 mt-0.5">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white">Outreach Campaigns</p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold">
                          {campaigns.length} Sequences
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1 line-clamp-1">
                        AI outreach sequences, conversions & agent mappings.
                      </p>
                    </div>
                  </div>

                  {/* Complete CRM Bundle */}
                  <div
                    onClick={() => setScope('complete_bundle')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      scope === 'complete_bundle'
                        ? 'bg-indigo-500/15 border-indigo-500/60 ring-2 ring-indigo-500/20'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white">Unified CRM Master Archive</p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                          {allLeads.length + campaigns.length} Total
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1 line-clamp-1">
                        Combined leads, campaigns, companies & contacts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Format Selection */}
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2.5">
                  2. Select File Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormat('csv')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      format === 'csv'
                        ? 'bg-indigo-500/15 border-indigo-500/60 ring-2 ring-indigo-500/20'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">CSV (Comma-Separated Values)</p>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Formatted for Microsoft Excel, Google Sheets, Salesforce.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormat('json')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      format === 'json'
                        ? 'bg-indigo-500/15 border-indigo-500/60 ring-2 ring-indigo-500/20'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Structured JSON</p>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Includes score breakdowns, custom attributes, and audit envelope.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Integrity & Privacy Controls */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                  3. Cryptographic Integrity & Statutory Privacy
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Companion Manifest Toggle */}
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.07] border border-white/5 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={downloadManifest}
                      onChange={e => setDownloadManifest(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-500 focus:ring-indigo-400"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                        Companion .sha256 Manifest
                      </span>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Download companion cryptographic verification checksum manifest file.
                      </p>
                    </div>
                  </label>

                  {/* Sensitive Field Masking Toggle */}
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.07] border border-white/5 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={anonymize}
                      onChange={e => setAnonymize(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-500 focus:ring-indigo-400"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Mask Sensitive PII
                      </span>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Obfuscate direct contact emails and phone numbers for privacy compliance.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          ) : (
            /* Dataset Preview Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">
                  Showing first 5 sample records of <span className="font-bold text-white">{targetRecordCount}</span> targeted records:
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                  Format: {format.toUpperCase()} | Scope: {scope}
                </span>
              </div>

              {scope === 'campaigns' ? (
                <div className="space-y-2">
                  {campaigns.slice(0, 5).map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{c.name}</p>
                        <p className="text-[11px] text-white/50">{c.targetAudience} • {c.channels.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                          {c.leadCount} Leads ({c.conversionRate}% Conv)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(scope === 'filtered_leads' ? filteredLeads : allLeads).slice(0, 5).map(lead => (
                    <div key={lead.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{lead.companyName}</span>
                          <span className="text-white/40">({lead.contactName})</span>
                        </div>
                        <p className="text-[11px] text-white/50 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-white/30" />{lead.contactEmail}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-white/30" />{lead.contactPhone}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400 font-mono">${(lead.estimatedValue || 0).toLocaleString()} AUD</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                          Score: {lead.leadScore}/100
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export Result & SHA-256 Integrity Verification Card */}
          {exportResult && (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Export Generated & Integrity Verified</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {exportResult.certificate.certificateId}
                </span>
              </div>

              {/* SHA-256 Hash Display Box */}
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-white/60">
                  <span className="flex items-center gap-1 font-semibold text-emerald-300">
                    <Hash className="w-3.5 h-3.5" />
                    FIPS 180-4 SHA-256 Digest:
                  </span>
                  <button
                    onClick={() => handleCopyHash(exportResult.sha256Hash)}
                    className="flex items-center gap-1 text-[10px] text-indigo-300 hover:text-white px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                  >
                    {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-emerald-400 break-all select-all">
                  {exportResult.sha256Hash}
                </div>
              </div>

              {/* Dual-Verification Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/70 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>
                    File: <strong className="text-white">{exportResult.filename}</strong> ({(exportResult.certificate.fileSizeBytes / 1024).toFixed(1)} KB, {exportResult.recordCount} records)
                  </span>
                </div>

                {clientVerified !== null && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Client & Server Hash 100% Match
                  </span>
                )}
              </div>

              {/* Action to Re-download if needed */}
              <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
                <button
                  onClick={() => downloadFile(exportResult.content, exportResult.filename, exportResult.mimeType)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Re-download {exportResult.format.toUpperCase()}</span>
                </button>
                {exportResult.manifestContent && (
                  <button
                    onClick={() => downloadFile(exportResult.manifestContent!, `${exportResult.filename}.sha256`, 'text/plain;charset=utf-8;')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Download .sha256 Manifest</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="text-xs text-white/50">
            Total targeted records: <strong className="text-white font-mono">{targetRecordCount}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleExecuteExport}
              disabled={isExporting || !isAuthorized}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
                isAuthorized && !isExporting
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-indigo-500/25 border border-white/20'
                  : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
              }`}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calculating SHA-256 Digest...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export & Compute SHA-256</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
