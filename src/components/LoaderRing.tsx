export function LoaderRing({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative animate-spin"
    >
      <div className="absolute inset-0 rounded-full" style={{
        background: 'conic-gradient(from 0deg, transparent, #22c55e, transparent)',
        WebkitMask: 'radial-gradient(circle, transparent 55%, black 56%)',
        mask: 'radial-gradient(circle, transparent 55%, black 56%)',
      }} />
    </div>
  );
}
