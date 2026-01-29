import {
  type AriaAttributes,
  type ButtonHTMLAttributes,
  type ChangeEventHandler,
  Component,
  cloneElement,
  type FocusEventHandler,
  Fragment,
  type InputHTMLAttributes,
  isValidElement,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

type SectionCols = 1 | 2 | 3;
type TagVariant = 'base' | 'muted' | 'solid';
type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'default' | 'lg';
type PanelVariant = 'default' | 'muted' | 'dashed';
type ToolCallStatus = 'success' | 'error' | 'pending';
type MessageRole = 'user' | 'assistant' | 'thinking' | 'tool';
type RenderMode = 'default' | 'literal' | 'rendered';
type CopyButtonStatus = 'idle' | 'copied' | 'failed';
type CopyableLabelStatus = 'idle' | 'hover' | 'copied' | 'failed';

type SearchResult = {
  id?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: ReactNode;
};

type VisibleTypes = {
  user: boolean;
  assistant: boolean;
  thinking: boolean;
  toolCalls: boolean;
  tokenCounters: boolean;
};

type MessageItem = {
  id?: string;
  role: MessageRole;
  content: string;
  timestamp?: string;
  type?: undefined;
};

type TokenCounterItem = {
  id?: string;
  type: 'token_counter';
  used: number;
  limit: number;
  label?: string;
};

type ToolCallItem = {
  id?: string;
  type: 'tool_call';
  tool: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
};

type TurnItem = MessageItem | TokenCounterItem | ToolCallItem;

type ConversationTurnData = {
  id?: string;
  turnNumber: number;
  timestamp?: string;
  duration?: string;
  items: TurnItem[];
};

type SectionProps = {
  title: string;
  children: ReactNode;
  cols?: SectionCols;
};

type SubSectionProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

type StatusTagProps = {
  label: string;
  reserveLabel?: string;
  active?: boolean;
  icon?: ReactNode;
  className?: string;
};

type TagProps = {
  children: ReactNode;
  variant?: TagVariant;
  className?: string;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  className?: string;
};

type SearchInputProps = {
  placeholder?: string;
  results?: SearchResult[];
  onSelect?: (result: SearchResult) => void;
  onSearch?: (value: string) => void;
  showResults?: boolean;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

type CheckboxProps = {
  label: string;
  reserveLabel?: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
};

type ToggleProps = {
  label: string;
  reserveLabel?: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
};

type RowProps = {
  children: ReactNode;
  selected?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

type PanelProps = {
  children: ReactNode;
  variant?: PanelVariant;
  className?: string;
};

type CopyButtonProps = {
  text: string;
  idleLabel?: string;
  showIcon?: boolean;
  className?: string;
};

type CopyableLabelProps = {
  value: string;
  icon?: ReactNode;
  className?: string;
};

type CodeBlockProps = {
  children: string;
  language?: string;
};

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
};

type PopoverTriggerProps = {
  onClick?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
} & AriaAttributes;

type PopoverProps = {
  trigger: ReactElement<PopoverTriggerProps>;
  children: ReactNode;
  open: boolean;
  onToggle?: () => void;
};

type TokenCounterProps = {
  used: number;
  limit: number;
  label?: string;
};

type ToolCallProps = {
  tool: string;
  input: string;
  output: string;
  timestamp?: string;
  status?: ToolCallStatus;
};

type MessageTypeToggleProps = {
  label: string;
  count: number;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  color: string;
};

type MessageCardProps = {
  role: MessageRole;
  content: string;
  timestamp?: string;
  renderMode?: RenderMode;
  onToggleRender?: () => void;
};

type ConversationTurnProps = {
  turnNumber: number;
  timestamp?: string;
  duration?: string;
  items: TurnItem[];
  renderModes?: RenderMode[];
  onToggleRender?: (messageIndex: number) => void;
  visibleTypes?: Partial<VisibleTypes>;
};

// ============================================
// DESIGN TOKENS (conceptual)
// ============================================
// Conceptual reference — not consumed in code, kept as a design token inventory
const tokens = {
  surface: {
    0: 'bg-white', // panel
    1: 'bg-slate-50', // muted grouping
    2: 'bg-slate-100', // pressed/strong hover
  },
  border: {
    default: 'border-slate-200',
    muted: 'border-slate-100',
    strong: 'border-slate-300',
  },
  text: {
    0: 'text-slate-900', // primary
    1: 'text-slate-600', // secondary
    2: 'text-slate-400', // muted
  },
};
void tokens;

const getSearchResultKey = (result: SearchResult) => {
  if (result.id) return result.id;
  return [result.title, result.subtitle, result.meta].filter(Boolean).join('::');
};

const getTurnKey = (turn: ConversationTurnData) => turn.id ?? `turn-${turn.turnNumber}-${turn.timestamp ?? ''}`;

const getTurnItemKey = (item: TurnItem) => {
  if (item.id) return item.id;
  if (item.type === 'token_counter') {
    return `token-${item.label ?? 'context'}-${item.used}-${item.limit}`;
  }
  if (item.type === 'tool_call') {
    return `tool-${item.tool}-${item.timestamp ?? ''}-${item.input.length}-${item.output.length}`;
  }
  return `msg-${item.role}-${item.timestamp ?? ''}-${item.content.length}`;
};

// ============================================
// SECTION WRAPPER
// ============================================
const colsClass: Record<SectionCols, string> = {
  1: '',
  2: 'grid grid-cols-2 gap-6',
  3: 'grid grid-cols-3 gap-6',
};

function Section({ title, children, cols = 1 }: SectionProps) {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-2 bg-slate-50">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      </div>
      <div className={`p-6 ${colsClass[cols] ?? ''}`}>{children}</div>
    </div>
  );
}

function SubSection({ label, children, className }: SubSectionProps) {
  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      {children}
    </div>
  );
}

// ============================================
// ICONS
// ============================================
// Icons from lucide-react
import {
  Check as CheckIcon,
  ChevronRight as ChevronIcon,
  Copy as CopyIcon,
  Folder as FolderIcon,
  GitBranch as GitBranchIcon,
  Github as GitRepoIcon,
  MessageSquare as MessageIcon,
  Plug as PlugIcon,
  Search as SearchIcon,
  X as XIcon,
} from 'lucide-react';

