import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const App = lazy(() => import('./App'));
const StandaloneRoot = lazy(() => import('./StandaloneRoot'));

const getStandaloneIdFromPath = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  const pathname = window.location.pathname;
  const stripped = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const match = stripped.match(/^\/artifact\/([^/]+)\/?$/);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const standaloneId = getStandaloneIdFromPath();

createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={null}>{standaloneId ? <StandaloneRoot id={standaloneId} /> : <App />}</Suspense>
  </StrictMode>,
);
