import type { Metadata } from 'next';
import Link from 'next/link';
import { TRPCProvider } from '@/lib/trpc/provider';
import { NotificationBell } from '@/components/NotificationBell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Concierge — Real Estate Agent',
  description: 'AI-powered channel manager for short-term rentals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <TRPCProvider>
          <header className="px-6 md:px-12 py-4 flex items-center justify-between border-b border-bg-border bg-bg">
            <Link href="/" className="flex items-center gap-2">
              <div
                aria-hidden
                className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-amber-700 shadow-[0_0_24px_-4px_rgba(245,158,11,0.45)]"
              />
              <span className="font-semibold tracking-tightish">Concierge</span>
            </Link>
            <div className="flex items-center gap-4">
              <nav className="text-sm text-fg-muted flex gap-6">
                <Link href="/properties" className="hover:text-fg transition-colors">
                  Properties
                </Link>
                <Link href="/schedule" className="hover:text-fg transition-colors">
                  Schedule
                </Link>
                <Link href="/orders" className="hover:text-fg transition-colors">
                  Orders
                </Link>
                <Link href="/repairs" className="hover:text-fg transition-colors">
                  Repairs
                </Link>
              </nav>
              <NotificationBell />
            </div>
          </header>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
