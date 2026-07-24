import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { artifacts, findArtifactById } from './artifacts';
import './index.css';
import { getMobileArtifactRedirectUrl } from './lib/artifactUrl';
import { MOBILE_MEDIA_QUERY } from './lib/useIsMobile';
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

// On phones a shared workbench link (/?artifact=<id>) hard-redirects to the standalone page
// before anything mounts; App keeps its own guard for later viewport crossings.
const mobileRedirectUrl =
  !standaloneId && typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches
    ? getMobileArtifactRedirectUrl(
        window.location.search,
        artifacts.map((a) => a.id),
      )
    : undefined;
if (mobileRedirectUrl) {
  window.location.replace(mobileRedirectUrl);
}

const standaloneArtifact = standaloneId ? findArtifactById(standaloneId) : undefined;
const standaloneFallback = standaloneId ? (
  <StandaloneFallback title={standaloneArtifact?.name ?? standaloneId} subtitle={standaloneArtifact?.subtitle} />
) : null;

createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={standaloneFallback}>
      {standaloneId ? <StandaloneRoot id={standaloneId} /> : mobileRedirectUrl ? null : <App />}
    </Suspense>
  </StrictMode>,
);
