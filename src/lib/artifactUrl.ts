export const getStandaloneArtifactUrl = (id: string) => {
  const base = import.meta.env?.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}artifact/${encodeURIComponent(id)}`;
};
