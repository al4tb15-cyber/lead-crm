import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import {
  Building2,
  ChevronDown,
  ShieldCheck,
  Zap,
  PhoneCall,
  Sparkles,
  MessageSquare,
  Calendar,
  AlertTriangle,
  LogOut,
  UserCheck,
  DollarSign,
  Workflow,
  CreditCard,
  ExternalLink
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenChatModal: () => void;
  onOpenBookingModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenChatModal,
  onOpenBookingModal
}) => {
  const {
    tenants,
    activeTenant,
    currentUser,
    users,
    setActiveTenantId,
    switchUser,
    isImpersonating,
    stopImpersonation,
    logout
  } = useTenant();

  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="backdrop-blur-2xl bg-[#020617]/70 border-b border-white/10 text-white sticky top-0 z-40 shadow-sm">
      {/* Impersonation Banner if active */}
      {isImpersonating && (
        <div className="backdrop-blur-xl bg-amber-500/90 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-md border-b border-amber-400/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              Support Impersonation Mode Active: Operating inside <strong>{activeTenant?.name}</strong> workspace.
            </span>
          </div>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 text-amber-400 rounded-lg hover:bg-slate-900 transition-colors text-xs font-bold shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit Impersonation
          </button>
        </div>
      )}

      <div className="px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Tenant Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-black tracking-tight text-xl border border-white/20">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">Business HUB</span>
                <a
                  href="https://businesshub.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 backdrop-blur-md flex items-center gap-1 transition-colors"
                  title="Visit Parent Website: https://businesshub.app"
                >
                  <span>businesshub.app</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              </div>
              <p className="text-[11px] text-white/50 font-medium">Multi-Tenant Revenue OS & Swarms</p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          {/* Tenant Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTenantMenuOpen(!isTenantMenuOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="max-w-[160px] truncate">{activeTenant?.name || 'Select Workspace'}</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/5">
                {activeTenant?.plan}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            </button>

            {isTenantMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl backdrop-blur-2xl bg-slate-900/95 border border-white/15 shadow-2xl p-2.5 z-50">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/40 border-b border-white/10">
                  Switch Workspace (Tenant)
                </div>
                <div className="max-h-60 overflow-y-auto mt-1.5 space-y-1">
                  {tenants.map(tenant => (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        setActiveTenantId(tenant.id);
                        setIsTenantMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        activeTenant?.id === tenant.id
                          ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-semibold shadow-sm'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate font-medium text-white">{tenant.name}</div>
                        <div className="text-[10px] text-white/40">{tenant.branding.subdomain}</div>
                      </div>
                      <div className="text-[10px] font-mono capitalize px-2 py-0.5 rounded-full bg-white/5 text-white/60 shrink-0 ml-2">
                        {tenant.plan}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/10 mt-2 pt-2 px-1">
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setIsTenantMenuOpen(false);
                    }}
                    className="w-full text-center py-2 rounded-xl text-xs font-semibold text-indigo-300 hover:bg-indigo-500/15 transition-colors cursor-pointer"
                  >
                    + Manage All Tenants in Platform Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Live AI Telemetry Status */}
        <div className="hidden lg:flex items-center gap-3 backdrop-blur-md bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-white/90 font-medium text-[11px]">Gemini 2.5 & Hermes Swarms</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="text-[11px] text-white/60 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Australian DNCR & Spam Act Compliant</span>
          </div>
        </div>

        {/* Right: Quick Launchers & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => onNavigate('billing')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
            title="Invoices & Payment Pipeline"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payments</span>
          </button>

          <button
            onClick={() => onNavigate('cloud_apis')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
            title="Cloud APIs & Agent Bridges"
          >
            <Workflow className="w-3.5 h-3.5 text-purple-400" />
            <span>Bridges</span>
          </button>

          <button
            onClick={() => onNavigate('discovery')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 border border-white/10 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover Leads</span>
          </button>

          <button
            onClick={() => onNavigate('voice')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 border border-white/10 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Voice Station</span>
          </button>

          <button
            onClick={onOpenChatModal}
            title="Preview White-label Chat Widget"
            className="p-2.5 rounded-xl backdrop-blur-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenBookingModal}
            title="Preview Public Booking Page"
            className="p-2.5 rounded-xl backdrop-blur-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* User Profile Selector */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white uppercase border border-white/20 shadow-sm">
                {currentUser?.name.substring(0, 2) || 'US'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-white leading-tight">{currentUser?.name}</p>
                <p className="text-[10px] text-white/50 capitalize">{currentUser?.role.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl backdrop-blur-2xl bg-slate-900/95 border border-white/15 shadow-2xl p-2.5 z-50">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/40 border-b border-white/10">
                  Switch Active Persona / Role (RBAC)
                </div>
                <div className="space-y-1 mt-1.5">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        currentUser?.id === u.id
                          ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-semibold'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-[10px] text-white/40 capitalize">{u.role.replace('_', ' ')} • {u.email}</div>
                      </div>
                      {currentUser?.id === u.id && <UserCheck className="w-4 h-4 text-indigo-400" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-white/10 mt-2 pt-2 space-y-1">
                  <button
                    onClick={() => {
                      onNavigate('client_portal');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Open Client Self-Serve Portal</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
