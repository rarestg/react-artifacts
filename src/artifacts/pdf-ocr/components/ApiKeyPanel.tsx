import { Check, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/Button';
import { Checkbox } from '../../../components/Checkbox';
import { Input } from '../../../components/Input';
import { mergeClassNames } from '../../../lib/classNames';
import type { Controller } from '../useController';
import { bandClass, bandLabelClass, helperClass } from './primitives';

const TEST_LABEL: Record<Controller['test']['status'], string> = {
  idle: 'Test',
  testing: 'Testing…',
  ok: 'Verified',
  error: 'Retry test',
};

export function ApiKeyPanel({ vm }: { vm: Controller }) {
  const [expanded, setExpanded] = useState(true);

  // Collapse once the key verifies; [Change] re-expands without re-collapsing (status stays "ok").
  useEffect(() => {
    if (vm.test.status === 'ok') setExpanded(false);
  }, [vm.test.status]);

  if (vm.test.status === 'ok' && !expanded) {
    return (
      <section className={mergeClassNames(bandClass, 'flex flex-wrap items-center gap-x-3 gap-y-2')}>
        <span className={bandLabelClass}>1 · API key</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--success-text)]">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          verified
        </span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setExpanded(true)}>
          Change
        </Button>
      </section>
    );
  }

  const messageTone =
    vm.test.status === 'ok'
      ? 'text-[var(--success-text)]'
      : vm.test.status === 'error'
        ? 'text-[var(--danger)]'
        : 'text-[var(--text-muted)]';

  return (
    <section className={mergeClassNames(bandClass, 'space-y-3')}>
      <div className={bandLabelClass}>1 · API key</div>
      <div className="flex items-end gap-2">
        <Input
          aria-label="Gemini API key"
          type={vm.showKey ? 'text' : 'password'}
          autoComplete="off"
          spellCheck={false}
          placeholder="AIza…"
          value={vm.apiKey}
          onChange={(event) => vm.setApiKey(event.currentTarget.value)}
          className="flex-1"
          inputClassName="font-mono"
        />
        <Button
          variant="ghost"
          aria-pressed={vm.showKey}
          aria-label={vm.showKey ? 'Hide API key' : 'Show API key'}
          title={vm.showKey ? 'Hide API key' : 'Show API key'}
          onClick={() => vm.setShowKey(!vm.showKey)}
          className="border border-[var(--border-strong)] px-2 text-[var(--text-muted)]"
        >
          {vm.showKey ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        <Button onClick={() => void vm.runTest()} disabled={vm.test.status === 'testing' || !vm.apiKey.trim()}>
          <span className="relative inline-grid">
            <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
              Retry test
            </span>
            <span className="col-start-1 row-start-1 whitespace-nowrap">{TEST_LABEL[vm.test.status]}</span>
          </span>
        </Button>
      </div>
      {vm.test.message && <p className={mergeClassNames('text-xs', messageTone)}>{vm.test.message}</p>}
      <Checkbox
        label="Remember on this browser"
        checked={vm.rememberKey}
        onCheckedChange={vm.setRememberKey}
        labelClassName="text-xs"
      />
      <p className={helperClass}>Your key stays in this browser and is sent only to Google to run OCR.</p>
    </section>
  );
}
