import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { Lead, LeadStatus } from '../../types/index.ts';
import confetti from 'canvas-confetti';
import { BulkExportModal } from './BulkExportModal.tsx';
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Calendar,
  Building,
  User,
  Star,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
  Bot,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  GripVertical,
  SlidersHorizontal,
  DollarSign,
  Send,
  Receipt,
  CreditCard,
  RotateCcw,
  Download,
  ShieldCheck,
  FileSpreadsheet,
  Hash
} from 'lucide-react';

const PIPELINE_STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'New / Discovered', color: 'border-white/10 bg-white/[0.03]' },
  { id: 'researching', label: 'Researching', color: 'border-blue-500/20 bg-blue-500/10' },
  { id: 'qualified', label: 'AI Qualified', color: 'border-cyan-500/20 bg-cyan-500/10' },
  { id: 'contacted', label: 'Contacted', color: 'border-indigo-500/20 bg-indigo-500/10' },
  { id: 'engaged', label: 'Engaged', color: 'border-purple-500/20 bg-purple-500/10' },
  { id: 'booked', label: 'Booked on Cal', color: 'border-emerald-500/30 bg-emerald-500/15' },
  { id: 'won', label: 'Closed Won', color: 'border-amber-500/30 bg-amber-500/15' },
  { id: 'lost', label: 'Lost / Closed', color: 'border-rose-500/20 bg-rose-500/10' }
];

interface CrmViewProps {
  onStartVoiceCall?: (lead: Lead) => void;
  onOpenInboxForLead?: (lead: Lead) => void;
  onOpenPaymentModalForLead?: (lead: Lead) => void;
}

