'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const ACCOUNT_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'blogger', label: 'Blogger' },
  { value: 'business', label: 'Business' },
];

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  async function handleSignUp() {
    setMsg(null);
    if (!username || !email || !password) {
      return setMsg({ type: 'error', text: 'Please fill in all fields.' });
    }
    if (password.length < 6) {
      return setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { username, account_type: accountType },
      },
    });

    if (error) {
      setLoading(false);
      return setMsg({ type: 'error', text: error.message });
    }

    // Create the matching profile row (id must equal the auth user id)
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        account_type: accountType,
      });
    }

    setLoading(false);
    setMsg({
      type: 'success',
      text: 'Account created! Check your email and click the verification link before logging in.',
    });
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border">
        <h1 className="text-2xl font-bold mb-1 text-brand">SamistInTech</h1>
        <p className="text-gray-500 text-sm mb-5">Create your account</p>

        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand"
          placeholder="Password (min 6 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p className="text-xs text-gray-500 mb-2">Account type</p>
        <div className="flex gap-2 mb-4">
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setAccountType(t.value)}
              className={`flex-1 text-sm py-2 rounded-lg border transition ${
                accountType === t.value
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full bg-brand text-white py-2.5 rounded-lg font-medium hover:bg-brand-dark transition disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>

        {msg && (
          <p className={`text-sm mt-3 text-center ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
            {msg.text}
          </p>
        )}

        <p className="text-sm text-center mt-5 text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
