import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Building,
  CheckCircle2,
  X,
  ShieldCheck,
  Video
} from 'lucide-react';

interface PublicBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicBookingModal: React.FC<PublicBookingModalProps> = ({ isOpen, onClose }) => {
  const { activeTenant, addToast } = useTenant();
  const [step, setStep] = useState<'select' | 'form' | 'success'>('select');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Form info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const sampleSlots = [
    { label: 'Tomorrow, 10:00 AM AEST', iso: new Date(Date.now() + 86400000).toISOString() },
    { label: 'Tomorrow, 2:30 PM AEST', iso: new Date(Date.now() + 86400000 + 16200000).toISOString() },
    { label: 'Thursday, 11:00 AM AEST', iso: new Date(Date.now() + 172800000).toISOString() },
    { label: 'Friday, 3:00 PM AEST', iso: new Date(Date.now() + 259200000).toISOString() }
  ];

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      await api.createAppointment({
        title: `Discovery Consultation with ${name}`,
        contactName: name,
        contactEmail: email,
        companyName: company || 'Prospective Client',
        staffName: 'Alexander Ross',
        appointmentType: 'discovery',
        startTime: selectedSlot || new Date().toISOString(),
        endTime: new Date(Date.now() + 45 * 60000).toISOString(),
        durationMinutes: 45,
        meetingUrl: 'https://meet.google.com/bhub-consult-session',
        timezone: 'Australia/Sydney',
        notes
      });

      setStep('success');
      addToast({
        type: 'success',
        title: 'Meeting Confirmed',
        message: 'Google Meet invite & calendar sync dispatched to ' + email
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Booking Failed', message: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Brand Header */}
        <div
          className="p-6 text-white flex items-center justify-between"
          style={{ backgroundColor: activeTenant?.branding.primaryColor || '#2563EB' }}
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-85">
              {activeTenant?.branding.companyName || 'Business HUB'} Scheduling Portal
            </div>
            <h2 className="text-xl font-bold mt-0.5">30-Minute Revenue & AI Strategy Audit</h2>
            <div className="flex items-center gap-2 text-xs opacity-90 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>45 minutes • Google Meet Video Call • AEST (Sydney)</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 bg-slate-950 flex-1">
          {step === 'select' && (
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Select Available Date & Time Slot (Real-time Live Sync)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sampleSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot.iso);
                      setStep('form');
                    }}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-blue-500 hover:bg-slate-800/80 text-left transition-all group"
                  >
                    <div className="font-bold text-xs text-slate-200 group-hover:text-blue-400">
                      {slot.label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Confirmed Available</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleConfirmBooking} className="space-y-3 text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Your Contact Information
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Sterling"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="david@company.com.au"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Macquarie Advisory"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  What is your primary growth goal? (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. We want to automate our after-hours qualification calls..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="text-slate-400 hover:text-white text-xs font-semibold"
                >
                  ← Choose Different Time
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  Confirm & Schedule Meeting
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Appointment Confirmed!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                A calendar invitation with Google Meet video link has been dispatched to {email}.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
