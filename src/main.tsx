import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { findArtifactById } from './artifacts';
import './index.css';
import StandaloneFallback from './StandaloneFallback';

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
const standaloneArtifact = standaloneId ? findArtifactById(standaloneId) : undefined;
const standaloneFallback = standaloneId ? (
  <StandaloneFallback title={standaloneArtifact?.name ?? standaloneId} subtitle={standaloneArtifact?.subtitle} />
) : null;

createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={standaloneFallback}>{standaloneId ? <StandaloneRoot id={standaloneId} /> : <App />}</Suspense>
  </StrictMode>,
);
