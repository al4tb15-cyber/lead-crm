import React from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import {
  LayoutDashboard,
  Kanban,
  Search,
  Bot,
  Inbox,
  PhoneCall,
  Calendar,
  BookOpen,
  Send,
  BarChart3,
  Server,
  Settings,
  Sparkles,
  CreditCard,
  Workflow,
  ShieldCheck,
  Building2,
  DollarSign,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  leadsCount?: number;
  unreadCount?: number;
  appointmentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  leadsCount = 0,
  unreadCount = 0,
  appointmentsCount = 0
}) => {
  const { activeTenant, currentUser } = useTenant();

  const isClient = currentUser?.role === 'client';

  const clientNavItems = [
    { id: 'client_portal', label: 'Client Dashboard', icon: ShieldCheck, badge: 'Active' },
    { id: 'billing', label: 'Tax Invoices & Receipts', icon: CreditCard, badge: null },
    { id: 'calendar', label: 'Booked Consultations', icon: Calendar, badge: null },
    { id: 'inbox', label: 'Advisory Inbox', icon: Inbox, badge: null }
  ];

  const coreRevenueItems = [
    { id: 'dashboard', label: 'Revenue Overview', icon: LayoutDashboard, badge: null },
    { id: 'crm', label: 'CRM & Pipeline', icon: Kanban, badge: leadsCount > 0 ? leadsCount : null },
    { id: 'billing', label: 'Payment Pipeline & Invoicing', icon: DollarSign, badge: 'Stripe', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'discovery', label: 'Lead Discovery & Scraping', icon: Search, badge: 'AI', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'inbox', label: 'Omnichannel Inbox', icon: Inbox, badge: unreadCount > 0 ? unreadCount : null, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'voice', label: 'AI Voice Station', icon: PhoneCall, badge: 'Live', badgeColor: 'bg-rose-500/20 text-rose-300' },
    { id: 'calendar', label: 'Calendar & Bookings', icon: Calendar, badge: appointmentsCount > 0 ? appointmentsCount : null }
  ];

  const intelligenceItems = [
    { id: 'agents', label: 'AI Agents Hub', icon: Bot, badge: '5 Active' },
    { id: 'remote_agent_workspace', label: 'Hermes & OpenClaw Swarm', icon: Workflow, badge: 'Live Swarm', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'cloud_apis', label: 'Cloud APIs & Agent Bridges', icon: Server, badge: 'Hermes', badgeColor: 'bg-purple-500/20 text-purple-300' },
    { id: 'knowledge', label: 'RAG Knowledge Base', icon: BookOpen, badge: null },
    { id: 'campaigns', label: 'Outreach Campaigns', icon: Send, badge: null },
    { id: 'analytics', label: 'Analytics & AI Metering', icon: BarChart3, badge: null }
  ];

  const adminItems = [
    { id: 'client_portal', label: 'Client Portal View', icon: ShieldCheck, badge: 'Live Portal', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
    { id: 'admin', label: 'Platform Admin Center', icon: Server, badge: 'Super Admin', badgeColor: 'bg-purple-500/20 text-purple-300' },
    { id: 'settings', label: 'White-Label & Settings', icon: Settings, badge: null }
  ];

  const tokenUsagePercent = Math.min(
    100,
    Math.round(((activeTenant?.usage.usedAiTokens || 0) / (activeTenant?.limits.monthlyAiTokens || 1)) * 100)
  );

  return (
    <aside className="w-64 backdrop-blur-2xl bg-white/[0.02] border-r border-white/10 text-white flex flex-col shrink-0 min-h-[calc(100vh-61px)] relative z-10">
      {/* Workspace Identifier */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Current Workspace</div>
        <div className="font-bold text-sm text-white truncate mt-0.5">{activeTenant?.branding.companyName || activeTenant?.name}</div>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400/50" />
          <span className="truncate">portal.businesshub.app</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {isClient ? (
          <>
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Client Portal Area
            </div>
            {clientNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-sm font-semibold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-white/40'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </>
        ) : (
          <>
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Revenue Operations
            </div>
            {coreRevenueItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/15 shadow-sm font-semibold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-white/40'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40' : item.badgeColor || 'bg-white/5 text-white/50'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-4 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/40 border-t border-white/10 mt-3">
              AI Engines & Swarms
            </div>
            {intelligenceItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm font-semibold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-300' : 'text-white/40'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-purple-500/40 text-purple-200' : item.badgeColor || 'bg-white/5 text-white/50'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-4 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/40 border-t border-white/10 mt-3">
              Governance & Portals
            </div>
            {adminItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/15 shadow-sm font-semibold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-300' : 'text-white/40'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-white/5 text-white/50'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Footer Resource Metering with Frosted Glow */}
      <div className="p-4 m-3 rounded-2xl backdrop-blur-lg bg-indigo-500/10 border border-white/10 text-xs space-y-3">
        <div>
          <div className="flex items-center justify-between text-white/50 text-[11px] mb-2">
            <span className="font-semibold text-white/90">AI Token Fleet</span>
            <span className="font-mono text-indigo-300 font-bold">{tokenUsagePercent}%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-400 to-purple-400 h-full rounded-full transition-all"
              style={{ width: `${tokenUsagePercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-white/50">
            <span className="text-indigo-200">{activeTenant?.usage.usedVoiceMinutes || 0}m voice used</span>
            <span className="text-emerald-300 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
        </div>

        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-white/40">Parent Network:</span>
          <a
            href="https://businesshub.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 hover:text-indigo-200 font-bold flex items-center gap-1 hover:underline"
          >
            <span>businesshub.app</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
};
