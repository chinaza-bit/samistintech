'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setError('');
    if (!email || !password) return setError('Please enter your email and password.');

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      // Supabase returns "Invalid login credentials" for wrong email OR password
      return setError('Incorrect email or password.');
    }

    if (!data.user?.email_confirmed_at) {
      setLoading(false);
      await supabase.auth.signOut();
      return setError('Please verify your email before logging in. Check your inbox.');
    }

    setLoading(false);
    router.push('/home');
    router.refresh(); // Refresh the page to update the session state in the app
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border">
        <h1 className="text-2xl font-bold mb-1 text-brand">SamistInTech</h1>
        <p className="text-gray-500 text-sm mb-5">Welcome back</p>

        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-brand text-white py-2.5 rounded-lg font-medium hover:bg-brand-dark transition disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}

        <div className="flex justify-between text-sm mt-5 text-gray-500">
          <Link href="/reset-password" className="text-brand">Forgot password?</Link>
          <Link href="/signup" className="text-brand font-medium">Create account</Link>
        </div>
      </div>
    </div>
  );
}
