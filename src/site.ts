export const SITE_ORIGIN = 'https://tools.rares.blog';
export const SITE_TITLE = 'tools.rares.blog';
export const HOME_TITLE = 'tools.rares.blog — small self-contained web tools';
export const SITE_DESCRIPTION = 'A small gallery of self-contained web tools built as React artifacts.';

export const formatPageTitle = (name?: string): string => (name ? `${name} · ${SITE_TITLE}` : SITE_TITLE);

export const NOT_FOUND_TITLE = formatPageTitle('Artifact not found');
