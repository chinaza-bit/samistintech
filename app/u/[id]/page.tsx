'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import PostCard, { Post } from '@/components/PostCard';
import FollowButton from '@/components/FollowButton';
import ProductCard, { Product } from '@/components/ProductCard';

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  account_type: string;
  business_name: string | null;
  business_links: string | null;
};

export default function PublicProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single();
    setProfile(p);

    const { data: userPosts } = await supabase
      .from('posts')
      .select('id, author_id, text_content, text_size, text_color, bg_color, image_url, video_url, music_url, link_url, created_at, profiles!author_id(username, avatar_url)')
      .eq('author_id', id)
      .order('created_at', { ascending: false });
    setPosts((userPosts as any) || []);

    if (p?.account_type === 'business') {
      const { data: userProducts } = await supabase
        .from('business_products').select('*').eq('owner_id', id).order('created_at', { ascending: false });
      setProducts(userProducts || []);
    }

    const { count: followerCount } = await supabase
      .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id);
    const { count: followingCount } = await supabase
      .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id);
    setFollowers(followerCount || 0);
    setFollowing(followingCount || 0);
  }

  if (!profile) return <p className="p-6 text-center text-gray-400">Loading…</p>;

  return (
    <>
      <Header title={profile.username} />
      <div className="p-4 pb-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {profile.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="font-bold text-lg">{profile.username}</p>
              <p className="text-xs text-gray-500 capitalize">{profile.account_type} account</p>
            </div>
          </div>
          <FollowButton profileId={profile.id} />
        </div>

        {profile.bio && <p className="text-sm text-gray-600 mt-3">{profile.bio}</p>}

        {profile.account_type === 'business' && profile.business_name && (
          <div className="mt-3 bg-brand-light rounded-xl p-3 text-sm">
            <p className="font-medium">{profile.business_name}</p>
            {profile.business_links && (
              <a href={profile.business_links} target="_blank" className="text-brand truncate block">
                {profile.business_links}
              </a>
            )}
          </div>
        )}

        <div className="flex gap-6 mt-4 text-sm">
          <span><b>{posts.length}</b> Posts</span>
          <span><b>{followers}</b> Followers</span>
          <span><b>{following}</b> Following</span>
        </div>

        {products.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold mb-2">Products</p>
            {products.map((prod) => <ProductCard key={prod.id} product={prod} />)}
          </div>
        )}

        <div className="mt-4">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
          {posts.length === 0 && <p className="text-center text-gray-400 text-sm mt-8">No posts yet.</p>}
        </div>
      </div>
      <Navbar />
    </>
  );
}
