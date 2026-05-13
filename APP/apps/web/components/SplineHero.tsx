'use client';

import { useState } from 'react';
import { MousePointer2, X } from 'lucide-react';

export default function SplineHero({
  url = 'https://my.spline.design/robotinteractiveevents-mmOC06PdpSqQu4kONFWqCpHg/',
}: {
  url?: string;
}) {
  const [interactive, setInteractive] = useState(false);

  return (
    <div className="w-full h-full min-h-[440px] relative overflow-hidden">
      <iframe
        src={url}
        className="absolute left-1/2 bottom-0 border-0 dark:[mix-blend-mode:multiply]"
        style={{
          width: '115%',
          height: '115%',
          transform: 'translateX(-50%)',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
        loading="lazy"
        title="Rental Buddy 3D hero"
      />

      {/* Watermark mask */}
      <div
        aria-hidden
        className="absolute bottom-0 right-0 w-48 h-14 bg-bg pointer-events-none"
      />

      {/* Toggle button */}
      {interactive ? (
        <button
          type="button"
          onClick={() => setInteractive(false)}
          className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-bg-surface/90 backdrop-blur border border-bg-border text-xs font-medium text-fg hover:bg-bg-surface transition-colors shadow-sm"
          aria-label="Exit robot interaction"
        >
          <X size={14} />
          Exit
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setInteractive(true)}
          className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-bg-surface/90 backdrop-blur border border-bg-border text-xs font-medium text-fg hover:bg-bg-surface transition-colors shadow-sm"
          aria-label="Interact with robot"
        >
          <MousePointer2 size={14} />
          Interact
        </button>
      )}
    </div>
  );
}
