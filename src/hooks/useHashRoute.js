import { useEffect, useState } from 'react';

// Minimal page switching without a router library: the page name lives in the URL hash
// (#/activity), so refreshing the browser keeps you on the same page.
const PAGES = ['dashboard', 'automations', 'activity'];

function readHash() {
  const page = window.location.hash.replace(/^#\/?/, '');
  return PAGES.includes(page) ? page : 'dashboard';
}

export function useHashRoute() {
  const [page, setPage] = useState(readHash);

  useEffect(() => {
    const onChange = () => setPage(readHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = (next) => {
    window.location.hash = `/${next}`;
  };

  return { page, navigate };
}
