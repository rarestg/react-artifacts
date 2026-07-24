// Guard for global keyboard shortcuts: true when the keystroke belongs to a control
// that consumes it (any input, textarea, select, or contenteditable region).
export function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
}
