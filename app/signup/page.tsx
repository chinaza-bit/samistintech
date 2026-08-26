'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Spinner from '@/components/Spinner';
import { Mail, CheckCircle2 } from 'lucide-react';

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
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleSignUp() {
    setMsg(null);
    if (!username || !email || !password) {
      return setMsg({ type: 'error', text: 'Please fill in all fields.' });
    }
    if (password.length < 6) {
      return setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { username, account_type: accountType },
      },
    });

    setLoading(false);

    if (error) {
      return setMsg({ type: 'error', text: error.message });
    }

    setResendCooldown(60);
    setAwaitingVerification(true);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResending(true);
    setResendMsg('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) {
      setResendMsg(error.message);
    } else {
      setResendMsg('Verification email resent — check your inbox.');
      setResendCooldown(60);
    }
  }

  if (awaitingVerification) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border text-center">
          <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-brand" />
          </div>
          <h1 className="text-xl font-bold mb-2">Check your email</h1>
          <p className="text-sm text-gray-500 mb-1">
            We sent a verification link to
          </p>
          <p className="text-sm font-medium text-gray-800 mb-4 break-all">{email}</p>
          <p className="text-xs text-gray-400 mb-5">
            Click the link in that email to activate your account, then come back and log in.
            Don't forget to check your spam or promotions folder.
          </p>

          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="w-full border border-brand text-brand py-2.5 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resending && <Spinner size={16} />}
            {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend verification email'}
          </button>

          {resendMsg && (
            <p className="text-xs mt-3 text-gray-500 flex items-center justify-center gap-1">
              <CheckCircle2 size={14} className="text-green-500" /> {resendMsg}
            </p>
          )}

          <p className="text-sm text-center mt-6 text-gray-500">
            Already verified?{' '}
            <Link href="/login" className="text-brand font-medium">Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border">
        <h1 className="text-2xl font-bold mb-1 text-brand">SamistInTech</h1>
        <p className="text-gray-500 text-sm mb-5">Create your account</p>

        <input
          className="w-full border rounded-lg p-2.5 mb-3 outline-none focus:ring-2 focus:ring-brand transition disabled:bg-gray-50"
          placeholder="Username"
          value={username}
          disabled={loading}
          onChange={(e) => setUsername(e.target.value)}
        />
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
          placeholder="Password (min 6 characters)"
          type="password"
          value={password}
          disabled={loading}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p className="text-xs text-gray-500 mb-2">Account type</p>
        <div className="flex gap-2 mb-4">
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setAccountType(t.value)}
              disabled={loading}
              className={`flex-1 text-sm py-2 rounded-lg border transition disabled:opacity-60 ${
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
          className="w-full bg-brand text-white py-2.5 rounded-lg font-medium hover:bg-brand-dark active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Spinner size={16} />}
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
