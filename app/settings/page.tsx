'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';

export default function SettingsPage() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [accountType, setAccountType] = useState('personal');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (p) { setUsername(p.username); setBio(p.bio || ''); setAccountType(p.account_type); }
    });
  }, []);

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ username, bio, account_type: accountType })
      .eq('id', user.id);
    setMsg(error ? error.message : 'Profile updated.');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      <Header title="Settings" />
      <div className="p-4 pb-24 space-y-5">
        <div>
          <label className="text-sm text-gray-500">Username</label>
          <input className="w-full border rounded-lg p-2.5 mt-1"
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-gray-500">Bio</label>
          <textarea className="w-full border rounded-lg p-2.5 mt-1" rows={3}
            value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-gray-500">Account type</label>
          <select className="w-full border rounded-lg p-2.5 mt-1"
            value={accountType} onChange={(e) => setAccountType(e.target.value)}>
            <option value="personal">Personal</option>
            <option value="blogger">Blogger</option>
            <option value="business">Business</option>
          </select>
        </div>

        <button onClick={saveProfile} className="w-full bg-brand text-white py-2.5 rounded-lg font-medium">
          Save Changes
        </button>
        {msg && <p className="text-sm text-center text-gray-600">{msg}</p>}

        <hr />

        <button
          onClick={() => router.push('/reset-password')}
          className="w-full border py-2.5 rounded-lg font-medium"
        >
          Change Password
        </button>

        <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg font-medium">
          Log Out
        </button>
      </div>
      <Navbar />
    </>
  );
}
