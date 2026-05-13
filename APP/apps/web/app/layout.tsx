import type { Metadata } from 'next';
import Link from 'next/link';
import { TRPCProvider } from '@/lib/trpc/provider';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rental Buddy',
  description: 'AI-powered channel manager for short-term rentals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TRPCProvider>
            <header className="px-6 md:px-12 py-4 flex items-center justify-between border-b border-bg-border bg-bg/80 backdrop-blur-md sticky top-0 z-50">
              <Link href="/" className="flex items-center gap-2">
                <div
                  aria-hidden
                  className="w-7 h-7 rounded-md bg-gradient-to-br from-accent to-accent-hover shadow-[0_0_24px_-4px_rgba(99,102,241,0.45)]"
                />
                <span className="font-semibold tracking-tightish text-lg">Rental Buddy</span>
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
                <div className="flex items-center gap-2 pl-4 border-l border-bg-border">
                  <ThemeToggle />
                  <NotificationBell />
                </div>
              </div>
            </header>
            {children}
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
