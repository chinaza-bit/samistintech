'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import BlogEditor from '@/components/BlogEditor';
import BlogPostCard, { BlogPost } from '@/components/BlogPostCard';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  async function loadPosts() {
    setLoading(true);
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, cover_image_url, body_html, created_at, profiles!author_id(username, avatar_url)')
      .order('created_at', { ascending: false });
    setPosts((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <>
      <Header title="Blog" />
      <div className="p-4 pb-24">
        <button
          onClick={() => setShowEditor((s) => !s)}
          className="w-full bg-brand text-white py-2 rounded-lg font-medium mb-4"
        >
          {showEditor ? 'Close editor' : '+ Write a blog post'}
        </button>

        {showEditor && (
          <BlogEditor onPublished={() => { setShowEditor(false); loadPosts(); }} />
        )}

        {loading && <p className="text-center text-gray-400 text-sm">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">No blog posts yet — be the first.</p>
        )}
        {posts.map((p) => <BlogPostCard key={p.id} post={p} />)}
      </div>
      <Navbar />
    </>
  );
}
