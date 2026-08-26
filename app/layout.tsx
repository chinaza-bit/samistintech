import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import RouteLoader from '@/components/RouteLoader';

export const metadata: Metadata = {
  title: 'SamistInTech',
  description: 'Connect, create, sell, and grow — all in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="max-w-2xl mx-auto min-h-screen">
        <Suspense fallback={null}>
          <RouteLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
