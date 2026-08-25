'use client';
import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

type Story = {
  id: string;
  author_id: string;
  media_url: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

export default function StoryViewer({
  stories,
  startIndex,
  onClose,
}: {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const current = stories[index];
  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(current?.media_url || '');

  function goNext() {
    if (index < stories.length - 1) setIndex(index + 1);
    else onClose();
  }

  function goPrev() {
    if (index > 0) setIndex(index - 1);
  }

  useEffect(() => {
    if (isVideo) return;
    const timer = setTimeout(goNext, 5000);
    return () => clearTimeout(timer);
  }, [index, isVideo]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/30 rounded overflow-hidden">
            <div
              className={`h-full bg-white ${i < index ? 'w-full' : i === index ? 'w-full animate-pulse' : 'w-0'}`}
            />
          </div>
        ))}
      </div>

      <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-10">
        <span className="text-white text-sm font-medium drop-shadow">
          {current.profiles?.username || 'user'}
        </span>
        <button onClick={onClose} className="text-white p-1">
          <X size={24} />
        </button>
      </div>

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

      <button onClick={goPrev} className="absolute left-0 top-0 h-full w-1/3" aria-label="Previous story" />
      <button onClick={goNext} className="absolute right-0 top-0 h-full w-1/3" aria-label="Next story" />

      <button onClick={goPrev} className="absolute left-2 text-white/70 hidden sm:block">
        <ChevronLeft size={32} />
      </button>
      <button onClick={goNext} className="absolute right-2 text-white/70 hidden sm:block">
        <ChevronRight size={32} />
      </button>
    </div>
  );
                                            }
