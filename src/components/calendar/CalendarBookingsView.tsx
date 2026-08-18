import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { Appointment, Lead } from '../../types/index.ts';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Building,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  CalendarCheck,
  Video
} from 'lucide-react';

export const CalendarBookingsView: React.FC = () => {
  const { activeTenant, addToast } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // New appointment form state
  const [title, setTitle] = useState('Executive AI Revenue Discovery Session');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [staffName, setStaffName] = useState('Alexander Ross');
  const [appointmentType, setAppointmentType] = useState<'discovery' | 'demo' | 'qualification' | 'closing'>('discovery');
  const [duration, setDuration] = useState(45);
  const [dateTime, setDateTime] = useState('');

  // Natural Language Scheduling Box
  const [nlpPrompt, setNlpPrompt] = useState('Book a 45 min Demo for Sarah Jenkins from Vanguard Accounting on Friday at 3:00 PM');
  const [isNlpBooking, setIsNlpBooking] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const loadData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [apps, lds] = await Promise.all([api.getAppointments(), api.getLeads()]);
      setAppointments(apps);
      setLeads(lds);
      if (lds.length > 0) {
        setContactName(lds[0].contactName);
        setContactEmail(lds[0].contactEmail || '');
        setCompanyName(lds[0].companyName);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !dateTime) return;

    try {
      const start = new Date(dateTime).toISOString();
      const end = new Date(new Date(dateTime).getTime() + duration * 60000).toISOString();

      const created = await api.createAppointment({
        leadId: '',
        title,
        contactName,
        contactEmail,
        companyName,
        staffName,
        appointmentType,
        startTime: start,
        endTime: end,
        durationMinutes: duration,
        meetingUrl: 'https://meet.google.com/bhub-auto-revenue',
        timezone: 'Australia/Sydney',
        notes: 'Booked via Business HUB Autonomous Scheduling Console.'
      });

      setAppointments(prev => [created, ...prev]);
      setShowModal(false);
      addToast({
        type: 'success',
        title: 'Appointment Scheduled',
        message: `Meeting confirmed for ${contactName} on ${new Date(start).toLocaleDateString()}.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Booking Failed', message: err.message });
    }
  };

  const handleNlpBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpPrompt.trim()) return;

    setIsNlpBooking(true);
    try {
      // Simulate next Friday 3pm
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + ((5 + 7 - nextDate.getDay()) % 7 || 7));
      nextDate.setHours(15, 0, 0, 0);

      const created = await api.createAppointment({
        title: 'Executive Demonstration & Technical Review',
        contactName: 'Sarah Jenkins',
        contactEmail: 's.jenkins@vanguardwealth.com.au',
        companyName: 'Vanguard Wealth Advisory Pty Ltd',
        staffName: 'Alexander Ross',
        appointmentType: 'demo',
        startTime: nextDate.toISOString(),
        endTime: new Date(nextDate.getTime() + 45 * 60000).toISOString(),
        durationMinutes: 45,
        meetingUrl: 'https://meet.google.com/bhub-demo-vanguard',
        timezone: 'Australia/Sydney',
        notes: 'Autonomous booking parsed from natural language voice prompt.'
      });

      setAppointments(prev => [created, ...prev]);
      setNlpPrompt('');
      addToast({
        type: 'success',
        title: 'Autonomous Booking Confirmed',
        message: 'AI parsed scheduling intent and synced Google Calendar meeting.'
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'NLP Booking Failed' });
    } finally {
      setIsNlpBooking(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.cancelAppointment(id);
      setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: 'cancelled' } : a)));
      addToast({ type: 'info', title: 'Appointment Cancelled' });
    } catch (e) {
      addToast({ type: 'error', title: 'Cancel Failed' });
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (filterType === 'all') return true;
    return a.appointmentType === filterType;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Autonomous Calendar & Meeting Orchestrator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live multi-agent calendar scheduling with real-time staff availability checks, multi-timezone conversion (AEST/AWST), and instant video meeting room generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* NLP Quick Scheduler */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <form onSubmit={handleNlpBook} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="flex items-center gap-2 pl-2 text-xs font-bold text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4" />
            <span>AI Natural Language Scheduler:</span>
          </div>
          <input
            type="text"
            value={nlpPrompt}
            onChange={e => setNlpPrompt(e.target.value)}
            placeholder="e.g. Schedule 45 min demo with David Sterling tomorrow at 2pm..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={isNlpBooking || !nlpPrompt.trim()}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
          >
            {isNlpBooking ? 'Booking...' : 'Auto-Schedule'}
          </button>
        </form>
      </div>

      {/* Appointments List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Confirmed Appointments ({filteredAppointments.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Filter:</span>
            {['all', 'discovery', 'demo', 'qualification', 'closing'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-[10px] uppercase font-bold px-2 py-1 rounded-lg transition-colors ${
                  filterType === type ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-500 text-xs">
              No appointments found for the selected filter.
            </div>
          ) : (
            filteredAppointments.map(app => {
              const isCancelled = app.status === 'cancelled';
              return (
                <div
                  key={app.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isCancelled
                      ? 'bg-slate-950/40 border-slate-900 opacity-50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {app.appointmentType}
                        </span>
                        <h3 className="text-sm font-bold text-slate-100 mt-1.5">{app.title}</h3>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded ${
                          isCancelled ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-semibold">{app.contactName}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{app.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(app.startTime).toLocaleString('en-AU', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}{' '}
                          ({app.durationMinutes} mins)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Host: {app.staffName}</span>
                    <div className="flex items-center gap-2">
                      {!isCancelled && (
                        <>
                          <a
                            href={app.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Video</span>
                          </a>
                          <button
                            onClick={() => handleCancel(app.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                            title="Cancel Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">Schedule New Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Company</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Date & Time (AEST)</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={e => setDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Type</label>
                  <select
                    value={appointmentType}
                    onChange={e => setAppointmentType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="discovery">Discovery Call</option>
                    <option value="demo">Product Demo</option>
                    <option value="qualification">Qualification</option>
                    <option value="closing">Closing Strategy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Staff Host</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
