import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Lead,
  Appointment,
  SupportedCurrency
} from '../../types/index.ts';
import { formatCurrency, convertFromAud } from '../../utils/currencyAndTax.ts';
import {
  Target,
  TrendingUp,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Pin,
  PinOff,
  Sliders,
  Sparkles,
  Bot,
  UserCheck,
  Percent,
  DollarSign,
  BarChart3,
  Activity
} from 'lucide-react';

interface TeamMemberPerformance {
  id: string;
  name: string;
  role: string;
  type: 'human' | 'ai_agent';
  avatarBg: string;
  assignedLeads: number;
  contactedLeads: number;
  convertedDeals: number;
  weeklyGoal: number;
  conversionRate: number; // percentage (0-100)
  attainmentRate: number; // percentage of weekly goal (0-100+)
  totalRevenueAud: number;
  avgScore: number;
  status: 'ahead' | 'on_track' | 'behind';
}

interface TeamLeadConversionsWidgetProps {
  leads: Lead[];
  appointments?: Appointment[];
  selectedCurrency?: SupportedCurrency;
  pinned?: boolean;
  onTogglePin?: () => void;
  onNavigate?: (view: string) => void;
}

export const TeamLeadConversionsWidget: React.FC<TeamLeadConversionsWidgetProps> = ({
  leads = [],
  appointments = [],
  selectedCurrency = 'AUD',
  pinned = false,
  onTogglePin,
  onNavigate
}) => {
  const currencyCode: SupportedCurrency = (selectedCurrency || 'AUD') as SupportedCurrency;

  // View controls
  const [activeTab, setActiveTab] = useState<'reps' | 'trajectory' | 'efficiency'>('reps');
  const [metricMode, setMetricMode] = useState<'conversions' | 'revenue'>('conversions');
  const [selectedWeek, setSelectedWeek] = useState<'current' | 'prior' | 'month'>('current');
  const [baseWeeklyGoal, setBaseWeeklyGoal] = useState<number>(18); // Default weekly target per rep
  const [showGoalSettings, setShowGoalSettings] = useState<boolean>(false);
  const [highlightedRepId, setHighlightedRepId] = useState<string | null>(null);

  // Default team roster mapping across human specialists and autonomous AI agents
  const teamRoster = useMemo(() => [
    { id: 'usr_sarah', name: 'Sarah Chen', role: 'Enterprise Account Exec', type: 'human' as const, avatarBg: 'from-pink-500 to-rose-600', goalMultiplier: 1.2 },
    { id: 'usr_marcus', name: 'Marcus Brody', role: 'Mid-Market Sales Closer', type: 'human' as const, avatarBg: 'from-indigo-500 to-purple-600', goalMultiplier: 1.0 },
    { id: 'agent_sydney', name: 'Sydney Inbound SDR', role: 'Autonomous Voice AI SDR', type: 'ai_agent' as const, avatarBg: 'from-cyan-500 to-blue-600', goalMultiplier: 1.5 },
    { id: 'agent_closer', name: 'Enterprise AI Closer', role: 'Hermes-3 Autonomous Deal Closer', type: 'ai_agent' as const, avatarBg: 'from-purple-500 to-indigo-700', goalMultiplier: 1.3 },
    { id: 'usr_chloe', name: 'Chloe Vance', role: 'Outreach & Lead Specialist', type: 'human' as const, avatarBg: 'from-emerald-500 to-teal-600', goalMultiplier: 0.9 },
    { id: 'usr_alexander', name: 'Alexander Ross', role: 'Head of Growth / Platform Admin', type: 'human' as const, avatarBg: 'from-amber-500 to-orange-600', goalMultiplier: 0.8 }
  ], []);

  // Compute team performance metrics dynamically grounded with leads dataset
  const teamMetrics: TeamMemberPerformance[] = useMemo(() => {
    // If we have leads in state, distribute or map real leads
    const totalLeadsCount = Math.max(leads.length, 36);

    return teamRoster.map((member, idx) => {
      // Calculate realistic assigned leads and conversions matching tenant lead data
      const repLeads = leads.filter(l => l.assignedStaffId === member.id || l.assignedAgentId === member.id);
      
      // Compute counts grounded on tenant leads or synthetic baseline based on roster weight
      const leadFactor = [0.22, 0.18, 0.25, 0.15, 0.12, 0.08][idx] || 0.15;
      const assigned = repLeads.length > 0 
        ? repLeads.length 
        : Math.round(totalLeadsCount * leadFactor) + (idx * 2 + 5);

      const wonInRep = repLeads.filter(l => l.status === 'won' || l.status === 'booked').length;
      const converted = repLeads.length > 0
        ? wonInRep
        : Math.round(assigned * ([0.38, 0.32, 0.45, 0.40, 0.28, 0.35][idx] || 0.3));

      const contacted = Math.round(assigned * 0.85);

      const targetGoal = Math.round(baseWeeklyGoal * member.goalMultiplier);
      const conversionRate = assigned > 0 ? (converted / assigned) * 100 : 0;
      const attainmentRate = targetGoal > 0 ? (converted / targetGoal) * 100 : 0;

      const revenueFromLeads = repLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
      const totalRevenueAud = revenueFromLeads > 0 
        ? revenueFromLeads 
        : converted * ([4200, 3600, 2800, 5100, 2400, 4800][idx] || 3200);

      const avgScore = repLeads.length > 0
        ? Math.round(repLeads.reduce((acc, l) => acc + l.leadScore, 0) / repLeads.length)
        : [86, 79, 92, 88, 74, 82][idx] || 80;

      let status: 'ahead' | 'on_track' | 'behind' = 'on_track';
      if (attainmentRate >= 100) {
        status = 'ahead';
      } else if (attainmentRate < 75) {
        status = 'behind';
      }

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        type: member.type,
        avatarBg: member.avatarBg,
        assignedLeads: assigned,
        contactedLeads: contacted,
        convertedDeals: converted,
        weeklyGoal: targetGoal,
        conversionRate: Math.round(conversionRate * 10) / 10,
        attainmentRate: Math.round(attainmentRate * 10) / 10,
        totalRevenueAud,
        avgScore,
        status
      };
    });
  }, [leads, teamRoster, baseWeeklyGoal]);

  // Aggregate Team Summary Totals
  const teamTotals = useMemo(() => {
    const totalAssigned = teamMetrics.reduce((acc, m) => acc + m.assignedLeads, 0);
    const totalConverted = teamMetrics.reduce((acc, m) => acc + m.convertedDeals, 0);
    const totalWeeklyGoal = teamMetrics.reduce((acc, m) => acc + m.weeklyGoal, 0);
    const totalRevenueAud = teamMetrics.reduce((acc, m) => acc + m.totalRevenueAud, 0);
    const overallConversionRate = totalAssigned > 0 ? (totalConverted / totalAssigned) * 100 : 0;
    const overallAttainmentRate = totalWeeklyGoal > 0 ? (totalConverted / totalWeeklyGoal) * 100 : 0;
    
    // Top performer
    const topPerformer = [...teamMetrics].sort((a, b) => b.attainmentRate - a.attainmentRate)[0];

    return {
      totalAssigned,
      totalConverted,
      totalWeeklyGoal,
      totalRevenueAud,
      overallConversionRate: Math.round(overallConversionRate * 10) / 10,
      overallAttainmentRate: Math.round(overallAttainmentRate * 10) / 10,
      gapToGoal: totalWeeklyGoal - totalConverted,
      topPerformer
    };
  }, [teamMetrics]);

  // Daily Cumulative Trajectory Data (Mon - Sun)
  const trajectoryData = useMemo(() => {
    const totalGoal = teamTotals.totalWeeklyGoal;
    const dailyTargetStep = totalGoal / 7;
    
    const days = [
      { day: 'Mon', actual: Math.round(teamTotals.totalConverted * 0.14), target: Math.round(dailyTargetStep * 1) },
      { day: 'Tue', actual: Math.round(teamTotals.totalConverted * 0.32), target: Math.round(dailyTargetStep * 2) },
      { day: 'Wed', actual: Math.round(teamTotals.totalConverted * 0.55), target: Math.round(dailyTargetStep * 3) },
      { day: 'Thu', actual: Math.round(teamTotals.totalConverted * 0.76), target: Math.round(dailyTargetStep * 4) },
      { day: 'Fri (Today)', actual: teamTotals.totalConverted, target: Math.round(dailyTargetStep * 5) },
      { day: 'Sat', actual: null, target: Math.round(dailyTargetStep * 6), projection: Math.round(teamTotals.totalConverted * 1.12) },
      { day: 'Sun', actual: null, target: totalGoal, projection: Math.round(teamTotals.totalConverted * 1.25) }
    ];

    return days;
  }, [teamTotals]);

  // Custom Dark Frosted Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="backdrop-blur-xl bg-slate-900/95 border border-white/20 p-4 rounded-2xl shadow-2xl text-xs space-y-2 font-sans z-50 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="font-bold text-white text-sm">{label}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
            {selectedWeek === 'current' ? 'Week 37' : selectedWeek.toUpperCase()}
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {payload.map((item: any, idx: number) => {
            const isRevenue = item.name.toLowerCase().includes('revenue');
            const displayValue = isRevenue
              ? formatCurrency(convertFromAud(item.value, currencyCode), currencyCode)
              : typeof item.value === 'number'
              ? item.value.toLocaleString()
              : item.value;

            return (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || item.fill }}
                  />
                  <span className="text-white/70">{item.name}:</span>
                </div>
                <span className="font-bold font-mono text-white">{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-2xl space-y-6 text-white relative overflow-hidden transition-all duration-300 hover:border-white/20">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Team Lead Conversion Metrics</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {teamTotals.overallAttainmentRate}% Goal Progress
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Weekly lead-to-deal conversion performance across sales reps and autonomous AI voice agents.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-950/70 border border-white/15 rounded-2xl p-1 text-xs">
            <button
              onClick={() => setSelectedWeek('current')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedWeek === 'current'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedWeek('prior')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedWeek === 'prior'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Prior Week
            </button>
          </div>

          {/* Goal Settings Trigger */}
          <button
            onClick={() => setShowGoalSettings(!showGoalSettings)}
            className={`p-2 rounded-2xl border transition-all cursor-pointer ${
              showGoalSettings
                ? 'bg-purple-500/30 border-purple-500/50 text-purple-200'
                : 'bg-white/10 hover:bg-white/15 border-white/10 text-white/70 hover:text-white'
            }`}
            title="Adjust Weekly Goal Targets"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Pin Widget Toggle */}
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
              title={pinned ? 'Unpin Widget' : 'Pin Widget to Top'}
            >
              {pinned ? <Pin className="w-4 h-4 text-indigo-400" /> : <PinOff className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Goal Settings Tray (Collapsible) */}
      {showGoalSettings && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs animate-in fade-in zoom-in duration-150">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white">Adjust Weekly Conversion Baseline:</span>
            <span className="text-white/50">Target per full-time rep</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-mono">
              <button
                onClick={() => setBaseWeeklyGoal(Math.max(5, baseWeeklyGoal - 2))}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="font-bold text-sm text-purple-300 px-2">{baseWeeklyGoal} deals/rep</span>
              <button
                onClick={() => setBaseWeeklyGoal(baseWeeklyGoal + 2)}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                setBaseWeeklyGoal(18);
                setShowGoalSettings(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold border border-purple-500/30 transition-colors cursor-pointer"
            >
              Reset Default (18)
            </button>
          </div>
        </div>
      )}

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Conversions vs Weekly Goal */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-white/50 text-[11px] font-semibold uppercase tracking-wider">
            <span>Weekly Conversions</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {teamTotals.totalConverted}
            </span>
            <span className="text-xs text-white/40 font-mono">
              / {teamTotals.totalWeeklyGoal} Target
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                teamTotals.overallAttainmentRate >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${Math.min(teamTotals.overallAttainmentRate, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-white/50 flex items-center justify-between font-mono">
            <span>{teamTotals.overallAttainmentRate}% Goal Reached</span>
            <span className={teamTotals.gapToGoal <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
              {teamTotals.gapToGoal <= 0 ? 'Goal Exceeded' : `${teamTotals.gapToGoal} needed`}
            </span>
          </div>
        </div>

        {/* Metric 2: Team Lead Conversion Rate */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-white/50 text-[11px] font-semibold uppercase tracking-wider">
            <span>Team Conversion Rate</span>
            <Percent className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">
              {teamTotals.overallConversionRate}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +4.2%
            </span>
          </div>
          <div className="text-[10px] text-white/50">
            Across {teamTotals.totalAssigned} assigned pipeline leads
          </div>
        </div>

        {/* Metric 3: Closed-Won Pipeline Revenue */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-white/50 text-[11px] font-semibold uppercase tracking-wider">
            <span>Closed-Won Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono truncate">
            {formatCurrency(convertFromAud(teamTotals.totalRevenueAud, currencyCode), currencyCode)}
          </div>
          <div className="text-[10px] text-white/50 font-mono">
            Avg deal: {formatCurrency(convertFromAud(teamTotals.totalConverted > 0 ? teamTotals.totalRevenueAud / teamTotals.totalConverted : 0, currencyCode), currencyCode)}
          </div>
        </div>

        {/* Metric 4: Top Performer Badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-indigo-950/40 border border-purple-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-purple-300 text-[11px] font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Pace Leader
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
              {teamTotals.topPerformer?.attainmentRate}%
            </span>
          </div>
          <div className="font-bold text-white text-base truncate">
            {teamTotals.topPerformer?.name}
          </div>
          <div className="text-[10px] text-white/60 flex items-center gap-1.5 truncate">
            {teamTotals.topPerformer?.type === 'ai_agent' ? (
              <Bot className="w-3 h-3 text-cyan-400 shrink-0" />
            ) : (
              <UserCheck className="w-3 h-3 text-indigo-400 shrink-0" />
            )}
            <span>{teamTotals.topPerformer?.convertedDeals} deals ({teamTotals.topPerformer?.conversionRate}% conv)</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Section */}
      <div className="space-y-4">
        {/* Visualization Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-2 rounded-2xl border border-white/10">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('reps')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'reps'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Team Reps vs Weekly Goal</span>
            </button>

            <button
              onClick={() => setActiveTab('trajectory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'trajectory'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Weekly Pace & Trajectory</span>
            </button>

            <button
              onClick={() => setActiveTab('efficiency')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'efficiency'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Conversion Efficiency %</span>
            </button>
          </div>

          {/* Metric mode toggle */}
          {activeTab === 'reps' && (
            <div className="flex items-center gap-2 text-xs self-end sm:self-center pr-1">
              <span className="text-white/40 text-[11px]">Display:</span>
              <button
                onClick={() => setMetricMode(metricMode === 'conversions' ? 'revenue' : 'conversions')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 font-mono text-[11px] text-white flex items-center gap-1.5 cursor-pointer"
              >
                {metricMode === 'conversions' ? (
                  <>
                    <Users className="w-3 h-3 text-indigo-400" />
                    <span>Conversions (Units)</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>Revenue ({selectedCurrency})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Recharts Canvas Container */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/40 border border-white/5 h-[340px] relative">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'reps' ? (
              /* TAB 1: Composed Bar Chart (Assigned Leads, Actual Conversions, Weekly Goal Benchmark Line) */
              <ComposedChart
                data={teamMetrics}
                margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff90', fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff80', fontSize: 11 }}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                
                {metricMode === 'conversions' ? (
                  <>
                    <Bar
                      dataKey="assignedLeads"
                      name="Assigned Leads"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                      opacity={0.65}
                    />
                    <Bar
                      dataKey="convertedDeals"
                      name="Converted Deals"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    >
                      {teamMetrics.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={entry.attainmentRate >= 100 ? '#10b981' : entry.attainmentRate >= 75 ? '#818cf8' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="weeklyGoal"
                      name="Weekly Target Goal"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#f43f5e', strokeWidth: 1 }}
                    />
                  </>
                ) : (
                  <>
                    <Bar
                      dataKey="totalRevenueAud"
                      name={`Total Revenue (${selectedCurrency})`}
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                    />
                  </>
                )}
              </ComposedChart>
            ) : activeTab === 'trajectory' ? (
              /* TAB 2: Area + Line Chart (Daily Pace vs Weekly Target Run-Rate) */
              <ComposedChart
                data={trajectoryData}
                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff90', fontSize: 11 }}
                />
                <YAxis
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff80', fontSize: 11 }}
                  domain={[0, Math.ceil(teamTotals.totalWeeklyGoal * 1.2)]}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <ReferenceLine
                  y={teamTotals.totalWeeklyGoal}
                  label={{ value: `Goal (${teamTotals.totalWeeklyGoal})`, fill: '#f43f5e', fontSize: 11, position: 'right' }}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Cumulative Conversions"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#actualGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Ideal Run-Rate Pace"
                  stroke="#e2e8f0"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#cbd5e1' }}
                />
                <Line
                  type="monotone"
                  dataKey="projection"
                  name="Weekend Forecast"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </ComposedChart>
            ) : (
              /* TAB 3: Conversion Rate % & ICP Score Efficiency */
              <BarChart
                data={teamMetrics}
                margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff90', fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff80', fontSize: 11 }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <ReferenceLine
                  y={30}
                  label={{ value: 'Team Benchmark (30%)', fill: '#fbbf24', fontSize: 10, position: 'top' }}
                  stroke="#fbbf24"
                  strokeDasharray="4 4"
                />
                <Bar
                  dataKey="conversionRate"
                  name="Conversion Rate %"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                >
                  {teamMetrics.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.conversionRate >= 40 ? '#10b981' : entry.conversionRate >= 28 ? '#8b5cf6' : '#f59e0b'}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="avgScore"
                  name="Avg ICP Match Score"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                  opacity={0.4}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rep Breakdown & Goal Attainment Table Cards */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Individual Rep & Autonomous Agent Attainment
          </span>
          <span className="text-[11px] text-white/40">
            Click row to view CRM leads
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {teamMetrics.map((rep) => {
            const isAhead = rep.attainmentRate >= 100;
            const isBehind = rep.attainmentRate < 75;

            return (
              <div
                key={rep.id}
                onClick={() => onNavigate && onNavigate('crm')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                  isAhead
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                    : isBehind
                    ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${rep.avatarBg} text-white text-xs font-black flex items-center justify-center shrink-0 shadow-md`}>
                      {rep.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                        <span>{rep.name}</span>
                        {rep.type === 'ai_agent' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">{rep.role}</div>
                    </div>
                  </div>

                  {/* Goal attainment badge */}
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                    isAhead
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : isBehind
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {rep.attainmentRate}% Goal
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-white/60">
                      <strong>{rep.convertedDeals}</strong> / {rep.weeklyGoal} Deals
                    </span>
                    <span className="text-white/40">
                      {rep.conversionRate}% Conv
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAhead
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                          : isBehind
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                          : 'bg-gradient-to-r from-indigo-400 to-purple-400'
                      }`}
                      style={{ width: `${Math.min(rep.attainmentRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Footer metrics */}
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/60">
                  <span>Assigned: {rep.assignedLeads}</span>
                  <span className="text-emerald-400 font-semibold">
                    {formatCurrency(convertFromAud(rep.totalRevenueAud, currencyCode), currencyCode)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
