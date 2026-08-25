'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  async function handleUpdate() {
    if (password.length < 6) return setMsg('Password must be at least 6 characters.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setMsg(error.message);
    setMsg('Password updated! Redirecting to login…');
    setTimeout(() => router.push('/login'), 1500);
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border">
        <h1 className="text-xl font-bold mb-4">Set a new password</h1>
        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand"
          placeholder="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleUpdate} className="w-full bg-brand text-white py-2.5 rounded-lg font-medium">
          Update Password
        </button>
        {msg && <p className="text-sm mt-3 text-center text-gray-600">{msg}</p>}
      </div>
    </div>
  );
}
