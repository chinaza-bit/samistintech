'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { notify } from '@/lib/notify';
import { Heart } from 'lucide-react';

export default function LikeButton({ postId, authorId }: { postId: string; authorId?: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, [postId]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const { count: total } = await supabase
      .from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
    setCount(total || 0);

    if (user) {
      const { data } = await supabase
        .from('likes').select('*').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
      setLiked(!!data);
    }
  }

  async function toggleLike() {
    if (!userId) return alert('Please log in to like posts.');
    setBusy(true);

    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
      setLiked(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: userId });
      setLiked(true);
      setCount((c) => c + 1);
      if (authorId) notify(authorId, 'like', postId);
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggleLike}
      disabled={busy}
      className={`flex items-center gap-1 text-sm ${liked ? 'text-red-500' : 'text-gray-500'}`}
    >
      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      {count > 0 ? count : 'Like'}
    </button>
  );
}
