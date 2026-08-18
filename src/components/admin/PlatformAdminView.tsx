import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { Tenant } from '../../types/index.ts';
import {
  Server,
  Plus,
  Building2,
  ShieldAlert,
  UserCheck,
  Zap,
  Globe,
  DollarSign,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export const PlatformAdminView: React.FC = () => {
  const {
    tenants,
    activeTenant,
    startImpersonation,
    refreshTenantData,
    addToast
  } = useTenant();

  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New Tenant Form
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [plan, setPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [monthlyFee, setMonthlyFee] = useState('2490');
  const [voiceMinutes, setVoiceMinutes] = useState('500');
  const [aiTokens, setAiTokens] = useState('1000000');

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subdomain) return;

    try {
      const created = await api.createTenant({
        name,
        slug: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        plan,
        status: 'active',
        isPlatformOwner: false,
        branding: {
          companyName: name,
          subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '') + '.businesshub.ai',
          primaryColor: '#2563EB',
          accentColor: '#10B981',
          voiceGender: 'female',
          voiceStyle: 'professional'
        },
        limits: {
          monthlyLeadCredits: 500,
          monthlyAiTokens: Number(aiTokens) || 1000000,
          monthlyVoiceMinutes: Number(voiceMinutes) || 500,
          monthlyEmailVolume: 10000,
          maxUsers: 10,
          maxAgents: 8
        },
        usage: {
          usedLeadCredits: 0,
          usedAiTokens: 0,
          usedVoiceMinutes: 0,
          usedEmailVolume: 0,
          currentEstimatedCost: 0
        },
        complianceSettings: {
          australianCompliance: true,
          gdprCompliant: true,
          canSpamCompliant: true,
          callRecordingDisclosure: true,
          dataRetentionDays: 365,
          doNotContactEnforced: true
        }
      });

      await refreshTenantData();
      setShowCreateModal(false);
      setName('');
      setSubdomain('');

      addToast({
        type: 'success',
        title: 'New Workspace Provisioned',
        message: `${created.name} provisioned with dedicated in-memory DB and RAG vector space.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Provisioning Failed', message: err.message });
    }
  };

  const totalTenants = tenants.length;
  const totalFleetTokens = tenants.reduce((acc, t) => acc + (t.usage.usedAiTokens || 0), 0);
  const totalFleetVoice = tenants.reduce((acc, t) => acc + (t.usage.usedVoiceMinutes || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Business HUB Platform Admin & Multi-Tenant Fleet Manager
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Centralized platform control panel. Manage client tenant accounts, provision dedicated isolated databases, configure telephony quotas, and perform secure 1-click support impersonation.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Provision Tenant Workspace</span>
        </button>
      </div>

      {/* Fleet Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Workspaces</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100">{totalTenants}</span>
            <span className="text-xs text-emerald-400 font-semibold">100% Isolated</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Strict header-level tenant partition</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fleet AI Tokens Used</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400">{(totalFleetTokens / 1000).toFixed(1)}k</span>
            <span className="text-xs text-slate-400 font-semibold">tk</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Gemini 3.7 Flash autonomous processing</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fleet Voice Telephony</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{totalFleetVoice}</span>
            <span className="text-xs text-slate-400 font-semibold">minutes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Australian phone calls connected</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compliance Enforcement</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400">ACMA / DNCR</span>
            <span className="text-xs text-emerald-400 font-semibold">Active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Automatic real-time suppression checks</div>
        </div>
      </div>

      {/* Tenants Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Provisioned Tenant Workspaces ({tenants.length})
            </h2>
            <p className="text-xs text-slate-400">
              Each workspace maintains its own isolated CRM, RAG vector repository, and autonomous voice agents.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Workspace & Tenant</th>
                <th className="py-3 px-4">Subdomain</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Monthly AI Tokens</th>
                <th className="py-3 px-4">Voice Minutes</th>
                <th className="py-3 px-4">Isolation Status</th>
                <th className="py-3 px-4 text-right">Support Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenants.map(tenant => {
                const isCurrent = activeTenant?.id === tenant.id;
                return (
                  <tr key={tenant.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>{tenant.name}</span>
                        {tenant.isPlatformOwner && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            PLATFORM ROOT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{tenant.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-400">{tenant.branding.subdomain}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-200">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-slate-200 font-bold">{tenant.usage.usedAiTokens.toLocaleString()}</span>
                      <span className="text-slate-500"> / {tenant.limits.monthlyAiTokens.toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-emerald-400 font-bold">{tenant.usage.usedVoiceMinutes}m</span>
                      <span className="text-slate-500"> / {tenant.limits.monthlyVoiceMinutes}m</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Isolated</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!tenant.isPlatformOwner && (
                        <button
                          onClick={() => startImpersonation(tenant.id)}
                          className="px-3 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Impersonate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">Provision New Tenant Workspace</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company / Tenant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Legal Advisory Partners"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Subdomain Slug</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="apex-legal"
                    value={subdomain}
                    onChange={e => setSubdomain(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-l-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                  <span className="bg-slate-800 border border-slate-700 border-l-0 rounded-r-lg px-3 py-2 text-slate-400 font-mono">
                    .businesshub.ai
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Plan Tier</label>
                  <select
                    value={plan}
                    onChange={e => setPlan(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Voice Minutes</label>
                  <input
                    type="number"
                    value={voiceMinutes}
                    onChange={e => setVoiceMinutes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">AI Tokens</label>
                  <input
                    type="number"
                    value={aiTokens}
                    onChange={e => setAiTokens(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/25 transition-all cursor-pointer"
                >
                  Provision Isolated Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
