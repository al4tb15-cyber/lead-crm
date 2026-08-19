import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { CustomVoice, AgentConfig } from '../../types/index.ts';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  Trash2,
  Save,
  Bot,
  Sparkles,
  Sliders,
  Radio,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ChevronRight,
  Globe,
  Settings2,
  AudioLines,
  UserCheck,
  Zap,
  Layers,
  HelpCircle,
  Upload
} from 'lucide-react';

const PRESET_SCRIPTS = [
  {
    title: 'Australian Executive Pitch (B2B)',
    text: "G'day! This is Alexander from Business HUB. I noticed your firm is scaling up operations across Sydney and Melbourne, and wanted to share how our autonomous revenue workflows can save your team fifteen hours a week."
  },
  {
    title: 'Consultative Discovery & Qualification',
    text: "Good morning! Thanks for taking the time to speak today. I am reaching out to understand how your sales reps currently handle inbound lead qualification and appointment confirmations."
  },
  {
    title: 'Objection Handling & Value Demo',
    text: "I completely understand your timing concerns. Many managing directors we work with felt the same way until they saw our zero-latency Australian compliance engine in action. How does a 10-minute preview on Thursday sound?"
  },
  {
    title: 'Fast-Paced High Energy Closer',
    text: "Hey there! Great news—we've just opened up 5 VIP integration slots for Q3. If you have two minutes, I can walk you through the real-time pipeline telemetry right now!"
  }
];

const ACCENT_OPTIONS = [
  { id: 'en-AU (Sydney Executive)', label: '🇦🇺 Australian (Sydney Executive)', lang: 'en-AU' },
  { id: 'en-AU (Melbourne Professional)', label: '🇦🇺 Australian (Melbourne Professional)', lang: 'en-AU' },
  { id: 'en-US (American Neutral)', label: '🇺🇸 American Neutral', lang: 'en-US' },
  { id: 'en-GB (British RP)', label: '🇬🇧 British RP (Executive)', lang: 'en-GB' },
  { id: 'en-SG / en-IN (Global Business Neutral)', label: '🇸🇬 Singapore / APAC Business', lang: 'en-SG' },
  { id: 'en-IE / en-AU (Technical Neutral)', label: '🇮🇪 Irish-Australian (Technical)', lang: 'en-IE' },
  { id: 'en-NZ (New Zealand Friendly)', label: '🇳🇿 New Zealand Friendly', lang: 'en-NZ' },
  { id: 'en-CA (Canadian Neutral)', label: '🇨🇦 Canadian Neutral', lang: 'en-CA' }
];

