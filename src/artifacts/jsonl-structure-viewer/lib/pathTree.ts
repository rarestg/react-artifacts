import type { PathNode } from '../types';

export function buildPaths(data: unknown) {
  const paths = new Set<string>();

  const addPath = (segments: string[]) => {
    const path = segments.join('->');
    if (path) paths.add(path);
  };

  const visitValue = (value: unknown, segments: string[]) => {
    if (Array.isArray(value)) {
      if (segments.length === 0) {
        addPath(['[]']);
      }
      const nextSegments = segments.length === 0 ? ['[]'] : segments;
      value.forEach((item) => {
        if (Array.isArray(item)) {
          const nestedSegments = [...nextSegments, '[]'];
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

  const visitObject = (obj: Record<string, unknown>, segments: string[]) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const arraySegment = `${key}[]`;
        addPath([...segments, arraySegment]);
        value.forEach((item) => {
          if (Array.isArray(item)) {
            const nested = [...segments, arraySegment, '[]'];
            addPath(nested);
            visitValue(item, nested);
          } else if (item && typeof item === 'object') {
            visitObject(item as Record<string, unknown>, [...segments, arraySegment]);
          }
        });
        return;
      }

      const nextSegments = [...segments, key];
      addPath(nextSegments);

      if (value && typeof value === 'object') {
        visitObject(value as Record<string, unknown>, nextSegments);
      }
    });
  };

  visitValue(data, []);

  return Array.from(paths);
}

export function buildTree(paths: string[]) {
  const root: PathNode = {
    id: 'root',
    label: 'root',
    path: '',
    isArray: false,
    depth: -1,
    children: [],
    subtreeCount: 0,
  };

  paths.forEach((path) => {
    const segments = path.split('->');
    let current = root;
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}->${segment}` : segment;
      const id = currentPath;
      const existing = current.children.find((child) => child.id === id);
      if (existing) {
        current = existing;
        return;
      }
      const node: PathNode = {
        id,
        label: segment,
        path: currentPath,
        isArray: segment.endsWith('[]'),
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

  return root;
}

export function flattenTree(root: PathNode) {
  const list: PathNode[] = [];

  const walk = (node: PathNode) => {
    node.children
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach((child) => {
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
      descendants.push(child.path, ...childDescendants);
    });
    map[node.path] = descendants;
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
      const included = parentIncluded && selection[child.path] !== false;
      map[child.path] = included;
      walk(child, included);
    });
  };

  walk(root, true);
  return map;
}
