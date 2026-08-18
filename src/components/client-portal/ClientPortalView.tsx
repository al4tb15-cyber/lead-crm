import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { Invoice, Appointment, CallLog } from '../../types/index.ts';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  DollarSign,
  Receipt,
  Calendar,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  User,
  Building,
  Mail,
  Lock
} from 'lucide-react';

export const ClientPortalView: React.FC = () => {
  const { currentUser, activeTenant, addToast } = useTenant();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Pay invoice modal state
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [activeTenant, currentUser]);

  const loadClientData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [invs, apts, cls] = await Promise.all([
        api.getInvoices(),
        api.getAppointments(),
        api.getCalls()
      ]);
      setInvoices(invs);
      setAppointments(apts);
      setCalls(cls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (invoice: Invoice) => {
    setIsProcessing(true);
    try {
      const result = await api.payInvoice(invoice.id, {
        paymentMethod: 'card',
        payerName: currentUser?.name || invoice.clientName,
        payerEmail: currentUser?.email || invoice.clientEmail
      });

      setInvoices(prev => prev.map(i => (i.id === invoice.id ? result.invoice : i)));
      setPayingInvoice(null);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      addToast({
        type: 'success',
        title: 'Payment Complete',
        message: `Tax Invoice ${result.invoice.invoiceNumber} paid in full ($${result.invoice.total.toLocaleString()} AUD). Receipt emailed.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Payment Error', message: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Client Welcome Banner */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/60 border border-white/10 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Verified Client Portal • portal.businesshub.app
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, {currentUser?.name || 'Valued Client'}
          </h1>
          <p className="text-xs text-white/60 max-w-xl leading-relaxed">
            Manage your autonomous revenue infrastructure, review ongoing advisory calls, and settle tax invoices securely.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs space-y-1 shrink-0">
          <div className="text-white/40 text-[10px] uppercase font-bold">Client Account Details</div>
          <div className="font-bold text-white text-sm">{currentUser?.name}</div>
          <div className="text-white/60 font-mono">{currentUser?.email}</div>
          <div className="text-emerald-300 font-medium text-[11px] pt-1">
            • Enterprise Retainer Active
          </div>
        </div>
      </div>

      {/* Tax Invoices & Billing Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Your Tax Invoices & Receipts</h2>
          </div>
          <span className="text-xs text-white/40">Secure Australian Tax Invoices (GST Compliant)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {invoices.map(inv => (
            <div
              key={inv.id}
              className="backdrop-blur-xl bg-white/[0.03] border border-white/10 hover:border-white/20 p-6 rounded-3xl shadow-lg transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-indigo-300 block">
                      {inv.invoiceNumber}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-0.5">{inv.companyName}</h3>
                  </div>
                  {inv.status === 'paid' ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Paid & Cleared
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due Now
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                  {inv.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-white/80">
                      <span>{item.description}</span>
                      <span className="font-mono font-semibold">${item.amount.toLocaleString()} AUD</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-white/40 text-[11px] pt-1 border-t border-white/5">
                    <span>GST (10%):</span>
                    <span className="font-mono">${inv.tax.toLocaleString()} AUD</span>
                  </div>
                  <div className="flex justify-between font-bold text-white text-sm pt-1">
                    <span>Total:</span>
                    <span className="font-mono text-emerald-300">${inv.total.toLocaleString()} AUD</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {inv.status !== 'paid' ? (
                  <button
                    onClick={() => handlePay(inv)}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 border border-white/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{isProcessing ? 'Processing Payment...' : `Pay $${inv.total.toLocaleString()} AUD Online`}</span>
                  </button>
                ) : (
                  <div className="w-full py-2 rounded-2xl bg-white/5 border border-white/10 text-center text-xs font-semibold text-white/50 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Payment Succeeded on {new Date(inv.issuedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Strategy Sessions */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Scheduled Executive Appointments</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.slice(0, 2).map(apt => (
            <div
              key={apt.id}
              className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-5 rounded-3xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{apt.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {apt.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-white/60 space-y-1">
                <div>Date & Time: {new Date(apt.startTime).toLocaleString()}</div>
                <div>Format: Google Meet & Telco Bridge</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
