export const SITE_ORIGIN = 'https://tools.rares.blog';
export const SITE_TITLE = 'tools.rares.blog';
export const HOME_TITLE = 'tools.rares.blog · small, single-purpose web tools';
export const SITE_DESCRIPTION =
  'Small, single-purpose web tools: unescape a message, inspect a JSONL file, generate a color palette, and a few more.';
export const SITE_EXPLAINER =
  'Small, single-purpose web tools: unescape a message, inspect a JSONL file, generate a color palette, and a few more. Each was built with an AI model; its row says which. Pick one to open it.';

export const formatPageTitle = (name?: string): string => (name ? `${name} · ${SITE_TITLE}` : SITE_TITLE);

export const NOT_FOUND_TITLE = formatPageTitle('Tool not found');
