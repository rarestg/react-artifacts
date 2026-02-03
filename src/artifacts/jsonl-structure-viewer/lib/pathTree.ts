import type { PathNode, PathSegment } from '../types';

const encodeSegment = (segment: PathSegment) =>
  segment.kind === 'key' ? (['k', segment.key] as const) : (['a', segment.key ?? null] as const);

export function encodePath(segments: PathSegment[]) {
  return JSON.stringify(segments.map(encodeSegment));
}

const formatSegment = (segment: PathSegment) => {
  if (segment.kind === 'array') {
    return segment.key ? `${segment.key}[]` : '[]';
  }
  return segment.key;
};

const formatPath = (segments: PathSegment[]) => segments.map(formatSegment).join('->');

export function buildPaths(data: unknown) {
  const paths: PathSegment[][] = [];
  const pathKeys = new Set<string>();

  const addPath = (segments: PathSegment[]) => {
    if (segments.length === 0) return;
    const key = encodePath(segments);
    if (pathKeys.has(key)) return;
    pathKeys.add(key);
    paths.push(segments);
  };

  const visitValue = (value: unknown, segments: PathSegment[]) => {
    if (Array.isArray(value)) {
      const rootArraySegment: PathSegment = { kind: 'array' };
      if (segments.length === 0) {
        addPath([rootArraySegment]);
      }
      const nextSegments = segments.length === 0 ? [rootArraySegment] : segments;
      value.forEach((item) => {
        if (Array.isArray(item)) {
          const nestedSegments = [...nextSegments, { kind: 'array' } as PathSegment];
          addPath(nestedSegments);
          visitValue(item, nestedSegments);
          return;
        }
        if (item && typeof item === 'object') {
          visitObject(item as Record<string, unknown>, nextSegments);
        }
      });
      return;
    }

    if (value && typeof value === 'object') {
      visitObject(value as Record<string, unknown>, segments);
    }
  };

  const visitObject = (obj: Record<string, unknown>, segments: PathSegment[]) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const arraySegment: PathSegment = { kind: 'array', key };
        addPath([...segments, arraySegment]);
        value.forEach((item) => {
          if (Array.isArray(item)) {
            const nested = [...segments, arraySegment, { kind: 'array' } as PathSegment];
            addPath(nested);
            visitValue(item, nested);
          } else if (item && typeof item === 'object') {
            visitObject(item as Record<string, unknown>, [...segments, arraySegment]);
          }
        });
        return;
      }

      const nextSegments = [...segments, { kind: 'key', key } as PathSegment];
      addPath(nextSegments);

      if (value && typeof value === 'object') {
        visitObject(value as Record<string, unknown>, nextSegments);
      }
    });
  };

  visitValue(data, []);

  return paths;
}

export function buildTree(paths: PathSegment[][]) {
  const root: PathNode = {
    key: 'root',
    label: 'root',
    path: '',
    isArray: false,
    depth: -1,
    children: [],
    subtreeCount: 0,
  };

  paths.forEach((segments) => {
    let current = root;
    segments.forEach((segment, index) => {
      const nextSegments = segments.slice(0, index + 1);
      const nodeKey = encodePath(nextSegments);
      const existing = current.children.find((child) => child.key === nodeKey);
      if (existing) {
        current = existing;
        return;
      }
      const label = formatSegment(segment);
      const node: PathNode = {
        key: nodeKey,
        label,
        path: formatPath(nextSegments),
        isArray: segment.kind === 'array',
        depth: index,
        children: [],
        subtreeCount: 1,
      };
      current.children.push(node);
      current = node;
    });
  });

  const computeCounts = (node: PathNode) => {
    let count = 1;
    node.children.forEach((child) => {
      count += computeCounts(child);
    });
    node.subtreeCount = count;
    return count;
  };

  computeCounts(root);

  const sortTree = (node: PathNode) => {
    node.children.sort((a, b) => a.label.localeCompare(b.label));
    node.children.forEach(sortTree);
  };

  sortTree(root);

  return root;
}

export function flattenTree(root: PathNode) {
  const list: PathNode[] = [];

  const walk = (node: PathNode) => {
    node.children.forEach((child) => {
      list.push(child);
      walk(child);
    });
  };

  walk(root);
  return list;
}

export function buildDescendantMap(root: PathNode) {
  const map: Record<string, string[]> = {};

  const walk = (node: PathNode) => {
    const descendants: string[] = [];
    node.children.forEach((child) => {
      const childDescendants = walk(child);
      descendants.push(child.key, ...childDescendants);
    });
    map[node.key] = descendants;
    return descendants;
  };

  walk(root);
  return map;
}

export function computeEffectiveSelection(root: PathNode | null, selection: Record<string, boolean>) {
  if (!root) return {} as Record<string, boolean>;
  const map: Record<string, boolean> = {};

  const walk = (node: PathNode, parentIncluded: boolean) => {
    node.children.forEach((child) => {
      const included = parentIncluded && selection[child.key] !== false;
      map[child.key] = included;
      walk(child, included);
    });
  };

  walk(root, true);
  return map;
}
