import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { CloudApiConfig, AgenticBridgeConfig, CloudAiProvider } from '../../types/index.ts';
import {
  Cpu,
  Server,
  Key,
  Globe,
  Radio,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Activity,
  Sliders,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Bot,
  Terminal,
  Clock,
  Workflow
} from 'lucide-react';

const PROVIDER_METADATA: Record<CloudAiProvider, { name: string; defaultModel: string; color: string; badge: string; desc: string }> = {
  google_gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    color: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    badge: 'Gemini 2.5 Flash / Pro',
    desc: 'Ultra-low latency server-side reasoning, native function calling, live audio streaming, and search grounding.'
  },
  anthropic_claude: {
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-7-sonnet',
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    badge: 'Claude 3.7 Sonnet / Opus',
    desc: 'Extended thinking, computer use, complex contract synthesis, and multi-turn objection handling.'
  },
  openai_gpt: {
    name: 'OpenAI GPT',
    defaultModel: 'gpt-4o',
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    badge: 'GPT-4o / o3-mini',
    desc: 'Multimodal vision, structured JSON outputs, and fast general-purpose conversational agent turns.'
  },
  deepseek: {
    name: 'DeepSeek AI',
    defaultModel: 'deepseek-r1',
    color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
    badge: 'DeepSeek-R1 / V3',
    desc: 'Deep mathematical and logical reasoning chains for rigorous market qualification and financial audits.'
  },
  hermes_agent: {
    name: 'Nous Hermes Agentic Engine',
    defaultModel: 'Hermes-3-Llama-3.1-405B',
    color: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    badge: 'Hermes 3 Function Bridge',
    desc: 'Autonomous agent model specialized in deep tool-use execution, multi-agent steering, and open weights sovereignty.'
  },
  openclaw_swarm: {
    name: 'OpenClaw Autonomous Swarm',
    defaultModel: 'OpenClaw-Worker-v2',
    color: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    badge: 'OpenClaw Tool-Bus',
    desc: 'High-concurrency autonomous web crawler, stealth scraper, and distributed worker nodes.'
  },
  custom_endpoint: {
    name: 'Custom Self-Hosted / vLLM',
    defaultModel: 'vllm-custom-model',
    color: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
    badge: 'OpenAI Compatible REST',
    desc: 'Private VPC or on-premises GPU cluster for sovereign compliance and data residency.'
  }
};

interface CloudApiAndBridgeViewProps {
  onOpenBridgeWorkspace?: (bridgeId?: string) => void;
}