export const CrmView: React.FC<CrmViewProps> = ({ 
  onStartVoiceCall, 
  onOpenInboxForLead,
  onOpenPaymentModalForLead
}) => {
  const { activeTenant, addToast } = useTenant();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'newest' | 'name'>('score');

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showQuickInvoiceModal, setShowQuickInvoiceModal] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('4500');
  const [invoiceDesc, setInvoiceDesc] = useState('AI Revenue OS Retainer & Autonomous Voice Deployment');

  // Drag and Drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  // New Lead form state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('Director');
  const [newIndustry, setNewIndustry] = useState('Renewable Energy & Utilities');
  const [newValue, setNewValue] = useState('25000');

  useEffect(() => {
    loadLeads();
  }, [activeTenant]);

  const loadLeads = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await api.getLeads();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const currentLead = leads.find(l => l.id === leadId);
    if (!currentLead || currentLead.status === newStatus) return;

    // Optimistic UI update
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l)));
    if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);

    try {
      const updated = await api.updateLead(leadId, { status: newStatus });
      setLeads(prev => prev.map(l => (l.id === leadId ? updated : l)));
      if (selectedLead?.id === leadId) setSelectedLead(updated);

      if (newStatus === 'won') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        addToast({
          type: 'success',
          title: 'Deal Won & Closed!',
          message: `${updated.companyName} moved to Closed Won ($${updated.estimatedValue?.toLocaleString() || '0'} AUD).`
        });
      } else {
        const stageLabel = PIPELINE_STAGES.find(s => s.id === newStatus)?.label || newStatus;
        addToast({
          type: 'info',
          title: 'Pipeline Stage Updated',
          message: `${updated.companyName} transitioned to ${stageLabel}`
        });
      }
    } catch (e) {
      // Revert on failure
      setLeads(prev => prev.map(l => (l.id === leadId ? currentLead : l)));
      if (selectedLead?.id === leadId) setSelectedLead(currentLead);
      addToast({ type: 'error', title: 'Update Failed', message: 'Could not sync lead state.' });
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newContactName) return;

    try {
      const created = await api.createLead({
        companyName: newCompanyName,
        contactName: newContactName,
        contactEmail: newEmail,
        contactPhone: newPhone,
        jobTitle: newJobTitle,
        industry: newIndustry,
        estimatedValue: Number(newValue) || 15000,
        status: 'qualified',
        leadScore: 82,
        notes: ['Manually added to CRM pipeline. Autonomous outreach sequences queued.']
      });

      setLeads(prev => [created, ...prev]);
      setShowNewLeadModal(false);
      setNewCompanyName('');
      setNewContactName('');
      setNewEmail('');
      setNewPhone('');

      addToast({
        type: 'success',
        title: 'Lead Created',
        message: `${created.companyName} (${created.contactName}) saved to CRM.`
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to create lead' });
    }
  };

  const handleQuickIssueInvoice = async (lead: Lead) => {
    try {
      const result = await api.createInvoice({
        leadId: lead.id,
        clientName: lead.contactName,
        clientEmail: lead.contactEmail || 'client@portal.businesshub.app',
        companyName: lead.companyName,
        amount: Number(invoiceAmount) || 4500,
        description: invoiceDesc,
        currency: 'AUD'
      });

      addToast({
        type: 'success',
        title: 'Tax Invoice & Payment Link Dispatched',
        message: `Invoice ${result.invoice.invoiceNumber} for $${result.invoice.total.toLocaleString()} AUD sent to ${lead.contactEmail}.`
      });

      setShowQuickInvoiceModal(false);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Invoice Creation Failed', message: err.message });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to remove this lead record?')) return;
    try {
      await api.deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
      addToast({ type: 'info', title: 'Lead Removed' });
    } catch (e) {
      addToast({ type: 'error', title: 'Delete Failed' });
    }
  };

  // Distinct industries for filter dropdown
  const uniqueIndustries = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.industry) set.add(l.industry);
    });
    return Array.from(set);
  }, [leads]);

  // Filter & Search Logic
  const filteredLeads = useMemo(() => {
    return leads
      .filter(lead => {
        // Search across name, company, email, phone, job title, industry
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCompany = lead.companyName.toLowerCase().includes(q);
          const matchContact = lead.contactName.toLowerCase().includes(q);
          const matchEmail = (lead.contactEmail || '').toLowerCase().includes(q);
          const matchPhone = (lead.contactPhone || '').toLowerCase().includes(q);
          const matchJob = (lead.jobTitle || '').toLowerCase().includes(q);
          const matchIndustry = (lead.industry || '').toLowerCase().includes(q);
          if (!matchCompany && !matchContact && !matchEmail && !matchPhone && !matchJob && !matchIndustry) {
            return false;
          }
        }

        // Status Filter
        if (statusFilter !== 'all' && lead.status !== statusFilter) {
          return false;
        }

        // Industry Filter
        if (industryFilter !== 'all' && lead.industry !== industryFilter) {
          return false;
        }

        // Min Score Filter
        if (minScoreFilter > 0 && lead.leadScore < minScoreFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.leadScore - a.leadScore;
        if (sortBy === 'value') return (b.estimatedValue || 0) - (a.estimatedValue || 0);
        if (sortBy === 'name') return a.companyName.localeCompare(b.companyName);
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
      });
  }, [leads, searchQuery, statusFilter, industryFilter, minScoreFilter, sortBy]);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || industryFilter !== 'all' || minScoreFilter > 0;

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setIndustryFilter('all');
    setMinScoreFilter(0);
    setSortBy('score');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <span>CRM & Opportunity Pipeline</span>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                {filteredLeads.length} of {leads.length} Leads
              </span>
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Autonomous account intelligence, lead qualification, multi-stage drag-and-drop pipeline, and instant payment dispatch.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* View Toggle */}
            <div className="flex rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
                }`}
              >
                Table
              </button>
            </div>

            {/* Bulk Data Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-sm group"
              title="Export leads and activity reports in CSV or PDF format with SHA-256 integrity verification"
            >
              <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Export</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                CSV / PDF
              </span>
            </button>

            {/* Add Lead Button */}
            <button
              onClick={() => setShowNewLeadModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 border border-white/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-white/10">
          {/* Main Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, company, email, phone, title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl pl-10 pr-9 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full backdrop-blur-md bg-slate-900 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">All Stages ({leads.length})</option>
              {PIPELINE_STAGES.map(st => (
                <option key={st.id} value={st.id}>
                  {st.label} ({leads.filter(l => l.status === st.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <select
              value={industryFilter}
              onChange={e => setIndustryFilter(e.target.value)}
              className="w-full backdrop-blur-md bg-slate-900 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">All Industries</option>
              {uniqueIndustries.map(ind => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full backdrop-blur-md bg-slate-900 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="score">Sort: AI Score (High to Low)</option>
              <option value="value">Sort: Deal Value (High to Low)</option>
              <option value="newest">Sort: Newest Added</option>
              <option value="name">Sort: Company Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Quick Pills & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center flex-wrap gap-2 pt-2 text-xs text-white/60">
            <span className="text-white/40">Active Filters:</span>
            {searchQuery && (
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                Search: "{searchQuery}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                Stage: {PIPELINE_STAGES.find(s => s.id === statusFilter)?.label}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
              </span>
            )}
            {industryFilter !== 'all' && (
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                Industry: {industryFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setIndustryFilter('all')} />
              </span>
            )}
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Kanban Board View with Drag & Drop */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-x-auto pb-4">
          {PIPELINE_STAGES.filter(st => st.id !== 'lost').map(stage => {
            const stageLeads = filteredLeads.filter(l => l.status === stage.id);
            const stageValue = stageLeads.reduce((a, b) => a + (b.estimatedValue || 0), 0);
            const isStageHovered = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={e => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverStage !== stage.id) {
                    setDragOverStage(stage.id);
                  }
                }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    if (dragOverStage === stage.id) {
                      setDragOverStage(null);
                    }
                  }
                }}
                onDrop={e => {
                  e.preventDefault();
                  const droppedId = e.dataTransfer.getData('text/plain') || draggedLeadId;
                  setDragOverStage(null);
                  setDraggedLeadId(null);
                  if (droppedId) {
                    handleStatusChange(droppedId, stage.id);
                  }
                }}
                className={`flex flex-col rounded-3xl p-4 transition-all duration-200 min-h-[500px] border backdrop-blur-xl ${
                  isStageHovered
                    ? 'ring-4 ring-indigo-500/20 border-indigo-400/80 bg-indigo-500/[0.08] shadow-2xl scale-[1.01]'
                    : stage.color
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white uppercase tracking-wider">
                      {stage.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/70">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-white/50">
                    ${stageValue > 0 ? (stageValue / 1000).toFixed(0) + 'k' : '$0'}
                  </span>
                </div>

                {/* Drop Indicator placeholder when dragging over empty column */}
                {isStageHovered && stageLeads.length === 0 && (
                  <div className="border-2 border-dashed border-indigo-400/60 rounded-2xl p-6 text-center text-xs text-indigo-300 font-semibold my-2 bg-indigo-500/10 animate-pulse">
                    Drop Lead Here
                  </div>
                )}

                {/* Lead Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {stageLeads.map(lead => {
                    const isDragging = draggedLeadId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('text/plain', lead.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedLeadId(lead.id);
                        }}
                        onDragEnd={() => {
                          setDraggedLeadId(null);
                          setDragOverStage(null);
                        }}
                        onClick={() => setSelectedLead(lead)}
                        className={`group relative p-4 rounded-2xl backdrop-blur-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all shadow-md cursor-grab active:cursor-grabbing ${
                          isDragging ? 'opacity-35 scale-95 border-indigo-400 ring-2 ring-indigo-400/50' : ''
                        }`}
                      >
                        {/* Drag Handle & Score */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors -ml-1" />
                            <h4 className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                              {lead.companyName}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono border border-emerald-500/30 shrink-0">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{lead.leadScore}</span>
                          </div>
                        </div>

                        {/* Contact Person */}
                        <div className="flex items-center gap-1.5 text-[11px] text-white/70 mb-2">
                          <User className="w-3 h-3 text-white/40" />
                          <span className="font-medium truncate">{lead.contactName}</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/50 text-[10px] truncate">{lead.jobTitle}</span>
                        </div>

                        {/* Industry and Value */}
                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                          <span className="text-white/40 truncate max-w-[120px] text-[10px]">
                            {lead.industry}
                          </span>
                          <span className="font-bold font-mono text-emerald-300 text-xs">
                            ${lead.estimatedValue?.toLocaleString() || '15,000'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && !isStageHovered && (
                    <div className="h-32 border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[11px] text-white/30">
                      No leads in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-bold text-white/50 tracking-wider">
                <tr>
                  <th className="p-4">Company & Contact</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">AI Score</th>
                  <th className="p-4">Est. Deal Value</th>
                  <th className="p-4">Industry</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {lead.companyName}
                      </div>
                      <div className="text-white/50 text-[11px] flex items-center gap-2 mt-0.5">
                        <span>{lead.contactName}</span>
                        <span>•</span>
                        <span>{lead.jobTitle}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/15">
                        {PIPELINE_STAGES.find(s => s.id === lead.status)?.label || lead.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 font-mono font-bold text-emerald-300">
                        <Sparkles className="w-3 h-3" />
                        {lead.leadScore}/100
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      ${lead.estimatedValue?.toLocaleString() || '15,000'} AUD
                    </td>
                    <td className="p-4 text-white/60">{lead.industry}</td>
                    <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {onStartVoiceCall && (
                          <button
                            onClick={() => onStartVoiceCall(lead)}
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors"
                            title="Call Lead"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowQuickInvoiceModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 transition-colors"
                          title="Generate Invoice & Payment Link"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Selected Lead */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl h-full backdrop-blur-2xl bg-slate-900/95 border-l border-white/15 p-8 overflow-y-auto shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {selectedLead.companyName}
                  </h2>
                  <p className="text-xs text-white/50 mt-1">{selectedLead.industry}</p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Selector & Value */}
              <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/10">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
                    Pipeline Stage
                  </label>
                  <select
                    value={selectedLead.status}
                    onChange={e => handleStatusChange(selectedLead.id, e.target.value as LeadStatus)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {PIPELINE_STAGES.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
                    Estimated Deal Value
                  </label>
                  <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
                    ${selectedLead.estimatedValue?.toLocaleString() || '25,000'} AUD
                  </div>
                </div>
              </div>

              {/* Primary Contact Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Primary Decision Maker
                </h3>
                <div className="p-5 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{selectedLead.contactName}</span>
                    <span className="text-white/50 font-medium">{selectedLead.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-4 text-white/60 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-white/80">{selectedLead.contactEmail || 'No email on file'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-white/80">{selectedLead.contactPhone || 'No phone on file'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Invoice Action Box */}
              <div className="p-5 rounded-2xl backdrop-blur-md bg-indigo-500/[0.07] border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-white">Payment Pipeline & Invoicing</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    Stripe & Direct Debit
                  </span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Issue an instant tax invoice with a secure checkout link dispatched directly to {selectedLead.contactName}'s email.
                </p>
                <button
                  onClick={() => setShowQuickInvoiceModal(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-md border border-white/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Generate Invoice & Payment Link</span>
                </button>
              </div>

              {/* Explainable Lead Score Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    AI Qualification Score Breakdown
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {selectedLead.leadScore}/100
                  </span>
                </div>

                <div className="space-y-2">
                  {(selectedLead.scoreBreakdown || []).map((sc, i) => (
                    <div key={i} className="p-3.5 rounded-xl backdrop-blur-md bg-white/[0.02] border border-white/10 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{sc.category}</span>
                        <span className="font-mono font-bold text-indigo-300">+{sc.points} pts</span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1">{sc.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Timeline & Notes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  Activity Timeline & Notes
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedLead.notes.map((note, idx) => (
                    <div key={idx} className="p-3 rounded-xl backdrop-blur-md bg-white/[0.02] border border-white/10 text-[11px] text-white/70 leading-relaxed">
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-5 border-t border-white/10 flex items-center gap-3">
              {onStartVoiceCall && (
                <button
                  onClick={() => {
                    const l = selectedLead;
                    setSelectedLead(null);
                    onStartVoiceCall(l);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 border border-white/20 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Launch Voice Call
                </button>
              )}
              {onOpenInboxForLead && (
                <button
                  onClick={() => {
                    const l = selectedLead;
                    setSelectedLead(null);
                    onOpenInboxForLead(l);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 border border-white/20 transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  Send AI Outreach
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Invoice Modal */}
      {showQuickInvoiceModal && selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Create & Send Tax Invoice</h2>
              </div>
              <button onClick={() => setShowQuickInvoiceModal(false)} className="text-white/40 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-white/50 font-semibold mb-1">Client Recipient</label>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium">
                  {selectedLead.contactName} ({selectedLead.contactEmail || 'client@portal.businesshub.app'})
                </div>
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Invoice Item Description</label>
                <input
                  type="text"
                  value={invoiceDesc}
                  onChange={e => setInvoiceDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Amount (AUD excl. GST)</label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={e => setInvoiceAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs space-y-1 text-white/70">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">${Number(invoiceAmount || 0).toLocaleString()} AUD</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (10%):</span>
                  <span className="font-mono">${(Number(invoiceAmount || 0) * 0.1).toLocaleString()} AUD</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10">
                  <span>Total Payable:</span>
                  <span className="font-mono text-emerald-300">${(Number(invoiceAmount || 0) * 1.1).toLocaleString()} AUD</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuickInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickIssueInvoice(selectedLead)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 border border-white/20 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invoice & Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg backdrop-blur-2xl bg-slate-900/95 border border-white/15 rounded-3xl p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white">Create New CRM Lead</h2>
              <button onClick={() => setShowNewLeadModal(false)} className="text-white/40 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/50 font-semibold mb-1.5">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Macquarie Wealth Partners Pty Ltd"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 font-semibold mb-1.5">Contact Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Sterling"
                    value={newContactName}
                    onChange={e => setNewContactName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-white/50 font-semibold mb-1.5">Job Title</label>
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={e => setNewJobTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 font-semibold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="david@macquariewealth.com.au"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-white/50 font-semibold mb-1.5">Phone (Mobile/Direct)</label>
                  <input
                    type="tel"
                    placeholder="+61 411 222 333"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 font-semibold mb-1.5">Industry</label>
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={e => setNewIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-white/50 font-semibold mb-1.5">Est. Deal Value (AUD)</label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 border border-white/20 transition-all cursor-pointer"
                >
                  Save Lead Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Data Export Modal with SHA-256 Cryptographic Digest */}
      <BulkExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        filteredLeads={filteredLeads}
        allLeads={leads}
        currentSearchQuery={searchQuery}
        currentStatusFilter={statusFilter}
        currentIndustryFilter={industryFilter}
        currentMinScoreFilter={minScoreFilter}
      />
    </div>
  );
};