// ============================================
// PRIMITIVES: STATUS TAG
// ============================================
function StatusTag({ label, reserveLabel, active = true, icon, className }: StatusTagProps) {
  const resolvedReserveLabel = reserveLabel ?? label;

  return (
    <span
      data-active={active ? 'true' : 'false'}
      className={[
        'inline-flex items-center gap-2 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] leading-none',
        'transition-colors duration-150 motion-reduce:transition-none',
        active ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-200 bg-slate-50 text-slate-400',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span
        className={[
          'w-2 h-2 shrink-0 transition-colors duration-150 motion-reduce:transition-none',
          active ? 'bg-emerald-500 border border-emerald-500' : 'bg-transparent border border-slate-400',
        ].join(' ')}
        aria-hidden="true"
      />
      <span className="relative inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
    </span>
  );
}

// ============================================
// PRIMITIVES: TAG (base, muted, solid)
// ============================================
function Tag({ children, variant = 'base', className }: TagProps) {
  const variants: Record<TagVariant, string> = {
    base: 'border border-slate-200 bg-white text-slate-600',
    muted: 'border-transparent bg-slate-100 text-slate-600',
    solid: 'border-transparent bg-slate-800 text-white',
  };

  return (
    <span
      className={['inline-flex items-center px-2 py-0.5 text-[11px] font-medium', variants[variant], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}

// ============================================
// PRIMITIVES: BUTTON
// ============================================
function Button({ children, variant = 'default', size = 'default', disabled, className, ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    default:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-200 active:border-slate-400',
    primary: 'border border-slate-800 bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-950',
    ghost: 'border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50 active:bg-red-100 active:border-red-300',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-2 text-xs',
    default: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-sm',
  };

  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium transition-colors motion-reduce:transition-none cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
        'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================
// PRIMITIVES: INPUT
// ============================================
function Input({ label, error, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = props.id ?? generatedId;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full h-9 px-3 text-sm border bg-white text-slate-900 placeholder:text-slate-400',
          'focus:outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
          error ? 'border-red-300' : 'border-slate-200',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ============================================
// PRIMITIVES: SEARCH INPUT (with floating dropdown)
// ============================================
function SearchInput({
  placeholder = 'Search...',
  results = [],
  onSelect,
  onSearch, // Intentionally unused — reserved for future wiring
  showResults,
  onFocus,
  onBlur,
  value,
  onChange,
}: SearchInputProps) {
  void onSearch;
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    if (!showResults) {
      setActiveIndex(-1);
      return;
    }
    if (results.length === 0) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex((prev) => (prev >= 0 && prev < results.length ? prev : 0));
  }, [showResults, results.length]);

  const activeResult = activeIndex >= 0 && activeIndex < results.length ? results[activeIndex] : null;

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!showResults || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      if (activeResult) {
        event.preventDefault();
        onSelect?.(activeResult);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setActiveIndex(-1);
      (event.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <div className="relative">
      {/* Input container */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults && results.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeResult ? `${listboxId}-option-${getSearchResultKey(activeResult)}` : undefined}
          className={[
            'w-full h-9 pl-9 pr-3 text-sm border bg-white text-slate-900 placeholder:text-slate-400',
            'focus:outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
            'border-slate-200',
          ].join(' ')}
        />
      </div>

      {/* Floating dropdown - absolutely positioned */}
      {showResults && results.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 border border-slate-200 bg-white max-h-64 overflow-y-auto"
        >
          {results.map((result, index) => (
            <button
              key={getSearchResultKey(result)}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                onSelect?.(result);
              }}
              id={`${listboxId}-option-${getSearchResultKey(result)}`}
              role="option"
              aria-selected={index === activeIndex}
              className={[
                'w-full text-left px-3 py-2 flex items-center gap-3 cursor-pointer',
                'hover:bg-slate-50 active:bg-slate-200 focus:bg-slate-50 focus:outline-none',
                index === activeIndex && 'bg-slate-50',
                'border-b border-slate-100 last:border-b-0',
              ].join(' ')}
            >
              {result.icon && <span className="shrink-0 text-slate-400">{result.icon}</span>}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-800 truncate">{result.title}</div>
                {result.subtitle && <div className="text-xs text-slate-500 truncate">{result.subtitle}</div>}
              </div>
              {result.meta && <span className="shrink-0 text-xs text-slate-400">{result.meta}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// PRIMITIVES: CHECKBOX
// ============================================
function Checkbox({ label, reserveLabel, checked, onChange, disabled }: CheckboxProps) {
  const resolvedReserveLabel = reserveLabel ?? label;

  return (
    <label
      className={[
        'flex items-center gap-2 cursor-pointer select-none py-1',
        disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'w-4 h-4 shrink-0 border flex items-center justify-center transition-colors motion-reduce:transition-none',
          'focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-1 focus-within:ring-offset-white',
          checked
            ? 'bg-slate-800 border-slate-800'
            : 'bg-white border-slate-300 hover:border-slate-400 active:bg-slate-100',
        ].join(' ')}
      >
        {checked && <CheckIcon className="w-3 h-3 text-white" />}
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
      </span>
      <span className="relative inline-grid min-w-0 text-sm text-slate-700">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
    </label>
  );
}

// ============================================
// PRIMITIVES: TOGGLE (checkbox-style for devtool feel)
// ============================================
function Toggle({ label, reserveLabel, checked, onChange, disabled }: ToggleProps) {
  const resolvedReserveLabel = reserveLabel ?? label;

  return (
    <label
      className={[
        'flex items-center gap-3 cursor-pointer select-none py-1',
        disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'relative w-8 h-4 shrink-0 border transition-colors motion-reduce:transition-none',
          'focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-1 focus-within:ring-offset-white',
          checked
            ? 'bg-slate-800 border-slate-800 active:bg-slate-900'
            : 'bg-slate-200 border-slate-300 hover:border-slate-400 active:bg-slate-300',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white transition-transform duration-150 motion-reduce:transition-none',
            checked ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')}
        />
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
      </span>
      <span className="relative inline-grid min-w-0 text-sm text-slate-700">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {resolvedReserveLabel}
        </span>
        <span className="col-start-1 row-start-1 min-w-0 truncate">{label}</span>
      </span>
    </label>
  );
}

// ============================================
// PRIMITIVES: ROW (for lists)
// ============================================
function Row({ children, selected, onClick, className }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2.5 flex items-center gap-3 transition-[background-color] motion-reduce:transition-none cursor-pointer border-l-2',
        'focus:outline-none focus-visible:bg-slate-50',
        'hover:bg-slate-50 active:bg-slate-200',
        // Apply transparent left border only when not selected; prevents utility order from hiding selection.
        selected ? 'bg-slate-50 border-l-slate-800' : 'border-l-transparent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

// ============================================
// PRIMITIVES: PANEL
// ============================================
function Panel({ children, variant = 'default', className }: PanelProps) {
  const variants: Record<PanelVariant, string> = {
    default: 'border border-slate-200 bg-white',
    muted: 'bg-slate-50',
    dashed: 'border border-dashed border-slate-300 bg-white',
  };

  return <div className={[variants[variant], className].filter(Boolean).join(' ')}>{children}</div>;
}

// ============================================
// PRIMITIVES: COPY BUTTON
// ============================================
function CopyButton({ text, idleLabel = 'Copy', showIcon = true, className }: CopyButtonProps) {
  const [status, setStatus] = useState<CopyButtonStatus>('idle');

  const labels: Record<CopyButtonStatus, string> = {
    idle: idleLabel,
    copied: 'Copied ✓',
    failed: 'Failed ✗',
  };

  // Reserve to longest label for stable width
  const reserveLabel = idleLabel.length > 8 ? idleLabel : 'Copied ✓';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('failed');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        'inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border transition-colors motion-reduce:transition-none cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
        status === 'copied'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : status === 'failed'
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:bg-slate-200 active:border-slate-400',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showIcon && <CopyIcon className="w-3 h-3 shrink-0" />}
      {idleLabel && (
        <span className="relative inline-grid min-w-0">
          <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
            {reserveLabel}
          </span>
          <span className="col-start-1 row-start-1">{labels[status]}</span>
        </span>
      )}
      <span className="sr-only" aria-live="assertive">
        {status === 'copied' ? 'Copied to clipboard' : status === 'failed' ? 'Copy failed' : ''}
      </span>
    </button>
  );
}

// ============================================
// PRIMITIVES: COPYABLE LABEL (for metadata display)
// ============================================
function CopyableLabel({ value, icon, className }: CopyableLabelProps) {
  const [status, setStatus] = useState<CopyableLabelStatus>('idle'); // idle | hover | copied | failed

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('failed');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const displayText: Record<CopyableLabelStatus, string> = {
    idle: value,
    hover: 'Copy',
    copied: 'Copied ✓',
    failed: 'Failed ✗',
  };

  // Reserve width to the longest of value or "Copied ✓"
  const reserveLabel = value.length > 8 ? value : 'Copied ✓';

  return (
    <button
      type="button"
      onClick={handleCopy}
      onMouseEnter={() => status === 'idle' && setStatus('hover')}
      onMouseLeave={() => status === 'hover' && setStatus('idle')}
      title={`Copy: ${value}`}
      className={[
        'inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border transition-colors motion-reduce:transition-none cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
        status === 'copied'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : status === 'failed'
            ? 'border-red-300 bg-red-50 text-red-700'
            : status === 'hover'
              ? 'border-slate-300 bg-slate-50 text-slate-700 active:bg-slate-200'
              : 'border-slate-200 bg-white text-slate-600 active:bg-slate-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
      <span className="relative inline-grid min-w-0">
        <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0 pointer-events-none">
          {reserveLabel}
        </span>
        <span className="col-start-1 row-start-1 truncate">{displayText[status]}</span>
      </span>
    </button>
  );
}

// ============================================
// PRIMITIVES: CODE BLOCK
// ============================================
function CodeBlock({ children, language }: CodeBlockProps) {
  return (
    <div className="relative border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 bg-slate-100">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{language}</span>
        <CopyButton text={children} className="border-0 bg-transparent hover:bg-slate-200 px-1.5" />
      </div>
      <pre className="p-3 text-sm text-slate-800 overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// ============================================
// PRIMITIVES: MODAL
// ============================================
function Modal({ open, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !modalRef.current) return;
    const modal = modalRef.current;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay scrim (allowed exception) */}
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />

      {/* Modal surface */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-md border border-slate-300 bg-white shadow-none"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ============================================
// PRIMITIVES: POPOVER
// ============================================
function Popover({ trigger, children, open, onToggle }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleTriggerKeyDown: KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle?.();
    }
  };

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (event) => {
          trigger.props.onClick?.(event);
          if (!event.defaultPrevented) {
            onToggle?.();
          }
        },
        onKeyDown: (event) => {
          trigger.props.onKeyDown?.(event);
          if (!event.defaultPrevented) {
            handleTriggerKeyDown(event);
          }
        },
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      })
    : null;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onToggle?.();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggle?.();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onToggle]);

  return (
    <div ref={popoverRef} className="relative inline-block">
      {triggerNode}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-10 min-w-[200px] border border-slate-200 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// PRIMITIVES: TOKEN COUNTER
// ============================================
function TokenCounter({ used, limit, label = 'Context Window' }: TokenCounterProps) {
  const percentage = Math.round((used / limit) * 100);
  const filledBlocks = Math.round(percentage / 5); // 20 blocks total
  const emptyBlocks = 20 - filledBlocks;

  const formatTokens = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="border border-slate-300 bg-slate-50 font-mono text-xs">
      <div className="px-3 py-1.5 border-b border-slate-300 bg-slate-100 flex items-center justify-between">
        <span className="font-semibold text-slate-600 uppercase tracking-wide text-[10px]">Tokens & Limits</span>
        <CopyButton
          text={`${label}: ${used} / ${limit} tokens (${percentage}%)`}
          className="border-0 bg-transparent hover:bg-slate-200 px-1.5"
        />
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="text-slate-500 text-[10px] uppercase tracking-wide">{label}</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-slate-400">[</span>
            <span className="text-emerald-600">{'█'.repeat(filledBlocks)}</span>
            <span className="text-slate-300">{'░'.repeat(emptyBlocks)}</span>
            <span className="text-slate-400">]</span>
          </div>
          <span
            className={[
              'tabular-nums',
              percentage > 90 ? 'text-red-600' : percentage > 75 ? 'text-amber-600' : 'text-slate-600',
            ].join(' ')}
          >
            {percentage}% Used
          </span>
          <span className="text-slate-400 tabular-nums">
            ({formatTokens(used)} / {formatTokens(limit)} tokens)
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRIMITIVES: TOOL CALL (input + output)
// ============================================
function ToolCall({ tool, input, output, timestamp, status = 'success' }: ToolCallProps) {
  const [expanded, setExpanded] = useState(true);

  const statusConfig: Record<ToolCallStatus, { label: string; color: string }> = {
    success: { label: 'Success', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    error: { label: 'Error', color: 'text-red-600 bg-red-50 border-red-200' },
    pending: { label: 'Running', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  };

  const config = statusConfig[status] || statusConfig.success;

  return (
    <div className="border border-slate-200 border-l-2 border-l-violet-500 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-slate-600 active:text-slate-800 cursor-pointer p-0.5"
          >
            <ChevronIcon
              className={`w-3.5 h-3.5 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
          <span className="text-xs font-semibold text-slate-700">Tool Call</span>
          <Tag variant="muted" className="font-mono">
            {tool}
          </Tag>
          {timestamp && <span className="text-[10px] text-slate-400 tabular-nums">{timestamp}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 border ${config.color}`}>{config.label}</span>
          <CopyButton
            text={`Tool: ${tool}\nInput: ${input}\nOutput: ${output}`}
            className="border-0 bg-transparent hover:bg-slate-100 px-1.5"
          />
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-slate-100">
          {/* Input */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-violet-500 mb-1">Input</div>
            <pre className="font-mono text-sm text-slate-700 whitespace-pre-wrap break-words bg-slate-50 border border-slate-200 px-2 py-1.5">
              {input}
            </pre>
          </div>

          {/* Output */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 mb-1">Output</div>
            <pre className="font-mono text-sm text-slate-700 whitespace-pre-wrap break-words bg-slate-50 border border-slate-200 px-2 py-1.5 max-h-48 overflow-y-auto">
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PRIMITIVES: MESSAGE TYPE TOGGLE
// ============================================
function MessageTypeToggle({ label, count, checked, onChange, color }: MessageTypeToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none py-1 px-2 hover:bg-slate-50 active:bg-slate-100 transition-colors motion-reduce:transition-none">
      <span
        className={[
          'w-3.5 h-3.5 shrink-0 border flex items-center justify-center transition-colors motion-reduce:transition-none',
          checked ? `${color} border-current` : 'bg-white border-slate-300',
        ].join(' ')}
      >
        {checked && <CheckIcon className="w-2.5 h-2.5 text-white" />}
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      </span>
      <span className="text-xs text-slate-600">{label}</span>
      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 tabular-nums">{count}</span>
    </label>
  );
}

// ============================================
// PRIMITIVES: RENDER ERROR BOUNDARY
// ============================================
class RenderErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function renderInlineMarkdown(text: string, keyBase: string): ReactNode[] {
  const tokenRegex = /`[^`]+`|\*\*[^*]+\*\*/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(tokenRegex)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      nodes.push(<Fragment key={`${keyBase}-t-${cursor}`}>{text.slice(cursor, start)}</Fragment>);
    }

    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`${keyBase}-c-${start}`}
          className="px-1 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[13px]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <strong key={`${keyBase}-b-${start}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    }

    cursor = start + token.length;
  }

  if (cursor < text.length || nodes.length === 0) {
    nodes.push(<Fragment key={`${keyBase}-t-${cursor}`}>{text.slice(cursor)}</Fragment>);
  }

  return nodes;
}

// ============================================
// PRIMITIVES: MESSAGE CARD (conversation rendering)
// ============================================
type MessageContentPart =
  | { type: 'text'; content: string; start: number; end: number }
  | { type: 'code'; lang: string; content: string; start: number; end: number };

function MessageCard({ role, content, timestamp, renderMode = 'default', onToggleRender }: MessageCardProps) {
  // Role configuration
  const roleConfig: Record<
    MessageRole,
    { label: string; borderColor: string; bgColor: string; defaultRender: RenderMode; alwaysLiteral?: boolean }
  > = {
    user: {
      label: 'User',
      borderColor: 'border-l-blue-500',
      bgColor: 'bg-white',
      defaultRender: 'literal', // user = literal by default
    },
    assistant: {
      label: 'Assistant',
      borderColor: 'border-l-emerald-500',
      bgColor: 'bg-white',
      defaultRender: 'rendered', // assistant = rendered by default
    },
    thinking: {
      label: 'Thinking',
      borderColor: 'border-l-amber-400',
      bgColor: 'bg-amber-50',
      defaultRender: 'rendered',
    },
    tool: {
      label: 'Tool Output',
      borderColor: 'border-l-slate-400',
      bgColor: 'bg-slate-50',
      defaultRender: 'literal', // tool = always literal
      alwaysLiteral: true,
    },
  };

  const config = roleConfig[role] || roleConfig.assistant;
  const isLiteral =
    config.alwaysLiteral ||
    renderMode === 'literal' ||
    (renderMode === 'default' && config.defaultRender === 'literal');

  return (
    <div className={['border border-slate-200 border-l-2', config.borderColor, config.bgColor].join(' ')}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">{config.label}</span>
          {timestamp && <span className="text-[10px] text-slate-400 tabular-nums">{timestamp}</span>}
        </div>
        <div className="flex items-center gap-1">
          {/* Render mode toggle (not for tool/meta) */}
          {!config.alwaysLiteral && (
            <button
              type="button"
              onClick={onToggleRender}
              className="px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 cursor-pointer transition-colors motion-reduce:transition-none"
            >
              {isLiteral ? 'Raw' : 'Rendered'}
            </button>
          )}
          <CopyButton text={content} className="border-0 bg-transparent hover:bg-slate-100 px-1.5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {isLiteral ? (
          // Literal rendering (pre-wrap, monospace, exact text)
          <pre className="font-mono text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
            {content}
          </pre>
        ) : (
          // "Rendered" markdown — wrapped in error boundary; falls back to literal on failure
          <RenderErrorBoundary
            fallback={
              <pre className="font-mono text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                {content}
              </pre>
            }
          >
            <div className="font-mono text-sm text-slate-800 space-y-2 leading-relaxed">
              {(() => {
                // First, extract code blocks to protect them from paragraph splitting
                const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
                const parts: MessageContentPart[] = [];
                let lastIndex = 0;
                const contentCopy = content;
                let match = codeBlockRegex.exec(contentCopy);
                while (match !== null) {
                  // Add text before this code block
                  if (match.index > lastIndex) {
                    parts.push({
                      type: 'text',
                      content: contentCopy.slice(lastIndex, match.index),
                      start: lastIndex,
                      end: match.index,
                    });
                  }
                  // Add the code block
                  parts.push({
                    type: 'code',
                    lang: match[1],
                    content: match[2],
                    start: match.index,
                    end: match.index + match[0].length,
                  });
                  lastIndex = match.index + match[0].length;
                  match = codeBlockRegex.exec(contentCopy);
                }
                // Add remaining text after last code block
                if (lastIndex < contentCopy.length) {
                  parts.push({
                    type: 'text',
                    content: contentCopy.slice(lastIndex),
                    start: lastIndex,
                    end: contentCopy.length,
                  });
                }

                return parts.map((part) => {
                  const partKey = `${part.type}-${part.start}`;

                  if (part.type === 'code') {
                    return (
                      <div key={partKey} className="border border-slate-200 bg-slate-50">
                        {part.lang && (
                          <div className="px-2 py-1 border-b border-slate-200 bg-slate-100">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                              {part.lang}
                            </span>
                          </div>
                        )}
                        <pre className="p-2 text-sm overflow-x-auto">{part.content}</pre>
                      </div>
                    );
                  }

                  // Process text content (split by paragraphs)
                  const paragraphs = part.content.split('\n\n').filter((p) => p.trim());
                  let paragraphCursor = 0;

                  return paragraphs.map((paragraph) => {
                    const paragraphIndex = part.content.indexOf(paragraph, paragraphCursor);
                    const paragraphStart = paragraphIndex === -1 ? paragraphCursor : paragraphIndex;
                    paragraphCursor = paragraphStart + paragraph.length + 2;
                    const paragraphKey = `p-${part.start + paragraphStart}`;

                    if (paragraph.startsWith('# ')) {
                      return (
                        <div key={paragraphKey} className="font-semibold text-slate-900 border-b border-slate-200 pb-1">
                          {renderInlineMarkdown(paragraph.slice(2), `${paragraphKey}-h1`)}
                        </div>
                      );
                    }
                    if (paragraph.startsWith('## ')) {
                      return (
                        <div key={paragraphKey} className="font-semibold text-slate-800">
                          {renderInlineMarkdown(paragraph.slice(3), `${paragraphKey}-h2`)}
                        </div>
                      );
                    }
                    if (paragraph.startsWith('- ') || paragraph.includes('\n- ')) {
                      const lines = paragraph.split('\n').filter((l) => l.trim());
                      let lineCursor = 0;

                      return (
                        <div key={paragraphKey} className="pl-3">
                          {lines.map((line) => {
                            const lineIndex = paragraph.indexOf(line, lineCursor);
                            const lineStart = lineIndex === -1 ? lineCursor : lineIndex;
                            lineCursor = lineStart + line.length + 1;
                            const lineKey = `li-${part.start + paragraphStart + lineStart}`;
                            const lineText = line.replace(/^- /, '');

                            return (
                              <div key={lineKey} className="flex gap-2">
                                <span className="text-slate-400">•</span>
                                <span>{renderInlineMarkdown(lineText, `${lineKey}-inline`)}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return <p key={paragraphKey}>{renderInlineMarkdown(paragraph, `${paragraphKey}-p`)}</p>;
                  });
                });
              })()}
            </div>
          </RenderErrorBoundary>
        )}
      </div>
    </div>
  );
}

// ============================================
// PRIMITIVES: CONVERSATION TURN
// ============================================
function ConversationTurn({
  turnNumber,
  timestamp,
  duration,
  items,
  renderModes,
  onToggleRender,
  visibleTypes,
}: ConversationTurnProps) {
  // Filter items based on visible types
  const filteredItems = items.filter((item) => {
    if (item.type === 'token_counter') return visibleTypes?.tokenCounters ?? true;
    if (item.type === 'tool_call') return visibleTypes?.toolCalls ?? true;
    if (item.role === 'user') return visibleTypes?.user ?? true;
    if (item.role === 'assistant') return visibleTypes?.assistant ?? true;
    if (item.role === 'thinking') return visibleTypes?.thinking ?? true;
    return true;
  });

  if (filteredItems.length === 0) return null;

  return (
    <div className="border border-slate-200 bg-white">
      {/* Turn header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">Turn {turnNumber}</span>
          {timestamp && <span className="text-[10px] text-slate-400 tabular-nums">{timestamp}</span>}
        </div>
        <div className="flex items-center gap-2">
          {duration && (
            <Tag variant="muted" className="tabular-nums">
              {duration}
            </Tag>
          )}
          <Tag variant="muted" className="tabular-nums">
            {filteredItems.length} items
          </Tag>
        </div>
      </div>

      {/* Messages */}
      <div className="p-3 space-y-3">
        {filteredItems.map((item) => {
          // Find original index for render mode
          const originalIndex = items.indexOf(item);

          if (item.type === 'token_counter') {
            return <TokenCounter key={getTurnItemKey(item)} used={item.used} limit={item.limit} label={item.label} />;
          }

          if (item.type === 'tool_call') {
            return (
              <ToolCall
                key={getTurnItemKey(item)}
                tool={item.tool}
                input={item.input}
                output={item.output}
                timestamp={item.timestamp}
                status={item.status}
              />
            );
          }

          return (
            <MessageCard
              key={getTurnItemKey(item)}
              role={item.role}
              content={item.content}
              timestamp={item.timestamp}
              renderMode={renderModes?.[originalIndex] || 'default'}
              onToggleRender={() => onToggleRender?.(originalIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// MAIN DESIGN SYSTEM SHOWCASE
// ============================================
export default function DesignSystem() {
  const [selectedRow, setSelectedRow] = useState<number>(1);
  const [checkboxes, setCheckboxes] = useState<{ a: boolean; b: boolean; c: boolean }>({
    a: true,
    b: false,
    c: false,
  });
  const [toggles, setToggles] = useState<{ a: boolean; b: boolean }>({ a: true, b: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchingActive, setSearchingActive] = useState(true);

  // Sample search results
  const allSearchResults: SearchResult[] = [
    {
      id: 'project-setup',
      title: 'Project Setup',
      subtitle: 'Initial configuration and dependencies',
      meta: '12 msgs',
      icon: <FolderIcon className="w-4 h-4" />,
    },
    {
      id: 'api-integration',
      title: 'API Integration',
      subtitle: 'REST endpoints and authentication',
      meta: '8 msgs',
      icon: <MessageIcon className="w-4 h-4" />,
    },
    {
      id: 'database-schema',
      title: 'Database Schema',
      subtitle: 'PostgreSQL table definitions',
      meta: '24 msgs',
      icon: <FolderIcon className="w-4 h-4" />,
    },
    {
      id: 'authentication-flow',
      title: 'Authentication Flow',
      subtitle: 'OAuth2 and session management',
      meta: '6 msgs',
      icon: <MessageIcon className="w-4 h-4" />,
    },
    {
      id: 'deployment-config',
      title: 'Deployment Config',
      subtitle: 'Docker and CI/CD pipeline',
      meta: '15 msgs',
      icon: <FolderIcon className="w-4 h-4" />,
    },
  ];

  const filteredResults = searchValue
    ? allSearchResults.filter((r) => {
        const query = searchValue.toLowerCase();
        return r.title.toLowerCase().includes(query) || (r.subtitle?.toLowerCase().includes(query) ?? false);
      })
    : allSearchResults;

  // Conversation render modes (per-message toggle between literal/rendered)
  const [conversationRenderModes, setConversationRenderModes] = useState<Record<string, RenderMode>>({});
  const [demoCheckbox, setDemoCheckbox] = useState(false);

  // Message type visibility (thinking, tool calls, token counters off by default)
  const [visibleTypes, setVisibleTypes] = useState<VisibleTypes>({
    user: true,
    assistant: true,
    thinking: false,
    toolCalls: false,
    tokenCounters: false,
  });

  const toggleMessageRender = (turnIndex: number, messageIndex: number) => {
    const key = `${turnIndex}-${messageIndex}`;
    setConversationRenderModes((prev) => ({
      ...prev,
      [key]: prev[key] === 'literal' ? 'rendered' : 'literal',
    }));
  };

  // Explicitly typed to validate the discriminated union; consider `satisfies ConversationTurnData[]` to preserve literals.
  const sampleConversation: ConversationTurnData[] = [
    {
      id: 'turn-1',
      turnNumber: 1,
      timestamp: '10:42:15',
      duration: '2.3s',
      items: [
        {
          id: 'turn-1-user',
          role: 'user',
          content: 'How do I implement a debounce function in TypeScript? I want to use it for a search input.',
          timestamp: '10:42:15',
        },
        {
          id: 'turn-1-token-1',
          type: 'token_counter',
          used: 1240,
          limit: 200000,
          label: 'Context Window',
        },
        {
          id: 'turn-1-thinking',
          role: 'thinking',
          content:
            'The user wants a debounce implementation for search input. I should provide a generic TypeScript version with proper typing, explain how it works, and show usage.',
          timestamp: '10:42:16',
        },
        {
          id: 'turn-1-assistant',
          role: 'assistant',
          content: `Here's a TypeScript debounce function that works well for search inputs:

\`\`\`typescript
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
\`\`\`

## Usage

- Create the debounced function once (outside render or in \`useMemo\`)
- Pass your search handler and delay in ms
- Call the debounced version on each input change

The function uses **generics** to preserve the original function's parameter types.`,
          timestamp: '10:42:17',
        },
        {
          id: 'turn-1-token-2',
          type: 'token_counter',
          used: 2850,
          limit: 200000,
          label: 'Context Window',
        },
      ],
    },
    {
      id: 'turn-2',
      turnNumber: 2,
      timestamp: '10:43:02',
      duration: '1.8s',
      items: [
        {
          id: 'turn-2-user',
          role: 'user',
          content: 'Can you show me how to use this with React and useCallback?',
          timestamp: '10:43:02',
        },
        {
          id: 'turn-2-token-1',
          type: 'token_counter',
          used: 3120,
          limit: 200000,
          label: 'Context Window',
        },
        {
          id: 'turn-2-assistant',
          role: 'assistant',
          content: `Here's how to integrate debounce with React hooks:

\`\`\`typescript
const SearchInput = () => {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      console.log('Searching:', value);
    }, 300),
    []
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  return <input value={query} onChange={handleChange} />;
};
\`\`\`

**Key points:**

- Use \`useMemo\` (not \`useCallback\`) to create the debounced function once
- Update local state immediately for responsive UI
- The debounced function handles the expensive operation (API call, etc.)`,
          timestamp: '10:43:04',
        },
        {
          id: 'turn-2-token-2',
          type: 'token_counter',
          used: 4580,
          limit: 200000,
          label: 'Context Window',
        },
      ],
    },
    {
      id: 'turn-3',
      turnNumber: 3,
      timestamp: '10:44:30',
      duration: '3.1s',
      items: [
        {
          id: 'turn-3-user',
          role: 'user',
          content: 'Run the tests for this component',
          timestamp: '10:44:30',
        },
        {
          id: 'turn-3-token-1',
          type: 'token_counter',
          used: 4820,
          limit: 200000,
          label: 'Context Window',
        },
        {
          id: 'turn-3-thinking',
          role: 'thinking',
          content: "User wants to run tests. I'll execute the test command and show the output.",
          timestamp: '10:44:31',
        },
        {
          id: 'turn-3-tool-call',
          type: 'tool_call',
          tool: 'bash',
          input: 'npm test -- SearchInput.test.tsx',
          output: `PASS  src/components/SearchInput.test.tsx
  SearchInput
    ✓ renders without crashing (23ms)
    ✓ updates input value on change (15ms)
    ✓ debounces search calls (312ms)
    ✓ cancels pending debounce on unmount (8ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Time:        1.847s`,
          timestamp: '10:44:32',
          status: 'success',
        },
        {
          id: 'turn-3-assistant',
          role: 'assistant',
          content: `All 4 tests pass. The test suite covers:

- Basic rendering
- Input state updates
- Debounce timing behavior
- Cleanup on unmount (important for avoiding memory leaks)

The tests took **1.8s** total, with the debounce timing test accounting for most of that due to the 300ms delay.`,
          timestamp: '10:44:33',
        },
        {
          id: 'turn-3-token-2',
          type: 'token_counter',
          used: 5890,
          limit: 200000,
          label: 'Context Window',
        },
      ],
    },
  ];

  // Count items by type across all turns
  const itemCounts = sampleConversation.reduce(
    (acc, turn) => {
      turn.items.forEach((item) => {
        if (item.type === 'token_counter') acc.tokenCounters++;
        else if (item.type === 'tool_call') acc.toolCalls++;
        else if (item.role === 'user') acc.user++;
        else if (item.role === 'assistant') acc.assistant++;
        else if (item.role === 'thinking') acc.thinking++;
      });
      return acc;
    },
    { user: 0, assistant: 0, thinking: 0, toolCalls: 0, tokenCounters: 0 },
  );

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-300 pb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Sharp UI System</h1>
          <p className="text-sm text-slate-500 mt-1">
            Design primitives for Codex Conversation Manager — scan-first, dense, accessible
          </p>
        </div>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-4">
            <SubSection label="Text hierarchy">
              <div className="space-y-2">
                <p className="text-slate-900 text-base">text-0 — Primary content (slate-900)</p>
                <p className="text-slate-600 text-base">text-1 — Secondary content (slate-600)</p>
                <p className="text-slate-400 text-base">text-2 — Muted content (slate-400)</p>
              </div>
            </SubSection>
            <SubSection label="Label styles">
              <div className="flex flex-wrap gap-4 items-baseline">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Section header</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Sub-label</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Tag label</span>
              </div>
            </SubSection>
            <SubSection label="Inline code">
              <p className="text-sm text-slate-700">
                Use{' '}
                <code className="px-1 py-0.5 border border-slate-200 bg-slate-50 text-slate-800 text-xs">
                  inline code
                </code>{' '}
                for technical references like{' '}
                <code className="px-1 py-0.5 border border-slate-200 bg-slate-50 text-slate-800 text-xs">
                  className
                </code>{' '}
                props.
              </p>
            </SubSection>
          </div>
        </Section>

        {/* Surfaces */}
        <Section title="Surfaces & Containers">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SubSection label="Panel (default)">
              <Panel className="p-4">
                <p className="text-sm text-slate-600">Bordered, opaque, sharp edges</p>
              </Panel>
            </SubSection>
            <SubSection label="Panel (muted)">
              <Panel variant="muted" className="p-4">
                <p className="text-sm text-slate-600">Subtle background for grouping</p>
              </Panel>
            </SubSection>
            <SubSection label="Panel (dashed)">
              <Panel variant="dashed" className="p-4">
                <p className="text-sm text-slate-500">Empty/placeholder states</p>
              </Panel>
            </SubSection>
          </div>
        </Section>

        {/* Tags */}
        <Section title="Tags & Status Indicators">
          <div className="space-y-6">
            <SubSection label="Tag variants">
              <div className="flex flex-wrap gap-2">
                <Tag variant="base">Base tag</Tag>
                <Tag variant="muted">Muted tag</Tag>
                <Tag variant="solid">Solid tag</Tag>
              </div>
            </SubSection>
            <SubSection label="Status tags (with indicator)">
              <div className="flex flex-wrap gap-3">
                <StatusTag
                  label="Connected"
                  active={true}
                  reserveLabel="Disconnected"
                  icon={<PlugIcon className="h-3.5 w-3.5" />}
                />
                <StatusTag
                  label="Disconnected"
                  active={false}
                  reserveLabel="Disconnected"
                  icon={<PlugIcon className="h-3.5 w-3.5" />}
                />
                <StatusTag label="Indexed" active={true} />
                <StatusTag label="Offline" active={false} />
                {/* Position the label relative to the ring, not the tag. */}
                {/* Formula: ring-outset = ring width + ring offset (e.g., 2px + 1px = 3px). */}
                {/* Translate up by 100% + ring-outset to sit on the ring edge. */}
                {/* Translate left by ring-outset (+2px) to align with the ring. */}
                {/* Note: inset rings don't change the outer size. If using a normal (non-inset) ring on the label, */}
                {/* add 1px to ring-outset and the horizontal calc to keep alignment tight. */}
                <div className="relative inline-flex" style={{ '--ring-outset': '1px' } as React.CSSProperties}>
                  <span className="pointer-events-none absolute left-0 top-0 -translate-y-[calc(100%+var(--ring-outset))] -translate-x-[calc(var(--ring-outset)+2px)]">
                    <Tag variant="muted" className="!bg-amber-100 !text-amber-600 ring-2 ring-inset ring-amber-600">
                      Click me
                    </Tag>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchingActive((prev) => !prev)}
                    className="inline-flex cursor-pointer border-0 bg-transparent p-0 ring-2 ring-amber-600 ring-offset-1 ring-offset-white focus:outline-none"
                  >
                    <StatusTag
                      label={searchingActive ? 'Searching' : 'Done'}
                      reserveLabel="Searching"
                      active={searchingActive}
                    />
                  </button>
                </div>
              </div>
            </SubSection>
            <SubSection label="Metadata tags">
              <div className="flex flex-wrap gap-2 items-center">
                <Tag variant="base">main</Tag>
                <Tag variant="muted">v2.4.1</Tag>
                <Tag variant="base" className="tabular-nums">
                  142 items
                </Tag>
                <Tag variant="muted" className="tabular-nums">
                  3.2kb
                </Tag>
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="space-y-6">
            <SubSection label="Variants">
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </SubSection>
            <SubSection label="Sizes">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </SubSection>
            <SubSection label="With icons">
              <div className="flex flex-wrap gap-3">
                <Button variant="default">
                  <SearchIcon className="w-4 h-4" />
                  Search
                </Button>
                <Button variant="primary">
                  <MessageIcon className="w-4 h-4" />
                  New Chat
                </Button>
                <Button variant="ghost" size="sm">
                  <CopyIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </SubSection>
            <SubSection label="States">
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <CopyButton text="Hello world" />
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Copyable Labels */}
        <Section title="Copyable Labels">
          <div className="space-y-6">
            <SubSection label="Session metadata (hover to see copy affordance)">
              <div className="flex flex-wrap gap-2">
                <CopyableLabel
                  value="/users/rares/projects/codex-manager"
                  icon={<FolderIcon className="w-3.5 h-3.5" />}
                />
                <CopyableLabel value="rarestg/codex-manager" icon={<GitRepoIcon className="w-3.5 h-3.5" />} />
                <CopyableLabel value="(feat) integrate-waves" icon={<GitBranchIcon className="w-3.5 h-3.5" />} />
              </div>
            </SubSection>
            <SubSection label="Behavior">
              <div className="p-3 border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-1">
                <div>
                  <strong>Idle:</strong> Shows [icon] + [value]
                </div>
                <div>
                  <strong>Hover:</strong> Shows [icon] + "Copy" (indicates click action)
                </div>
                <div>
                  <strong>Copied:</strong> Shows [icon] + "Copied ✓" (green state)
                </div>
                <div>
                  <strong>Failed:</strong> Shows [icon] + "Failed ✗" (red state)
                </div>
                <div className="pt-2 text-slate-500">
                  Uses reserve label pattern for stable width. Tooltip shows full value.
                </div>
              </div>
            </SubSection>
            <SubSection label="Without icons">
              <div className="flex flex-wrap gap-2">
                <CopyableLabel value="abc123def456" />
                <CopyableLabel value="session-2024-01-15" />
              </div>
            </SubSection>
            <SubSection label="In context (simulated turn header)">
              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700">Turn 1</span>
                    <span className="text-[10px] text-slate-400 tabular-nums">10:42:15</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyableLabel value="~/projects/app" icon={<FolderIcon className="w-3 h-3" />} />
                    <CopyableLabel value="main" icon={<GitBranchIcon className="w-3 h-3" />} />
                    <Tag variant="muted" className="tabular-nums">
                      2.3s
                    </Tag>
                  </div>
                </div>
                <div className="p-3 text-sm text-slate-500">Message content would appear here...</div>
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Search Input */}
        <Section title="Search Input">
          <div className="space-y-6">
            <SubSection label="With floating typeahead results (click to focus)">
              <div className="max-w-md">
                <SearchInput
                  placeholder="Search conversations..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  showResults={searchFocused}
                  results={filteredResults}
                  onSelect={(result) => {
                    setSearchValue(result.title);
                    setSearchFocused(false);
                  }}
                />
              </div>
            </SubSection>
            <div className="p-3 border border-slate-200 bg-slate-50 text-xs text-slate-500">
              <strong>Float behavior:</strong> The dropdown is absolutely positioned with{' '}
              <code className="px-1 bg-white border border-slate-200">position: absolute</code> and
              <code className="px-1 bg-white border border-slate-200">z-50</code>. It floats over content below without
              affecting document flow. The content below this box stays in place when results appear.
            </div>
          </div>
        </Section>

        {/* Inputs & Controls */}
        <Section title="Inputs & Controls">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="min-w-0 space-y-4">
              <SubSection label="Text input">
                <Input placeholder="Enter text..." />
              </SubSection>
              <SubSection label="With label">
                <Input label="Workspace name" placeholder="my-project" />
              </SubSection>
              <SubSection label="Error state">
                <Input label="Email" placeholder="email@example.com" error="Invalid email address" />
              </SubSection>
            </div>
            <div className="min-w-0 space-y-4">
              <SubSection label="Checkboxes">
                <div className="space-y-1">
                  <Checkbox
                    label="Show hidden files"
                    reserveLabel="Show hidden files"
                    checked={checkboxes.a}
                    onChange={(e) => setCheckboxes((s) => ({ ...s, a: e.target.checked }))}
                  />
                  <Checkbox
                    label="Enable auto-save"
                    reserveLabel="Enable auto-save"
                    checked={checkboxes.b}
                    onChange={(e) => setCheckboxes((s) => ({ ...s, b: e.target.checked }))}
                  />
                  <Checkbox
                    label="Disabled option"
                    reserveLabel="Disabled option"
                    checked={checkboxes.c}
                    onChange={(e) => setCheckboxes((s) => ({ ...s, c: e.target.checked }))}
                    disabled
                  />
                </div>
              </SubSection>
              <SubSection label="Toggles">
                <div className="space-y-1">
                  <Toggle
                    label="Dark mode"
                    reserveLabel="Notifications"
                    checked={toggles.a}
                    onChange={(e) => setToggles((s) => ({ ...s, a: e.target.checked }))}
                  />
                  <Toggle
                    label="Notifications"
                    reserveLabel="Notifications"
                    checked={toggles.b}
                    onChange={(e) => setToggles((s) => ({ ...s, b: e.target.checked }))}
                  />
                </div>
              </SubSection>
            </div>
          </div>
        </Section>

        {/* Lists & Rows */}
        <Section title="Lists & Rows">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubSection label="Interactive list with selection" className="min-w-0">
              <Panel className="divide-y divide-slate-100">
                {[
                  { id: 0, title: 'Project Setup', meta: '12 messages', time: '2m ago' },
                  { id: 1, title: 'API Integration', meta: '8 messages', time: '1h ago' },
                  { id: 2, title: 'Bug Investigation', meta: '24 messages', time: '3h ago' },
                  { id: 3, title: 'Code Review', meta: '6 messages', time: 'Yesterday' },
                ].map((item) => (
                  <Row key={item.id} selected={selectedRow === item.id} onClick={() => setSelectedRow(item.id)}>
                    <MessageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.meta}</div>
                    </div>
                    <div className="text-xs text-slate-400 tabular-nums">{item.time}</div>
                    <ChevronIcon className="w-4 h-4 text-slate-300" />
                  </Row>
                ))}
              </Panel>
            </SubSection>
            <SubSection label="Static list (workspaces)" className="min-w-0">
              <Panel className="divide-y divide-slate-100">
                {[
                  { name: 'frontend', count: 42 },
                  { name: 'backend-api', count: 18 },
                  { name: 'documentation', count: 7 },
                ].map((ws) => (
                  <div key={ws.name} className="px-3 py-2.5 flex items-center gap-3">
                    <FolderIcon className="w-4 h-4 text-slate-400" />
                    <span className="flex-1 text-sm text-slate-700">{ws.name}</span>
                    <Tag variant="muted" className="tabular-nums">
                      {ws.count}
                    </Tag>
                  </div>
                ))}
              </Panel>
            </SubSection>
          </div>
        </Section>

        {/* Conversation Rendering */}
        <Section title="Conversation Rendering">
          <div className="space-y-6">
            {/* Message type filter toggles */}
            <SubSection label="Message type filters">
              <div className="flex flex-wrap gap-1 border border-slate-200 bg-white p-2">
                <MessageTypeToggle
                  label="User"
                  count={itemCounts.user}
                  checked={visibleTypes.user ?? false}
                  onChange={(e) => setVisibleTypes((v) => ({ ...v, user: e.target.checked }))}
                  color="bg-blue-500"
                />
                <MessageTypeToggle
                  label="Assistant"
                  count={itemCounts.assistant}
                  checked={visibleTypes.assistant ?? false}
                  onChange={(e) => setVisibleTypes((v) => ({ ...v, assistant: e.target.checked }))}
                  color="bg-emerald-500"
                />
                <MessageTypeToggle
                  label="Thinking"
                  count={itemCounts.thinking}
                  checked={visibleTypes.thinking ?? false}
                  onChange={(e) => setVisibleTypes((v) => ({ ...v, thinking: e.target.checked }))}
                  color="bg-amber-400"
                />
                <MessageTypeToggle
                  label="Tool Calls"
                  count={itemCounts.toolCalls}
                  checked={visibleTypes.toolCalls ?? false}
                  onChange={(e) => setVisibleTypes((v) => ({ ...v, toolCalls: e.target.checked }))}
                  color="bg-violet-500"
                />
                <MessageTypeToggle
                  label="Token Counters"
                  count={itemCounts.tokenCounters}
                  checked={visibleTypes.tokenCounters ?? false}
                  onChange={(e) => setVisibleTypes((v) => ({ ...v, tokenCounters: e.target.checked }))}
                  color="bg-slate-500"
                />
              </div>
            </SubSection>

            <div className="p-3 border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-2">
              <p>
                <strong>Rendering rules (terminal-adjacent):</strong>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-500">
                <div>
                  <span className="inline-block w-2 h-2 bg-blue-500 mr-2" />
                  User: literal by default (preserves exact input)
                </div>
                <div>
                  <span className="inline-block w-2 h-2 bg-emerald-500 mr-2" />
                  Assistant: rendered markdown by default
                </div>
                <div>
                  <span className="inline-block w-2 h-2 bg-amber-400 mr-2" />
                  Thinking: rendered markdown by default
                </div>
                <div>
                  <span className="inline-block w-2 h-2 bg-violet-500 mr-2" />
                  Tool Call: input + output (collapsible)
                </div>
                <div>
                  <span className="inline-block w-2 h-2 bg-slate-500 mr-2" />
                  Token Counter: context window meter
                </div>
              </div>
              <p className="text-slate-400">
                Toggle message types above. Thinking, Tool Calls, and Token Counters are hidden by default.
              </p>
            </div>

            <div className="space-y-4">
              {sampleConversation.map((turn, turnIndex) => (
                <ConversationTurn
                  key={getTurnKey(turn)}
                  turnNumber={turn.turnNumber}
                  timestamp={turn.timestamp}
                  duration={turn.duration}
                  items={turn.items}
                  visibleTypes={visibleTypes}
                  renderModes={turn.items.map(
                    (_, msgIndex) => conversationRenderModes[`${turnIndex}-${msgIndex}`] || 'default',
                  )}
                  onToggleRender={(msgIndex) => toggleMessageRender(turnIndex, msgIndex)}
                />
              ))}
            </div>

            <SubSection label="Typography contract">
              <div className="p-3 border border-slate-200 bg-white text-xs text-slate-600 font-mono space-y-1">
                <div>• All message content uses monospace font (font-mono)</div>
                <div>• Markdown headings use weight, not font-family change</div>
                <div>• Code blocks: sharp containers, no radius, solid bg</div>
                <div>• Inline code: minimal border + bg, no pill styling</div>
                <div>• whitespace-pre-wrap for literal text (no horizontal scroll for prose)</div>
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Code Blocks */}
        <Section title="Code Blocks">
          <div className="space-y-4">
            <SubSection label="With language label and copy">
              <CodeBlock language="typescript">
                {`interface StatusTagProps {
  label: string;
  reserveLabel?: string;
  active?: boolean;
  icon?: ReactNode;
}`}
              </CodeBlock>
            </SubSection>
          </div>
        </Section>

        {/* Modals & Overlays */}
        <Section title="Modals & Overlays">
          <div className="flex flex-wrap gap-4 items-start">
            <SubSection label="Modal">
              <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
              <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm Action">
                <p className="text-sm text-slate-600 mb-4">
                  Are you sure you want to proceed? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => setModalOpen(false)}>
                    Confirm
                  </Button>
                </div>
              </Modal>
            </SubSection>
            <SubSection label="Popover">
              <Popover
                open={popoverOpen}
                onToggle={() => setPopoverOpen(!popoverOpen)}
                trigger={<Button>Open Popover</Button>}
              >
                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-200 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-200 cursor-pointer"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </Popover>
            </SubSection>
          </div>
        </Section>

        {/* Layout Grid */}
        <Section title="Layout & Grid">
          <div className="space-y-6">
            <SubSection label="Two-column layout">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel className="p-4">
                  <div className="text-sm text-slate-600">Left panel</div>
                </Panel>
                <Panel className="p-4">
                  <div className="text-sm text-slate-600">Right panel</div>
                </Panel>
              </div>
            </SubSection>
            <SubSection label="Sidebar + content">
              <div className="grid grid-cols-[200px_1fr] gap-4">
                <Panel className="p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">Navigation</div>
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-sm text-slate-800 bg-slate-100 cursor-pointer">Sessions</div>
                    <div className="px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 active:bg-slate-200 cursor-pointer">
                      Workspaces
                    </div>
                    <div className="px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 active:bg-slate-200 cursor-pointer">
                      Settings
                    </div>
                  </div>
                </Panel>
                <Panel className="p-4">
                  <div className="text-sm text-slate-600">Main content area with min-w-0 for safe truncation</div>
                </Panel>
              </div>
            </SubSection>
            <SubSection label="Stacked panels (interactive rows)">
              <div className="space-y-2">
                <Panel className="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-200 cursor-pointer transition-colors motion-reduce:transition-none">
                  <span className="text-sm text-slate-700">First item</span>
                  <Tag variant="muted">Active</Tag>
                </Panel>
                <Panel className="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-200 cursor-pointer transition-colors motion-reduce:transition-none">
                  <span className="text-sm text-slate-700">Second item</span>
                  <Tag variant="base">Pending</Tag>
                </Panel>
                <Panel className="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-200 cursor-pointer transition-colors motion-reduce:transition-none">
                  <span className="text-sm text-slate-700">Third item</span>
                  <Tag variant="muted">Archived</Tag>
                </Panel>
              </div>
            </SubSection>
          </div>
        </Section>

        {/* Focus States */}
        <Section title="Focus & Keyboard">
          <div className="space-y-4">
            <SubSection label="Tab through these elements to see focus states (checkbox is interactive)">
              <div className="flex flex-wrap gap-3 items-center">
                <Button>Button</Button>
                <Input placeholder="Input" className="w-40" />
                <Checkbox label="Checkbox" checked={demoCheckbox} onChange={(e) => setDemoCheckbox(e.target.checked)} />
              </div>
            </SubSection>
            <div className="p-3 border border-slate-200 bg-slate-50 text-xs text-slate-500 space-y-2">
              <div>
                <strong>Focus contract:</strong> Focus-visible rings are allowed and preferred for keyboard clarity.
                Focus must never be clipped and should use a small offset so the ring does not touch the control edge.
                Use{' '}
                <code className="px-1 bg-white border border-slate-200">
                  focus-visible:ring-2 focus-visible:ring-offset-1
                </code>{' '}
                and a high-contrast ring color.
              </div>
              <div>
                <strong>Clickability indicators:</strong> All clickable elements must have:
                <div className="mt-1 ml-3 space-y-0.5">
                  <div>
                    • <code className="px-1 bg-white border border-slate-200">cursor-pointer</code> — pointer cursor on
                    hover
                  </div>
                  <div>• Visible hover state (background shift, border change, or text change)</div>
                  <div>• Active/pressed state for feedback</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Design Rules Summary */}
        <Section title="Sharp UI Rules (Summary)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 mt-1.5 bg-emerald-500 shrink-0" />
                <span className="text-slate-700">No rounded corners (radius = 0)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 mt-1.5 bg-emerald-500 shrink-0" />
                <span className="text-slate-700">No translucency / glass / blur</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 mt-1.5 bg-emerald-500 shrink-0" />
                <span className="text-slate-700">No shadows for hierarchy</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 mt-1.5 bg-emerald-500 shrink-0" />
                <span className="text-slate-700">Border-driven hierarchy</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 mt-1.5 bg-emerald-500 shrink-0" />
                <span className="text-slate-700">Preserve keyboard focus visibility</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 mt-1.5 bg-emerald-500 shrink-0" />
                <span className="text-slate-700">Color is never the only cue</span>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
