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
