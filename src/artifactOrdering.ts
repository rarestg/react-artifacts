const primaryArtifactOrder = new Map([
  ['prompt-library', 0],
  ['message-unescaper', 1],
  ['jsonl-structure-viewer', 2],
  ['palette-lab', 3],
]);

const bottomArtifactOrder = new Map([
  ['example', 0],
  ['example-app', 1],
]);

export const getArtifactSidebarGroupIndex = (id: string) => {
  if (primaryArtifactOrder.has(id)) return 0;
  if (bottomArtifactOrder.has(id)) return 2;
  return 1;
};

const getArtifactSortIndex = (id: string) => primaryArtifactOrder.get(id) ?? bottomArtifactOrder.get(id) ?? 0;

export const sortArtifactsForSidebar = <T extends { id: string; name: string }>(items: readonly T[]) =>
  [...items].sort((a, b) => {
    const groupDelta = getArtifactSidebarGroupIndex(a.id) - getArtifactSidebarGroupIndex(b.id);
    if (groupDelta !== 0) return groupDelta;

    const indexDelta = getArtifactSortIndex(a.id) - getArtifactSortIndex(b.id);
    if (indexDelta !== 0) return indexDelta;

    return a.name.localeCompare(b.name);
  });
