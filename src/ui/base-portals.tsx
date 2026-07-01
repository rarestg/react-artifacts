import { Dialog } from '@base-ui/react/dialog';
import { Select } from '@base-ui/react/select';
import { useArtifactPortalContainer } from '../components/ArtifactThemeRoot';

/**
 * Portals that mount Base UI overlays inside the `.artifact-theme` boundary so scoped
 * tokens resolve. An explicit `container` still wins; otherwise each falls back to the
 * theme root ref from context — never `document.body`.
 *
 * Popover/Menu/Combobox/etc. arrive with their migrations so knip does not flag unused exports.
 */
export function ArtifactDialogPortal({
  container,
  ...props
}: Omit<Dialog.Portal.Props, 'container'> & { container?: HTMLElement | null }) {
  const fallbackContainer = useArtifactPortalContainer();
  return <Dialog.Portal container={container ?? fallbackContainer} {...props} />;
}

export function ArtifactSelectPortal({
  container,
  ...props
}: Omit<Select.Portal.Props, 'container'> & { container?: HTMLElement | null }) {
  const fallbackContainer = useArtifactPortalContainer();
  return <Select.Portal container={container ?? fallbackContainer} {...props} />;
}
