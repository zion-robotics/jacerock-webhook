import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { sendDirectMessage, pauseBot, resumeBot } from '../../services/api';
import type { ConversationSession } from '../../types';
import { Send, Play, Pause, Phone, MessageSquare, RefreshCw, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  whatsapp_number: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  sender_name: string;
  sent_by: string;
  created_at: string;
  media_url?: string | null;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selected, setSelected] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [botPaused, setBotPaused] = useState(false);
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
    const channel = supabase
      .channel('sessions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_sessions' }, fetchSessions)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selected) {
      fetchMessages(selected.whatsapp_number);
      setBotPaused(selected.bot_paused || false);

      const channel = supabase
        .channel(`messages-${selected.whatsapp_number}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `whatsapp_number=eq.${selected.whatsapp_number}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function fetchSessions() {
    const { data } = await supabase
      .from('conversation_sessions')
      .select('*')
      .order('last_activity', { ascending: false });
    if (data) setSessions(data);
    setLoading(false);
  }

  async function fetchMessages(number: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('whatsapp_number', number)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data);
  }

  async function handleSelectSession(session: ConversationSession) {
    setSelected(session);
    setBotPaused(session.bot_paused || false);
    setMessages([]);
  }

  async function handleToggleBot() {
    if (!selected) return;
    try {
      if (botPaused) {
        await resumeBot(selected.whatsapp_number, user?.full_name || 'STAFF');
        setBotPaused(false);
        toast.success('AI bot resumed');
      } else {
        await pauseBot(selected.whatsapp_number, user?.full_name || 'STAFF');
        setBotPaused(true);
        toast.success('Bot paused. You can now message this customer.');
        inputRef.current?.focus();
      }
      fetchSessions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle bot. Check that the webhook server is running.');
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !selected) return;
    setSending(true);
    try {
      await sendDirectMessage(selected.whatsapp_number, message, user?.full_name || 'STAFF');
      setMessage('');
      inputRef.current?.focus();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 min-w-0">
      {/* Session list — full width on mobile when nothing selected, fixed width on desktop */}
      <div className={`
        bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden flex-shrink-0
        w-full md:w-72
        ${selected ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent flex-shrink-0" />
            Conversations
          </h3>
          <button onClick={fetchSessions} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-center text-slate-400 text-sm animate-pulse">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No active conversations</div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors min-w-0 ${
                  selected?.id === session.id ? 'bg-accent/5 border-l-2 border-accent' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1 min-w-0">
                  <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-xs font-mono text-slate-700 truncate flex-1">{session.whatsapp_number}</p>
                  {session.bot_paused && (
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Bot paused" />
                  )}
                </div>
                <p className="text-xs text-slate-400 pl-9 truncate">
                  {session.current_step?.replace(/_/g, ' ')} · {timeAgo(session.last_activity)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat area — full width on mobile when selected, flex-1 on desktop */}
      <div className={`
        bg-white rounded-xl border border-slate-200 flex-col overflow-hidden min-w-0
        w-full md:flex-1
        ${selected ? 'flex' : 'hidden md:flex'}
      `}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Select a conversation</p>
              <p className="text-slate-400 text-xs mt-1">Choose a customer from the left</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-3 md:px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  onClick={() => setSelected(null)}
                  className="md:hidden text-slate-400 hover:text-slate-600 flex-shrink-0 p-1 -ml-1"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{selected.whatsapp_number}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Step: {selected.current_step?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`hidden sm:flex text-xs px-2 py-1 rounded-full font-semibold items-center gap-1 ${
                  botPaused ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {botPaused ? <><Pause className="w-3 h-3" /> Bot Paused</> : <><Play className="w-3 h-3" /> Bot Active</>}
                </span>
                <button
                  onClick={handleToggleBot}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                    botPaused
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-800 text-white hover:bg-slate-900'
                  }`}
                >
                  {botPaused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Take Over</>}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-3 md:p-4 overflow-y-auto bg-slate-50 space-y-3 min-w-0">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No messages recorded yet for this conversation.
                  <br />
                  <span className="text-xs mt-1 block">Messages will appear here after the next interaction.</span>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm min-w-0 ${
                      msg.direction === 'OUTBOUND'
                        ? 'bg-accent text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}>
                      {msg.media_url ? (
                        <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={msg.media_url}
                            alt="Uploaded receipt"
                            className="rounded-lg max-w-full max-h-64 object-cover mb-1"
                          />
                        </a>
                      ) : null}
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.direction === 'OUTBOUND' ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        {msg.sent_by !== 'BOT' ? `${msg.sent_by} · ` : ''}
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 md:px-4 py-3 border-t border-slate-100">
              {!botPaused ? (
                <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-500 text-center border border-slate-200">
                  Click <strong>Take Over</strong> to pause the bot and send direct messages to this customer
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2 min-w-0">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 min-w-0 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">{sending ? '...' : 'Send'}</span>
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
