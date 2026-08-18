import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import {
  AgenticBridgeConfig,
  BridgeDashboardState,
  BridgeMessage,
  BridgeWorkerNode,
  BridgeTask,
  BridgeToolCall
} from '../../types/index.ts';
import {
  Bot,
  Workflow,
  Cpu,
  Terminal,
  Send,
  Play,
  Pause,
  RefreshCw,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Layers,
  Globe,
  Activity,
  Sparkles,
  DollarSign,
  Radio,
  Copy,
  ChevronDown,
  ChevronRight,
  Code2,
  Server,
  Zap,
  Gauge,
  Sliders,
  Plus,
  Compass,
  Database,
  PhoneCall
} from 'lucide-react';

interface RemoteAgentWorkspaceViewProps {
  initialBridgeId?: string;
  onNavigateToCrm?: () => void;
  onNavigateToBilling?: () => void;
}

export const RemoteAgentWorkspaceView: React.FC<RemoteAgentWorkspaceViewProps> = ({
  initialBridgeId,
  onNavigateToCrm,
  onNavigateToBilling
}) => {
  const { activeTenant, currentUser, addToast } = useTenant();
  const [bridges, setBridges] = useState<AgenticBridgeConfig[]>([]);
  const [selectedBridgeId, setSelectedBridgeId] = useState<string>(initialBridgeId || '');
  const [dashboardState, setDashboardState] = useState<BridgeDashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'workers' | 'tasks' | 'toolbus' | 'console'>('chat');

  // Chat input
  const [chatInput, setChatInput] = useState('');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Task Modal / Form
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<'lead_scrape' | 'crm_enrich' | 'draft_invoices' | 'voice_campaign' | 'compliance_audit'>('lead_scrape');
  const [taskKeywords, setTaskKeywords] = useState('');
  const [taskLocation, setTaskLocation] = useState('Sydney, Australia');
  const [taskWorker, setTaskWorker] = useState('');

  // Tool Bus Direct Execution
  const [selectedTool, setSelectedTool] = useState<string>('crm_search_leads');
  const [toolArgsJson, setToolArgsJson] = useState<string>('{\n  "query": "Solar",\n  "minScore": 70\n}');
  const [toolExecuting, setToolExecuting] = useState(false);
  const [toolExecutionResult, setToolExecutionResult] = useState<any>(null);

  // Console iframe / telemetry view mode
  const [consoleViewMode, setConsoleViewMode] = useState<'interactive_logs' | 'embedded_webview' | 'rpc_inspector'>('interactive_logs');

  useEffect(() => {
    loadBridges();
  }, [activeTenant]);

  useEffect(() => {
    if (selectedBridgeId) {
      loadBridgeDashboard(selectedBridgeId);
    }
  }, [selectedBridgeId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [dashboardState?.messages, activeTab]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadBridges = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const bridgeList = await api.getAgentBridges();
      setBridges(bridgeList);
      if (bridgeList.length > 0) {
        const defaultBridge = initialBridgeId && bridgeList.find(b => b.id === initialBridgeId)
          ? initialBridgeId
          : bridgeList[0].id;
        setSelectedBridgeId(defaultBridge);
      }
    } catch (err: any) {
      console.error('Error loading bridges:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBridgeDashboard = async (bridgeId: string) => {
    try {
      const state = await api.getBridgeDashboard(bridgeId);
      setDashboardState(state);
      if (state.workerNodes.length > 0 && !taskWorker) {
        setTaskWorker(state.workerNodes[0].name);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard state:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !selectedBridgeId || interacting) return;

    const messageText = chatInput.trim();
    setChatInput('');
    setInteracting(true);

    try {
      const res = await api.interactWithBridge(selectedBridgeId, {
        message: messageText,
        senderRole: currentUser?.role || 'staff',
        senderName: currentUser?.name || 'Operator'
      });

      setDashboardState(res.dashboardState);
      addToast({
        type: 'success',
        title: 'Bridge Responded',
        message: `${res.agentMessage.senderName} processed your directive.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Bridge Communication Failed',
        message: err.message || 'Error communicating with remote agent'
      });
    } finally {
      setInteracting(false);
    }
  };

  const handleToggleWorker = async (workerId: string) => {
    if (!selectedBridgeId) return;
    try {
      const updated = await api.toggleBridgeWorker(selectedBridgeId, workerId);
      setDashboardState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          workerNodes: prev.workerNodes.map(w => w.id === workerId ? updated : w)
        };
      });
      addToast({
        type: 'info',
        title: `Worker ${updated.name}`,
        message: `Status updated to ${updated.status.toUpperCase()}`
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Worker Toggle Failed', message: err.message });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBridgeId || !taskTitle.trim()) return;

    try {
      const newTask = await api.createBridgeTask(selectedBridgeId, {
        title: taskTitle.trim(),
        type: taskType,
        params: {
          keywords: taskKeywords,
          location: taskLocation
        },
        assignedWorker: taskWorker,
        createdByName: currentUser?.name || 'Operator'
      });

      setShowNewTaskModal(false);
      setTaskTitle('');
      setTaskKeywords('');

      addToast({
        type: 'success',
        title: 'Swarm Task Dispatched',
        message: `Task "${newTask.title}" assigned to ${newTask.assignedWorker}.`
      });

      // Reload dashboard state
      loadBridgeDashboard(selectedBridgeId);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Task Dispatch Failed', message: err.message });
    }
  };

  const handleExecuteToolBus = async () => {
    if (!selectedBridgeId || toolExecuting) return;
    setToolExecuting(true);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolArgsJson);
      } catch (e) {
        throw new Error('Invalid JSON arguments syntax');
      }

      const res = await api.executeBridgeTool(selectedBridgeId, {
        toolName: selectedTool,
        args: parsedArgs
      });

      setToolExecutionResult(res.result);
      setDashboardState(res.dashboardState);
      addToast({
        type: 'success',
        title: 'Tool Bus Executed',
        message: `[${selectedTool}] completed successfully.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Tool Bus Error',
        message: err.message || 'Tool execution failed'
      });
      setToolExecutionResult({ error: err.message });
    } finally {
      setToolExecuting(false);
    }
  };

  const handleQuickCommand = (promptText: string) => {
    setChatInput(promptText);
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const currentBridge = bridges.find(b => b.id === selectedBridgeId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in text-white font-sans">
      {/* 1. Header & Bridge Fleet Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-2xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300">
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Agentic Bridge Workspace & Dashboard
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  SWARM WRAPPER
                </span>
              </h1>
              <p className="text-xs text-white/60">
                Direct multi-turn operator steering, CoT inspection, and wrapped worker console for Nous Hermes & OpenClaw nodes.
              </p>
            </div>
          </div>
        </div>

        {/* Bridge Selector & Telemetry pill */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-white/15 rounded-2xl p-1.5 shadow-inner">
            {bridges.map(bridge => {
              const isSelected = bridge.id === selectedBridgeId;
              return (
                <button
                  key={bridge.id}
                  onClick={() => setSelectedBridgeId(bridge.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${bridge.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{bridge.framework === 'hermes' ? 'Nous Hermes 3' : bridge.framework === 'openclaw' ? 'OpenClaw Swarm' : bridge.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => selectedBridgeId && loadBridgeDashboard(selectedBridgeId)}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Refresh Swarm Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Real-Time Swarm Telemetry HUD */}
      {dashboardState && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Node Latency</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-black font-mono text-emerald-300">
              {dashboardState.telemetry.avgLatencyMs}ms
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Sub-second execution</div>
          </div>

          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Active Workers</span>
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-black font-mono text-purple-300">
              {dashboardState.workerNodes.filter(w => w.status === 'active').length} / {dashboardState.workerNodes.length}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Distributed nodes</div>
          </div>

          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Success Rate</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-lg font-black font-mono text-blue-300">
              {dashboardState.telemetry.successRate}%
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Telemetry validation</div>
          </div>

          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Memory Pool</span>
              <Layers className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-black font-mono text-amber-300">
              {dashboardState.telemetry.memoryTotalMb} MB
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Swarm cluster heap</div>
          </div>

          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>CPU Load</span>
              <Gauge className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-lg font-black font-mono text-rose-300">
              {dashboardState.telemetry.cpuLoadAverage}%
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Edge concurrency</div>
          </div>

          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Protocol Gateway</span>
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xs font-bold font-mono text-indigo-300 truncate">
              {currentBridge?.protocol.replace('_', ' ')}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live RPC Sync
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs within Wrapped Workspace */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'chat'
              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bot className="w-4 h-4 text-purple-400" />
          <span>Operator Chat & Reasoning</span>
          {dashboardState?.messages && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/30 text-purple-200 font-mono">
              {dashboardState.messages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('workers')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'workers'
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Worker Nodes Fleet</span>
          {dashboardState?.workerNodes && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200 font-mono">
              {dashboardState.workerNodes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Workflow className="w-4 h-4 text-emerald-400" />
          <span>Swarm Task Dispatcher</span>
          {dashboardState?.recentTasks && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200 font-mono">
              {dashboardState.recentTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('toolbus')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'toolbus'
              ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Direct Tool Bus Terminal</span>
        </button>

        <button
          onClick={() => setActiveTab('console')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'console'
              ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code2 className="w-4 h-4 text-blue-400" />
          <span>Wrapped Remote Dashboard Webview</span>
        </button>
      </div>

      {/* 4. TAB CONTENT 1: OPERATOR CHAT & REASONING STREAM */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left / Main: Chat History & Input */}
          <div className="lg:col-span-3 flex flex-col h-[640px] backdrop-blur-2xl bg-white/[0.02] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* Chat Messages Log */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {dashboardState?.messages.map((msg, index) => {
                const isAgent = msg.sender === 'remote_agent';
                const isSystem = msg.sender === 'system';
                const isToolBus = msg.sender === 'tool_bus';
                const isExpanded = expandedThoughts[msg.id] ?? false;

                if (isSystem) {
                  return (
                    <div key={msg.id || index} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-white/50 font-mono">
                      <span className="font-bold text-indigo-400">[{msg.senderName}]:</span> {msg.content}
                    </div>
                  );
                }

                if (isToolBus) {
                  return (
                    <div key={msg.id || index} className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                      <div className="flex items-center justify-between text-amber-300 font-bold font-mono">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-white/40">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-white/80">{msg.content}</p>
                      {msg.toolCalls && msg.toolCalls.map((tc, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] overflow-x-auto text-amber-200">
                          <span className="text-white/50">Output:</span> {JSON.stringify(tc.result, null, 2)}
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-white/40">
                      <span className="font-semibold text-white/70">{msg.senderName}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      {msg.latencyMs && (
                        <span className="text-emerald-400 font-mono">({msg.latencyMs}ms)</span>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-3xl p-4 text-xs leading-relaxed space-y-3 ${
                        isAgent
                          ? 'bg-slate-900/90 border border-purple-500/30 text-white shadow-lg'
                          : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      }`}
                    >
                      {/* Thought Chain Accordion for Hermes / OpenClaw CoT */}
                      {isAgent && msg.thoughtChain && (
                        <div className="rounded-2xl bg-black/40 border border-purple-500/20 p-3 space-y-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => toggleThought(msg.id)}
                            className="w-full flex items-center justify-between text-purple-300 font-mono font-bold text-left cursor-pointer hover:text-purple-200"
                          >
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              Hermes-3 Chain-of-Thought
                            </span>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="font-mono text-purple-200/80 whitespace-pre-wrap pt-2 border-t border-white/5 text-[10px] leading-normal">
                              {msg.thoughtChain}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tool Calls Executed by Agent */}
                      {isAgent && msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Autonomous Tool Bus Invocations ({msg.toolCalls.length})
                          </div>
                          {msg.toolCalls.map((tc, tcIdx) => (
                            <div key={tcIdx} className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono space-y-1.5">
                              <div className="flex items-center justify-between text-emerald-300 font-bold">
                                <span>⚡ {tc.name}()</span>
                                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                                  {tc.status}
                                </span>
                              </div>
                              <div className="text-white/60 text-[10px] overflow-x-auto">
                                <span className="text-white/40">Args:</span> {JSON.stringify(tc.params)}
                              </div>
                              {tc.result && (
                                <div className="text-emerald-200/90 text-[10px] p-1.5 rounded bg-black/40 overflow-x-auto">
                                  <span className="text-white/40">Result:</span> {JSON.stringify(tc.result)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Agent Text Content */}
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    </div>
                  </div>
                );
              })}

              {interacting && (
                <div className="flex items-center gap-3 p-4 rounded-3xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 animate-pulse">
                  <Bot className="w-4 h-4 animate-spin" />
                  <span>Remote {currentBridge?.name} executing reasoning tokens & tool bus dispatch...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input & Submit */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center gap-3">
              <input
                type="text"
                placeholder={`Instruct ${currentBridge?.name || 'Remote Agent'} (e.g. Scrape renewable energy leads in Sydney, or Issue tax invoice for David Sterling)...`}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={interacting}
                className="flex-1 bg-white/5 border border-white/15 focus:border-purple-400 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={interacting || !chatInput.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit</span>
              </button>
            </form>
          </div>

          {/* Right Sidebar: Quick Directives & Capabilities */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Quick Mission Directives
              </h3>
              <div className="space-y-2">
                {[
                  'Crawl and discover 4 Sydney Commercial Law firms with director contacts',
                  'Search CRM leads with score above 75 and verify Australian ABN status',
                  'Issue tax invoice for Apex Legal ($6,600 AUD) and email checkout link',
                  'Scrape yellowpages.com.au for Australian Renewable Energy EPCs',
                  'Audit compliance against Australian DNCR and Spam Act 2003'
                ].map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickCommand(promptText)}
                    className="w-full text-left p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 hover:border-purple-500/30 text-[11px] text-white/80 hover:text-white transition-all cursor-pointer"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.02] border border-white/10 shadow-xl space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Active Tool-Bus Hooks
              </h3>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-white/80">crm_search_leads</span>
                  <span className="text-emerald-400 text-[10px]">Active</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-white/80">discover_and_create_lead</span>
                  <span className="text-emerald-400 text-[10px]">Active</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-white/80">issue_tax_invoice</span>
                  <span className="text-emerald-400 text-[10px]">Active</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-white/80">verify_abn_registry</span>
                  <span className="text-emerald-400 text-[10px]">Active</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-white/80">stealth_scrape_url</span>
                  <span className="text-emerald-400 text-[10px]">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: WORKER NODES FLEET */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Connected Remote Worker Nodes ({dashboardState?.workerNodes.length || 0})
            </h2>
            <span className="text-xs text-white/50">
              Direct edge process orchestration via {currentBridge?.protocol}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardState?.workerNodes.map(worker => {
              const isPaused = worker.status === 'paused';
              return (
                <div
                  key={worker.id}
                  className={`p-5 rounded-3xl backdrop-blur-xl border transition-all shadow-xl space-y-4 ${
                    isPaused
                      ? 'bg-white/[0.01] border-white/5 opacity-70'
                      : 'bg-white/[0.03] border-white/10 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{worker.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                            isPaused
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {worker.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">{worker.role}</p>
                    </div>

                    <button
                      onClick={() => handleToggleWorker(worker.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isPaused
                          ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/40'
                          : 'bg-amber-600/30 text-amber-200 border border-amber-500/40 hover:bg-amber-600/40'
                      }`}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? 'Resume Node' : 'Pause Node'}</span>
                    </button>
                  </div>

                  {/* Task & Performance Meters */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] font-mono">
                    <div>
                      <span className="text-[10px] text-white/40 block">Tasks Done</span>
                      <span className="font-bold text-white">{worker.tasksCompleted}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">CPU Usage</span>
                      <span className="font-bold text-rose-300">{worker.cpuUsagePercent}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">Memory</span>
                      <span className="font-bold text-amber-300">{worker.memoryUsageMb} MB</span>
                    </div>
                  </div>

                  {/* Current Task & Tail Log */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Current Assignment</span>
                    <p className="text-white/80 font-medium">{worker.currentTask || 'Idle - Listening on tool bus'}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 font-mono text-[10px] text-purple-200/70 overflow-x-auto">
                    <span className="text-white/40 block mb-0.5">Stream Log:</span>
                    {worker.lastLog}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: SWARM TASK DISPATCHER & QUEUE */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Autonomous Swarm Task Queue</h2>
              <p className="text-xs text-white/60">Dispatch batch missions to remote Hermes & OpenClaw crawlers.</p>
            </div>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Launch New Swarm Mission</span>
            </button>
          </div>

          {/* Tasks Table */}
          <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] border-b border-white/10 text-[10px] uppercase font-bold tracking-wider text-white/50">
                  <tr>
                    <th className="py-3.5 px-5">Mission Title</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Assigned Worker</th>
                    <th className="py-3.5 px-4">Progress / Status</th>
                    <th className="py-3.5 px-4">Output Summary</th>
                    <th className="py-3.5 px-4 text-right">Dispatched By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dashboardState?.recentTasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    const isRunning = task.status === 'running';

                    return (
                      <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Workflow className="w-4 h-4 text-purple-400 shrink-0" />
                            <span>{task.title}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-white/5 text-white/70 border border-white/10">
                            {task.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white/80 font-mono text-[11px]">
                          {task.assignedWorker}
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1.5 w-32">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className={isCompleted ? 'text-emerald-300' : 'text-amber-300'}>
                                {task.status.toUpperCase()}
                              </span>
                              <span className="text-white/50">{task.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-purple-400'
                                }`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white/70 text-xs max-w-xs truncate">
                          {task.outputSummary || 'Processing queued targets...'}
                        </td>
                        <td className="py-4 px-4 text-right text-white/50 text-[11px]">
                          {task.createdByName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT 4: DIRECT TOOL BUS TERMINAL */}
      {activeTab === 'toolbus' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tool Invoker Form */}
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.02] border border-white/10 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              Direct Tool Execution Console
            </h2>
            <p className="text-xs text-white/60">
              Invoke individual bridge functions directly against the live database and external registers.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/50 font-semibold mb-1">Select Tool Function</label>
                <select
                  value={selectedTool}
                  onChange={e => {
                    const t = e.target.value;
                    setSelectedTool(t);
                    if (t === 'crm_search_leads') {
                      setToolArgsJson('{\n  "query": "Solar",\n  "minScore": 70\n}');
                    } else if (t === 'verify_abn_registry') {
                      setToolArgsJson('{\n  "entityName": "Apex Legal Partners",\n  "state": "NSW"\n}');
                    } else if (t === 'discover_and_create_lead') {
                      setToolArgsJson('{\n  "companyName": "Vanguard Solar Tech Pty Ltd",\n  "contactName": "Liam Davies",\n  "industry": "Renewable Energy",\n  "estimatedValue": 24000\n}');
                    } else if (t === 'issue_tax_invoice') {
                      setToolArgsJson('{\n  "clientName": "David Sterling",\n  "clientEmail": "david@aurorapower.com.au",\n  "companyName": "Aurora Renewable Energy",\n  "items": [\n    {"description": "AI Autonomous Lead Retainer Q3", "quantity": 1, "unitPrice": 4500}\n  ]\n}');
                    } else if (t === 'stealth_scrape_url') {
                      setToolArgsJson('{\n  "urlOrDomain": "solarpulse.com.au",\n  "depth": 2\n}');
                    }
                  }}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="crm_search_leads">crm_search_leads (Query CRM Pipeline)</option>
                  <option value="verify_abn_registry">verify_abn_registry (ASIC / ABN Registry Lookup)</option>
                  <option value="discover_and_create_lead">discover_and_create_lead (Autonomous Ingestion)</option>
                  <option value="issue_tax_invoice">issue_tax_invoice (GST Invoice & Payment Link)</option>
                  <option value="stealth_scrape_url">stealth_scrape_url (OpenClaw Web Crawler)</option>
                </select>
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Tool Input Arguments (JSON)</label>
                <textarea
                  rows={8}
                  value={toolArgsJson}
                  onChange={e => setToolArgsJson(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3.5 font-mono text-xs text-amber-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={handleExecuteToolBus}
                disabled={toolExecuting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 disabled:opacity-50 transition-all cursor-pointer"
              >
                {toolExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{toolExecuting ? 'Executing RPC Call...' : 'Execute Tool on Remote Bridge'}</span>
              </button>
            </div>
          </div>

          {/* Execution Output Viewer */}
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/[0.02] border border-white/10 shadow-2xl space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                Live Tool Bus Response Payload
              </h3>
              {toolExecutionResult && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  200 OK
                </span>
              )}
            </div>

            <div className="flex-1 min-h-[300px] p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs text-emerald-300 overflow-y-auto">
              {toolExecutionResult ? (
                <pre className="whitespace-pre-wrap">{JSON.stringify(toolExecutionResult, null, 2)}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/30 text-center space-y-2">
                  <Terminal className="w-8 h-8 opacity-40" />
                  <p>Execute a tool on the left to inspect return payload.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB CONTENT 5: WRAPPED REMOTE DASHBOARD WEBVIEW */}
      {activeTab === 'console' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Wrapped Agent Control Dashboard: {currentBridge?.name}
                </h3>
                <p className="text-xs text-white/50 font-mono">{currentBridge?.endpointUrl}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConsoleViewMode('interactive_logs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  consoleViewMode === 'interactive_logs' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/60'
                }`}
              >
                Telemetry Stream
              </button>
              <button
                onClick={() => setConsoleViewMode('embedded_webview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  consoleViewMode === 'embedded_webview' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/60'
                }`}
              >
                Remote Web Console
              </button>
            </div>
          </div>

          {/* Embedded Remote Dashboard Webview Simulator */}
          <div className="rounded-3xl border border-white/15 bg-slate-950 overflow-hidden shadow-2xl h-[560px] flex flex-col">
            {/* Top Browser Bar */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-white/10 flex items-center justify-between text-xs text-white/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-white/80 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                  https://{currentBridge?.framework || 'agent'}.portal.businesshub.app/dashboard/embedded
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">
                SECURE BRIDGE PROXY (TLS 1.3)
              </span>
            </div>

            {/* Embedded Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-white/40 text-[10px]">CLUSTER IDENTITY</span>
                  <div className="font-bold text-white">{currentBridge?.name}</div>
                  <div className="text-[11px] text-purple-300">Framework: {currentBridge?.framework.toUpperCase()}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-white/40 text-[10px]">AUTH PROTOCOL</span>
                  <div className="font-bold text-white">{currentBridge?.protocol}</div>
                  <div className="text-[11px] text-emerald-300">Heartbeat: {currentBridge?.lastHeartbeat ? new Date(currentBridge.lastHeartbeat).toLocaleTimeString() : 'Active'}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-white/40 text-[10px]">EDGE ROUTING PRIORITY</span>
                  <div className="font-bold text-white">Tier {currentBridge?.routingPriority} (Primary)</div>
                  <div className="text-[11px] text-indigo-300">Latency: {currentBridge?.latencyMs}ms</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-white/50 text-[11px]">
                  <span>LIVE REVERSE-PROXY LOG TAIL (`tail -f /var/log/agent/bridge.log`)</span>
                  <span className="text-emerald-400 animate-pulse">● STREAMING</span>
                </div>
                <div className="text-[11px] text-emerald-300/90 leading-relaxed font-mono">
                  [2026-08-18 10:14:02.112] [INFO] [HERMES-CORE] Authenticated session established with Business HUB Australia.<br/>
                  [2026-08-18 10:14:05.420] [DEBUG] [TOOL-BUS] Registered 5 native CRM methods into function table.<br/>
                  [2026-08-18 10:14:12.890] [INFO] [OPENCLAW-WORKER] 12 headless crawler nodes listening on queue.<br/>
                  [2026-08-18 10:14:18.230] [INFO] [STRIPE-BUS] Verified GST calculation algorithm (10% Australian Tax).<br/>
                  [2026-08-18 10:14:24.015] [DEBUG] [AGENTIC-REASONING] Temperature set to 0.6, Top-P 0.95. CoT buffer ready.<br/>
                  [2026-08-18 10:14:31.901] [READY] Swarm available for multi-turn staff and admin communications.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: LAUNCH NEW SWARM TASK */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-emerald-400" />
                Dispatch Autonomous Swarm Mission
              </h2>
              <button onClick={() => setShowNewTaskModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/50 font-semibold mb-1">Mission Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scrape Sydney Renewable Energy EPCs"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 font-semibold mb-1">Task Category</label>
                  <select
                    value={taskType}
                    onChange={e => setTaskType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="lead_scrape">Lead Scraping & Discovery</option>
                    <option value="crm_enrich">CRM ABN & Entity Enrichment</option>
                    <option value="draft_invoices">Invoice & Billing Generation</option>
                    <option value="voice_campaign">Voice Outreach Synthesis</option>
                    <option value="compliance_audit">Compliance Audit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/50 font-semibold mb-1">Assigned Worker Node</label>
                  <select
                    value={taskWorker}
                    onChange={e => setTaskWorker(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  >
                    {dashboardState?.workerNodes.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Target Keywords / Domain</label>
                <input
                  type="text"
                  placeholder="e.g. Solar, Law, Wealth Advisory"
                  value={taskKeywords}
                  onChange={e => setTaskKeywords(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1">Geographic Region</label>
                <input
                  type="text"
                  value={taskLocation}
                  onChange={e => setTaskLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Dispatch Mission</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
