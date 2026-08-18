import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import {
  Invoice,
  PaymentTransaction,
  EmailDispatchLog,
  SupportedCurrency,
  TaxJurisdiction
} from '../../types/index.ts';
import {
  CURRENCY_CONFIG,
  TAX_JURISDICTIONS,
  GLOBAL_LEGAL_TERMS,
  formatCurrency,
  calculateTaxAndTotal
} from '../../utils/currencyAndTax.ts';
import confetti from 'canvas-confetti';
import {
  DollarSign,
  Receipt,
  Mail,
  Send,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Plus,
  Search,
  Filter,
  X,
  FileText,
  Building2,
  Sparkles,
  ShieldCheck,
  Download,
  AlertCircle,
  Globe,
  Scale,
  Eye
} from 'lucide-react';

export const PaymentPipelineView: React.FC = () => {
  const { activeTenant, addToast } = useTenant();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [emails, setEmails] = useState<EmailDispatchLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  // Tab State
  const [activeTab, setActiveTab] = useState<'invoices' | 'transactions' | 'emails' | 'legal_terms'>('invoices');

  // Preview Invoice Details Modal State
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);

  // Checkout Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'pay_id'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('981');
  const [isProcessing, setIsProcessing] = useState(false);

  // New Invoice Modal State
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('4500');
  const [invoiceCurrency, setInvoiceCurrency] = useState<SupportedCurrency>('AUD');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<TaxJurisdiction>('AU_GST');
  const [taxIdInput, setTaxIdInput] = useState(TAX_JURISDICTIONS.AU_GST.defaultTaxId);
  const [legalTermsPreset, setLegalTermsPreset] = useState('Standard Global SaaS Master Services Agreement');
  const [isCrossBorderExempt, setIsCrossBorderExempt] = useState(false);
  const [itemDescription, setItemDescription] = useState('AI Revenue OS Autonomous Agent Fleet & Voice Engine');

  // Send Custom Email Modal State
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  useEffect(() => {
    loadBillingData();
  }, [activeTenant]);

  const loadBillingData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [invs, pays, ems] = await Promise.all([
        api.getInvoices(),
        api.getPayments(),
        api.getEmails()
      ]);
      setInvoices(invs);
      setPayments(pays);
      setEmails(ems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (curr: SupportedCurrency) => {
    setInvoiceCurrency(curr);
    const defaultJur = CURRENCY_CONFIG[curr]?.defaultJurisdiction || 'AU_GST';
    setSelectedJurisdiction(defaultJur);
    setTaxIdInput(TAX_JURISDICTIONS[defaultJur]?.defaultTaxId || '');
  };

  const handleJurisdictionChange = (jur: TaxJurisdiction) => {
    setSelectedJurisdiction(jur);
    setTaxIdInput(TAX_JURISDICTIONS[jur]?.defaultTaxId || '');
  };

  const taxCalculation = calculateTaxAndTotal(
    Number(invoiceAmount || 0),
    selectedJurisdiction,
    isCrossBorderExempt
  );

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !invoiceAmount) return;

    try {
      const result = await api.createInvoice({
        clientName,
        clientEmail,
        companyName: companyName || clientName + ' Pty Ltd',
        amount: Number(invoiceAmount),
        description: itemDescription,
        currency: invoiceCurrency,
        taxJurisdiction: selectedJurisdiction,
        taxRate: taxCalculation.taxRate,
        taxLabel: taxCalculation.taxLabel,
        taxIdOrVat: taxIdInput,
        legalTermsPreset
      });

      setInvoices(prev => [result.invoice, ...prev]);
      setEmails(prev => [result.emailLog, ...prev]);
      setShowCreateInvoiceModal(false);
      setClientName('');
      setClientEmail('');
      setCompanyName('');

      addToast({
        type: 'success',
        title: 'Global Tax Invoice Dispatched',
        message: `Invoice ${result.invoice.invoiceNumber} created in ${result.invoice.currency} and emailed to ${result.invoice.clientEmail} with ${result.invoice.taxLabel || 'GST/VAT'}.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Invoice Creation Failed', message: err.message });
    }
  };

  const handleProcessPayment = async () => {
    if (!payingInvoice) return;
    setIsProcessing(true);

    try {
      const result = await api.payInvoice(payingInvoice.id, {
        paymentMethod,
        payerName: payingInvoice.clientName,
        payerEmail: payingInvoice.clientEmail
      });

      setInvoices(prev => prev.map(inv => (inv.id === payingInvoice.id ? result.invoice : inv)));
      setPayments(prev => [result.transaction, ...prev]);
      setEmails(prev => [result.receiptEmail, ...prev]);
      setPayingInvoice(null);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      addToast({
        type: 'success',
        title: `Payment Succeeded (${formatCurrency(result.invoice.total, result.invoice.currency)})`,
        message: `Payment cleared. Tax receipt and legal invoice PDF dispatched to ${result.invoice.clientEmail}.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Payment Failed', message: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailSubject || !emailBody) return;

    try {
      const log = await api.sendEmail({
        toEmail: emailTo,
        toName: emailTo.split('@')[0],
        subject: emailSubject,
        bodyPreview: emailBody,
        category: 'quote_proposal'
      });

      setEmails(prev => [log, ...prev]);
      setShowSendEmailModal(false);
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');

      addToast({
        type: 'success',
        title: 'Email Dispatched',
        message: `Transactional email sent successfully to ${log.toEmail}.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Email Dispatch Failed', message: err.message });
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCurr = filterCurrency === 'all' || inv.currency === filterCurrency;
    return matchesSearch && matchesCurr;
  });

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const pendingTotal = invoices.filter(i => i.status !== 'paid').reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto text-white font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Global Multi-Currency Payment Pipeline & Tax Invoicing
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Full-lifecycle billing: Multi-currency (AUD, USD, EUR, GBP, SGD, CAD, NZD, JPY), dynamic tax compliance (GST, VAT, US Sales Tax), and legal terms for global clients.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => setShowSendEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>Send Email</span>
          </button>
          <button
            onClick={() => setShowCreateInvoiceModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 border border-white/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Global Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-white/40 text-xs font-semibold uppercase tracking-wider">
            <span>Total Invoices</span>
            <Receipt className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-4 text-3xl font-black text-white">{invoices.length}</div>
          <div className="mt-2 text-[11px] text-white/50">
            {invoices.filter(i => i.status === 'paid').length} settled • {invoices.filter(i => i.status !== 'paid').length} awaiting payment
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-white/40 text-xs font-semibold uppercase tracking-wider">
            <span>Total Settled (All Currencies)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4 text-3xl font-black text-emerald-400">${totalCollected.toLocaleString()}</div>
          <div className="mt-2 text-[11px] text-emerald-400/80 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% tax receipted & verified
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-white/40 text-xs font-semibold uppercase tracking-wider">
            <span>Awaiting Settlement</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 text-3xl font-black text-amber-300">${pendingTotal.toLocaleString()}</div>
          <div className="mt-2 text-[11px] text-white/50">
            Automated email reminder sequence active
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-white/40 text-xs font-semibold uppercase tracking-wider">
            <span>Emails Dispatched</span>
            <Mail className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-4 text-3xl font-black text-purple-300">{emails.length}</div>
          <div className="mt-2 text-[11px] text-white/50">
            Invoices, payment links & tax receipts
          </div>
        </div>
      </div>

      {/* Tabs Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 p-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'invoices' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            Invoices & Payment Links ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'transactions' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            Transaction Receipts ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'emails' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            Transactional Emails ({emails.length})
          </button>
          <button
            onClick={() => setActiveTab('legal_terms')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'legal_terms' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Global Legal Terms</span>
          </button>
        </div>

        {/* Currency filter & Search */}
        {activeTab === 'invoices' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice or client..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />
            </div>
            <select
              value={filterCurrency}
              onChange={e => setFilterCurrency(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Currencies</option>
              {(Object.keys(CURRENCY_CONFIG) as SupportedCurrency[]).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: INVOICES LIST */}
      {activeTab === 'invoices' && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-bold text-white/50 tracking-wider">
                <tr>
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Client & Company</th>
                  <th className="p-4">Currency & Tax Jurisdiction</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Issued / Due</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-300">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{inv.companyName}</div>
                      <div className="text-white/50 text-[11px]">{inv.clientName} ({inv.clientEmail})</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span>{CURRENCY_CONFIG[inv.currency]?.flag || '🌐'}</span>
                        <span>{inv.currency}</span>
                      </div>
                      <div className="text-[10px] text-white/50 font-mono mt-0.5">
                        {inv.taxLabel || 'GST (10%)'} • {inv.taxIdOrVat || 'ABN 48 612 890 341'}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-white text-sm">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>
                    <td className="p-4">
                      {inv.status === 'paid' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          Awaiting Payment
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-white/50 text-[11px]">
                      <div>Issued: {new Date(inv.issuedDate).toLocaleDateString()}</div>
                      <div>Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewingInvoice(inv)}
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                          title="View Tax Invoice & Legal Terms"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay / Checkout</span>
                          </button>
                        )}
                        <a
                          href={inv.paymentLinkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                          title="Open Hosted Checkout"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS LIST */}
      {activeTab === 'transactions' && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-bold text-white/50 tracking-wider">
                <tr>
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Payer Details</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Amount Cleared</th>
                  <th className="p-4">Status & Timestamp</th>
                  <th className="p-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-4 font-mono font-bold text-purple-300">
                      {tx.id}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{tx.payerName}</div>
                      <div className="text-white/50 text-[11px]">{tx.payerEmail}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono capitalize">
                        {tx.paymentMethodType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(tx.amount, tx.currency as SupportedCurrency)}
                    </td>
                    <td className="p-4 text-white/50 text-[11px]">
                      <div className="flex items-center gap-1 text-emerald-400 font-semibold mb-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Succeeded
                      </div>
                      <div>{new Date(tx.timestamp).toLocaleString()}</div>
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={tx.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Tax Receipt PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONAL EMAILS */}
      {activeTab === 'emails' && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-bold text-white/50 tracking-wider">
                <tr>
                  <th className="p-4">Email ID</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Subject & Preview</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status & Dispatch Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {emails.map(em => (
                  <tr key={em.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-4 font-mono text-white/50">
                      {em.id}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{em.toName}</div>
                      <div className="text-white/50 text-[11px] font-mono">{em.toEmail}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-white truncate">{em.subject}</div>
                      <div className="text-white/50 text-[11px] truncate mt-0.5">{em.bodyPreview}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {em.category}
                      </span>
                    </td>
                    <td className="p-4 text-white/50 text-[11px]">
                      <div className="text-emerald-400 font-semibold flex items-center gap-1 mb-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        {em.status.toUpperCase()}
                      </div>
                      <div>{new Date(em.sentAt).toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL LEGAL TERMS & DISCLOSURES */}
      {activeTab === 'legal_terms' && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Global Legal Framework & Cross-Border Tax Treaties</h2>
              <p className="text-white/50">Compliance standards enforced across Australia, United States, United Kingdom, European Union, and Singapore.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(TAX_JURISDICTIONS).map(jur => (
              <div key={jur.code} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{jur.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                    {jur.label}
                  </span>
                </div>
                <div className="text-white/70 text-[11px]">
                  <span className="text-white/40">Tax Identifier: </span>
                  <span className="font-mono text-white">{jur.defaultTaxId}</span>
                </div>
                <div className="text-white/70 text-[11px]">
                  <span className="text-white/40">Governing Jurisdiction: </span>
                  <span className="text-white">{jur.governingLawRegion}</span>
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed border-t border-white/5 pt-2">
                  {jur.legalDisclaimer}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
            <h3 className="font-bold text-indigo-300 text-xs">Standard SaaS Master Services Agreement (MSA) Clauses:</h3>
            <pre className="text-[11px] text-white/70 font-mono whitespace-pre-wrap leading-relaxed">
              {GLOBAL_LEGAL_TERMS.saasMasterServices}
            </pre>
          </div>
        </div>
      )}

      {/* PREVIEW INVOICE & LEGAL TERMS MODAL */}
      {previewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Tax Invoice {previewingInvoice.invoiceNumber}</h2>
                  <span className="text-xs text-white/50">{previewingInvoice.companyName}</span>
                </div>
              </div>
              <button onClick={() => setPreviewingInvoice(null)} className="text-white/40 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-bold block mb-1">Issued To</span>
                <div className="font-bold text-white">{previewingInvoice.clientName}</div>
                <div className="text-white/60">{previewingInvoice.companyName}</div>
                <div className="text-white/40 font-mono">{previewingInvoice.clientEmail}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 uppercase font-bold block mb-1">Billing Details</span>
                <div className="font-mono text-emerald-300 font-bold">{previewingInvoice.currency} ({CURRENCY_CONFIG[previewingInvoice.currency]?.name})</div>
                <div className="text-white/60">Tax ID: {previewingInvoice.taxIdOrVat || 'ABN 48 612 890 341'}</div>
                <div className="text-white/40">Status: <span className="uppercase text-emerald-400 font-bold">{previewingInvoice.status}</span></div>
              </div>
            </div>

            <div className="border border-white/10 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase font-bold text-white/50">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {previewingInvoice.items.map(it => (
                    <tr key={it.id}>
                      <td className="p-3 text-white font-medium">{it.description}</td>
                      <td className="p-3 text-right text-white/70 font-mono">{it.quantity}</td>
                      <td className="p-3 text-right text-white/70 font-mono">{formatCurrency(it.unitPrice, previewingInvoice.currency)}</td>
                      <td className="p-3 text-right text-white font-bold font-mono">{formatCurrency(it.total, previewingInvoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-4 bg-white/[0.02] border-t border-white/10 space-y-1.5 text-xs text-right font-mono">
                <div className="flex justify-between">
                  <span className="text-white/50">Subtotal:</span>
                  <span className="text-white">{formatCurrency(previewingInvoice.subtotal, previewingInvoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">{previewingInvoice.taxLabel || 'Tax / GST'}:</span>
                  <span className="text-white">{formatCurrency(previewingInvoice.tax, previewingInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-emerald-300 pt-2 border-t border-white/10">
                  <span>Total Amount Payable:</span>
                  <span>{formatCurrency(previewingInvoice.total, previewingInvoice.currency)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-[10px] space-y-2 text-white/60">
              <div className="font-bold text-indigo-300 uppercase tracking-wider">Governing Terms & Cross-Border Compliance:</div>
              <p>{TAX_JURISDICTIONS[previewingInvoice.taxJurisdiction || 'AU_GST']?.legalDisclaimer || GLOBAL_LEGAL_TERMS.crossBorderExportDisclaimer}</p>
              <div className="text-[9px] text-white/40 font-mono">
                Prescribed by Business HUB Revenue Gateway • Domain: portal.businesshub.app
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewingInvoice(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL WITH MULTI-CURRENCY & TAX COMPLIANCE */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Generate Global Tax Invoice</h2>
                <p className="text-xs text-white/50">Multi-currency & dynamic tax jurisdiction engine</p>
              </div>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="text-white/40 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              {/* Currency & Tax Jurisdiction Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                <div>
                  <label className="block text-white/60 font-semibold mb-1">Billing Currency</label>
                  <select
                    value={invoiceCurrency}
                    onChange={e => handleCurrencyChange(e.target.value as SupportedCurrency)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white font-mono font-bold cursor-pointer"
                  >
                    {(Object.keys(CURRENCY_CONFIG) as SupportedCurrency[]).map(c => (
                      <option key={c} value={c}>
                        {CURRENCY_CONFIG[c].flag} {c} - {CURRENCY_CONFIG[c].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 font-semibold mb-1">Tax Jurisdiction</label>
                  <select
                    value={selectedJurisdiction}
                    onChange={e => handleJurisdictionChange(e.target.value as TaxJurisdiction)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-xs cursor-pointer"
                  >
                    {(Object.keys(TAX_JURISDICTIONS) as TaxJurisdiction[]).map(j => (
                      <option key={j} value={j}>
                        {TAX_JURISDICTIONS[j].name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Client Contact Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Sterling"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Company / Entity Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp LLC"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Client Email (Dispatches PDF link & receipt)</label>
                <input
                  type="email"
                  required
                  placeholder="david@acmecorp.com"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Tax ID / VAT / ABN</label>
                  <input
                    type="text"
                    value={taxIdInput}
                    onChange={e => setTaxIdInput(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Base Amount ({invoiceCurrency})</label>
                  <input
                    type="number"
                    required
                    value={invoiceAmount}
                    onChange={e => setInvoiceAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Service Description</label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={e => setItemDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              {/* Dynamic Tax Breakdown */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs space-y-1 text-white/70 font-mono">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(taxCalculation.subtotal, invoiceCurrency)}</span>
                </div>
                <div className="flex justify-between text-indigo-300">
                  <span>{taxCalculation.taxLabel}:</span>
                  <span>{formatCurrency(taxCalculation.tax, invoiceCurrency)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10 text-sm">
                  <span>Total Amount Due:</span>
                  <span className="text-emerald-300">{formatCurrency(taxCalculation.total, invoiceCurrency)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  Issue & Email Global Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Pay Tax Invoice {payingInvoice.invoiceNumber}</h2>
                <p className="text-xs text-white/50">{payingInvoice.companyName}</p>
              </div>
              <button onClick={() => setPayingInvoice(null)} className="text-white/40 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-white/50">Total Due:</span>
                <span className="text-base font-bold text-emerald-300">{formatCurrency(payingInvoice.total, payingInvoice.currency)}</span>
              </div>
              <div className="text-[10px] text-white/40 font-mono">
                {payingInvoice.taxLabel || 'GST/VAT'} • Dispatched to {payingInvoice.clientEmail}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-white/50 font-semibold">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'card' ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold' : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                  Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'apple_pay' ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold' : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  Apple Pay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_id')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'pay_id' ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold' : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <Building2 className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                  PayID / Wire
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-white/50 font-semibold mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/50 font-semibold mb-1">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-white/50 font-semibold mb-1">CVC</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={e => setCardCvc(e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 border border-white/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4" />
                <span>{isProcessing ? 'Processing...' : `Authorize & Pay ${formatCurrency(payingInvoice.total, payingInvoice.currency)}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND CUSTOM EMAIL MODAL */}
      {showSendEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white">Dispatch Transactional Email</h2>
              <button onClick={() => setShowSendEmailModal(false)} className="text-white/40 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSendCustomEmail} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/50 font-semibold mb-1">To Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="executive@clientcompany.com"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Enterprise AI Solution Proposal & Scope of Work"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Email Body Content</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Hi team, pleased to provide our proposal for autonomous revenue orchestration..."
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3.5 text-white leading-relaxed resize-none"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSendEmailModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Transactional Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
