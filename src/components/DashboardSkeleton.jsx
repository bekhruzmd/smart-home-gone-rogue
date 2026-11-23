// Placeholder shaped like the dashboard, shown while the first database load runs,
// so the page doesn't jump from a spinner to a full layout.
export default function DashboardSkeleton() {
  return (
    <main className="shell" role="status" aria-label="Loading your home">
      <span className="sr-only">Loading your home…</span>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-strip" />
      <div className="skeleton-row cols-3">
        <div className="skeleton skeleton-tile" />
        <div className="skeleton skeleton-tile" />
        <div className="skeleton skeleton-tile" />
      </div>
      <div className="skeleton-row cols-4">
        <div className="skeleton skeleton-room" />
        <div className="skeleton skeleton-room" />
        <div className="skeleton skeleton-room" />
        <div className="skeleton skeleton-room" />
      </div>
    </main>
  );
}
