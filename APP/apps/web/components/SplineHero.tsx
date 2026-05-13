'use client';

import Spline from '@splinetool/react-spline/next';

export default function SplineHero({ url = 'https://prod.spline.design/y4DRgzAPBfrARWVF/scene.splinecode' }: { url?: string }) {
  return (
    <div className="w-full h-full min-h-[440px] relative flex items-center justify-center overflow-visible">
      <Spline 
        scene={url} 
        className="w-full h-full"
      />
    </div>
  );
}
