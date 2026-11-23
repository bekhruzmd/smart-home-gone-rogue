// Carried over from the original assignment: a reusable card shell.
// Props give each system its identity (title, icon, status); `children` supplies its controls.
// 2.0 adds a `tone` for the status badge and an optional `aside` slot in the header.
export default function SystemCard({ title, icon: Icon, status, tone = 'neutral', className = '', aside, children }) {
  return (
    <section className={`system-card ${className}`} aria-label={title}>
      <header className="card-head">
        <div className="card-title">
          {Icon && (
            <span className="card-icon" aria-hidden="true">
              <Icon size={18} />
            </span>
          )}
          <h2>{title}</h2>
        </div>
        <div className="card-head-right">
          {aside}
          {status && <span className={`badge badge-${tone}`}>{status}</span>}
        </div>
      </header>
      {children}
    </section>
  );
}
