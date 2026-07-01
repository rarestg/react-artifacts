import { Dialog } from '@base-ui/react/dialog';
import { useArtifactPortalContainer } from '../components/ArtifactThemeRoot';

/**
 * Dialog portal that mounts overlays inside the `.artifact-theme` boundary so scoped
 * tokens resolve. An explicit `container` still wins; otherwise it falls back to the
 * theme root ref from context — never `document.body`.
 *
 * Only the Dialog wrapper ships in this PR; Popover/Select/Menu/etc. arrive with their
 * migrations so knip does not flag unused exports.
 */
export function ArtifactDialogPortal({
  container,
  ...props
}: Omit<Dialog.Portal.Props, 'container'> & { container?: HTMLElement | null }) {
  const fallbackContainer = useArtifactPortalContainer();
  return <Dialog.Portal container={container ?? fallbackContainer} {...props} />;
}
