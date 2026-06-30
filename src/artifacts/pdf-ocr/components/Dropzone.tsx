import { FileText, Loader2, Upload, X } from 'lucide-react';
import { type DragEvent, useRef, useState } from 'react';
import { Button } from '../../../components/Button';
import { mergeClassNames } from '../../../lib/classNames';
import type { Controller } from '../useController';
import { bandClass, bandLabelClass, focusRing, formatBytes } from './primitives';

export function Dropzone({ vm }: { vm: Controller }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => inputRef.current?.click();
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    void vm.pickFile(event.dataTransfer.files);
  };

  const boxClass = mergeClassNames(
    'flex min-h-[5rem] flex-col justify-center border border-dashed p-4 transition-colors motion-reduce:transition-none',
    dragOver
      ? 'border-[color:var(--accent)] bg-[var(--surface-strong)]'
      : 'border-[var(--border-strong)] bg-[var(--surface)]',
  );

  let body: React.ReactNode;
  if (vm.fileReading) {
    body = (
      <span className="inline-flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Reading PDF…
      </span>
    );
  } else if (vm.file) {
    body = (
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="inline-flex min-w-0 items-center gap-2 font-mono text-xs tabular-nums text-[var(--text)]">
          <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <span className="min-w-0 truncate">{vm.file.name}</span>
          <span className="shrink-0 text-[var(--text-muted)]">
            · {vm.file.pageCount} {vm.file.pageCount === 1 ? 'page' : 'pages'} · {formatBytes(vm.file.size)}
          </span>
        </span>
        <Button size="sm" onClick={openPicker} className="shrink-0">
          Replace
        </Button>
      </div>
    );
  } else if (vm.fileError) {
    body = (
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <span className="inline-flex min-w-0 items-start gap-2 text-sm text-[var(--danger-text)]">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" aria-hidden="true" />
          <span className="min-w-0">{vm.fileError}</span>
        </span>
        <Button size="sm" onClick={openPicker} className="shrink-0">
          Choose file
        </Button>
      </div>
    );
  } else {
    body = (
      <button
        type="button"
        onClick={openPicker}
        className={mergeClassNames(
          'flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-none text-center text-sm text-[var(--text-muted)]',
          focusRing,
        )}
      >
        <Upload className="h-5 w-5 text-[var(--text-subtle)]" aria-hidden="true" />
        <span>
          <span className="font-medium text-[var(--text)]">Drop a PDF here</span>, or click to choose
        </span>
      </button>
    );
  }

  return (
    <section className={mergeClassNames(bandClass, 'space-y-2')}>
      <div className={bandLabelClass}>2 · PDF</div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop target; the nested label/input owns keyboard + click */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={boxClass}
      >
        {body}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        aria-label="Choose a PDF file"
        className="sr-only"
        onChange={(event) => {
          void vm.pickFile(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
    </section>
  );
}
