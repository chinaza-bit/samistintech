'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { notify } from '@/lib/notify';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import { Send, Smile, Image as ImageIcon, ArrowLeft, Search, Trash2, Check, CheckCheck } from 'lucide-react';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  media_url: string | null;
  created_at: string;
  read_at: string | null;
};

type Conversation = {
  peerId: string;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  lastTime: string;
  unread: number;
};

type SearchResult = { id: string; username: string; avatar_url: string | null };

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function dateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [revealedMsgId, setRevealedMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
      if (data.user?.id) loadConversations(data.user.id);
    });
  }, []);

  async function loadConversations(me: string) {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, media_url, created_at, read_at')
      .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
      .order('created_at', { ascending: false });

    const rows = data || [];
    const byPeer = new Map<string, Conversation>();
    const peerIds = new Set<string>();

    for (const m of rows) {
      const peerId = m.sender_id === me ? m.receiver_id : m.sender_id;
      peerIds.add(peerId);
      if (!byPeer.has(peerId)) {
        byPeer.set(peerId, {
          peerId,
          username: '',
          avatar_url: null,
          lastMessage: m.media_url ? '📷 Photo' : m.content || '',
          lastTime: m.created_at,
          unread: 0,
        });
      }
      if (m.receiver_id === me && !m.read_at) {
        byPeer.get(peerId)!.unread += 1;
      }
    }

    if (peerIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(peerIds));
      for (const p of profiles || []) {
        const c = byPeer.get(p.id);
        if (c) {
          c.username = p.username;
          c.avatar_url = p.avatar_url;
        }
      }
    }

    setConversations(Array.from(byPeer.values()));
  }

  async function openConversation(peerId: string, peerInfo?: { username: string; avatar_url: string | null }) {
    setActiveId(peerId);
    setSearch('');
    setSearchResults([]);
    if (peerInfo) {
      setActivePeer(peerInfo);
    } else {
      const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', peerId).single();
      setActivePeer(data as any);
    }
  }

  useEffect(() => {
    if (!activeId || !userId) return;
    loadMessages();

    const roomName = [userId, activeId].sort().join('-');

    const msgChannel = supabase
      .channel(`chat-${roomName}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        const belongs =
          (m.sender_id === userId && m.receiver_id === activeId) ||
          (m.sender_id === activeId && m.receiver_id === userId);
        if (belongs) {
          setMessages((prev) => [...prev, m]);
          if (m.receiver_id === userId) markRead([m.id]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
      })
      .subscribe();

    const typingChannel = supabase.channel(`typing-${roomName}`, { config: { broadcast: { self: false } } });
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.from === activeId) {
          setPeerTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 2500);
        }
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [activeId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerTyping]);

  useEffect(() => {
    if (search.trim().length < 1) return setSearchResults([]);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${search.trim()}%`)
        .neq('id', userId || '')
        .limit(10);
      setSearchResults(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [search, userId]);

  async function loadMessages() {
    if (!activeId || !userId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${activeId}),and(sender_id.eq.${activeId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);

    const unreadIds = (data || [])
      .filter((m) => m.receiver_id === userId && !m.read_at)
      .map((m) => m.id);
    if (unreadIds.length) markRead(unreadIds);
  }

  async function markRead(ids: string[]) {
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', ids);
    if (userId) loadConversations(userId);
  }

  function broadcastTyping() {
    typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { from: userId } });
  }

  async function sendMessage() {
    if (!text.trim() || !activeId || !userId) return;
    const content = text.trim();
    setText('');
    setShowEmoji(false);
    await supabase.from('messages').insert({ sender_id: userId, receiver_id: activeId, content });
    notify(activeId, 'message');
  }

  async function sendImage(file: File) {
    if (!activeId || !userId) return;
    const path = `chat/${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('media').upload(path, file);
    if (error) return alert(error.message);
    const mediaUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
    await supabase.from('messages').insert({ sender_id: userId, receiver_id: activeId, media_url: mediaUrl });
    notify(activeId, 'message');
  }

  async function deleteMessage(id: string) {
    await supabase.from('messages').delete().eq('id', id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setRevealedMsgId(null);
  }

  const showingList = !activeId;

  return (
    <>
      <Header title="Chat" />
      <div className="flex h-[calc(100vh-56px-64px)] bg-white">
        <aside className={`w-full md:w-80 border-r flex-col ${showingList ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
                className="w-full bg-gray-100 rounded-full pl-9 pr-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {search.trim() ? (
              searchResults.length === 0 ? (
                <p className="text-center text-gray-400 text-sm mt-6">No users found</p>
              ) : (
                searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openConversation(r.id, { username: r.username, avatar_url: r.avatar_url })}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                  >
                    <Avatar url={r.avatar_url} name={r.username} />
                    <span className="text-sm font-medium">{r.username}</span>
                  </button>
                ))
              )
            ) : conversations.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-6">
                No conversations yet — search above to message someone.
              </p>
            ) : (
              conversations
                .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
                .map((c) => (
                  <button
                    key={c.peerId}
                    onClick={() => openConversation(c.peerId, { username: c.username, avatar_url: c.avatar_url })}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b ${
                      activeId === c.peerId ? 'bg-brand-light' : ''
                    }`}
                  >
                    <Avatar url={c.avatar_url} name={c.username} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{c.username}</span>
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">{formatTime(c.lastTime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 truncate">{c.lastMessage}</span>
                        {c.unread > 0 && (
                          <span className="ml-2 bg-brand text-white text-[10px] rounded-full px-1.5 py-0.5 shrink-0">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
            )}
          </div>
        </aside>

        <section className={`flex-1 flex-col ${showingList ? 'hidden md:flex' : 'flex'}`}>
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-3 py-2 border-b shrink-0">
                <button onClick={() => setActiveId(null)} className="md:hidden text-gray-500">
                  <ArrowLeft size={20} />
                </button>
                <Avatar url={activePeer?.avatar_url || null} name={activePeer?.username || '?'} />
                <div>
                  <p className="text-sm font-semibold">{activePeer?.username}</p>
                  {peerTyping && <p className="text-xs text-brand">typing…</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-gray-50">
                {messages.map((m, i) => {
                  const mine = m.sender_id === userId;
                  const prev = messages[i - 1];
                  const showDateSep = !prev || dateLabel(prev.created_at) !== dateLabel(m.created_at);
                  return (
                    <div key={m.id}>
                      {showDateSep && (
                        <div className="flex justify-center my-3">
                          <span className="text-[11px] text-gray-400 bg-gray-200 rounded-full px-3 py-1">
                            {dateLabel(m.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          onClick={() => mine && setRevealedMsgId(revealedMsgId === m.id ? null : m.id)}
                          className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm relative ${
                            mine ? 'bg-brand text-white rounded-br-sm' : 'bg-white border rounded-bl-sm'
                          }`}
                        >
                          {m.media_url && (
                            <img src={m.media_url} className="rounded-lg mb-1 max-h-60 object-cover" />
                          )}
                          {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                          <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[10px] ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                              {formatTime(m.created_at)}
                            </span>
                            {mine && (
                              m.read_at ? (
                                <CheckCheck size={13} className="text-blue-300" />
                              ) : (
                                <Check size={13} className="text-white/70" />
                              )
                            )}
                          </div>

                          {mine && revealedMsgId === m.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(m.id);
                              }}
                              className="absolute -left-9 top-1/2 -translate-y-1/2 bg-white border rounded-full p-1.5 text-red-500 shadow"
                              aria-label="Delete message"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {showEmoji && (
                <div className="border-t">
                  <EmojiPicker
                    width="100%"
                    height={300}
                    onEmojiClick={(e: any) => setText((t) => t + e.emoji)}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 p-3 border-t shrink-0">
                <button onClick={() => setShowEmoji((s) => !s)} className="text-gray-500 shrink-0">
                  <Smile size={22} />
                </button>
                <button onClick={() => fileInput.current?.click()} className="text-gray-500 shrink-0">
                  <ImageIcon size={22} />
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && sendImage(e.target.files[0])}
                />
                <input
                  className="flex-1 border rounded-full px-4 py-2 text-sm outline-none"
                  placeholder="Message…"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    broadcastTyping();
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} className="bg-brand text-white p-2 rounded-full shrink-0">
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
      <Navbar />
    </>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-500 text-sm font-medium shrink-0">
      {url ? <img src={url} className="w-full h-full object-cover" /> : name?.[0]?.toUpperCase() || '?'}
    </div>
  );
        }
