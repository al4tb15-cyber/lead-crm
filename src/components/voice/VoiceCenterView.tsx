import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { Lead, CallLog } from '../../types/index.ts';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Clock,
  Play,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileText,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

interface VoiceCenterViewProps {
  initialLead?: Lead | null;
}

export const VoiceCenterView: React.FC<VoiceCenterViewProps> = ({ initialLead }) => {
  const { activeTenant, addToast } = useTenant();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLead?.id || '');
  
  // Active Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<{ sender: 'agent' | 'user'; text: string; timestamp: string }[]>([]);
  const [currentUtterance, setCurrentUtterance] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioTtsEnabled, setAudioTtsEnabled] = useState(true);
  const [lastSummarizedCall, setLastSummarizedCall] = useState<CallLog | null>(null);

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  useEffect(() => {
    if (initialLead) {
      setSelectedLeadId(initialLead.id);
    }
  }, [initialLead]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const loadData = async () => {
    if (!activeTenant) return;
    try {
      const [l, c] = await Promise.all([api.getLeads(), api.getCalls()]);
      setLeads(l);
      setCallLogs(c);
      if (!selectedLeadId && l.length > 0) {
        setSelectedLeadId(l[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const speakText = (text: string) => {
    if (!audioTtsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Select Australian or natural English voice if present
    const voices = window.speechSynthesis.getVoices();
    const auVoice = voices.find(v => v.lang === 'en-AU' || v.lang.includes('AU')) || voices[0];
    if (auVoice) utterance.voice = auVoice;

    window.speechSynthesis.speak(utterance);
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast({
        type: 'info',
        title: 'Microphone Not Supported',
        message: 'Speech recognition API is unavailable in this browser; please use the text input below.'
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-AU';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          handleSendTurn(text);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const handleStartCall = async () => {
    const targetLead = leads.find(l => l.id === selectedLeadId);
    setIsCallActive(true);
    setTranscript([]);
    setLastSummarizedCall(null);

    // Initial greeting from AI voice agent
    const greeting = `G'day ${targetLead?.contactName || 'there'}! This is Sarah calling from ${activeTenant?.branding.companyName || 'Business HUB'}. I noticed your team at ${targetLead?.companyName || 'your practice'} is scaling operations, and wanted to see if you have 5 minutes to discuss automating your client intake. How are things running today?`;
    
    const initialTurn = { sender: 'agent' as const, text: greeting, timestamp: new Date().toISOString() };
    setTranscript([initialTurn]);
    speakText(greeting);

    addToast({
      type: 'info',
      title: 'AI Voice Station Connected',
      message: `Autonomous call initiated with ${targetLead?.contactName || 'Lead'}.`
    });
  };

  const handleSendTurn = async (utteranceToSend?: string) => {
    const text = utteranceToSend || currentUtterance;
    if (!text.trim() || isAiThinking) return;

    setCurrentUtterance('');
    const userTurn = { sender: 'user' as const, text, timestamp: new Date().toISOString() };
    const updatedHistory = [...transcript, userTurn];
    setTranscript(updatedHistory);

    setIsAiThinking(true);
    try {
      const res = await api.runVoiceTurn({
        utterance: text,
        leadId: selectedLeadId,
        history: updatedHistory
      });

      const agentTurn = { sender: 'agent' as const, text: res.response, timestamp: new Date().toISOString() };
      setTranscript([...updatedHistory, agentTurn]);
      speakText(res.response);

      if (res.actionTriggered) {
        addToast({
          type: 'success',
          title: 'Action Triggered During Call',
          message: `${res.actionTriggered.action}: ${JSON.stringify(res.actionTriggered.data || {})}`
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Voice turn failed', message: err.message });
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleEndCall = async () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsCallActive(false);

    if (transcript.length > 1) {
      setIsAiThinking(true);
      try {
        const summary = await api.summarizeCall({
          leadId: selectedLeadId,
          transcript
        });
        setLastSummarizedCall(summary);
        setCallLogs(prev => [summary, ...prev]);

        addToast({
          type: 'success',
          title: 'Post-Call Intelligence Generated',
          message: `Transcript summarized, sentiment scored (${summary.sentiment}), and CRM updated.`
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsAiThinking(false);
      }
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeLead = leads.find(l => l.id === selectedLeadId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              AI Voice Calling Station & Telephony Orchestrator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Autonomous 2-way phone calling agent capable of natural outbound qualification, inbound inquiry handling, live objection negotiation, calendar booking, and automatic CRM transcript sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioTtsEnabled(!audioTtsEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              audioTtsEnabled
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {audioTtsEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioTtsEnabled ? 'Voice Audio On' : 'Voice Audio Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Calling Stage: Left Interactive Phone Terminal + Right Call Logs & CRM Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Active Voice Console */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          {/* Target Lead Selector & Call Launcher */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Select Target CRM Lead to Call
              </label>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                Australian Telecommunications Compliant
              </span>
            </div>

            <div className="flex gap-2">
              <select
                disabled={isCallActive}
                value={selectedLeadId}
                onChange={e => setSelectedLeadId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.companyName} — {l.contactName} ({l.contactPhone || 'Direct Line'})
                  </option>
                ))}
              </select>

              {!isCallActive ? (
                <button
                  onClick={handleStartCall}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Initiate Call</span>
                </button>
              ) : (
                <button
                  onClick={handleEndCall}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Call Visualization Stage */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
            {isCallActive ? (
              <div className="w-full space-y-4 text-center">
                {/* Pulse Visualizer */}
                <div className="relative flex items-center justify-center my-3">
                  <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-emerald-400 opacity-20"></span>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 text-white">
                    <PhoneCall className="w-8 h-8 animate-bounce" />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-100">{activeLead?.contactName}</div>
                  <div className="text-xs text-slate-400">{activeLead?.companyName} • {activeLead?.contactPhone}</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Call In Progress: {formatSeconds(callDuration)}</span>
                  </div>
                </div>

                {/* Animated Waveform Bars */}
                <div className="flex items-center justify-center gap-1 h-8 pt-2">
                  {[40, 75, 95, 60, 30, 85, 100, 70, 45, 90, 65, 35].map((h, i) => (
                    <span
                      key={i}
                      className="w-1.5 bg-emerald-500 rounded-full transition-all duration-300 animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400">Station idle. Select a lead above and click "Initiate Call".</p>
                <p className="text-[10px] text-slate-400">Supports full live voice input via browser microphone & natural Australian TTS audio.</p>
              </div>
            )}
          </div>

          {/* Live Transcript Stream */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Turn-by-Turn Speech Transcript
              </span>
              {isAiThinking && (
                <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  AI Reasoning & Synthesizing Voice...
                </span>
              )}
            </div>

            <div className="h-56 bg-slate-950 border border-slate-800 rounded-xl p-3.5 overflow-y-auto space-y-3">
              {transcript.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                  Transcript will stream here once the call begins...
                </div>
              ) : (
                transcript.map((t, idx) => (
                  <div key={idx} className={`flex flex-col ${t.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mb-0.5">
                      {t.sender === 'agent' ? <Bot className="w-3 h-3 text-emerald-400" /> : <User className="w-3 h-3 text-blue-400" />}
                      <span>{t.sender === 'agent' ? 'AI Voice Agent' : activeLead?.contactName || 'Lead'}</span>
                    </div>
                    <div
                      className={`p-2.5 rounded-xl text-xs max-w-md ${
                        t.sender === 'agent'
                          ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-100 rounded-tl-none'
                          : 'bg-blue-950/50 border border-blue-500/30 text-blue-100 rounded-tr-none'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Operator Utterance Input & Microphone Controls */}
          {isCallActive && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startSpeechRecognition}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Speak via Microphone"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isListening ? 'Listening...' : 'Speak to AI'}</span>
                </button>

                <input
                  type="text"
                  placeholder="Or type prospect reply (e.g. 'Yes, I would like to book a demo next Tuesday')..."
                  value={currentUtterance}
                  onChange={e => setCurrentUtterance(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendTurn()}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={() => handleSendTurn()}
                  disabled={isAiThinking || !currentUtterance.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Post-Call Intelligence & Historic Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Post-Call Summary Card (If just completed) */}
          {lastSummarizedCall && (
            <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Post-Call Intelligence Generated
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  {lastSummarizedCall.sentiment}
                </span>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Executive Summary:</div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">{lastSummarizedCall.summary}</p>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Action Items & Next Steps:</div>
                <ul className="mt-1 space-y-1">
                  {lastSummarizedCall.actionItems.map((item, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-400">Duration: {formatSeconds(lastSummarizedCall.durationSeconds)}</span>
                <span className="text-blue-400 font-semibold">CRM Stage Updated to "Engaged"</span>
              </div>
            </div>
          )}

          {/* Call Logs Archive */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Call Recording & Log Archive
              </h3>
              <span className="text-[10px] font-mono text-slate-400">{callLogs.length} Records</span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {callLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">No call logs recorded yet.</div>
              ) : (
                callLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{log.contactName}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold font-mono ${
                          log.sentiment === 'positive'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {log.sentiment}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">{log.companyName}</div>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{log.summary}</p>

                    <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{new Date(log.timestamp).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{log.durationSeconds}s duration</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
