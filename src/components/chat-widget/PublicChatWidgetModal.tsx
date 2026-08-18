import React, { useState, useRef, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { api } from '../../api/client.ts';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Calendar,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface PublicChatWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicChatWidgetModal: React.FC<PublicChatWidgetModalProps> = ({ isOpen, onClose }) => {
  const { activeTenant } = useTenant();
  const [messages, setMessages] = useState<{ sender: 'ai' | 'user'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: `Hello! Welcome to ${activeTenant?.branding.companyName || 'Business HUB'}. I'm your AI assistant. How can I help you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input;
    setInput('');
    const userMsg = {
      sender: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      let convId = conversationId;
      if (!convId) {
        const newConv = await api.createConversation({
          channel: 'chat',
          leadId: '',
          subject: 'Public Website Chat Visitor'
        });
        convId = newConv.id;
        setConversationId(convId);
      }

      const res = await api.sendMessage(convId, userText, 'lead');
      const aiMsg = {
        sender: 'ai' as const,
        text: res.aiMessage.content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I'd be glad to arrange a consultation for you. Please let me know your preferred day and time.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[580px]">
        {/* Widget Brand Header */}
        <div
          className="p-4 flex items-center justify-between text-white shadow-md"
          style={{ backgroundColor: activeTenant?.branding.primaryColor || '#2563EB' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">{activeTenant?.branding.companyName || 'Business HUB'}</div>
              <div className="text-[11px] opacity-85 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>AI Concierge Online</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 bg-slate-950 p-4 overflow-y-auto space-y-3">
          {messages.map((m, idx) => {
            const isAI = m.sender === 'ai';
            return (
              <div key={idx} className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    isAI
                      ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                      : 'bg-blue-600 text-white rounded-tr-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.time}</span>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl w-20">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Footer Input */}
        <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your question or request..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
