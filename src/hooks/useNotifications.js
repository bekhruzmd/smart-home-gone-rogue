import { useCallback, useEffect, useRef, useState } from 'react';

export function useNotifications() {
  const [items, setItems] = useState([]);
  const nextId = useRef(1);
  const timers = useRef(new Set());
  const closing = useRef(new Set());
  const schedule = useCallback((task, delay) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      task();
    }, delay);
    timers.current.add(timer);
  }, []);
  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    closing.current.clear();
  }, []);
  const dismiss = useCallback((id) => {
    if (closing.current.has(id)) return;
    closing.current.add(id);
    setItems((list) => list.map((item) => item.id === id ? { ...item, leaving: true } : item));
    schedule(() => {
      setItems((list) => list.filter((item) => item.id !== id));
      closing.current.delete(id);
    }, 200);
  }, [schedule]);
  const notify = useCallback(({ type = 'info', message }) => {
    const id = nextId.current++;
    setItems((list) => [...list.slice(-3), { id, type, message }]);
    schedule(() => dismiss(id), type === 'error' ? 9000 : 4000);
  }, [dismiss, schedule]);
  return { items, notify, dismiss };
}
