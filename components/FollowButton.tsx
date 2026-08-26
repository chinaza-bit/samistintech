'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { notify } from '@/lib/notify';
import Spinner from './Spinner';

export default function FollowButton({ profileId }: { profileId: string }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [profileId]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
    if (!user || user.id === profileId) return setLoading(false);

    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', profileId)
      .maybeSingle();

    setIsFollowing(!!data);
    setLoading(false);
  }

  async function toggleFollow() {
    if (!currentUserId) return alert('Please log in to follow users.');
    setLoading(true);

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId);
      setIsFollowing(false);
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: profileId });
      setIsFollowing(true);
      notify(profileId, 'follow');
    }
    setLoading(false);
  }

  if (currentUserId === profileId) return null;

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition active:scale-[0.96] disabled:opacity-70 flex items-center gap-1.5 ${
        isFollowing ? 'bg-gray-100 text-gray-700 border' : 'bg-brand text-white'
      }`}
    >
      {loading && <Spinner size={12} />}
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
