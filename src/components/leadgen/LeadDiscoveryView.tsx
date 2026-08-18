import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { Lead } from '../../types/index.ts';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Building,
  User,
  Globe,
  Phone,
  Mail,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sliders,
  Layers,
  Zap,
  Info
} from 'lucide-react';

interface LeadDiscoveryViewProps {
  onNavigateToCrm: () => void;
  onStartVoiceCall?: (lead: Lead) => void;
}

export const LeadDiscoveryView: React.FC<LeadDiscoveryViewProps> = ({ onNavigateToCrm, onStartVoiceCall }) => {
  const { activeTenant, addToast, refreshTenantData } = useTenant();
  const [criteriaPrompt, setCriteriaPrompt] = useState(
    'Find Australian accounting and wealth advisory firms with 10-50 employees that need after-hours lead qualification and automated appointment booking.'
  );
  const [location, setLocation] = useState('Australia (Sydney, Melbourne, Brisbane)');
  const [leadCount, setLeadCount] = useState<number>(4);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<Lead[]>([]);

  const samplePrompts = [
    'Find Australian accounting & wealth advisory practices with 10-50 employees needing 24/7 lead booking.',
    'Identify commercial architecture & engineering firms in Melbourne and Sydney with 15-60 staff.',
    'Discover mid-market clean energy and utility retailers in Australia subject to corporate compliance audits.',
    'Find high-growth B2B SaaS companies in APAC with 20-80 employees looking for SDR voice automation.'
  ];

  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteriaPrompt.trim()) return;

    setIsDiscovering(true);
    setDiscoveredLeads([]);

    try {
      const res = await api.discoverLeads(criteriaPrompt, location, leadCount);
      setDiscoveredLeads(res.leads);
      await refreshTenantData();

      addToast({
        type: 'success',
        title: 'Discovery Complete',
        message: `Discovered and enriched ${res.count} verified B2B prospects saved into CRM.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Discovery Failed',
        message: err.message || 'Error occurred while contacting web discovery agent.'
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              AI Lead Discovery & Market Intelligence Agent
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Autonomous web research engine that identifies target ICP accounts, scrapes verified company intelligence, discovers key decision makers, detects operational pain points, and calculates explainable lead scores.
          </p>
        </div>

        {/* Compliance Guarantee Pill */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-[11px]">
            <div className="font-bold text-slate-200">Australian Telecommunications & Spam Compliant</div>
            <div className="text-slate-400 text-[10px]">DNCR Suppression • Privacy Act 1988 • CAN-SPAM</div>
          </div>
        </div>
      </div>

      {/* Discovery Input Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <form onSubmit={handleRunDiscovery} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Specify Target Market Criteria & Desired ICP (Natural Language)
            </label>
            <textarea
              rows={3}
              required
              value={criteriaPrompt}
              onChange={e => setCriteriaPrompt(e.target.value)}
              placeholder="e.g. Find Australian accounting firms with 5-50 employees that appear to need digital marketing or after-hours appointment scheduling..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Preset Prompts */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Presets:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCriteriaPrompt(p)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Preset #{idx + 1}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Batch Prospects Count</label>
              <select
                value={leadCount}
                onChange={e => setLeadCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value={2}>2 Prospects (Quick Test)</option>
                <option value={4}>4 Prospects (Standard Batch)</option>
                <option value={8}>8 Prospects (Deep Scan)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isDiscovering}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                {isDiscovering ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Autonomous Agent Scraping & Researching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Lead Discovery & Scrape</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Discovered Results Section */}
      {discoveredLeads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Newly Discovered & Enriched Prospects ({discoveredLeads.length})</span>
            </h2>
            <button
              onClick={onNavigateToCrm}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              Open in CRM Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discoveredLeads.map((lead, idx) => (
              <div
                key={lead.id || idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
              >
                <div>
                  {/* Top: Company Name + Score */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        {lead.industry}
                      </span>
                      <h3 className="text-base font-bold text-slate-100 leading-tight mt-0.5">
                        {lead.companyName}
                      </h3>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-right shrink-0">
                      <div className="text-xs font-mono font-bold">{lead.leadScore}/100</div>
                      <div className="text-[9px] uppercase tracking-wider font-semibold">Lead Score</div>
                    </div>
                  </div>

                  {/* Decision Maker Contact Card */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        {lead.contactName}
                      </span>
                      <span className="text-slate-400 font-medium text-[11px]">{lead.jobTitle}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span className="truncate">{lead.contactEmail}</span>
                      <span>•</span>
                      <span>{lead.contactPhone}</span>
                    </div>
                  </div>

                  {/* Score Breakdown Reasoning */}
                  <div className="mt-3 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Scoring Reasoning Breakdown:
                    </div>
                    {(lead.scoreBreakdown || []).slice(0, 3).map((item, i) => (
                      <div key={i} className="text-[11px] text-slate-300 flex items-center justify-between bg-slate-950/40 px-2.5 py-1 rounded-lg">
                        <span>{item.category}: {item.reason}</span>
                        <span className="text-blue-400 font-mono font-bold text-[10px]">+{item.points}</span>
                      </div>
                    ))}
                  </div>

                  {/* Notes / Pain Points */}
                  <div className="mt-3 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg">
                    {lead.notes[1] || lead.notes[0]}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    Est. Value: ${lead.estimatedValue?.toLocaleString() || '25,000'} AUD
                  </div>

                  <div className="flex items-center gap-2">
                    {onStartVoiceCall && (
                      <button
                        onClick={() => onStartVoiceCall(lead)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>AI Voice Call</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
