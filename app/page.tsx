'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Landing() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      router.replace(data.session ? '/home' : '/login');
    });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <h1 className="text-3xl font-bold text-brand">SamistInTech</h1>
      <p className="text-gray-500 text-sm">Loading…</p>
    </div>
  );
}
