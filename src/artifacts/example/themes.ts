export const themes = [
  { id: 'base', label: 'Base' },
  { id: 'noir', label: 'Noir' },
  { id: 'amber', label: 'Amber' },
  { id: 'aqua', label: 'Aqua' },
  { id: 'forest', label: 'Forest' },
  { id: 'plum', label: 'Plum' },
] as const;

export type ThemeId = (typeof themes)[number]['id'];
