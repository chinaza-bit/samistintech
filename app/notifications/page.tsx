'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import { Heart, MessageCircle, UserPlus, Mail } from 'lucide-react';

type Notification = {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message';
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor: { id: string; username: string; avatar_url: string | null } | null;
};

const ICONS = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  message: Mail,
};

const LABELS = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
  message: 'sent you a message',
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    const { data } = await supabase
      .from('notifications')
      .select('id, type, post_id, read, created_at, actor:actor_id(id, username, avatar_url)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setItems((data as any) || []);
    setLoading(false);

    // Mark everything as read now that the user has opened the page.
    await supabase.from('notifications').update({ read: true }).eq('recipient_id', user.id).eq('read', false);
  }

  return (
    <>
      <Header title="Notifications" />
      <div className="p-4 pb-24">
        {loading && <p className="text-center text-gray-400 text-sm">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">No notifications yet.</p>
        )}

        {items.map((n) => {
          const Icon = ICONS[n.type];
          return (
            <Link
              key={n.id}
              href={n.type === 'message' ? '/chat' : n.actor ? `/u/${n.actor.id}` : '#'}
              className={`flex items-center gap-3 p-3 rounded-xl mb-1 ${n.read ? '' : 'bg-brand-light'}`}
            >
              <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                {n.actor?.avatar_url ? (
                  <img src={n.actor.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <Icon size={16} className="text-gray-500" />
                )}
              </div>
              <p className="text-sm">
                <span className="font-medium">{n.actor?.username || 'Someone'}</span>{' '}
                <span className="text-gray-600">{LABELS[n.type]}</span>
              </p>
            </Link>
          );
        })}
      </div>
      <Navbar />
    </>
  );
}
