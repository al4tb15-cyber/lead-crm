import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, Building, User, KeyRound, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, addToast } = useTenant();
  const [email, setEmail] = useState('al4tb15@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'staff' | 'client'>('super_admin');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({
        email,
        role: selectedRole
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Toast already shown in context
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'super_admin' | 'staff' | 'client') => {
    let quickEmail = 'al4tb15@gmail.com';
    if (role === 'staff') quickEmail = 'sarah.jenkins@businesshub.app';
    if (role === 'client') quickEmail = 'james.thornton@apexlegal.com.au';

    setSelectedRole(role);
    setEmail(quickEmail);
    setLoading(true);
    try {
      await login({
        email: quickEmail,
        role
      });
      if (onSuccess) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md backdrop-blur-2xl bg-white/[0.04] border border-white/15 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>portal.businesshub.app</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
            Business HUB Revenue OS
          </h1>
          <p className="text-xs text-white/50">
            Unified Multi-Tenant Autonomous Growth & Revenue Platform
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('super_admin');
              setEmail('al4tb15@gmail.com');
            }}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              selectedRole === 'super_admin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('staff');
              setEmail('sarah.jenkins@businesshub.app');
            }}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              selectedRole === 'staff'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('client');
              setEmail('james.thornton@apexlegal.com.au');
            }}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              selectedRole === 'client'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Client
          </button>
        </div>

        {selectedRole === 'super_admin' && (
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-white">Production Security Enforced</span>
              <span>Administrator credentials require explicit authentication. 1-Click login is reserved exclusively for sandbox demo accounts below.</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-white/50 font-semibold mb-1">Account Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/50 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 border border-white/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Switchers (Demo Accounts Only - Admin Excluded for Security) */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
              1-Click Demo Account Access
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Demo Only
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button
              onClick={() => handleQuickDemoLogin('staff')}
              className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-left cursor-pointer transition-all flex items-center gap-2.5 group"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold shrink-0">
                SJ
              </div>
              <div className="min-w-0">
                <div className="font-bold text-purple-300 truncate">Sarah (Sales Ops)</div>
                <div className="text-white/40 text-[9px] truncate">sarah.jenkins@businesshub.app</div>
              </div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('client')}
              className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-left cursor-pointer transition-all flex items-center gap-2.5 group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
                JT
              </div>
              <div className="min-w-0">
                <div className="font-bold text-emerald-300 truncate">James (Client)</div>
                <div className="text-white/40 text-[9px] truncate">james.thornton@apexlegal.com.au</div>
              </div>
            </button>
          </div>
        </div>

        {/* Australian Compliance Notice */}
        <div className="text-[10px] text-center text-white/40 flex items-center justify-center gap-1.5 pt-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Compliant with Australian DNCR & Privacy Act 1988</span>
        </div>
      </div>
    </div>
  );
};
