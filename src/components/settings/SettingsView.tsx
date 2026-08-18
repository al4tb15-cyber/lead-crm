import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import {
  Settings,
  ShieldCheck,
  Palette,
  Globe,
  Save,
  CheckCircle2,
  Lock,
  PhoneCall,
  Key,
  Webhook
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { activeTenant, refreshTenantData, addToast } = useTenant();

  // Branding State
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [accentColor, setAccentColor] = useState('#10B981');
  const [subdomain, setSubdomain] = useState('');

  // Compliance State
  const [dncrEnabled, setDncrEnabled] = useState(true);
  const [spamActCompliant, setSpamActCompliant] = useState(true);
  const [callingHoursEnforced, setCallingHoursEnforced] = useState(true);

  useEffect(() => {
    if (activeTenant) {
      setCompanyName(activeTenant.branding.companyName);
      setPrimaryColor(activeTenant.branding.primaryColor);
      setAccentColor(activeTenant.branding.accentColor);
      setSubdomain(activeTenant.branding.subdomain);

      if (activeTenant.complianceSettings) {
        setDncrEnabled(activeTenant.complianceSettings.doNotContactEnforced);
        setSpamActCompliant(activeTenant.complianceSettings.australianCompliance);
        setCallingHoursEnforced(activeTenant.complianceSettings.callRecordingDisclosure);
      }
    }
  }, [activeTenant]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;

    try {
      await api.updateBranding(activeTenant.id, {
        companyName,
        primaryColor,
        accentColor,
        subdomain
      });
      await refreshTenantData();
      addToast({
        type: 'success',
        title: 'Branding Saved',
        message: 'White-label customizations and subdomains updated.'
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleSaveCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;

    try {
      await api.updateCompliance(activeTenant.id, {
        australianCompliance: spamActCompliant,
        doNotContactEnforced: dncrEnabled,
        callRecordingDisclosure: callingHoursEnforced,
        canSpamCompliant: spamActCompliant,
        gdprCompliant: true,
        dataRetentionDays: 365
      });
      await refreshTenantData();
      addToast({
        type: 'success',
        title: 'Compliance Saved',
        message: 'Telecommunications and anti-spam policies updated.'
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Workspace Settings & White-Label Branding
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure tenant branding, public subdomains, telecommunications compliance gates, and integrations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding & White-Label */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Palette className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              White-Label Identity & Subdomain
            </h2>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Company Display Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Hosted Subdomain</label>
              <input
                type="text"
                value={subdomain}
                onChange={e => setSubdomain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Primary Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Accent Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save White-Label Branding</span>
              </button>
            </div>
          </form>
        </div>

        {/* Telecommunications & Legal Compliance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Australian Telecommunications & Privacy Compliance
            </h2>
          </div>

          <form onSubmit={handleSaveCompliance} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <input
                type="checkbox"
                id="dncr"
                checked={dncrEnabled}
                onChange={e => setDncrEnabled(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <label htmlFor="dncr" className="cursor-pointer">
                <div className="font-bold text-slate-200">Do Not Call Register (DNCR) Real-Time Suppression</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Automatically queries ACMA DNCR register before initiating outbound phone voice calls.
                </div>
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <input
                type="checkbox"
                id="spam"
                checked={spamActCompliant}
                onChange={e => setSpamActCompliant(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <label htmlFor="spam" className="cursor-pointer">
                <div className="font-bold text-slate-200">Australian Spam Act 2003 & Privacy Act 1988</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Appends mandatory business identity, ABN, and one-click opt-out suppression headers to all emails & SMS.
                </div>
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <input
                type="checkbox"
                id="hours"
                checked={callingHoursEnforced}
                onChange={e => setCallingHoursEnforced(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <label htmlFor="hours" className="cursor-pointer">
                <div className="font-bold text-slate-200">Calling Hours Enforcement (9:00 AM - 8:00 PM AEST)</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Blocks automated voice calls outside permitted Australian commercial calling windows.
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Compliance Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
