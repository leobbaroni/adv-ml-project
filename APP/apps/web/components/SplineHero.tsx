export default function SplineHero({
  url = 'https://my.spline.design/robotinteractiveevents-mmOC06PdpSqQu4kONFWqCpHg/',
}: {
  url?: string;
}) {
  return (
    <div className="w-full h-full min-h-[440px] relative overflow-hidden">
      <iframe
        src={url}
        className="absolute left-1/2 bottom-0 border-0 pointer-events-none dark:[mix-blend-mode:multiply]"
        style={{
          width: '115%',
          height: '115%',
          transform: 'translateX(-50%)',
        }}
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
