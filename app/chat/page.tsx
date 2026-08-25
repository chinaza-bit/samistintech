'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { notify } from '@/lib/notify';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import { Send } from 'lucide-react';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export default function ChatPage() {
  const [contacts, setContacts] = useState<{ id: string; username: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
    loadContacts();
  }, []);

  useEffect(() => {
    if (!activeId || !userId) return;
    loadMessages();

    const channel = supabase
      .channel(`chat-${[userId, activeId].sort().join('-')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        const belongs =
          (m.sender_id === userId && m.receiver_id === activeId) ||
          (m.sender_id === activeId && m.receiver_id === userId);
        if (belongs) setMessages((prev) => [...prev, m]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadContacts() {
    const { data } = await supabase.from('profiles').select('id, username').limit(30);
    setContacts(data || []);
  }

  async function loadMessages() {
    if (!activeId || !userId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${activeId}),and(sender_id.eq.${activeId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function sendMessage() {
    if (!text.trim() || !activeId || !userId) return;
    await supabase.from('messages').insert({ sender_id: userId, receiver_id: activeId, content: text });
    notify(activeId, 'message');
    setText('');
  }

  return (
    <>
      <Header title="Chat" />
      <div className="flex h-[calc(100vh-56px-64px)]">
        <aside className="w-28 border-r overflow-y-auto shrink-0">
          {contacts.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`block w-full text-left px-3 py-3 text-sm truncate ${
                activeId === c.id ? 'bg-brand-light text-brand font-medium' : ''
              }`}
            >
              {c.username}
            </button>
          ))}
        </aside>

        <section className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!activeId && <p className="text-center text-gray-400 text-sm mt-8">Select a contact to chat</p>}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  m.sender_id === userId ? 'bg-brand text-white ml-auto' : 'bg-gray-100'
                }`}
              >
                {m.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {activeId && (
            <div className="flex items-center gap-2 p-3 border-t">
              <input
                className="flex-1 border rounded-full px-4 py-2 text-sm outline-none"
                placeholder="Message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="bg-brand text-white p-2 rounded-full">
                <Send size={16} />
              </button>
            </div>
          )}
        </section>
      </div>
      <Navbar />
    </>
  );
}
