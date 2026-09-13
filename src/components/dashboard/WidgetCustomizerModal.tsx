import React from 'react';
import { DashboardWidgetConfig, DashboardWidgetId } from '../../types/index.ts';
import {
  Sliders,
  Check,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  BarChart3,
  TrendingUp,
  PhoneCall,
  Bot,
  ShieldCheck,
  CalendarCheck,
  Activity,
  Zap,
  DollarSign,
  Target
} from 'lucide-react';

interface WidgetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  onUpdateWidgets: (updated: DashboardWidgetConfig[]) => void;
  onResetDefaults: () => void;
}

const WIDGET_ICONS: Record<DashboardWidgetId, React.ElementType> = {
  key_metrics: TrendingUp,
  quick_actions: Zap,
  team_lead_conversions: Target,
  pipeline_funnel: BarChart3,
  global_revenue_map: DollarSign,
  call_sentiment_chart: PhoneCall,
  token_metering_chart: Bot,
  swarm_cluster_hud: Activity,
  tax_compliance_summary: ShieldCheck,
  upcoming_bookings: CalendarCheck,
  live_activity_feed: Sparkles
};

export const WidgetCustomizerModal: React.FC<WidgetCustomizerModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onUpdateWidgets,
  onResetDefaults
}) => {
  if (!isOpen) return null;

  const handleToggleWidget = (id: DashboardWidgetId) => {
    const updated = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    onUpdateWidgets(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newWidgets.length) return;

    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;

    // Re-index orders
    const reindexed = newWidgets.map((w, idx) => ({ ...w, order: idx }));
    onUpdateWidgets(reindexed);
  };

  const handleChangeWidth = (id: DashboardWidgetId, width: 'full' | 'half' | 'third') => {
    const updated = widgets.map(w => w.id === id ? { ...w, width } : w);
    onUpdateWidgets(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col text-white font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Customize Overview Dashboard</h2>
              <p className="text-xs text-white/50">
                Pin analytics charts, rearrange widgets, and configure grid widths.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Widget Items */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {widgets.map((widget, index) => {
            const Icon = WIDGET_ICONS[widget.id] || Sparkles;

            return (
              <div
                key={widget.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  widget.enabled
                    ? 'bg-white/[0.04] border-white/15'
                    : 'bg-white/[0.01] border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl border shrink-0 ${
                    widget.enabled ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-white/5 text-white/40 border-white/5'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{widget.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono uppercase bg-white/5 text-white/50 border border-white/10">
                        {widget.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">ID: {widget.id}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {/* Width selector */}
                  {widget.enabled && (
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleChangeWidth(widget.id, 'third')}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                          widget.width === 'third' ? 'bg-purple-600 text-white font-bold' : 'text-white/40 hover:text-white'
                        }`}
                        title="1/3 Column Width"
                      >
                        1/3
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeWidth(widget.id, 'half')}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                          widget.width === 'half' ? 'bg-purple-600 text-white font-bold' : 'text-white/40 hover:text-white'
                        }`}
                        title="1/2 Column Width"
                      >
                        1/2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeWidth(widget.id, 'full')}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                          widget.width === 'full' ? 'bg-purple-600 text-white font-bold' : 'text-white/40 hover:text-white'
                        }`}
                        title="Full Width"
                      >
                        Full
                      </button>
                    </div>
                  )}

                  {/* Move Up / Down */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/70 hover:text-white border border-white/10 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === widgets.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/70 hover:text-white border border-white/10 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Toggle enable / disable */}
                  <button
                    type="button"
                    onClick={() => handleToggleWidget(widget.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      widget.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {widget.enabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default Layout</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