export const CloudApiAndBridgeView: React.FC<CloudApiAndBridgeViewProps> = ({
  onOpenBridgeWorkspace
}) => {
  const { activeTenant, addToast } = useTenant();
  const [cloudApis, setCloudApis] = useState<CloudApiConfig[]>([]);
  const [agentBridges, setAgentBridges] = useState<AgenticBridgeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  // New Cloud API Modal
  const [showAddApiModal, setShowAddApiModal] = useState(false);
  const [newProvider, setNewProvider] = useState<CloudAiProvider>('google_gemini');
  const [newModel, setNewModel] = useState('gemini-2.5-flash');
  const [newApiKey, setNewApiKey] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newTemperature, setNewTemperature] = useState(0.7);
  const [newMaxTokens, setNewMaxTokens] = useState(8192);

  // New Bridge Modal
  const [showAddBridgeModal, setShowAddBridgeModal] = useState(false);
  const [bridgeFramework, setBridgeFramework] = useState<'hermes' | 'openclaw' | 'langgraph' | 'crewai' | 'custom_agent'>('hermes');
  const [bridgeName, setBridgeName] = useState('Nous Hermes Function Calling Gateway');
  const [bridgeEndpoint, setBridgeEndpoint] = useState('https://hermes-agent.portal.businesshub.app/api/v2/agents/revenue-orchestrator');
  const [bridgeToken, setBridgeToken] = useState('');
  const [bridgeProtocol, setBridgeProtocol] = useState<'rest_webhook' | 'websocket_stream' | 'hermes_fc_protocol' | 'openclaw_tool_bus'>('hermes_fc_protocol');
  const [bridgeWorkers, setBridgeWorkers] = useState('6');

  useEffect(() => {
    loadData();
  }, [activeTenant]);

  const loadData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [apis, bridges] = await Promise.all([
        api.getCloudApis(),
        api.getAgentBridges()
      ]);
      setCloudApis(apis);
      setAgentBridges(bridges);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultApi = async (id: string) => {
    try {
      const updated = await api.updateCloudApi(id, { isDefault: true });
      setCloudApis(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
      addToast({
        type: 'success',
        title: 'Default Cloud Provider Updated',
        message: `${updated.provider.replace('_', ' ').toUpperCase()} (${updated.model}) is now primary for all onboarded agents.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  const handleTestApi = async (config: CloudApiConfig) => {
    setTestingId(config.id);
    try {
      const res = await api.testCloudApi({
        provider: config.provider,
        model: config.model,
        apiKey: config.apiKeyMasked
      });
      setCloudApis(prev => prev.map(c => c.id === config.id ? { ...c, lastPingMs: res.latencyMs } : c));
      addToast({
        type: 'success',
        title: 'Cloud API Verified',
        message: `${PROVIDER_METADATA[config.provider]?.name || config.provider} ping: ${res.latencyMs}ms. Status: 200 OK.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Test Failed', message: err.message });
    } finally {
      setTestingId(null);
    }
  };

  const handlePingBridge = async (bridge: AgenticBridgeConfig) => {
    setTestingId(bridge.id);
    try {
      const res = await api.pingAgentBridge(bridge.id);
      setAgentBridges(prev => prev.map(b => b.id === bridge.id ? { ...b, latencyMs: res.latencyMs, status: 'connected' } : b));
      addToast({
        type: 'success',
        title: 'Bridge Ping Successful',
        message: `${bridge.name} responded in ${res.latencyMs}ms over ${bridge.protocol.replace('_', ' ')}.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Ping Failed', message: err.message });
    } finally {
      setTestingId(null);
    }
  };

  const handleCreateCloudApi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createCloudApi({
        provider: newProvider,
        model: newModel,
        apiKeyMasked: newApiKey ? `${newApiKey.slice(0, 6)}...${newApiKey.slice(-4)}` : 'key_configured',
        baseUrl: newBaseUrl || undefined,
        temperature: newTemperature,
        maxTokens: newMaxTokens,
        isDefault: false
      });
      setCloudApis(prev => [...prev, created]);
      setShowAddApiModal(false);
      setNewApiKey('');
      addToast({
        type: 'success',
        title: 'Cloud API Added',
        message: `${PROVIDER_METADATA[newProvider]?.name} (${newModel}) is ready for routing.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to add API', message: err.message });
    }
  };

  const handleCreateBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAgentBridge({
        framework: bridgeFramework,
        name: bridgeName,
        endpointUrl: bridgeEndpoint,
        authTokenMasked: bridgeToken ? `${bridgeToken.slice(0, 8)}...` : 'sec_tok_live',
        protocol: bridgeProtocol,
        activeWorkers: Number(bridgeWorkers) || 4,
        description: `Autonomous ${bridgeFramework.toUpperCase()} bridge synchronizing agents with CRM & Voice pipelines.`
      });
      setAgentBridges(prev => [...prev, created]);
      setShowAddBridgeModal(false);
      setBridgeToken('');
      addToast({
        type: 'success',
        title: 'Agentic Bridge Connected',
        message: `${created.name} successfully registered.`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to create bridge', message: err.message });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Cloud API & Agentic Bridges</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Admin Gateway
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Manage underlying LLM cloud inference providers for onboarded agents and bridge external autonomous swarms (Hermes, OpenClaw, LangGraph).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddApiModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add Cloud API</span>
          </button>
          <button
            onClick={() => setShowAddBridgeModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 border border-white/20 transition-all cursor-pointer"
          >
            <Workflow className="w-4 h-4" />
            <span>Connect Agent Bridge</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CLOUD API INFERENCE PROVIDERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Cloud AI Inference Providers</h2>
          </div>
          <span className="text-xs text-white/40">Default provider routes orchestrator & conversational turns</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cloudApis.map(config => {
            const meta = PROVIDER_METADATA[config.provider] || PROVIDER_METADATA.google_gemini;
            const isTesting = testingId === config.id;

            return (
              <div
                key={config.id}
                className={`backdrop-blur-xl bg-white/[0.03] border p-5 rounded-3xl transition-all relative flex flex-col justify-between space-y-4 ${
                  config.isDefault ? 'border-indigo-400/80 ring-2 ring-indigo-500/20 bg-indigo-500/[0.04]' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.color}`}>
                      {meta.badge}
                    </span>
                    {config.isDefault ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Default Routing
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefaultApi(config.id)}
                        className="text-[10px] font-bold text-white/40 hover:text-white px-2 py-0.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Set Default
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-base mt-1">{meta.name}</h3>
                  <div className="font-mono text-xs text-indigo-300 font-semibold mt-0.5">{config.model}</div>
                  <p className="text-[11px] text-white/60 mt-2 leading-relaxed">{meta.desc}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/5 text-xs">
                  <div className="flex items-center justify-between text-white/50 text-[11px]">
                    <span>API Key:</span>
                    <span className="font-mono text-white/80">{config.apiKeyMasked}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/50 text-[11px]">
                    <span>Temp / Max Tokens:</span>
                    <span className="font-mono text-white/80">{config.temperature} / {config.maxTokens}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/50 text-[11px]">
                    <span>Latency Ping:</span>
                    <span className="font-mono font-bold text-emerald-300">{config.lastPingMs}ms</span>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleTestApi(config)}
                      disabled={isTesting}
                      className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[11px] font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Pinging...' : 'Verify Ping'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: AGENTIC BRIDGES (Hermes, OpenClaw, LangGraph) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Agentic Bridges (Hermes & OpenClaw)</h2>
          </div>
          <span className="text-xs text-white/40">Synchronized tool-bus & autonomous worker swarms</span>
        </div>

        <div className="space-y-4">
          {agentBridges.map(bridge => {
            const isPinging = testingId === bridge.id;

            return (
              <div
                key={bridge.id}
                className="backdrop-blur-xl bg-white/[0.03] border border-white/10 hover:border-white/20 p-6 rounded-3xl transition-all shadow-xl space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold text-white">{bridge.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {bridge.framework.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {bridge.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">{bridge.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-mono font-bold text-emerald-300">{bridge.latencyMs}ms latency</div>
                      <div className="text-[10px] text-white/40">{bridge.activeWorkers} active worker nodes</div>
                    </div>
                    {onOpenBridgeWorkspace && (
                      <button
                        onClick={() => onOpenBridgeWorkspace(bridge.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Work Inside Dashboard</span>
                      </button>
                    )}
                    <button
                      onClick={() => handlePingBridge(bridge)}
                      disabled={isPinging}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                      <span>{isPinging ? 'Pinging...' : 'Ping Bridge'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Bridge Endpoint</span>
                    <span className="font-mono text-white/80 text-[11px] truncate block">{bridge.endpointUrl}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Protocol / Auth</span>
                    <span className="font-mono text-indigo-300 text-[11px] block">{bridge.protocol} ({bridge.authTokenMasked})</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Subscribed Tool Bus</span>
                    <div className="flex flex-wrap gap-1">
                      {bridge.supportedTools.slice(0, 3).map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-white/70 text-[10px] font-mono">
                          {t}
                        </span>
                      ))}
                      {bridge.supportedTools.length > 3 && (
                        <span className="text-[10px] text-white/40">+{bridge.supportedTools.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: ADD CLOUD API */}
      {showAddApiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white">Configure Cloud AI Inference Provider</h2>
              <button onClick={() => setShowAddApiModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCloudApi} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/50 font-semibold mb-1">Provider Architecture</label>
                <select
                  value={newProvider}
                  onChange={e => {
                    const p = e.target.value as CloudAiProvider;
                    setNewProvider(p);
                    setNewModel(PROVIDER_METADATA[p]?.defaultModel || 'custom-model');
                  }}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="google_gemini">Google Gemini (Gemini 2.5 Flash / Pro)</option>
                  <option value="anthropic_claude">Anthropic Claude (Claude 3.7 Sonnet / Haiku)</option>
                  <option value="openai_gpt">OpenAI (GPT-4o / o3-mini)</option>
                  <option value="deepseek">DeepSeek (DeepSeek-R1 / V3)</option>
                  <option value="hermes_agent">Nous Hermes Agentic Function Model</option>
                  <option value="custom_endpoint">Custom Self-Hosted / vLLM Endpoint</option>
                </select>
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Model Identifier</label>
                <input
                  type="text"
                  required
                  value={newModel}
                  onChange={e => setNewModel(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">API Key / Secret Bearer Token</label>
                <input
                  type="password"
                  placeholder="Paste provider secret key..."
                  value={newApiKey}
                  onChange={e => setNewApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>

              {newProvider === 'custom_endpoint' && (
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Base URL (OpenAI-Compatible)</label>
                  <input
                    type="url"
                    placeholder="https://vllm.yourdomain.com/v1"
                    value={newBaseUrl}
                    onChange={e => setNewBaseUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Sampling Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1.5"
                    value={newTemperature}
                    onChange={e => setNewTemperature(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Max Output Tokens</label>
                  <input
                    type="number"
                    value={newMaxTokens}
                    onChange={e => setNewMaxTokens(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddApiModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 border border-white/20"
                >
                  Save & Register API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONNECT AGENT BRIDGE */}
      {showAddBridgeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white">Bridge Existing Agentic Swarm</h2>
              <button onClick={() => setShowAddBridgeModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBridge} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/50 font-semibold mb-1">Agent Framework</label>
                <select
                  value={bridgeFramework}
                  onChange={e => {
                    const f = e.target.value as any;
                    setBridgeFramework(f);
                    if (f === 'hermes') {
                      setBridgeName('Nous Hermes Function Calling Gateway');
                      setBridgeEndpoint('https://hermes-agent.portal.businesshub.app/api/v2/agents/revenue-orchestrator');
                      setBridgeProtocol('hermes_fc_protocol');
                    } else if (f === 'openclaw') {
                      setBridgeName('OpenClaw Autonomous Swarm Tool-Bus');
                      setBridgeEndpoint('https://openclaw.portal.businesshub.app/cluster/nodes/sydney-01');
                      setBridgeProtocol('openclaw_tool_bus');
                    }
                  }}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="hermes">Nous Hermes (Hermes-3 Function Protocol)</option>
                  <option value="openclaw">OpenClaw (Autonomous Worker Tool-Bus)</option>
                  <option value="langgraph">LangGraph (State-Machine Graph)</option>
                  <option value="crewai">CrewAI (Multi-Agent Team Webhook)</option>
                  <option value="custom_agent">Custom Autonomous Agent Protocol</option>
                </select>
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Bridge Display Name</label>
                <input
                  type="text"
                  required
                  value={bridgeName}
                  onChange={e => setBridgeName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Agent Webhook / Stream Endpoint URL</label>
                <input
                  type="url"
                  required
                  value={bridgeEndpoint}
                  onChange={e => setBridgeEndpoint(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Bridge Secret Token</label>
                  <input
                    type="password"
                    placeholder="bridge_sec_..."
                    value={bridgeToken}
                    onChange={e => setBridgeToken(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Active Swarm Workers</label>
                  <input
                    type="number"
                    value={bridgeWorkers}
                    onChange={e => setBridgeWorkers(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddBridgeModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 border border-white/20"
                >
                  Connect & Synchronize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
