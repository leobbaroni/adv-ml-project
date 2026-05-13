import Link from 'next/link';
import SplineHero from '@/components/SplineHero';
import { CalendarDays, Bot, ListChecks, Wrench, ShoppingCart, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <section className="px-6 md:px-12 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Sparkles size={16} />
            <span>AI-Powered Channel Manager</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tightish leading-[1.05]">
            Your properties.<br />
            One dashboard.<br />
            <span className="text-fg-muted">Zero conflicts.</span>
          </h1>
          <p className="mt-6 text-lg text-fg-muted max-w-prose leading-relaxed">
            Rental Buddy merges your Airbnb, Booking, VRBO and Interhome calendars,
            resolves double-bookings with AI, and handles repairs, orders, and guest
            check-ins — all from one Telegram chat.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center h-12 px-6 rounded-btn bg-accent text-white font-medium hover:bg-accent-hover transition-colors text-base"
            >
              Open dashboard
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center justify-center h-12 px-6 rounded-btn border border-bg-border text-fg hover:bg-bg-surface transition-colors text-base"
            >
              View schedule
            </Link>
          </div>
        </div>

        <div className="w-full aspect-square md:aspect-auto md:h-[600px] justify-self-end relative">
          <SplineHero />
        </div>
      </section>

      <section className="px-6 md:px-12 py-16 md:py-24 bg-bg-surface border-y border-bg-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tightish">Everything you need to host.</h2>
            <p className="mt-3 text-fg-muted">Automated workflows that save you hours every week.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<CalendarDays size={24} />}
              title="Calendar Merge"
              description="All your iCal feeds merged into one clean, printable view."
            />
            <FeatureCard 
              icon={<Sparkles size={24} />}
              title="AI Overlap Resolution"
              description="Detects and resolves double bookings automatically with intelligent rules."
            />
            <FeatureCard 
              icon={<Bot size={24} />}
              title="Telegram Bot"
              description="Request schedules, invoices, and repairs via chat, right from your phone."
            />
            <FeatureCard 
              icon={<ListChecks size={24} />}
              title="Check-in Forms"
              description="Magic links for guests to self check-in, auto-collected passport data."
            />
            <FeatureCard 
              icon={<Wrench size={24} />}
              title="Repair Estimates"
              description="AI-generated repair budgets with editable line items for Portugal."
            />
            <FeatureCard 
              icon={<ShoppingCart size={24} />}
              title="Shopping Orders"
              description="Track furniture and supplies per property with direct IKEA integration."
            />
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-12 text-sm text-fg-muted flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center text-accent font-bold text-[10px]">RB</div>
          <span className="font-medium text-fg">Rental Buddy</span>
        </div>
        <p>Built for short-term rental hosts · 2758-T4 Advanced Topics in ML</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="surface p-6 hover:border-accent/30 transition-colors flex flex-col items-start text-left">
      <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-tightish mb-2">{title}</h3>
      <p className="text-fg-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}
