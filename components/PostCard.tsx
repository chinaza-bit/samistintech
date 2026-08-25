'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Share2, Copy, Download, Forward } from 'lucide-react';
import Comments from './Comments';
import FollowButton from './FollowButton';
import LikeButton from './LikeButton';

export type Post = {
  id: string;
  author_id?: string;
  text_content: string | null;
  text_size?: string | null;
  text_color?: string | null;
  bg_color: string | null;
  image_url: string | null;
  video_url: string | null;
  music_url?: string | null;
  link_url: string | null;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null } | null;
};

export default function PostCard({ post }: { post: Post }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ text: post.text_content || '', url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard.');
    }
    setMenuOpen(false);
  }

  function handleCopyText() {
    navigator.clipboard.writeText(post.text_content || '');
    setMenuOpen(false);
  }

  function handleDownload() {
    const url = post.image_url || post.video_url;
    if (url) window.open(url, '_blank');
    setMenuOpen(false);
  }

  function handleForward() {
    // Forwards to the chat picker with this post pre-attached.
    window.location.href = `/chat?forwardPostId=${post.id}`;
  }

  return (
    <div
      className="rounded-2xl p-4 mb-4 border shadow-sm relative"
      style={{ backgroundColor: post.bg_color || '#fff' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Link href={post.author_id ? `/u/${post.author_id}` : '#'} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
              {post.profiles?.avatar_url && (
                <img src={post.profiles.avatar_url} className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-sm font-medium">{post.profiles?.username || 'user'}</span>
          </Link>
          {post.author_id && <FollowButton profileId={post.author_id} />}
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="text-gray-500">
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 bg-white border shadow-lg rounded-xl text-sm w-40 overflow-hidden z-10">
              <button onClick={handleShare} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50">
                <Share2 size={15} /> Share
              </button>
              <button onClick={handleCopyText} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50">
                <Copy size={15} /> Copy text
              </button>
              {(post.image_url || post.video_url) && (
                <button onClick={handleDownload} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50">
                  <Download size={15} /> Download
                </button>
              )}
              <button onClick={handleForward} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50">
                <Forward size={15} /> Forward
              </button>
            </div>
          )}
        </div>
      </div>

      {post.text_content && (
        <p className={post.text_size || 'text-base'} style={{ color: post.text_color || '#111827' }}>
          {post.text_content}
        </p>
      )}
      {post.image_url && <img src={post.image_url} className="rounded-lg mt-2 w-full" />}
      {post.video_url && <video src={post.video_url} controls className="rounded-lg mt-2 w-full" />}
      {post.music_url && <audio src={post.music_url} controls className="w-full mt-2" />}
      {post.link_url && (
        <a href={post.link_url} target="_blank" className="text-brand text-sm mt-2 block truncate">
          {post.link_url}
        </a>
      )}

      <div className="flex items-center gap-4 mt-3 pt-2 border-t">
        <LikeButton postId={post.id} authorId={post.author_id} />
      </div>

      <Comments postId={post.id} authorId={post.author_id} />
    </div>
  );
}
