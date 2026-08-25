'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus } from 'lucide-react';
import StoryViewer, { StoryGroup } from './StoryViewer';

export default function StoriesBar() {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [unseenAuthorIds, setUnseenAuthorIds] = useState<Set<string>>(new Set());
  const [viewerGroupIndex, setViewerGroupIndex] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    const { data } = await supabase
      .from('stories')
      .select('id, author_id, media_url, created_at, profiles!author_id(username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    const raw = (data as any) || [];

    const byAuthor = new Map<string, StoryGroup>();
    for (const s of raw) {
      const existing = byAuthor.get(s.author_id);
      const story = { id: s.id, author_id: s.author_id, media_url: s.media_url, created_at: s.created_at };
      if (existing) {
        existing.stories.push(story);
      } else {
        byAuthor.set(s.author_id, {
          author_id: s.author_id,
          username: s.profiles?.username || 'user',
          avatar_url: s.profiles?.avatar_url || null,
          stories: [story],
        });
      }
    }

    const grouped = Array.from(byAuthor.values()).reverse();
    setGroups(grouped);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || raw.length === 0) return setUnseenAuthorIds(new Set());

    const allStoryIds = raw.map((s: any) => s.id);
    const { data: views } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('user_id', user.id)
      .in('story_id', allStoryIds);

    const seenIds = new Set((views || []).map((v: any) => v.story_id));
    const unseen = new Set<string>();
    for (const g of grouped) {
      if (g.stories.some((s) => !seenIds.has(s.id))) unseen.add(g.author_id);
    }
    setUnseenAuthorIds(unseen);
  }

  async function handleUpload(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `stories/${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file);
    if (upErr) return alert(upErr.message);

    const mediaUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
    await supabase.from('stories').insert({ author_id: user.id, media_url: mediaUrl });
    loadStories();
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-3 border-b bg-white no-scrollbar">
      <div className="flex flex-col items-center shrink-0">
        <button
          onClick={() => fileInput.current?.click()}
          className="w-14 h-14 rounded-full border-2 border-dashed border-brand flex items-center justify-center text-brand"
        >
          <Plus size={22} />
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        <span className="text-[11px] mt-1 text-gray-500">Your story</span>
      </div>

      {groups.map((g, i) => {
        const isUnseen = unseenAuthorIds.has(g.author_id);
        return (
          <button
            key={g.author_id}
            onClick={() => setViewerGroupIndex(i)}
            className="flex flex-col items-center shrink-0"
          >
            <div
              className={`w-14 h-14 rounded-full p-[2px] ${
                isUnseen ? 'bg-gradient-to-tr from-green-400 to-green-600' : 'bg-gray-300'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                {g.avatar_url ? (
                  <img src={g.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <img src={g.stories[g.stories.length - 1].media_url} className="w-full h-full object-cover" />
                )}
              </div>
            </div>
            <span className="text-[11px] mt-1 text-gray-500 truncate w-14 text-center">
              {g.username}
            </span>
          </button>
        );
      })}

      {viewerGroupIndex !== null && (
        <StoryViewer
          groups={groups}
          startGroupIndex={viewerGroupIndex}
          onClose={() => {
            setViewerGroupIndex(null);
            loadStories();
          }}
        />
      )}
    </div>
  );
                                               }
