import { LoaderCircle } from 'lucide-react';

// Full-screen state for loading, errors and setup problems.
export default function ScreenMessage({ title, children, loading = false, action }) {
  return (
    <main className="screen-message">
      <div className="screen-card" role={loading ? 'status' : undefined}>
        {loading && <LoaderCircle size={28} className="spin" aria-hidden="true" />}
        <h1>{title}</h1>
        {children}
        {action}
      </div>
    </main>
  );
}
