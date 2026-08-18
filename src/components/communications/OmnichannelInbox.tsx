import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import { Conversation, Lead, Message } from '../../types/index.ts';
import {
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck,
  Search,
  Clock,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface OmnichannelInboxProps {
  initialLead?: Lead | null;
}

export const OmnichannelInbox: React.FC<OmnichannelInboxProps> = ({ initialLead }) => {
  const { activeTenant, currentUser, addToast } = useTenant();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'chat' | 'sms'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSimulatingLead, setIsSimulatingLead] = useState(false);
  const [leadSimText, setLeadSimText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [activeTenant]);

  useEffect(() => {
    if (initialLead && conversations.length > 0) {
      const match = conversations.find(c => c.leadId === initialLead.id);
      if (match) {
        setSelectedConv(match);
      }
    }
  }, [initialLead, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  const loadConversations = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConv) {
        setSelectedConv(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (senderType: 'human_agent' | 'lead' = 'human_agent') => {
    if (!selectedConv) return;
    const textToSend = senderType === 'human_agent' ? replyText : leadSimText;
    if (!textToSend.trim()) return;

    setIsSending(true);
    try {
      const res = await api.sendMessage(selectedConv.id, textToSend, senderType);
      
      // Update selected conversation in place
      const updatedConv = await api.getConversation(selectedConv.id);
      setSelectedConv(updatedConv);
      setConversations(prev => prev.map(c => (c.id === updatedConv.id ? updatedConv : c)));

      if (senderType === 'human_agent') {
        setReplyText('');
        addToast({ type: 'success', title: 'Message Dispatched', message: 'Sent via active channel.' });
      } else {
        setLeadSimText('');
        addToast({
          type: 'info',
          title: 'AI Lead Response Received',
          message: `AI Agent responded to simulated lead message.`
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Send Failed', message: err.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleTakeover = () => {
    if (!selectedConv) return;
    const isHuman = selectedConv.assignedTo === 'human_rep';
    const updated = {
      ...selectedConv,
      assignedTo: (isHuman ? 'ai_agent' : 'human_rep') as 'ai_agent' | 'human_rep'
    };
    setSelectedConv(updated);
    setConversations(prev => prev.map(c => (c.id === updated.id ? updated : c)));

    addToast({
      type: isHuman ? 'info' : 'warning',
      title: isHuman ? 'AI Co-Pilot Resumed' : 'Human Takeover Activated',
      message: isHuman ? 'AI will autonomously respond to future incoming turns.' : 'AI agent will pause responses and yield control to you.'
    });
  };

  const filteredConversations = conversations.filter(c => {
    if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.contactName.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        (c.subject && c.subject.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Omnichannel Autonomous Inbox
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Unified communications stream spanning 2-way Email, SMS, and Web Chat with live AI auto-replies, sentiment telemetry, and 1-click human intervention.
          </p>
        </div>

        {/* Channel Filter Chips */}
        <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs">
          {(['all', 'email', 'chat', 'sms'] as const).map(ch => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1.5 rounded-lg uppercase text-[10px] font-bold tracking-wider transition-colors ${
                channelFilter === ch ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inbox Workspace: Left 4 cols Threads, Right 8 cols Chat Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* Left Column (4 cols): Threads List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {filteredConversations.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No active threads found.</div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConv?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {conv.channel === 'email' && <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        {conv.channel === 'chat' && <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {conv.channel === 'sms' && <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className="font-bold text-xs text-slate-200 truncate">{conv.contactName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(conv.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {conv.companyName}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 leading-snug">
                      {lastMsg ? lastMsg.content : 'No messages yet.'}
                    </p>

                    {/* Footer tags */}
                    <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          conv.assignedTo === 'human_rep'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {conv.assignedTo === 'human_rep' ? 'Human Managed' : 'AI Active'}
                      </span>

                      {conv.sentiment && (
                        <span
                          className={`capitalize font-mono ${
                            conv.sentiment === 'positive'
                              ? 'text-emerald-400'
                              : conv.sentiment === 'urgent'
                              ? 'text-rose-400 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {conv.sentiment}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (8 cols): Selected Conversation Stream */}
        {selectedConv ? (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
            {/* Thread Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-100">{selectedConv.contactName}</h2>
                  <span className="text-slate-400 text-xs">• {selectedConv.companyName}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {selectedConv.channel}
                  </span>
                </div>
                {selectedConv.subject && (
                  <p className="text-xs text-blue-400 font-medium mt-0.5">{selectedConv.subject}</p>
                )}
              </div>

              {/* Takeover toggle button */}
              <button
                onClick={handleTakeover}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedConv.assignedTo === 'human_rep'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{selectedConv.assignedTo === 'human_rep' ? 'Yield back to AI' : 'Take Over Thread'}</span>
              </button>
            </div>

            {/* Message History Bubble Stream */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[420px] pr-2">
              {selectedConv.messages.map(msg => {
                const isLead = msg.sender === 'lead';
                const isAI = msg.sender === 'ai_agent';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isLead ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {isAI ? (
                        <Bot className="w-3 h-3 text-blue-400" />
                      ) : isLead ? (
                        <User className="w-3 h-3 text-slate-400" />
                      ) : (
                        <UserCheck className="w-3 h-3 text-purple-400" />
                      )}
                      <span className="text-[10px] font-bold text-slate-400">
                        {isAI ? 'AI Revenue Agent' : isLead ? selectedConv.contactName : currentUser?.name || 'Human Representative'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isLead
                          ? 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                          : isAI
                          ? 'bg-blue-950/70 border border-blue-500/30 text-blue-100 rounded-tr-none'
                          : 'bg-purple-950/70 border border-purple-500/30 text-purple-100 rounded-tr-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Tool Calls badge inside AI message */}
                      {msg.toolCallsExecuted && msg.toolCallsExecuted.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-blue-500/20 text-[10px] space-y-1">
                          <div className="font-bold text-blue-300">Tool Triggered:</div>
                          {msg.toolCallsExecuted.map((t, idx) => (
                            <div key={idx} className="bg-slate-950/60 p-1.5 rounded font-mono text-[10px] text-slate-300">
                              {t.name}({JSON.stringify(t.arguments || {})})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Canvas & Lead Simulator Toolbar */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              {/* Lead Simulator Drawer (For testing and interactive demos) */}
              <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Simulate Prospect Response:</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Can you send me available slots for Thursday afternoon?"
                  value={leadSimText}
                  onChange={e => setLeadSimText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendReply('lead')}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => handleSendReply('lead')}
                  disabled={isSending || !leadSimText.trim()}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Send as Lead
                </button>
              </div>

              {/* Main Operator Input */}
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  placeholder={`Type manual reply as ${currentUser?.name || 'Representative'}...`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply('human_agent');
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
                <button
                  onClick={() => handleSendReply('human_agent')}
                  disabled={isSending || !replyText.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
            Select a conversation thread to view message history.
          </div>
        )}
      </div>
    </div>
  );
};
