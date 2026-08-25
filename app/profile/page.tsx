'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import CreatePost from '@/components/CreatePost';
import PostCard, { Post } from '@/components/PostCard';

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  account_type: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(p);

    const { data: myPosts } = await supabase
      .from('posts')
      .select('id, author_id, text_content, text_size, text_color, bg_color, image_url, video_url, music_url, link_url, created_at, profiles(username, avatar_url)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    setPosts((myPosts as any) || []);

    const { count: followerCount } = await supabase
      .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
    const { count: followingCount } = await supabase
      .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
    setFollowers(followerCount || 0);
    setFollowing(followingCount || 0);
  }

  useEffect(() => { load(); }, []);

  if (!profile) return <p className="p-6 text-center text-gray-400">Loading…</p>;

  return (
    <>
      <Header title="My Profile" />
      <div className="p-4 pb-24">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
            {profile.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
          </div>
          <div>
            <p className="font-bold text-lg">{profile.username}</p>
            <p className="text-xs text-gray-500 capitalize">{profile.account_type} account</p>
          </div>
        </div>

        {profile.bio && <p className="text-sm text-gray-600 mt-3">{profile.bio}</p>}

        <div className="flex gap-6 mt-4 text-sm">
          <span><b>{posts.length}</b> Posts</span>
          <span><b>{followers}</b> Followers</span>
          <span><b>{following}</b> Following</span>
        </div>

        <button
          onClick={() => setShowCreate((s) => !s)}
          className="w-full bg-brand text-white py-2 rounded-lg mt-4 font-medium"
        >
          {showCreate ? 'Close editor' : '+ Create new post'}
        </button>

        {showCreate && (
          <div className="mt-4">
            <CreatePost onPublished={() => { setShowCreate(false); load(); }} />
          </div>
        )}

        <div className="mt-4">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </div>
      <Navbar />
    </>
  );
}
