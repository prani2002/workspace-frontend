export function Skeleton({ width = '100%', height = 16 }: { width?: string | number; height?: number }) {
  return <span className="skeleton" style={{ width, height }} aria-hidden="true" />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="stack">
      {Array.from({ length: rows }, (_, i) => (
        <div className="card" key={i}><Skeleton width="60%" height={18} /><Skeleton width="90%" /></div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="stack">
      <Skeleton width="40%" height={28} />
      <ListSkeleton rows={3} />
    </div>
  );
}
