'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus } from 'lucide-react';

type Story = {
  id: string;
  author_id: string;
  media_url: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

export default function StoriesBar() {
  const [stories, setStories] = useState<Story[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    const { data } = await supabase
      .from('stories')
      .select('id, author_id, media_url, profiles(username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    setStories((data as any) || []);
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

      {stories.map((s) => (
        <div key={s.id} className="flex flex-col items-center shrink-0">
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-brand to-pink-400">
            <img
              src={s.media_url}
              className="w-full h-full rounded-full object-cover border-2 border-white"
            />
          </div>
          <span className="text-[11px] mt-1 text-gray-500 truncate w-14 text-center">
            {s.profiles?.username || 'user'}
          </span>
        </div>
      ))}
    </div>
  );
}
