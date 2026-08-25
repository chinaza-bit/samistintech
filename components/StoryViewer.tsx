'use client';
import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { notify } from '@/lib/notify';

export type Story = {
  id: string;
  author_id: string;
  media_url: string;
  created_at: string;
};

export type StoryGroup = {
  author_id: string;
  username: string;
  avatar_url: string | null;
  stories: Story[];
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function StoryViewer({
  groups,
  startGroupIndex,
  onClose,
}: {
  groups: StoryGroup[];
  startGroupIndex: number;
  onClose: () => void;
}) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reply, setReply] = useState('');
  const [sent, setSent] = useState(false);
  const [paused, setPaused] = useState(false);

  const group = groups[groupIndex];
  const current = group?.stories[storyIndex];
  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(current?.media_url || '');

  function goNext() {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }

  function goPrev() {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  }

  useEffect(() => {
    if (!current) return;
    setReply('');
    setSent(false);

    (async () => {
      const { count } = await supabase
        .from('story_likes')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', current.id);
      setLikeCount(count || 0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLiked(false);

      const { data } = await supabase
        .from('story_likes')
        .select('story_id')
        .eq('story_id', current.id)
        .eq('user_id', user.id)
        .maybeSingle();
      setLiked(!!data);

      await supabase
        .from('story_views')
        .upsert({ story_id: current.id, user_id: user.id }, { onConflict: 'story_id,user_id' });
    })();
  }, [current?.id]);

  useEffect(() => {
    if (isVideo || paused) return;
    const timer = setTimeout(goNext, 5000);
    return () => clearTimeout(timer);
  }, [storyIndex, groupIndex, isVideo, paused]);

  async function toggleLike() {
    if (!current) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase.from('story_likes').delete().eq('story_id', current.id).eq('user_id', user.id);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase.from('story_likes').insert({ story_id: current.id, user_id: user.id });
      await notify(group.author_id, 'story_like', undefined, current.id);
    }
  }

  async function sendReply() {
    if (!reply.trim() || !current) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: group.author_id,
      content: `Replied to your story: ${reply.trim()}`,
    });
    await notify(group.author_id, 'message');

    setReply('');
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  }

  if (!group || !current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none">
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/30 rounded overflow-hidden">
            <div
              className={`h-full bg-white ${
                i < storyIndex ? 'w-full' : i === storyIndex ? 'w-full' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center text-white text-xs font-medium">
            {group.avatar_url ? (
              <img src={group.avatar_url} className="w-full h-full object-cover" />
            ) : (
              group.username?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white text-sm font-medium drop-shadow">{group.username}</span>
            <span className="text-white/70 text-[11px]">{timeAgo(current.created_at)}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white p-1">
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {isVideo ? (
          <video
            src={current.media_url}
            className="max-h-full max-w-full"
            autoPlay
            onEnded={goNext}
            controls={false}
          />
        ) : (
          <img src={current.media_url} className="max-h-full max-w-full object-contain" />
        )}
      </div>

      <button onClick={goPrev} className="absolute left-0 top-0 h-[85%] w-1/3 z-10" aria-label="Previous story" />
      <button onClick={goNext} className="absolute right-0 top-0 h-[85%] w-1/3 z-10" aria-label="Next story" />

      <button onClick={goPrev} className="absolute left-3 text-white/70 hidden sm:block z-20">
        <ChevronLeft size={32} />
      </button>
      <button onClick={goNext} className="absolute right-3 text-white/70 hidden sm:block z-20">
        <ChevronRight size={32} />
      </button>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={(e) => e.key === 'Enter' && sendReply()}
          placeholder={sent ? 'Reply sent ✓' : 'Reply to this story…'}
          className="flex-1 bg-white/15 text-white placeholder-white/70 rounded-full px-4 py-2 text-sm outline-none border border-white/30 focus:border-white/60"
        />
        <button
          onClick={sendReply}
          disabled={!reply.trim()}
          className="text-white p-2 disabled:opacity-40"
          aria-label="Send reply"
        >
          <Send size={22} />
        </button>
        <button onClick={toggleLike} className="flex items-center gap-1 text-white p-2" aria-label="Like story">
          <Heart size={24} className={liked ? 'fill-red-500 text-red-500' : ''} />
          {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
        </button>
      </div>
    </div>
  );
        }
