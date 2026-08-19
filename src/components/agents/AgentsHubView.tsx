import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { AgentConfig, ChannelType, CustomVoice } from '../../types/index.ts';
import {
  Bot,
  Settings2,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  ShieldAlert,
  Cpu,
  Save,
  Play,
  Pause,
  X,
  Sliders,
  BookOpen,
  Mic,
  Volume2,
  AudioLines
} from 'lucide-react';

const AVAILABLE_TOOLS = [
  { id: 'search_knowledge_base', label: 'Knowledge Base Semantic Search (RAG)', desc: 'Answers questions using tenant factual docs' },
  { id: 'get_availability', label: 'Calendar Real-Time Availability Engine', desc: 'Queries open appointment slots in staff calendars' },
  { id: 'create_booking', label: 'Autonomous Meeting Confirmation & Scheduling', desc: 'Directly reserves calendar slot & sends invites' },
  { id: 'update_lead_status', label: 'CRM Pipeline Status & Note Writer', desc: 'Updates pipeline stages based on conversational intent' },
  { id: 'send_email', label: 'Omnichannel Email Dispatcher', desc: 'Dispatches personalized email sequences' },
  { id: 'send_sms', label: 'Two-Way SMS Communicator', desc: 'Sends responsive SMS messages with links' },
  { id: 'enrich_company_profile', label: 'Public Web Research & Tech Stack Scraper', desc: 'Scrapes domain data and executive titles' },
  { id: 'escalate_to_human', label: 'Human Operator Escalation Trigger', desc: 'Transfers call or inbox thread to human team' }
];

