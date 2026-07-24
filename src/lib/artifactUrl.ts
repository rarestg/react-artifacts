export const getStandaloneArtifactUrl = (id: string) => {
  const base = import.meta.env?.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}artifact/${encodeURIComponent(id)}`;
};

// On phones the workbench cannot mount, so a shared desktop link (/?artifact=<id>) must land on
// the standalone artifact page instead of the index. Pure so the decision is unit-testable.
export const getMobileArtifactRedirectUrl = (search: string, ids: readonly string[]): string | undefined => {
  const id = new URLSearchParams(search).get('artifact');
  if (!id || !ids.includes(id)) return undefined;
  return getStandaloneArtifactUrl(id);
};
