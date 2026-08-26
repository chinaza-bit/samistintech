'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || anchor.target === '_blank') return;
      setLoading(true);
      setProgress(20);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!loading) return;
    setProgress(100);
    const t = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!loading || progress >= 90) return;
    const t = setTimeout(() => setProgress((p) => Math.min(p + 10, 90)), 150);
    return () => clearTimeout(t);
  }, [loading, progress]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent">
      <div
        className="h-full bg-brand transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}
