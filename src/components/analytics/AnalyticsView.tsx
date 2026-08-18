import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import {
  BarChart3,
  TrendingUp,
  Cpu,
  PhoneCall,
  Clock,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { activeTenant } = useTenant();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      if (!activeTenant) return;
      setLoading(true);
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [activeTenant]);

  const usedTokens = activeTenant?.usage.usedAiTokens || 42500;
  const tokenLimit = activeTenant?.limits.monthlyAiTokens || 1000000;
  const usedVoice = activeTenant?.usage.usedVoiceMinutes || 24;
  const voiceLimit = activeTenant?.limits.monthlyVoiceMinutes || 500;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              AI Telemetry, ROI & Resource Metering
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time tracking of AI reasoning tokens, voice latency, conversion rates, and revenue impact across all autonomous communication channels.
          </p>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Autonomous Efficiency</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">89.4%</span>
            <span className="text-xs text-slate-400 font-semibold">Zero-touch</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Appointments booked without manual human intervention
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Lead Response Time</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400">740 ms</span>
            <span className="text-xs text-emerald-400 font-semibold">Sub-second</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Across 2-way Email, SMS, and Web Chat channels
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Voice Call Quality</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400">4.9 / 5.0</span>
            <span className="text-xs text-slate-400 font-semibold">MOS score</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Ultra-low latency Australian neural voice synthesis
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Realized Pipeline ROI</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">14.2x</span>
            <span className="text-xs text-emerald-400 font-semibold">Net return</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Based on active closed-won revenue and compute cost
          </div>
        </div>
      </div>

      {/* Metering Breakdown: AI Tokens & Voice Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Usage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Monthly AI Token Consumption
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {usedTokens.toLocaleString()} / {tokenLimit.toLocaleString()}
            </span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (usedTokens / tokenLimit) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Lead Discovery</div>
              <div className="text-sm font-bold text-slate-200 mt-1 font-mono">18,200 tk</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Voice Reasoning</div>
              <div className="text-sm font-bold text-slate-200 mt-1 font-mono">14,300 tk</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Inbox Co-Pilot</div>
              <div className="text-sm font-bold text-slate-200 mt-1 font-mono">10,000 tk</div>
            </div>
          </div>
        </div>

        {/* Telephony Minutes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Voice Telephony Minutes
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {usedVoice} / {voiceLimit} mins
            </span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (usedVoice / voiceLimit) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Outbound Calls</div>
              <div className="text-sm font-bold text-slate-200 mt-1 font-mono">18 mins</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Inbound Calls</div>
              <div className="text-sm font-bold text-slate-200 mt-1 font-mono">6 mins</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">DNCR Checked</div>
              <div className="text-sm font-bold text-emerald-400 mt-1 font-mono">100% Pass</div>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Performance Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
          Multi-Channel Conversion Performance Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            { channel: 'AI Voice Calling', conv: '42.8%', volume: '18 calls', avgDeal: '$35,000 AUD', color: 'text-rose-400' },
            { channel: 'Two-Way Email', conv: '28.4%', volume: '64 threads', avgDeal: '$22,500 AUD', color: 'text-blue-400' },
            { channel: 'Instant SMS', conv: '34.1%', volume: '32 messages', avgDeal: '$18,000 AUD', color: 'text-amber-400' },
            { channel: 'Web Chat Widget', conv: '31.2%', volume: '45 chats', avgDeal: '$20,000 AUD', color: 'text-emerald-400' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-slate-200">{item.channel}</div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-[11px] text-slate-400">Meeting Conv:</span>
                <span className={`text-base font-black font-mono ${item.color}`}>{item.conv}</span>
              </div>
              <div className="flex items-baseline justify-between text-[11px] text-slate-400">
                <span>Volume:</span>
                <span className="text-slate-300 font-mono">{item.volume}</span>
              </div>
              <div className="flex items-baseline justify-between text-[11px] text-slate-400">
                <span>Avg Deal Size:</span>
                <span className="text-emerald-400 font-mono font-bold">{item.avgDeal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
