'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email) return setMsg('Please enter your email.');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    setMsg(error ? error.message : 'If that email is registered, a reset link has been sent.');
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border">
        <h1 className="text-xl font-bold mb-1">Reset your password</h1>
        <p className="text-gray-500 text-sm mb-5">We'll email you a secure reset link.</p>

        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand"
          placeholder="Your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-brand text-white py-2.5 rounded-lg font-medium disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>

        {msg && <p className="text-sm mt-3 text-center text-gray-600">{msg}</p>}

        <p className="text-sm text-center mt-5">
          <Link href="/login" className="text-brand">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
