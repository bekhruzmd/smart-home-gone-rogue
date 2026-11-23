import { useCallback, useRef, useState } from 'react';

// Small toast queue for errors and confirmations.
export function useNotifications() {
  const [items, setItems] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setItems((list) => list.filter((n) => n.id !== id)), []);

  const notify = useCallback(
    ({ type = 'info', message }) => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-3), { id, type, message }]);
      // Errors stay longer so there's time to read them.
      setTimeout(() => dismiss(id), type === 'error' ? 9000 : 4000);
    },
    [dismiss],
  );

  return { items, notify, dismiss };
}
