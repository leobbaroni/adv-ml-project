export default function SplineHero({
  url = 'https://my.spline.design/robotinteractiveevents-mmOC06PdpSqQu4kONFWqCpHg/',
}: {
  url?: string;
}) {
  return (
    <div className="w-full h-full min-h-[440px] relative overflow-hidden">
      <iframe
        src={url}
        className="absolute inset-0 w-full h-full border-0"
        loading="lazy"
        title="Rental Buddy 3D hero"
      />
      {/* Mask the "Built with Spline" watermark (bottom-right) */}
      <div
        aria-hidden
        className="absolute bottom-0 right-0 w-48 h-14 bg-bg pointer-events-none"
      />
    </div>
  );
}
