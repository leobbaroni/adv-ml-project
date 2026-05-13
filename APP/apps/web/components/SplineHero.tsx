'use client';

import { useEffect, useState } from 'react';

export default function SplineHero({ url = 'https://prod.spline.design/y4DRgzAPBfrARWVF/scene.splinecode' }: { url?: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load spline viewer script
    if (!document.querySelector('script[src*="spline-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.12.92/build/spline-viewer.js';
      document.head.appendChild(script);
    }
  }, []);

  if (!isMounted) {
    return <HeroFallback />;
  }

  return (
    <div className="w-full h-full min-h-[440px] relative rounded-card overflow-hidden surface flex items-center justify-center">
      <HeroFallback />
      {/* Dynamic custom element creation avoids TS IntrinsicElements issues */}
      {isMounted && (
        <div
          dangerouslySetInnerHTML={{
            __html: `<spline-viewer url="${url}" class="absolute inset-0 w-full h-full z-10" loading-anim-type="none"></spline-viewer>`,
          }}
        />
      )}
      {/* Overlay gradient to blend edges if needed, mostly handled by Spline scene */}
      <div className="absolute inset-0 pointer-events-none rounded-card ring-1 ring-inset ring-bg-border z-20" />
    </div>
  );
}

function HeroFallback() {
  return (
    <div className="absolute inset-0 bg-bg-surface/50 rounded-card flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.10),transparent_55%)]" />
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin opacity-50 z-10" />
    </div>
  );
}
