import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { sendDirectMessage, pauseBot, resumeBot } from '../../services/api';
import type { ConversationSession } from '../../types';
import { Send, Play, Pause, Phone, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selected, setSelected] = useState<ConversationSession | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel('sessions-chat')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversation_sessions',
      }, () => fetchSessions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchSessions() {
    const { data } = await supabase
      .from('conversation_sessions')
      .select('*')
      .order('last_activity', { ascending: false });
    if (data) setSessions(data);
    setLoading(false);
  }

  async function handleToggleBot(session: ConversationSession) {
    try {
      if (session.bot_paused) {
        await resumeBot(session.whatsapp_number, user?.full_name || 'STAFF');
        toast.success('AI bot resumed');
      } else {
        await pauseBot(session.whatsapp_number, user?.full_name || 'STAFF');
        toast.success('Bot paused. You can now message this customer directly.');
      }
      fetchSessions();
      if (selected?.whatsapp_number === session.whatsapp_number) {
        setSelected({ ...session, bot_paused: !session.bot_paused });
      }
    } catch {
      toast.error('Failed to toggle bot');
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
      toast.success('Message sent');
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
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Session list */}
      <div className="w-72 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            Active Conversations
          </h3>
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
                onClick={() => setSelected(session)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                  selected?.id === session.id ? 'bg-accent/5 border-l-2 border-accent' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-600 truncate">{session.whatsapp_number}</p>
                  </div>
                  {session.bot_paused && (
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Bot paused" />
                  )}
                </div>
                <p className="text-xs text-slate-400 pl-9">
                  {session.current_step?.replace(/_/g, ' ')} · {timeAgo(session.last_activity)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Select a conversation</p>
              <p className="text-slate-400 text-xs mt-1">Choose a customer from the left to view and respond</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 text-sm">{selected.whatsapp_number}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Step: {selected.current_step?.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected.bot_paused ? (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Pause className="w-3 h-3" />
                    Bot Paused
                  </span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    Bot Active
                  </span>
                )}
                <button
                  onClick={() => handleToggleBot(selected)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    selected.bot_paused
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-800 text-white hover:bg-slate-900'
                  }`}
                >
                  {selected.bot_paused
                    ? <><Play className="w-3 h-3" /> Resume AI</>
                    : <><Pause className="w-3 h-3" /> Take Over</>
                  }
                </button>
              </div>
            </div>

            {/* Message area */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50">
              {selected.bot_paused ? (
                <div className="text-center py-8">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 inline-block text-left max-w-sm">
                    <p className="text-sm font-semibold text-slate-800 mb-1">Bot is paused</p>
                    <p className="text-xs text-slate-500">
                      You have taken over this conversation. Type a message below to contact the customer directly on WhatsApp.
                    </p>
                    {selected.paused_by && (
                      <p className="text-xs text-slate-400 mt-2">Paused by: {selected.paused_by}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 inline-block text-left max-w-sm">
                    <p className="text-sm font-semibold text-slate-800 mb-1">AI bot is active</p>
                    <p className="text-xs text-slate-500">
                      The AI bot is currently handling this customer. Click Take Over to pause the bot and message the customer directly.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="px-4 py-3 border-t border-slate-100">
              {!selected.bot_paused ? (
                <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-500 text-center">
                  Take over the conversation to send a direct message
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type a message to the customer..."
                    className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send'}
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