export const VoiceStudioView: React.FC = () => {
  const { activeTenant, addToast } = useTenant();
  const [voices, setVoices] = useState<CustomVoice[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<CustomVoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Tab & Filter
  const [filterType, setFilterType] = useState<'all' | 'cloned' | 'neural'>('all');
  const [activeTab, setActiveTab] = useState<'tune' | 'record' | 'assign'>('tune');

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState<string>(PRESET_SCRIPTS[0].text);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<any>(null);

  // Test Synthesis State
  const [testPhrase, setTestPhrase] = useState<string>(
    "G'day! This is our custom AI voice engine. Ready to qualify leads and book appointments automatically."
  );
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // New Voice Modal / Form
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newVoiceForm, setNewVoiceForm] = useState<Partial<CustomVoice>>({
    name: 'My New Custom Voice',
    description: 'Custom recorded caller voice profile',
    gender: 'female',
    accent: 'en-AU (Sydney Executive)',
    language: 'English (Australian)',
    provider: 'custom_recorded',
    isRecordedByMe: true,
    sampleScript: PRESET_SCRIPTS[0].text,
    settings: {
      speed: 1.0,
      pitch: 1.0,
      stability: 85,
      similarityBoost: 90,
      styleExaggeration: 15,
      noiseReduction: true
    },
    labels: ['Custom Cloned', 'Calling']
  });

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const loadData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [vList, aList] = await Promise.all([
        api.getCustomVoices(),
        api.getAgents()
      ]);
      setVoices(vList);
      setAgents(aList);
      if (vList.length > 0 && !selectedVoice) {
        setSelectedVoice(vList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load voices:', err);
    } finally {
      setLoading(false);
    }
  };

  // Live Microphone Recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addToast({
          type: 'error',
          title: 'Microphone Unavailable',
          message: 'Browser media devices not supported or permission denied.'
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordedAudioUrl(null);

      // Start timer
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Start canvas audio visualizer
      startVisualizer(stream);

      addToast({
        type: 'info',
        title: 'Microphone Active',
        message: 'Please read the script out loud in your natural calling voice.'
      });
    } catch (err: any) {
      console.error('Recording start failed:', err);
      addToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'Could not access microphone. Please allow audio permissions in browser.'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      addToast({
        type: 'success',
        title: 'Voice Sample Captured',
        message: `Captured ${recordingSeconds}s of audio. Ready for neural clone synthesis!`
      });
    }
  };

  const startVisualizer = (stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#6366f1');
          gradient.addColorStop(1, '#a855f7');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.warn('Visualizer context error:', e);
    }
  };

  // Speech Synthesis Test Player
  const handlePlayVoicePreview = (voiceToTest: CustomVoice, customPhrase?: string) => {
    const textToSpeak = customPhrase || testPhrase || voiceToTest.sampleScript || 'Hello from Business HUB!';
    
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      addToast({
        type: 'error',
        title: 'TTS Not Supported',
        message: 'Your browser does not support native speech synthesis playback.'
      });
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlayingTest(true);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = voiceToTest.settings?.speed || 1.0;
    utterance.pitch = voiceToTest.settings?.pitch || 1.0;

    // Pick best system voice matching accent/gender
    const availableVoices = window.speechSynthesis.getVoices();
    const isFemale = voiceToTest.gender === 'female';
    const isMale = voiceToTest.gender === 'male';

    let matchedVoice = availableVoices.find(v => {
      const matchLang = v.lang.toLowerCase().includes('en-au') || v.lang.toLowerCase().includes('en');
      if (isFemale) return matchLang && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('karen') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('catherine'));
      if (isMale) return matchLang && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george') || v.name.toLowerCase().includes('alex'));
      return matchLang;
    }) || availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      setIsPlayingTest(false);
    };

    utterance.onerror = () => {
      setIsPlayingTest(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoicePreview = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingTest(false);
    }
  };

  // Save Voice Updates
  const handleSaveSelectedVoice = async () => {
    if (!selectedVoice) return;
    try {
      const updated = await api.updateCustomVoice(selectedVoice.id, selectedVoice);
      setVoices(prev => prev.map(v => (v.id === updated.id ? updated : v)));
      setSelectedVoice(updated);
      addToast({
        type: 'success',
        title: 'Voice Profile Saved',
        message: `"${updated.name}" updated with latest neural tuning parameters.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err?.message || 'Could not update custom voice profile.'
      });
    }
  };

  // Create New Voice
  const handleCreateVoice = async () => {
    if (!newVoiceForm.name) {
      addToast({ type: 'error', title: 'Name Required', message: 'Please give your voice a title.' });
      return;
    }

    setIsSynthesizing(true);
    try {
      const created = await api.createCustomVoice({
        ...newVoiceForm,
        sampleAudioUrl: recordedAudioUrl || 'data:audio/wav;base64,sample_captured'
      });
      setVoices(prev => [created, ...prev]);
      setSelectedVoice(created);
      setIsCreatingNew(false);
      setRecordedAudioUrl(null);
      addToast({
        type: 'success',
        title: 'Custom Voice Cloned & Ready!',
        message: `"${created.name}" is now available to be assigned to any AI agent.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err?.message || 'Could not synthesize new voice profile.'
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Delete Voice
  const handleDeleteVoice = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete voice profile "${name}"?`)) return;
    try {
      await api.deleteCustomVoice(id);
      const remaining = voices.filter(v => v.id !== id);
      setVoices(remaining);
      if (selectedVoice?.id === id) {
        setSelectedVoice(remaining[0] || null);
      }
      addToast({
        type: 'info',
        title: 'Voice Deleted',
        message: `"${name}" removed from voice library.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err?.message });
    }
  };

  // Assign Voice to Agent
  const handleAssignVoiceToAgent = async (agentId: string, voice: CustomVoice) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      const updated = await api.updateAgent(agentId, {
        voiceConfig: {
          voiceId: voice.id,
          voiceName: voice.name,
          provider: voice.provider,
          gender: voice.gender,
          accent: voice.accent,
          speed: voice.settings?.speed || 1.0,
          pitch: voice.settings?.pitch || 1.0,
          stability: voice.settings?.stability || 85,
          similarityBoost: voice.settings?.similarityBoost || 90,
          greetingScript: agent.voiceConfig?.greetingScript || voice.sampleScript
        }
      });

      setAgents(prev => prev.map(a => (a.id === updated.id ? updated : a)));
      addToast({
        type: 'success',
        title: 'Agent Voice Updated',
        message: `Agent "${agent.name}" is now using voice "${voice.name}".`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Assignment Failed', message: err?.message });
    }
  };

  const filteredVoices = voices.filter(v => {
    if (filterType === 'cloned') return v.isRecordedByMe;
    if (filterType === 'neural') return !v.isRecordedByMe;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 p-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 shrink-0">
            <Mic className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">Custom Voice & Speech Studio</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Neural Clone Engine
              </span>
            </div>
            <p className="text-sm text-white/60 mt-0.5">
              Record your own voice, synthesize hyper-realistic AI caller personas, and assign unique voices to each autonomous agent.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsCreatingNew(true);
              setActiveTab('record');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 font-bold text-sm text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Clone New Voice
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <AudioLines className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{voices.length}</div>
            <div className="text-xs text-white/50">Total Voice Profiles</div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">
              {voices.filter(v => v.isRecordedByMe).length}
            </div>
            <div className="text-xs text-white/50">Custom Cloned Voices</div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{agents.length}</div>
            <div className="text-xs text-white/50">Active Calling Agents</div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">88ms</div>
            <div className="text-xs text-white/50">Edge Neural Latency</div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Voice Library Explorer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl flex flex-col h-[750px]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                <h2 className="font-bold text-sm text-white">Voice Library</h2>
              </div>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  All ({voices.length})
                </button>
                <button
                  onClick={() => setFilterType('cloned')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'cloned' ? 'bg-indigo-600 text-white font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  My Clones ({voices.filter(v => v.isRecordedByMe).length})
                </button>
                <button
                  onClick={() => setFilterType('neural')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'neural' ? 'bg-indigo-600 text-white font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  Neural ({voices.filter(v => !v.isRecordedByMe).length})
                </button>
              </div>
            </div>

            {/* Voice List */}
            <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
              {filteredVoices.map(voice => {
                const isSelected = selectedVoice?.id === voice.id;
                const assignedAgentsCount = agents.filter(a => a.voiceConfig?.voiceId === voice.id).length;

                return (
                  <div
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice);
                      setIsCreatingNew(false);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-900/60 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                          voice.isRecordedByMe
                            ? 'bg-gradient-to-tr from-rose-500 to-pink-600 shadow-sm shadow-rose-500/30'
                            : 'bg-gradient-to-tr from-indigo-500 to-purple-600'
                        }`}>
                          {voice.isRecordedByMe ? <Mic className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                              {voice.name}
                            </span>
                            {voice.isRecordedByMe && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Cloned
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/50 flex items-center gap-2 mt-0.5">
                            <span>{voice.accent}</span>
                            <span>•</span>
                            <span className="capitalize">{voice.gender}</span>
                            <span>•</span>
                            <span className="text-indigo-300 font-mono text-[11px]">{voice.settings?.speed}x</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Play Sample */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPlayingTest && selectedVoice?.id === voice.id) {
                            handleStopVoicePreview();
                          } else {
                            setSelectedVoice(voice);
                            handlePlayVoicePreview(voice);
                          }
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isPlayingTest && selectedVoice?.id === voice.id
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-white/10 hover:bg-indigo-600 text-white/80 hover:text-white'
                        }`}
                        title="Listen to sample audio"
                      >
                        {isPlayingTest && selectedVoice?.id === voice.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Assigned Agents Tag */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-white/60">
                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                        <span>
                          {assignedAgentsCount > 0
                            ? `Assigned to ${assignedAgentsCount} agent${assignedAgentsCount > 1 ? 's' : ''}`
                            : 'Unassigned (Available for any agent)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono uppercase">
                        {voice.provider.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Custom Voice Editor / Studio / Recorder */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl min-h-[750px] flex flex-col justify-between">
            
            {/* Top Tabs */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {isCreatingNew ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-rose-400" />
                      <h2 className="text-lg font-bold text-white">Record & Clone New Voice</h2>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-lg font-bold text-white">{selectedVoice?.name || 'Voice Configuration'}</h2>
                    </div>
                  )}
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setActiveTab('tune')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
                      activeTab === 'tune' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Voice Tuning
                  </button>
                  <button
                    onClick={() => setActiveTab('record')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
                      activeTab === 'record' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Record Sample
                  </button>
                  <button
                    onClick={() => setActiveTab('assign')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
                      activeTab === 'assign' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Assign to Agents
                  </button>
                </div>
              </div>

              {/* TAB 1: RECORD MY OWN VOICE */}
              {activeTab === 'record' && (
                <div className="pt-5 space-y-5 animate-fadeIn">
                  <div className="bg-slate-900/60 border border-rose-500/30 p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                        <h3 className="font-bold text-sm text-white">Live Microphone Voice Capture</h3>
                      </div>
                      {isRecording && (
                        <div className="text-xs font-mono font-bold text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                          RECORDING: {recordingSeconds}s
                        </div>
                      )}
                    </div>

                    {/* Audio Visualizer Canvas */}
                    <div className="bg-slate-950 rounded-xl p-2 border border-white/10 flex flex-col items-center justify-center h-28 overflow-hidden relative">
                      <canvas
                        ref={canvasRef}
                        width={480}
                        height={100}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {!isRecording && !recordedAudioUrl && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40 pointer-events-none">
                          Microphone idle. Click "Start Recording" to clone your voice.
                        </div>
                      )}
                    </div>

                    {/* Recording Action Buttons */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 font-extrabold text-sm text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Mic className="w-5 h-5" />
                          Start Voice Recording
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 font-extrabold text-sm text-white shadow-lg shadow-rose-600/40 transition-all animate-pulse cursor-pointer"
                        >
                          <MicOff className="w-5 h-5" />
                          Stop & Process Audio ({recordingSeconds}s)
                        </button>
                      )}

                      {recordedAudioUrl && (
                        <audio
                          src={recordedAudioUrl}
                          controls
                          className="h-10 rounded-lg bg-white/10"
                        />
                      )}
                    </div>
                  </div>

                  {/* Sample Reading Prompts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                        Recommended Reading Script (Select to Read)
                      </label>
                      <span className="text-[11px] text-white/40">Read clearly for 20-30 seconds</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_SCRIPTS.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedScript(s.text)}
                          className={`p-3 rounded-xl text-left border text-xs transition-all ${
                            selectedScript === s.text
                              ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                              : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="font-bold text-white text-[11px] mb-1">{s.title}</div>
                          <div className="text-[11px] text-white/60 line-clamp-2">"{s.text}"</div>
                        </button>
                      ))}
                    </div>

                    {/* Active Script Teleprompter */}
                    <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-white">
                      <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                        Live Prompter:
                      </div>
                      <p className="text-sm leading-relaxed text-white/90 font-medium">
                        "{selectedScript}"
                      </p>
                    </div>
                  </div>

                  {/* If Creating New Voice from Recording, show details form */}
                  {isCreatingNew && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                      <div>
                        <label className="text-xs font-semibold text-white/60 block mb-1">Voice Profile Name</label>
                        <input
                          type="text"
                          value={newVoiceForm.name || ''}
                          onChange={(e) => setNewVoiceForm({ ...newVoiceForm, name: e.target.value })}
                          className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Alexander Sterling (Founder Clone)"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-white/60 block mb-1">Accent & Accent Regionality</label>
                        <select
                          value={newVoiceForm.accent || 'en-AU (Sydney Executive)'}
                          onChange={(e) => setNewVoiceForm({ ...newVoiceForm, accent: e.target.value })}
                          className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                          {ACCENT_OPTIONS.map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VOICE TUNING & NEURAL CONTROLS */}
              {activeTab === 'tune' && selectedVoice && (
                <div className="pt-5 space-y-5 animate-fadeIn">
                  {/* Basic Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white/60 block mb-1">Voice Display Name</label>
                      <input
                        type="text"
                        value={selectedVoice.name}
                        onChange={(e) => setSelectedVoice({ ...selectedVoice, name: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/60 block mb-1">Accent & Dialect</label>
                      <select
                        value={selectedVoice.accent}
                        onChange={(e) => setSelectedVoice({ ...selectedVoice, accent: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        {ACCENT_OPTIONS.map(a => (
                          <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Neural Sliders Matrix */}
                  <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                        Speech Synthesis Parameters
                      </span>
                      <span className="text-xs text-white/40">Real-time Audio Calibration</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Speaking Speed */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-white/80 font-medium">Speaking Pace / Rate</span>
                          <span className="font-mono text-indigo-400 font-bold">{selectedVoice.settings?.speed}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.75"
                          max="1.35"
                          step="0.02"
                          value={selectedVoice.settings?.speed || 1.0}
                          onChange={(e) => setSelectedVoice({
                            ...selectedVoice,
                            settings: { ...selectedVoice.settings, speed: parseFloat(e.target.value) }
                          })}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/40 mt-1">
                          <span>0.75x (Deliberate)</span>
                          <span>1.0x (Standard)</span>
                          <span>1.35x (Fast)</span>
                        </div>
                      </div>

                      {/* Voice Pitch */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-white/80 font-medium">Pitch Modulation</span>
                          <span className="font-mono text-indigo-400 font-bold">{selectedVoice.settings?.pitch}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="1.2"
                          step="0.02"
                          value={selectedVoice.settings?.pitch || 1.0}
                          onChange={(e) => setSelectedVoice({
                            ...selectedVoice,
                            settings: { ...selectedVoice.settings, pitch: parseFloat(e.target.value) }
                          })}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/40 mt-1">
                          <span>Deep Baritone</span>
                          <span>Natural Tone</span>
                          <span>High Articulation</span>
                        </div>
                      </div>

                      {/* Neural Stability */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-white/80 font-medium">Voice Stability & Consistency</span>
                          <span className="font-mono text-indigo-400 font-bold">{selectedVoice.settings?.stability}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          step="1"
                          value={selectedVoice.settings?.stability || 85}
                          onChange={(e) => setSelectedVoice({
                            ...selectedVoice,
                            settings: { ...selectedVoice.settings, stability: parseInt(e.target.value) }
                          })}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/40 mt-1">
                          <span>Dynamic / Expressive</span>
                          <span>High Consistency (90%)</span>
                        </div>
                      </div>

                      {/* Similarity & Clarity Boost */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-white/80 font-medium">Clarity & Acoustic Similarity</span>
                          <span className="font-mono text-indigo-400 font-bold">{selectedVoice.settings?.similarityBoost}%</span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="100"
                          step="1"
                          value={selectedVoice.settings?.similarityBoost || 90}
                          onChange={(e) => setSelectedVoice({
                            ...selectedVoice,
                            settings: { ...selectedVoice.settings, similarityBoost: parseInt(e.target.value) }
                          })}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/40 mt-1">
                          <span>Broad Neutrality</span>
                          <span>Strict Persona Match</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Neural Provider Selector */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'gemini_neural', label: 'Gemini Neural Audio', desc: 'Sub-100ms conversational response' },
                      { id: 'custom_recorded', label: 'Custom Voice Clone', desc: 'Synthesized from recorded microphone' },
                      { id: 'elevenlabs_clone', label: 'ElevenLabs High-Fidelity', desc: 'Premium emotive modulation' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedVoice({ ...selectedVoice, provider: p.id as any })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedVoice.provider === p.id
                            ? 'bg-indigo-600/25 border-indigo-500 text-white'
                            : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="font-bold text-xs text-white">{p.label}</div>
                        <div className="text-[10px] text-white/50 mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ASSIGN VOICE TO EACH AGENT */}
              {activeTab === 'assign' && selectedVoice && (
                <div className="pt-5 space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-white flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        Assign "{selectedVoice.name}" to Autonomous Agents
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        Whenever the selected agent initiates or receives phone calls, it will speak with this exact voice.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 font-mono text-xs border border-indigo-500/30">
                      {selectedVoice.accent}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {agents.map(agent => {
                      const isUsingThisVoice = agent.voiceConfig?.voiceId === selectedVoice.id;

                      return (
                        <div
                          key={agent.id}
                          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                            isUsingThisVoice
                              ? 'bg-emerald-950/20 border-emerald-500/50'
                              : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isUsingThisVoice ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60'
                            }`}>
                              <Bot className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{agent.name}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/60 uppercase">
                                  {agent.type}
                                </span>
                              </div>
                              <div className="text-xs text-white/50 mt-0.5">
                                Current Voice:{' '}
                                <span className="text-indigo-300 font-medium">
                                  {agent.voiceConfig?.voiceName || 'Default System Voice'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isUsingThisVoice ? (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4" />
                                Active Voice
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAssignVoiceToAgent(agent.id, selectedVoice)}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-indigo-600 text-xs font-bold text-white transition-all hover:scale-105 cursor-pointer"
                              >
                                Set as Agent Voice
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Live Synthesis & Action Bar */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              {/* Test Speech Synthesizer Field */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
                <input
                  type="text"
                  value={testPhrase}
                  onChange={(e) => setTestPhrase(e.target.value)}
                  placeholder="Type any test phrase to hear this voice speak..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none px-2"
                />
                
                {isPlayingTest ? (
                  <button
                    onClick={handleStopVoicePreview}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => selectedVoice && handlePlayVoicePreview(selectedVoice, testPhrase)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 hover:scale-105 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    Test Synthesis
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div>
                  {selectedVoice && !isCreatingNew && (
                    <button
                      onClick={() => handleDeleteVoice(selectedVoice.id, selectedVoice.name)}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Voice
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isCreatingNew ? (
                    <button
                      disabled={isSynthesizing}
                      onClick={handleCreateVoice}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-rose-500/25 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
                    >
                      {isSynthesizing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Synthesizing Neural Model...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Cloned Voice Profile
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveSelectedVoice}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Save Voice Configuration
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
