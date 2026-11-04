import { createContext, type HTMLAttributes, type Ref, use, useCallback, useEffect, useState } from 'react';
import { mergeClassNames } from '../lib/classNames';
import { assignRef } from '../lib/refs';

const ArtifactThemeContext = createContext(false);
const ArtifactPortalContainerContext = createContext<HTMLDivElement | null | undefined>(undefined);
const warnedComponents = new Set<string>();

export type ArtifactThemeRootProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
};

export function ArtifactThemeRoot({ ref, className, ...props }: ArtifactThemeRootProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      setPortalContainer(node);
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <ArtifactThemeContext.Provider value={true}>
      <ArtifactPortalContainerContext.Provider value={portalContainer}>
        <div ref={setRef} className={mergeClassNames('artifact-theme', className)} {...props} />
      </ArtifactPortalContainerContext.Provider>
    </ArtifactThemeContext.Provider>
  );
}

/**
 * The artifact theme root element, for portaling Base UI overlays inside the
 * `.artifact-theme` boundary so scoped tokens resolve (light + dark, device preview,
 * and standalone routes). It is `null` until the root mounts, and Base UI waits on `null`.
 * Throws when used outside `<ArtifactThemeRoot>`: an overlay without an in-boundary
 * container would escape to `document.body` and lose the tokens.
 */
export function useArtifactPortalContainer() {
  const container = use(ArtifactPortalContainerContext);
  if (container === undefined) {
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
