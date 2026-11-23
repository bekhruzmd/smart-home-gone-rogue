import { X } from 'lucide-react';

export default function Toasts({ items, onDismiss }) {
  return (
    <div className="toasts" aria-live="assertive">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
          <p>{t.message}</p>
          <button type="button" className="icon-btn" onClick={() => onDismiss(t.id)} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
