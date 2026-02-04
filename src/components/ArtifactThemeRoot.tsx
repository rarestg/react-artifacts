import { createContext, forwardRef, type HTMLAttributes, useContext, useEffect } from 'react';

const ArtifactThemeContext = createContext(false);
const warnedComponents = new Set<string>();

export const ArtifactThemeRoot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ArtifactThemeRoot(
  { className, ...props },
  ref,
) {
  return (
    <ArtifactThemeContext.Provider value={true}>
      <div ref={ref} className={['artifact-theme', className].filter(Boolean).join(' ')} {...props} />
    </ArtifactThemeContext.Provider>
  );
});

type ThemeRootRef = { current: HTMLElement | null } | null | undefined;

export function useArtifactThemeGuard(componentName = 'Component', ref?: ThemeRootRef) {
  const inTheme = useContext(ArtifactThemeContext);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
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
