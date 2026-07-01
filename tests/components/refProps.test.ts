import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

const migratedFiles = [
  'src/components/Button.tsx',
  'src/components/Panel.tsx',
  'src/components/Input.tsx',
  'src/components/ArtifactThemeRoot.tsx',
  'src/components/CopyButton.tsx',
];

function toImportPath(fromDir: string, repoRelativePath: string) {
  const relativePath = path.relative(fromDir, path.join(repoRoot, repoRelativePath)).split(path.sep).join('/');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

test('migrated ref-prop components no longer use forwardRef', () => {
  for (const file of migratedFiles) {
    const source = readFileSync(path.join(repoRoot, file), 'utf8');

    assert.doesNotMatch(source, /\bforwardRef\b/, `${file} should use regular React 19 ref props`);
  }
});

test('migrated ref-prop contracts compile for DOM refs and imperative handles', () => {
  const tempRoot = path.join(repoRoot, 'node_modules/.tmp');
  mkdirSync(tempRoot, { recursive: true });
  const tempDir = mkdtempSync(path.join(tempRoot, 'react-artifacts-ref-props-'));
  const assertionsFile = path.join(tempDir, 'ref-prop-assertions.tsx');

  try {
    writeFileSync(
      assertionsFile,
      `
import { createElement, createRef } from 'react';

import { ArtifactThemeRoot } from '${toImportPath(tempDir, 'src/components/ArtifactThemeRoot.tsx')}';
import { Button } from '${toImportPath(tempDir, 'src/components/Button.tsx')}';
import { CopyButton as SharedCopyButton, type CopyButtonHandle as SharedCopyButtonHandle } from '${toImportPath(
        tempDir,
        'src/components/CopyButton.tsx',
      )}';
import { Input } from '${toImportPath(tempDir, 'src/components/Input.tsx')}';
import { Panel } from '${toImportPath(tempDir, 'src/components/Panel.tsx')}';

const buttonRef = createRef<HTMLButtonElement>();
createElement(Button, { ref: buttonRef, onClick: () => undefined }, 'Save');
createElement(Button, { ref: (node: HTMLButtonElement | null) => node?.focus() }, 'Save');

const inputRef = createRef<HTMLInputElement>();
createElement(Input, { ref: inputRef, label: 'Email' });
createElement(Input, { ref: (node: HTMLInputElement | null) => node?.select(), 'aria-label': 'Filter' });

const panelRef = createRef<HTMLDivElement>();
createElement(Panel, { ref: panelRef, title: 'Panel' });
createElement(Panel, { ref: (node: HTMLDivElement | null) => { node?.getBoundingClientRect(); } });

const themeRootRef = createRef<HTMLDivElement>();
createElement(ArtifactThemeRoot, { ref: themeRootRef, className: 'custom-theme-root' });

const sharedCopyRef = createRef<SharedCopyButtonHandle>();
createElement(SharedCopyButton, { ref: sharedCopyRef, text: 'value' });
sharedCopyRef.current?.copy();
// @ts-expect-error Shared CopyButton exposes an imperative handle, not its DOM button.
createElement(SharedCopyButton, { ref: createRef<HTMLButtonElement>(), text: 'value' });
`,
    );

    execFileSync(
      process.execPath,
      [
        path.join(repoRoot, 'node_modules/typescript/bin/tsc'),
        '--noEmit',
        '--target',
        'ES2022',
        '--lib',
        'ES2022,DOM,DOM.Iterable',
        '--module',
        'ESNext',
        '--moduleResolution',
        'bundler',
        '--jsx',
        'react-jsx',
        '--strict',
        '--skipLibCheck',
        '--types',
        'vite/client',
        '--allowImportingTsExtensions',
        '--verbatimModuleSyntax',
        '--moduleDetection',
        'force',
        assertionsFile,
      ],
      { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' },
    );
  } catch (error) {
    const { message, stderr, stdout } = error as { message?: string; stderr?: string; stdout?: string };
    assert.fail([message, stdout, stderr].filter(Boolean).join('\n'));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
