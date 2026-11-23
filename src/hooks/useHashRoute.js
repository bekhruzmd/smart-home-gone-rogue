import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const PAGES = ['dashboard', 'automations', 'activity'];
function readHash() {
  const page = window.location.hash.replace(/^#\/?/, '');
  return PAGES.includes(page) ? page : 'dashboard';
}

export function useHashRoute() {
  const [page, setPage] = useState(readHash);
  useEffect(() => {
    let keyboard = false;
    let transition;
    const onKey = () => { keyboard = true; };
    const onPointer = () => { keyboard = false; };
    const onChange = () => {
      const next = readHash();
      transition?.skipTransition();
      if (keyboard || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setPage(next);
        return;
      }
      transition = document.startViewTransition(() => flushSync(() => setPage(next)));
      // Interrupted transitions are expected during rapid navigation.
      transition.ready.catch(() => {});
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('hashchange', onChange);
    return () => {
      transition?.skipTransition();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('hashchange', onChange);
    };
  }, []);
  return { page, navigate: (next) => { window.location.hash = `/${next}`; } };
}
