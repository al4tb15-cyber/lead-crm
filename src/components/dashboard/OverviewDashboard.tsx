import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import {
  Lead,
  Appointment,
  PlatformEvent,
  CallLog,
  SupportedCurrency,
  DashboardWidgetConfig,
  DashboardWidgetId
} from '../../types/index.ts';
import {
  CURRENCY_CONFIG,
  TAX_JURISDICTIONS,
  formatCurrency,
  convertFromAud
} from '../../utils/currencyAndTax.ts';
import { WidgetCustomizerModal } from './WidgetCustomizerModal.tsx';
import { TeamLeadConversionsWidget } from './TeamLeadConversionsWidget.tsx';
import {
  TrendingUp,
  Users,
  CalendarCheck,
  DollarSign,
  Sparkles,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  Bot,
  Sliders,
  Pin,
  PinOff,
  Zap,
  BarChart3,
  Layers,
  Activity,
  Globe,
  Plus,
  Workflow,
  Search,
  Inbox,
  CheckCircle2,
  AlertCircle,
  Target
} from 'lucide-react';

interface OverviewDashboardProps {
  onNavigate: (view: string) => void;
}

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  { id: 'key_metrics', title: 'Executive Revenue KPIs', category: 'metric', enabled: true, order: 0, width: 'full', pinned: true },
  { id: 'quick_actions', title: 'Autonomous Action Launchpad', category: 'action', enabled: true, order: 1, width: 'full', pinned: true },
  { id: 'team_lead_conversions', title: 'Team Lead Conversion & Weekly Goal Progress', category: 'chart', enabled: true, order: 2, width: 'full', pinned: true },
  { id: 'pipeline_funnel', title: 'Lead Pipeline & Conversion Flow', category: 'chart', enabled: true, order: 3, width: 'half', pinned: true },
  { id: 'global_revenue_map', title: 'Global Multi-Currency & Tax Jurisdiction', category: 'chart', enabled: true, order: 4, width: 'half', pinned: true },
  { id: 'call_sentiment_chart', title: 'AI Voice Call Sentiment & Quality (MOS)', category: 'chart', enabled: true, order: 5, width: 'half', pinned: false },
  { id: 'token_metering_chart', title: 'AI Token Consumption & Swarm Metering', category: 'chart', enabled: true, order: 6, width: 'half', pinned: false },
  { id: 'swarm_cluster_hud', title: 'Hermes & OpenClaw Swarm Telemetry', category: 'system', enabled: true, order: 7, width: 'third', pinned: false },
  { id: 'tax_compliance_summary', title: 'Global Tax & Legal Terms Status', category: 'system', enabled: true, order: 8, width: 'third', pinned: false },
  { id: 'upcoming_bookings', title: 'Real-Time Booked Consultations', category: 'feed', enabled: true, order: 9, width: 'third', pinned: false },
  { id: 'live_activity_feed', title: 'Autonomous Multi-Agent Activity Stream', category: 'feed', enabled: true, order: 10, width: 'full', pinned: true }
];

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const { activeTenant, addToast } = useTenant();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Currency State
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('AUD');

  // Customizable Widget System State
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(`dashboard_widgets_${activeTenant?.id || 'default'}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved widget layout');
    }
    return DEFAULT_WIDGETS;
  });

  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!activeTenant) return;
      setLoading(true);
      try {
        const [l, a, e, c] = await Promise.all([
          api.getLeads(),
          api.getAppointments(),
          api.getEvents(),
          api.getCalls()
        ]);
        setLeads(l);
        setAppointments(a);
        setEvents(e);
        setCalls(c);
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTenant]);

  const handleSaveWidgets = (updated: DashboardWidgetConfig[]) => {
    setWidgets(updated);
    try {
      localStorage.setItem(`dashboard_widgets_${activeTenant?.id || 'default'}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed');
    }
  };

  const handleResetWidgets = () => {
    setWidgets(DEFAULT_WIDGETS);
    try {
      localStorage.removeItem(`dashboard_widgets_${activeTenant?.id || 'default'}`);
    } catch (e) {}
    addToast({
      type: 'info',
      title: 'Layout Reset',
      message: 'Dashboard layout restored to default configuration.'
    });
  };

  const togglePinWidget = (id: DashboardWidgetId) => {
    const updated = widgets.map(w => w.id === id ? { ...w, pinned: !w.pinned } : w);
    handleSaveWidgets(updated);
    const item = updated.find(w => w.id === id);
    addToast({
      type: 'info',
      title: item?.pinned ? 'Widget Pinned' : 'Widget Unpinned',
      message: `"${item?.title}" pin preference saved.`
    });
  };

  // Calculations in nominated currency
  const totalAudPipeline = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
  const wonLeads = leads.filter(l => l.status === 'won');
  const wonAudRevenue = wonLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
  const bookedCount = leads.filter(l => ['booked', 'completed', 'won'].includes(l.status)).length;
  const conversionRate = leads.length > 0 ? ((bookedCount / leads.length) * 100).toFixed(1) : '0.0';

  const convertedPipeline = convertFromAud(totalAudPipeline, selectedCurrency);
  const convertedWon = convertFromAud(wonAudRevenue, selectedCurrency);

  // Stage distribution
  const stageCounts: Record<string, number> = {
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    engaged: leads.filter(l => l.status === 'engaged').length,
    booked: leads.filter(l => l.status === 'booked').length,
    won: leads.filter(l => l.status === 'won').length
  };

  // Enabled & sorted widgets
  const activeWidgets = [...widgets]
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto text-white font-sans animate-fade-in">
      {/* Top Banner with Frosted Glass, Global Currency & Customize Trigger */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 backdrop-blur-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl font-black italic pointer-events-none select-none">
          OS
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeTenant?.branding.companyName || 'Business HUB'} Autonomous Revenue Engine
            </h1>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md uppercase tracking-wider">
              GLOBAL ENTERPRISE READY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/50 max-w-2xl leading-relaxed">
            Multi-currency revenue orchestration, autonomous lead discovery, 24/7 neural voice agents, and global tax compliance (GST, VAT, US Sales Tax).
          </p>
        </div>

        {/* Action Controls: Currency Switcher & Widget Customizer */}
        <div className="flex items-center gap-3 shrink-0 relative z-10 flex-wrap">
          {/* Global Currency Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-white/15 rounded-2xl px-3 py-2 text-xs">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] uppercase font-bold text-white/40">Currency:</span>
            <select
              value={selectedCurrency}
              onChange={e => setSelectedCurrency(e.target.value as SupportedCurrency)}
              className="bg-transparent text-white font-bold font-mono focus:outline-none cursor-pointer"
            >
              {(Object.keys(CURRENCY_CONFIG) as SupportedCurrency[]).map(code => (
                <option key={code} value={code} className="bg-slate-900 text-white">
                  {CURRENCY_CONFIG[code].flag} {code} ({CURRENCY_CONFIG[code].symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Customize Widgets Button */}
          <button
            onClick={() => setShowCustomizer(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-all cursor-pointer shadow-sm"
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Customize Widgets</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC CUSTOMIZABLE WIDGET GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeWidgets.map(widget => {
          const colSpanClass =
            widget.width === 'full'
              ? 'md:col-span-2 lg:col-span-3'
              : widget.width === 'half'
              ? 'md:col-span-2 lg:col-span-2' // or half in 2-col
              : 'col-span-1';

          return (
            <div
              key={widget.id}
              className={`${colSpanClass} transition-all duration-200`}
            >
              {/* WIDGET 1: KEY METRICS */}
              {widget.id === 'key_metrics' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Total CRM Leads</span>
                      <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{leads.length}</span>
                      <span className="text-xs text-emerald-400 font-semibold flex items-center">↑ 14.8%</span>
                    </div>
                    <div className="mt-2 text-[11px] text-white/50">
                      {leads.filter(l => l.status === 'qualified').length} qualified for immediate outreach
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Autonomous Bookings</span>
                      <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{appointments.length}</span>
                      <span className="text-xs text-indigo-300 font-semibold">{conversionRate}% conv rate</span>
                    </div>
                    <div className="mt-2 text-[11px] text-white/50">
                      24/7 Neural AI reservation engine
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Active Pipeline Value</span>
                      <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">
                        {formatCurrency(convertedPipeline, selectedCurrency)}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-white/50">
                      Across {leads.length} opportunities in pipeline
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Closed-Won Invoicing</span>
                      <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-400">
                        {formatCurrency(convertedWon, selectedCurrency)}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-white/50">
                      {wonLeads.length} deals closed & GST/VAT compliant
                    </div>
                  </div>
                </div>
              )}

              {/* WIDGET 2: QUICK ACTION LAUNCHPAD */}
              {widget.id === 'quick_actions' && (
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Customizable Quick-Action Launchpad</span>
                    </div>
                    <button
                      onClick={() => togglePinWidget('quick_actions')}
                      className="text-white/40 hover:text-white transition-colors cursor-pointer"
                      title={widget.pinned ? 'Unpin from Top' : 'Pin to Top'}
                    >
                      {widget.pinned ? <Pin className="w-3.5 h-3.5 text-indigo-400" /> : <PinOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <button
                      onClick={() => onNavigate('discovery')}
                      className="p-3.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-left transition-all cursor-pointer group space-y-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Lead Discovery</div>
                      <div className="text-[10px] text-white/50">Crawl & Scrape</div>
                    </button>

                    <button
                      onClick={() => onNavigate('voice')}
                      className="p-3.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-left transition-all cursor-pointer group space-y-1.5"
                    >
                      <PhoneCall className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Voice Station</div>
                      <div className="text-[10px] text-white/50">Neural AI Calls</div>
                    </button>

                    <button
                      onClick={() => onNavigate('remote_agent_workspace')}
                      className="p-3.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-left transition-all cursor-pointer group space-y-1.5"
                    >
                      <Bot className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Hermes & OpenClaw</div>
                      <div className="text-[10px] text-white/50">Swarm Terminal</div>
                    </button>

                    <button
                      onClick={() => onNavigate('billing')}
                      className="p-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-left transition-all cursor-pointer group space-y-1.5"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Issue Tax Invoice</div>
                      <div className="text-[10px] text-white/50">Global Tax & Stripe</div>
                    </button>

                    <button
                      onClick={() => onNavigate('inbox')}
                      className="p-3.5 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-left transition-all cursor-pointer group space-y-1.5"
                    >
                      <Inbox className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Omnichannel Inbox</div>
                      <div className="text-[10px] text-white/50">Email / SMS / Chat</div>
                    </button>

                    <button
                      onClick={() => onNavigate('calendar')}
                      className="p-3.5 rounded-2xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-left transition-all cursor-pointer group space-y-1.5"
                    >
                      <CalendarCheck className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Calendar Bookings</div>
                      <div className="text-[10px] text-white/50">Auto Scheduler</div>
                    </button>
                  </div>
                </div>
              )}

              {/* WIDGET: TEAM LEAD CONVERSION & WEEKLY GOALS (RECHARTS) */}
              {widget.id === 'team_lead_conversions' && (
                <TeamLeadConversionsWidget
                  leads={leads}
                  appointments={appointments}
                  selectedCurrency={selectedCurrency}
                  pinned={widget.pinned}
                  onTogglePin={() => togglePinWidget('team_lead_conversions')}
                  onNavigate={onNavigate}
                />
              )}

              {/* WIDGET 3: PIPELINE FUNNEL CHART */}
              {widget.id === 'pipeline_funnel' && (
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Lead Pipeline & Conversion Flow
                      </h2>
                    </div>
                    <button
                      onClick={() => togglePinWidget('pipeline_funnel')}
                      className="text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {widget.pinned ? <Pin className="w-3.5 h-3.5 text-indigo-400" /> : <PinOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {Object.entries(stageCounts).map(([stage, count]) => {
                      const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                      return (
                        <div key={stage} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between font-mono">
                            <span className="capitalize font-semibold text-white/80">{stage}</span>
                            <span className="text-white/50">{count} leads ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                              style={{ width: `${Math.max(percentage, 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* WIDGET 4: GLOBAL MULTI-CURRENCY & TAX JURISDICTION */}
              {widget.id === 'global_revenue_map' && (
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Global Multi-Currency & Tax Jurisdiction
                      </h2>
                    </div>
                    <button
                      onClick={() => togglePinWidget('global_revenue_map')}
                      className="text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {widget.pinned ? <Pin className="w-3.5 h-3.5 text-indigo-400" /> : <PinOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[10px] text-white/40 uppercase font-bold block">Active Billing Currency</span>
                      <div className="text-base font-bold font-mono text-emerald-300">
                        {CURRENCY_CONFIG[selectedCurrency].flag} {selectedCurrency} ({CURRENCY_CONFIG[selectedCurrency].name})
                      </div>
                      <div className="text-[10px] text-white/50">
                        Fx Rate: 1 {selectedCurrency} = A${CURRENCY_CONFIG[selectedCurrency].exchangeRateToAud} AUD
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[10px] text-white/40 uppercase font-bold block">Tax Compliance Engine</span>
                      <div className="text-xs font-bold text-indigo-300">
                        {TAX_JURISDICTIONS[CURRENCY_CONFIG[selectedCurrency].defaultJurisdiction].name}
                      </div>
                      <div className="text-[10px] text-white/50">
                        {TAX_JURISDICTIONS[CURRENCY_CONFIG[selectedCurrency].defaultJurisdiction].defaultTaxId}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 text-[11px] text-white/70 space-y-1">
                    <span className="font-bold text-indigo-300 block">Cross-Border Legal Notice:</span>
                    <p className="text-[10px] leading-relaxed text-white/50">
                      {TAX_JURISDICTIONS[CURRENCY_CONFIG[selectedCurrency].defaultJurisdiction].legalDisclaimer}
                    </p>
                  </div>
                </div>
              )}

              {/* WIDGET 5: CALL SENTIMENT CHART */}
              {widget.id === 'call_sentiment_chart' && (
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-rose-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Voice Call Sentiment & Quality (MOS)
                      </h2>
                    </div>
                    <button
                      onClick={() => togglePinWidget('call_sentiment_chart')}
                      className="text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {widget.pinned ? <Pin className="w-3.5 h-3.5 text-indigo-400" /> : <PinOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-lg font-black text-emerald-400">88.4%</div>
                      <div className="text-[10px] text-white/50 mt-0.5">Positive Sentiment</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <div className="text-lg font-black text-blue-400">4.9/5.0</div>
                      <div className="text-[10px] text-white/50 mt-0.5">Neural Voice MOS</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                      <div className="text-lg font-black text-purple-400">740ms</div>
                      <div className="text-[10px] text-white/50 mt-0.5">Avg Turn Latency</div>
                    </div>
                  </div>
                </div>
              )}

              {/* WIDGET 6: AI TOKEN METERING */}
              {widget.id === 'token_metering_chart' && (
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        AI Reasoning Tokens Consumption
                      </h2>
                    </div>
                    <button
                      onClick={() => togglePinWidget('token_metering_chart')}
                      className="text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {widget.pinned ? <Pin className="w-3.5 h-3.5 text-indigo-400" /> : <PinOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white/70">Used: 42,500 / 1,000,000 tk</span>
                      <span className="text-purple-300">4.25% allocated</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 w-[4.25%]" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono text-white/50">
                      <div className="p-2 rounded-xl bg-white/[0.02]">Discovery: 18.2k</div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">Voice: 14.3k</div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">Hermes: 10.0k</div>
                    </div>
                  </div>
                </div>
              )}

              {/* WIDGET 7: SWARM CLUSTER HUD */}
              {widget.id === 'swarm_cluster_hud' && (
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                        Swarm Cluster HUD
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      12 NODES
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-white/70">Nous Hermes-3 405B</span>
                      <span className="text-emerald-400 font-bold">94ms</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-white/70">OpenClaw Crawler</span>
                      <span className="text-emerald-400 font-bold">120ms</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-white/70">Tool Bus Uptime</span>
                      <span className="text-indigo-300 font-bold">99.98%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* WIDGET 8: TAX COMPLIANCE SUMMARY */}
              {widget.id === 'tax_compliance_summary' && (
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                        Global Legal & Tax Terms
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      COMPLIANT
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px] text-white/70 font-mono">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span>Australia Privacy Act 1988</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span>EU GDPR & UK VAT</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span>US Nexus & CCPA</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* WIDGET 9: UPCOMING BOOKINGS */}
              {widget.id === 'upcoming_bookings' && (
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-teal-400" />
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                        Upcoming Consultations ({appointments.length})
                      </h2>
                    </div>
                    <button
                      onClick={() => onNavigate('calendar')}
                      className="text-[11px] text-teal-300 hover:text-teal-200 cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {appointments.slice(0, 3).map(app => (
                      <div key={app.id} className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs space-y-0.5">
                        <div className="font-bold text-white">{app.title}</div>
                        <div className="text-[10px] text-white/50">{app.contactName} • {new Date(app.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WIDGET 10: LIVE EVENT ACTIVITY STREAM */}
              {widget.id === 'live_activity_feed' && (
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Autonomous Multi-Agent Activity Stream
                      </h2>
                    </div>
                    <button
                      onClick={() => togglePinWidget('live_activity_feed')}
                      className="text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {widget.pinned ? <Pin className="w-3.5 h-3.5 text-indigo-400" /> : <PinOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="divide-y divide-white/5">
                    {events.slice(0, 5).map(ev => (
                      <div key={ev.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                          <div>
                            <span className="text-white font-medium">{ev.summary}</span>
                            {ev.triggeredByAgent && (
                              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                                {ev.triggeredByAgent}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-white/40 shrink-0 font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Widget Customizer Modal */}
      <WidgetCustomizerModal
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        widgets={widgets}
        onUpdateWidgets={handleSaveWidgets}
        onResetDefaults={handleResetWidgets}
      />
    </div>
  );
};
