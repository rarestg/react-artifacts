import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

const sharp2Dir = 'src/artifacts/sharp2';
const sharedPrimitiveNames = [
  'Checkbox',
  'Toggle',
  'CopyButton',
  'CopyableLabel',
  'StatusTag',
  'Button',
  'Input',
  'Tag',
  'Panel',
];

async function readSharp2SourceFiles(dir = sharp2Dir): Promise<Array<{ file: string; source: string }>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: Array<{ file: string; source: string }> = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await readSharp2SourceFiles(entryPath)));
      continue;
    }
    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;
    files.push({ file: entryPath, source: await readFile(entryPath, 'utf8') });
  }

  return files;
}

test('sharp2 no longer defines primitives that belong to src/components', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ file, source }) => `\n// ${file}\n${source}`).join('\n');

  for (const name of sharedPrimitiveNames) {
    assert.doesNotMatch(
      joined,
      new RegExp(`^\\s*(?:export\\s+(?:default\\s+)?)?function\\s+${name}\\b`, 'm'),
      `${name} should not be defined under sharp2`,
    );
    assert.doesNotMatch(
      joined,
      new RegExp(`^\\s*(?:export\\s+)?const\\s+${name}\\b`, 'm'),
      `${name} should not be defined under sharp2`,
    );
  }
});

test('sharp2 imports shared primitives from src/components at usage sites', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ source }) => source).join('\n');

  for (const name of ['Button', 'Input', 'Tag', 'Panel', 'Checkbox', 'Toggle', 'CopyButton', 'CopyableLabel']) {
    assert.match(joined, new RegExp(`import \\{[^}]*${name}[^}]*\\} from ['"](?:\\.\\.\\/)+components\\/${name}['"]`));
  }
  assert.match(joined, /import \{ StatusTag \} from ['"](?:\.\.\/)+components\/StatusTag['"]/);
});

test('sharp2 documentation describes ArtifactThemeRoot and import-based shared components', async () => {
  const guide = await readFile('src/artifacts/sharp2/sharp2.txt', 'utf8');

  assert.match(guide, /ArtifactThemeRoot/);
  assert.match(guide, /import/i);
  assert.doesNotMatch(guide, /self-contained React file/i);
  assert.doesNotMatch(guide, /any React environment/i);
  assert.doesNotMatch(guide, /copy any component directly/i);
  assert.doesNotMatch(guide, /Copy Components Directly/i);
  assert.doesNotMatch(guide, /\bcopy the entire function\b/i);
  assert.doesNotMatch(guide, /\bcopy\b[^.\n]*\binto your (?:app|codebase)\b/i);
  assert.doesNotMatch(guide, /\bpaste\b[^.\n]*\bcomponent\b/i);
});

test('sharp2 documentation matches shared primitive APIs', async () => {
  const guide = await readFile('src/artifacts/sharp2/sharp2.txt', 'utf8');

  assert.match(guide, /`Button`[^|]*\|[^|]*\|[^|\n]*`size`: `sm`, `md`, `lg`/);
  assert.match(guide, /`Checkbox`[^|]*\|[^|]*\|[^|\n]*`onCheckedChange`/);
  assert.match(guide, /`Toggle`[^|]*\|[^|]*\|[^|\n]*`onCheckedChange`/);
  assert.doesNotMatch(guide, /`Button`[^|\n]*\|[^|\n]*\|[^|\n]*`size`: `sm`, `default`, `lg`/);
  assert.doesNotMatch(guide, /`(?:Checkbox|Toggle)`[^|\n]*\|[^|\n]*\|[^|\n]*`onChange`/);
});

test('Row remains sharp2-local and is not exported from src/components', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ source }) => source).join('\n');

  assert.match(joined, /function Row\b|export function Row\b/);

  await assert.rejects(readFile('src/components/Row.tsx', 'utf8'), /ENOENT/);
});

test('sharp2 keeps Panel structural instead of adding interactive affordances to it', async () => {
  const files = await readSharp2SourceFiles();

  for (const { file, source } of files) {
    assert.doesNotMatch(
      source,
      /<Panel\b[^>]*className="[^"]*(?:cursor-pointer|hover:bg|active:bg)/s,
      `${file} should not pass interactive affordance classes to shared Panel`,
    );
  }
});

test('sharp2 avoids viewport breakpoints in preview-sensitive showcase layout', async () => {
  const files = await readSharp2SourceFiles();
  const joined = files.map(({ file, source }) => `\n// ${file}\n${source}`).join('\n');

  assert.doesNotMatch(joined, /\b(?:sm|md|lg|xl|2xl):grid-cols-/);
  assert.doesNotMatch(joined, /grid-cols-\[200px_1fr\]/);
  assert.match(joined, /auto-fit|minmax\(/);
});

test('sharp2 SearchInput uses managed combobox focus instead of focusable option buttons', async () => {
  const source = await readFile('src/artifacts/sharp2/components/SearchInput.tsx', 'utf8');
  const indexSource = await readFile('src/artifacts/sharp2/index.tsx', 'utf8');

  assert.match(source, /role="combobox"/);
  assert.match(source, /ariaLabel/);
  assert.match(source, /aria-label=/);
  assert.match(indexSource, /ariaLabel="Search conversations"/);
  assert.match(source, /aria-expanded=/);
  assert.match(source, /aria-controls=/);
  assert.match(source, /aria-activedescendant=/);
  assert.match(source, /role="option"/);
  assert.match(source, /aria-selected=/);
  assert.match(source, /border-l-\[var\(--accent\)\]/);
  assert.match(source, /No results for/);
  const handleKeyDownStart = source.indexOf('const handleKeyDown');
  const escapeBranch = source.indexOf("event.key === 'Escape'", handleKeyDownStart);
  const emptyResultsReturn = /if \([^)]*results\.length === 0[^)]*\) return;/.exec(source.slice(handleKeyDownStart));
  assert.notEqual(handleKeyDownStart, -1);
  assert.notEqual(escapeBranch, -1);
  assert.ok(
    emptyResultsReturn === null || escapeBranch < handleKeyDownStart + emptyResultsReturn.index,
    'Escape should be handled before any empty-results early return',
  );
  assert.doesNotMatch(source, /<button[^>]*role="option"/s);
  assert.doesNotMatch(source, /focus:bg-\[var\(--surface-muted\)\]/);
  assert.doesNotMatch(source, /role="option"[\s\S]{0,600}focus-visible:/);
  assert.doesNotMatch(source, /role="option"[\s\S]{0,600}tabIndex=/);
  assert.doesNotMatch(source, /tabIndex=[\s\S]{0,600}role="option"/);
});

test('sharp2 Popover stays plain and avoids incomplete composite menu semantics', async () => {
  const source = await readFile('src/artifacts/sharp2/components/Popover.tsx', 'utf8');
  const indexSource = await readFile('src/artifacts/sharp2/index.tsx', 'utf8');

  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-controls/);
  assert.match(source, /Escape/);
  assert.match(source, /focus\(\)/);
  assert.match(source, /focus-visible:bg-\[var\(--surface-muted\)\]/);
  assert.match(source, /focus-visible:ring-2/);
  assert.doesNotMatch(source, /role="menu"/);
  assert.doesNotMatch(indexSource, /role="menuitem"/);
});
