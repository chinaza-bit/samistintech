'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard, { Post } from './PostCard';
import CreatePost from './CreatePost';

type Category = 'feed' | 'marketplace' | 'tech_trends' | 'business_trends' | 'blog' | 'reel';

export default function CategoryFeed({
  category,
  allowPosting = true,
}: {
  category: Category;
  allowPosting?: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('id, author_id, text_content, text_size, text_color, bg_color, image_url, video_url, music_url, link_url, created_at, profiles!author_id(username, avatar_url)')
      .eq('category', category)
      .order('created_at', { ascending: false });
    setPosts((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, [category]);

  return (
    <div className="p-4 pb-24">
      {allowPosting && <CreatePost category={category} onPublished={loadPosts} />}

      {loading && <p className="text-center text-gray-400 text-sm">Loading…</p>}
      {!loading && posts.length === 0 && (
        <p className="text-center text-gray-400 text-sm mt-8">Nothing here yet — be the first to post.</p>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
