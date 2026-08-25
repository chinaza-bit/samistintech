'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmojiPicker from 'emoji-picker-react';
import { Image as ImageIcon, Music, Link2, Smile, Palette, Type } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const BG_COLORS = ['#ffffff', '#FEF3C7', '#DBEAFE', '#FCE7F3', '#D1FAE5', '#111827'];
const TEXT_SIZES = [
  { label: 'S', value: 'text-sm' },
  { label: 'M', value: 'text-lg' },
  { label: 'L', value: 'text-2xl' },
];

type Props = {
  category?: 'feed' | 'marketplace' | 'tech_trends' | 'business_trends' | 'blog' | 'reel';
  onPublished?: () => void;
};

export default function CreatePost({ category = 'feed', onPublished }: Props) {
  const [text, setText] = useState('');
  const [textSize, setTextSize] = useState('text-lg');
  const [textColor, setTextColor] = useState('#111827');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  const REEL_MAX_SECONDS = 60 * 60; // 60 minutes
  const BUSINESS_VIDEO_MAX_SECONDS = 30 * 60; // 30 minutes

  function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => resolve(video.duration);
      video.src = URL.createObjectURL(file);
    });
  }

  async function handleVideoSelect(file: File) {
    const duration = await getVideoDuration(file);
    const limit = category === 'reel' ? REEL_MAX_SECONDS : BUSINESS_VIDEO_MAX_SECONDS;
    if (duration > limit) {
      alert(`Video too long. Max allowed: ${limit / 60} minutes.`);
      return;
    }
    setVideoFile(file);
  }

  async function uploadFile(file: File, folder: string, userId: string) {
    const path = `${folder}/${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('media').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
  }

  async function handlePublish() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please log in first.');
    if (!text && !imageFile && !videoFile) return alert('Add some text or media before posting.');

    setPublishing(true);
    try {
      let imageUrl = '';
      let videoUrl = '';
      let musicUrl = '';

      if (imageFile) imageUrl = await uploadFile(imageFile, 'images', user.id);
      if (videoFile) videoUrl = await uploadFile(videoFile, 'videos', user.id);
      if (musicFile) musicUrl = await uploadFile(musicFile, 'audio', user.id);

      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        category,
        text_content: text,
        text_size: textSize,
        text_color: textColor,
        bg_color: bgColor,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        music_url: musicUrl || null,
        link_url: link || null,
      });
      if (error) throw error;

      setText(''); setImageFile(null); setVideoFile(null); setMusicFile(null); setLink('');
      onPublished ? onPublished() : router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to publish.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="rounded-2xl p-4 border shadow-sm mb-4" style={{ backgroundColor: bgColor }}>
      <textarea
        className={`w-full bg-transparent outline-none resize-none placeholder-gray-400 ${textSize}`}
        style={{ color: textColor }}
        placeholder="What's happening?"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {imageFile && (
        <img src={URL.createObjectURL(imageFile)} className="rounded-lg mt-2 max-h-64 w-full object-cover" />
      )}
      {videoFile && (
        <video src={URL.createObjectURL(videoFile)} controls className="rounded-lg mt-2 max-h-64 w-full" />
      )}
      {musicFile && <p className="text-xs text-gray-500 mt-2">🎵 {musicFile.name}</p>}
      {link && <p className="text-xs text-brand mt-2 truncate">{link}</p>}

      {showEmoji && (
        <div className="mt-2">
          <EmojiPicker onEmojiClick={(e) => setText((t) => t + e.emoji)} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mt-3 flex-wrap text-gray-500">
        <label className="cursor-pointer" title="Add image">
          <ImageIcon size={20} />
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && setImageFile(e.target.files[0])} />
        </label>
        <label className="cursor-pointer" title="Add video">
          <Type size={0} className="hidden" />
          🎥
          <input type="file" accept="video/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])} />
        </label>
        <label className="cursor-pointer" title="Add background music">
          <Music size={20} />
          <input type="file" accept="audio/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && setMusicFile(e.target.files[0])} />
        </label>
        <button onClick={() => setShowEmoji((s) => !s)} title="Emoji"><Smile size={20} /></button>

        <span className="flex items-center gap-1" title="Background color">
          <Palette size={18} />
          {BG_COLORS.map((c) => (
            <button key={c} onClick={() => setBgColor(c)}
              className="w-5 h-5 rounded-full border" style={{ backgroundColor: c }} />
          ))}
        </span>

        <span className="flex items-center gap-1" title="Text size">
          {TEXT_SIZES.map((s) => (
            <button key={s.value} onClick={() => setTextSize(s.value)}
              className={`text-xs px-1.5 rounded border ${textSize === s.value ? 'bg-brand text-white' : ''}`}>
              {s.label}
            </button>
          ))}
        </span>

        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
          title="Text color" className="w-6 h-6" />

        <label className="cursor-pointer" title="Add link">
          <Link2 size={20} />
        </label>
      </div>

      <input
        className="w-full border rounded-lg p-2 mt-2 text-sm"
        placeholder="Paste a link (optional)"
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />

      <button
        onClick={handlePublish}
        disabled={publishing}
        className="mt-3 w-full bg-brand text-white py-2 rounded-lg font-medium disabled:opacity-60"
      >
        {publishing ? 'Publishing…' : 'Publish'}
      </button>
    </div>
  );
}
