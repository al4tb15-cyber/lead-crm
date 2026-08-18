import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { Campaign } from '../../types/index.ts';
import {
  Send,
  Plus,
  Play,
  Pause,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  X
} from 'lucide-react';

export const CampaignsView: React.FC = () => {
  const { activeTenant, addToast } = useTenant();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Campaign Form
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Accounting & Advisory');
  const [minScore, setMinScore] = useState(70);

  useEffect(() => {
    loadCampaigns();
  }, [activeTenant]);

  const loadCampaigns = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const created = await api.createCampaign({
        name,
        status: 'active',
        audienceFilter: {
          minScore,
          industry: [industry]
        },
        steps: [
          {
            dayOffset: 0,
            channel: 'email',
            templatePrompt: 'Introduce Business HUB autonomous revenue operations, referencing their firm size.'
          },
          {
            dayOffset: 2,
            channel: 'voice',
            templatePrompt: 'AI Voice Station calls lead during business hours for quick 3-minute intake qualification.'
          },
          {
            dayOffset: 4,
            channel: 'sms',
            templatePrompt: 'Send SMS with direct link to Google Calendar booking page.'
          }
        ],
        stats: {
          totalLeads: 8,
          contacted: 0,
          engaged: 0,
          booked: 0
        }
      });

      setCampaigns(prev => [created, ...prev]);
      setShowModal(false);
      setName('');
      addToast({
        type: 'success',
        title: 'Campaign Launched',
        message: `Autonomous sequence "${created.name}" is now running.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to create campaign' });
    }
  };

  const toggleStatus = (camp: Campaign) => {
    const nextStatus = camp.status === 'active' ? 'paused' : 'active';
    setCampaigns(prev => prev.map(c => (c.id === camp.id ? { ...c, status: nextStatus } : c)));
    addToast({
      type: 'info',
      title: `Campaign ${nextStatus === 'active' ? 'Resumed' : 'Paused'}`,
      message: `${camp.name} is now ${nextStatus}.`
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Autonomous Multi-Channel Campaigns
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Orchestrate multi-day outbound sequences combining AI Email, Autonomous Phone Calling, and Two-Way SMS with dynamic audience targeting.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New AI Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map(camp => {
          const isActive = camp.status === 'active';
          return (
            <div
              key={camp.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {camp.status}
                    </span>
                    <h2 className="text-base font-bold text-slate-100 mt-2">{camp.name}</h2>
                  </div>

                  <button
                    onClick={() => toggleStatus(camp)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                    title={isActive ? 'Pause Campaign' : 'Resume Campaign'}
                  >
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>

                {/* Target Audience */}
                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Target Audience:</span>
                  <span className="font-semibold text-slate-200">
                    Score ≥ {camp.audienceFilter.minScore} • {camp.audienceFilter.industry.join(', ')}
                  </span>
                </div>

                {/* Step Sequence Flow */}
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sequence Steps Flow:
                  </div>
                  <div className="space-y-1.5">
                    {camp.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3 text-xs"
                      >
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-slate-300 flex items-center justify-center shrink-0">
                          D{step.dayOffset}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {step.channel === 'email' && <Mail className="w-3.5 h-3.5 text-blue-400" />}
                          {step.channel === 'voice' && <Phone className="w-3.5 h-3.5 text-emerald-400" />}
                          {step.channel === 'sms' && <MessageSquare className="w-3.5 h-3.5 text-amber-400" />}
                          <span className="capitalize font-semibold text-slate-200 text-[11px]">
                            {step.channel}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px] truncate flex-1">{step.templatePrompt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="font-mono font-bold text-slate-200">{camp.stats.totalLeads}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Targeted</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="font-mono font-bold text-blue-400">{camp.stats.contacted}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Contacted</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="font-mono font-bold text-purple-400">{camp.stats.engaged}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Engaged</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="font-mono font-bold text-emerald-400">{camp.stats.booked}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Bookings</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">Launch New Autonomous Campaign</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Financial Advisory Automated Outreach"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Minimum AI Lead Score (1-100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={minScore}
                  onChange={e => setMinScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
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
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
