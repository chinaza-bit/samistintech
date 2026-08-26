'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Spinner from '@/components/Spinner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const router = useRouter();

  async function handleLogin() {
    setError('');
    setNeedsVerification(false);
    setResendMsg('');
    if (!email || !password) return setError('Please enter your email and password.');

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      return setError('Incorrect email or password.');
    }

    if (!data.user?.email_confirmed_at) {
      setLoading(false);
      await supabase.auth.signOut();
      setNeedsVerification(true);
      return setError('Please verify your email before logging in.');
    }

    setLoading(false);
    router.push('/home');
    router.refresh();
  }

  async function handleResend() {
    setResending(true);
    setResendMsg('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    setResendMsg(error ? error.message : 'Verification email resent — check your inbox.');
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border">
        <h1 className="text-2xl font-bold mb-1 text-brand">SamistInTech</h1>
<p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
  Tech · Business · Innovation
</p>
<p className="text-gray-500 text-sm mb-5">Welcome back</p>

        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand transition disabled:bg-gray-50"
          placeholder="Email"
          type="email"
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand transition disabled:bg-gray-50"
          placeholder="Password"
          type="password"
          value={password}
          disabled={loading}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-brand text-white py-2.5 rounded-lg font-medium hover:bg-brand-dark active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Spinner size={16} />}
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}

        {needsVerification && (
          <div className="mt-3 text-center">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-brand text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2 mx-auto"
            >
              {resending && <Spinner size={14} />}
              {resending ? 'Resending…' : 'Resend verification email'}
            </button>
            {resendMsg && <p className="text-xs text-gray-500 mt-1">{resendMsg}</p>}
          </div>
        )}

        <div className="flex justify-between text-sm mt-5 text-gray-500">
          <Link href="/reset-password" className="text-brand">Forgot password?</Link>
          <Link href="/signup" className="text-brand font-medium">Create account</Link>
        </div>
      </div>
    </div>
  );
      }
