import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            aria-hidden
            className="w-7 h-7 rounded-md bg-gradient-to-br from-accent to-amber-700 shadow-[0_0_24px_-4px_rgba(245,158,11,0.45)]"
          />
          <span className="font-semibold tracking-tightish">Concierge</span>
        </div>
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
        </nav>
      </header>

      <section className="flex-1 px-6 md:px-12 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tightish leading-[1.05]">
            One calendar.
            <br />
            <span className="text-fg-muted">Every platform.</span>
            <br />
            Zero conflicts.
          </h1>
          <p className="mt-6 text-lg text-fg-muted max-w-prose">
            A focused channel manager for short-term rental hosts. Merges Airbnb, Booking,
            VRBO and Interhome calendars in real time, resolves overlaps with AI, and lets
            you run everything from Telegram.
          </p>
          <div className="mt-10 flex gap-3">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center h-11 px-5 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 transition-colors"
            >
              Open dashboard
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center justify-center h-11 px-5 rounded-btn border border-bg-border text-fg hover:bg-bg-surface transition-colors"
            >
              View schedule
            </Link>
          </div>
          <p className="mt-6 text-xs text-fg-muted">
            Phase 0 scaffold — UI lives at <code className="font-mono">/properties</code>,{' '}
            <code className="font-mono">/schedule</code>, <code className="font-mono">/orders</code>.
            Implementation lands in phase 1+.
          </p>
        </div>

        <div className="surface aspect-square w-full max-w-[440px] justify-self-end relative overflow-hidden">
          {/* R3F hero will mount here in phase 9. Placeholder gradient for now. */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.18),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.10),transparent_55%)]" />
          <div className="absolute bottom-4 left-4 text-xs text-fg-muted">3D hero — phase 9</div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-6 text-xs text-fg-muted border-t border-bg-border">
        adv-ml-project · 2758-T4 Advanced Topics in ML
      </footer>
    </main>
  );
}