export const AgentsHubView: React.FC = () => {
  const { activeTenant, addToast } = useTenant();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Voice speech test player state
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Sandbox testing state
  const [testPrompt, setTestPrompt] = useState('Hi, I am interested in your services. Can you book me a discovery call tomorrow afternoon?');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testToolOutput, setTestToolOutput] = useState<any[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadAgents();
  }, [activeTenant]);

  const loadAgents = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [agentData, voiceData] = await Promise.all([
        api.getAgents(),
        api.getCustomVoices()
      ]);
      setAgents(agentData);
      setCustomVoices(voiceData);
      if (agentData.length > 0 && !selectedAgent) {
        setSelectedAgent(agentData[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgent = async (agentToSave: AgentConfig) => {
    try {
      const updated = await api.updateAgent(agentToSave.id, agentToSave);
      setAgents(prev => prev.map(a => (a.id === updated.id ? updated : a)));
      setSelectedAgent(updated);
      addToast({
        type: 'success',
        title: 'Agent Configuration Saved',
        message: `${updated.name} updated and deployed across active channels.`
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Save Failed' });
    }
  };

  const toggleTool = (toolId: string) => {
    if (!selectedAgent) return;
    const current = selectedAgent.enabledTools || [];
    const updatedTools = current.includes(toolId)
      ? current.filter(t => t !== toolId)
      : [...current, toolId];

    setSelectedAgent({ ...selectedAgent, enabledTools: updatedTools });
  };

  const handleSelectVoice = (voiceId: string) => {
    if (!selectedAgent) return;
    const voice = customVoices.find(v => v.id === voiceId);
    if (!voice) return;

    setSelectedAgent({
      ...selectedAgent,
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
        greetingScript: selectedAgent.voiceConfig?.greetingScript || voice.sampleScript || `G'day! This is ${selectedAgent.name} calling from Business HUB.`
      }
    });
  };

  const handleTestVoiceAudio = () => {
    if (!selectedAgent || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      addToast({
        type: 'info',
        title: 'Speech Player',
        message: 'Synthesizing voice playback test.'
      });
      return;
    }

    const textToSpeak = selectedAgent.voiceConfig?.greetingScript || `G'day! This is ${selectedAgent.name} with your custom voice profile configured.`;

    window.speechSynthesis.cancel();
    setIsPlayingVoice(true);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = selectedAgent.voiceConfig?.speed || 1.0;
    utterance.pitch = selectedAgent.voiceConfig?.pitch || 1.0;

    const availableVoices = window.speechSynthesis.getVoices();
    const isFemale = selectedAgent.voiceConfig?.gender === 'female';
    const isMale = selectedAgent.voiceConfig?.gender === 'male';

    let matchedVoice = availableVoices.find(v => {
      const matchLang = v.lang.toLowerCase().includes('en-au') || v.lang.toLowerCase().includes('en');
      if (isFemale) return matchLang && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('karen') || v.name.toLowerCase().includes('samantha'));
      if (isMale) return matchLang && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('alex'));
      return matchLang;
    }) || availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoiceAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    }
  };

  const handleRunSandboxTest = async () => {
    if (!selectedAgent || !testPrompt.trim()) return;
    setIsTesting(true);
    setTestResponse(null);
    setTestToolOutput(null);

    try {
      const conv = await api.createConversation({
        leadId: '',
        channel: selectedAgent.allowedChannels[0] || 'email',
        subject: 'Sandbox Test Execution'
      });

      const replyRes = await api.sendMessage(conv.id, testPrompt, 'lead');
      setTestResponse(replyRes.aiMessage.content);
      setTestToolOutput(replyRes.aiMessage.toolCallsExecuted || []);

      addToast({
        type: 'info',
        title: 'Sandbox Simulation Complete',
        message: `Agent responded with intent "${replyRes.aiMessage.intent}"`
      });
    } catch (err: any) {
      setTestResponse('Error in sandbox execution.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              AI Agent Fleet & Orchestrator Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Configure autonomous agents, persona instructions, objection playbooks, multi-channel permissions, and controlled tool execution policies.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Agent Selector + Right Config & Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Agent List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Active Agent Fleet ({agents.length})
          </div>

          <div className="space-y-2.5">
            {agents.map(agent => {
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-xs text-slate-100 flex items-center gap-2">
                      <span>{agent.name}</span>
                    </div>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold font-mono ${
                        agent.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {agent.active ? 'Online' : 'Paused'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {agent.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="capitalize font-medium text-slate-300">Model: {agent.model}</span>
                    <div className="flex items-center gap-1.5">
                      {agent.allowedChannels.map(ch => (
                        <span key={ch} className="px-1.5 py-0.5 rounded bg-slate-800 uppercase font-mono text-[9px] text-slate-400">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Selected Agent Editor & Sandbox */}
        {selectedAgent && (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {/* Header / Meta */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-100">{selectedAgent.name}</h2>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                    {selectedAgent.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAgent.description}</p>
              </div>

              <button
                onClick={() => handleSaveAgent(selectedAgent)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Agent</span>
              </button>
            </div>

            {/* Prompt Instruction */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Core System Persona & Behavioral Directives
              </label>
              <textarea
                rows={4}
                value={selectedAgent.promptInstruction}
                onChange={e => setSelectedAgent({ ...selectedAgent, promptInstruction: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* Personality & Tone Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tone & Communication Style</label>
                <input
                  type="text"
                  value={selectedAgent.tone}
                  onChange={e => setSelectedAgent({ ...selectedAgent, tone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Underlying AI Model</label>
                <input
                  type="text"
                  disabled
                  value={selectedAgent.model}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Custom Voice & Calling Speech Configuration */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-950 border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Agent Calling Voice Profile & Neural Tuning
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Select or clone a custom voice specifically assigned to {selectedAgent.name}.
                    </p>
                  </div>
                </div>

                {/* Voice Test Button */}
                <div className="flex items-center gap-2">
                  {isPlayingVoice ? (
                    <button
                      onClick={handleStopVoiceAudio}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm animate-pulse cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Stop Speaking
                    </button>
                  ) : (
                    <button
                      onClick={handleTestVoiceAudio}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Test Voice Audio
                    </button>
                  )}
                </div>
              </div>

              {/* Voice Selector Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Assigned Voice Profile
                  </label>
                  <select
                    value={selectedAgent.voiceConfig?.voiceId || customVoices[0]?.id || ''}
                    onChange={e => handleSelectVoice(e.target.value)}
                    className="w-full bg-slate-900 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  >
                    {customVoices.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.accent}) {v.isRecordedByMe ? '• [Custom Clone]' : '• [Neural Engine]'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Voice Provider & Engine
                  </label>
                  <div className="bg-slate-900/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono flex items-center justify-between">
                    <span>{selectedAgent.voiceConfig?.provider || 'Gemini Neural Audio'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {selectedAgent.voiceConfig?.accent || 'en-AU'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Speech Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] text-white/70 mb-1 font-medium">
                    <span>Speaking Speed</span>
                    <span className="font-mono text-indigo-300">{selectedAgent.voiceConfig?.speed || 1.0}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.35"
                    step="0.05"
                    value={selectedAgent.voiceConfig?.speed || 1.0}
                    onChange={e =>
                      setSelectedAgent({
                        ...selectedAgent,
                        voiceConfig: {
                          ...(selectedAgent.voiceConfig || {
                            voiceId: 'voice_exec_au',
                            voiceName: 'Alexander Sterling',
                            provider: 'custom_recorded',
                            gender: 'male',
                            accent: 'en-AU (Australian)'
                          }),
                          speed: parseFloat(e.target.value)
                        }
                      })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-white/70 mb-1 font-medium">
                    <span>Pitch Modulation</span>
                    <span className="font-mono text-indigo-300">{selectedAgent.voiceConfig?.pitch || 1.0}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={selectedAgent.voiceConfig?.pitch || 1.0}
                    onChange={e =>
                      setSelectedAgent({
                        ...selectedAgent,
                        voiceConfig: {
                          ...(selectedAgent.voiceConfig || {
                            voiceId: 'voice_exec_au',
                            voiceName: 'Alexander Sterling',
                            provider: 'custom_recorded',
                            gender: 'male',
                            accent: 'en-AU (Australian)'
                          }),
                          pitch: parseFloat(e.target.value)
                        }
                      })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-white/70 mb-1 font-medium">
                    <span>Voice Stability</span>
                    <span className="font-mono text-indigo-300">{selectedAgent.voiceConfig?.stability || 85}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    step="5"
                    value={selectedAgent.voiceConfig?.stability || 85}
                    onChange={e =>
                      setSelectedAgent({
                        ...selectedAgent,
                        voiceConfig: {
                          ...(selectedAgent.voiceConfig || {
                            voiceId: 'voice_exec_au',
                            voiceName: 'Alexander Sterling',
                            provider: 'custom_recorded',
                            gender: 'male',
                            accent: 'en-AU (Australian)'
                          }),
                          stability: parseInt(e.target.value)
                        }
                      })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Agent Greeting Script */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Custom Phone Greeting Script
                </label>
                <textarea
                  rows={2}
                  value={selectedAgent.voiceConfig?.greetingScript || ''}
                  onChange={e =>
                    setSelectedAgent({
                      ...selectedAgent,
                      voiceConfig: {
                        ...(selectedAgent.voiceConfig || {
                          voiceId: 'voice_exec_au',
                          voiceName: 'Alexander Sterling',
                          provider: 'custom_recorded',
                          gender: 'male',
                          accent: 'en-AU (Australian)'
                        }),
                        greetingScript: e.target.value
                      }
                    })
                  }
                  placeholder={`G'day! This is ${selectedAgent.name} calling from Business HUB...`}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Controlled Tool Permissions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Controlled Tool Execution Policies ({selectedAgent.enabledTools?.length || 0} Enabled)
                </label>
                <span className="text-[10px] text-slate-400">Strict Tenant Boundaries Enforced</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_TOOLS.map(tool => {
                  const isEnabled = (selectedAgent.enabledTools || []).includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isEnabled
                          ? 'bg-blue-950/30 border-blue-500/40 text-slate-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-xs text-slate-100">{tool.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tool.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Agent Sandbox Tester */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  Live Agent Sandbox & Tool Calling Simulation
                </span>
                <span className="text-[10px] font-mono text-slate-400">Gemini 3.7 Flash Backend</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPrompt}
                  onChange={e => setTestPrompt(e.target.value)}
                  placeholder="Enter message to test agent behavior..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleRunSandboxTest}
                  disabled={isTesting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  {isTesting ? 'Thinking...' : 'Test Turn'}
                </button>
              </div>

              {testResponse && (
                <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2 mt-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Agent Generated Response:</div>
                  <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">{testResponse}</p>

                  {testToolOutput && testToolOutput.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <div className="text-[10px] font-bold text-blue-400 uppercase">Tools Executed:</div>
                      <pre className="text-[10px] text-slate-300 font-mono bg-slate-950 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(testToolOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
