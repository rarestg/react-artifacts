import {
  createContext,
  type HTMLAttributes,
  type Ref,
  type RefObject,
  use,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { mergeClassNames } from '../lib/classNames';
import { assignRef } from '../lib/refs';

const ArtifactThemeContext = createContext(false);
const ArtifactPortalContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(null);
const warnedComponents = new Set<string>();

export type ArtifactThemeRootProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
};

export function ArtifactThemeRoot({ ref, className, ...props }: ArtifactThemeRootProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <ArtifactThemeContext.Provider value={true}>
      <ArtifactPortalContainerContext.Provider value={rootRef}>
        <div ref={setRef} className={mergeClassNames('artifact-theme', className)} {...props} />
      </ArtifactPortalContainerContext.Provider>
    </ArtifactThemeContext.Provider>
  );
}

/**
 * Ref to the artifact theme root element, for portaling Base UI overlays inside the
 * `.artifact-theme` boundary so scoped tokens resolve (light + dark, device preview,
 * and standalone routes). Throws when used outside `<ArtifactThemeRoot>`: an overlay
 * without an in-boundary container would escape to `document.body` and lose the tokens.
 */
export function useArtifactPortalContainer() {
  const container = use(ArtifactPortalContainerContext);
  if (!container) {
    throw new Error('useArtifactPortalContainer must be used within <ArtifactThemeRoot>.');
  }
  return container;
}

type ThemeRootRef = { current: HTMLElement | null } | null | undefined;

export function useArtifactThemeGuard(componentName = 'Component', ref?: ThemeRootRef) {
  const inTheme = use(ArtifactThemeContext);

  useEffect(() => {
    if (!import.meta.env?.DEV) return;
    const hasThemeAncestor = ref?.current?.closest('.artifact-theme');
    if (hasThemeAncestor) return;
    if (inTheme && !ref) return;

    const name = componentName || 'Component';
    if (warnedComponents.has(name)) return;
    warnedComponents.add(name);
    const message = inTheme
      ? `[ArtifactThemeRoot] ${name} is rendered under ArtifactThemeRoot but appears outside the .artifact-theme DOM subtree (possible portal). Ensure it mounts under the theme root or wrap it in <ArtifactThemeRoot>.`
      : `[ArtifactThemeRoot] ${name} rendered outside artifact theme scope. Wrap it in <ArtifactThemeRoot>.`;
    console.warn(message);
  }, [componentName, inTheme, ref]);
}
