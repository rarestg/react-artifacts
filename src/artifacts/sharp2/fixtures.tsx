import { Folder as FolderIcon, MessageSquare as MessageIcon } from 'lucide-react';
import type { SearchResult } from './components/SearchInput';
import { type ConversationTurnData, tokenCounterPropsFromTelemetry } from './conversation';

export const allSearchResults = [
  {
    id: 'project-setup',
    title: 'Project Setup',
    subtitle: 'Initial configuration and dependencies',
    meta: '12 msgs',
    icon: <FolderIcon className="size-4" />,
  },
  {
    id: 'api-integration',
    title: 'API Integration',
    subtitle: 'REST endpoints and authentication',
    meta: '8 msgs',
    icon: <MessageIcon className="size-4" />,
  },
  {
    id: 'database-schema',
    title: 'Database Schema',
    subtitle: 'PostgreSQL table definitions',
    meta: '24 msgs',
    icon: <FolderIcon className="size-4" />,
  },
  {
    id: 'authentication-flow',
    title: 'Authentication Flow',
    subtitle: 'OAuth2 and session management',
    meta: '6 msgs',
    icon: <MessageIcon className="size-4" />,
  },
  {
    id: 'deployment-config',
    title: 'Deployment Config',
    subtitle: 'Docker and CI/CD pipeline',
    meta: '15 msgs',
    icon: <FolderIcon className="size-4" />,
  },
] satisfies SearchResult[];

const turnThreeFinalTokenUsage = tokenCounterPropsFromTelemetry({
  info: {
    total_token_usage: {
      input_tokens: 3200,
      cached_input_tokens: 1200,
      output_tokens: 1750,
      reasoning_output_tokens: 940,
      total_tokens: 5890,
    },
    last_token_usage: {
      input_tokens: 300,
      cached_input_tokens: 0,
      output_tokens: 180,
      reasoning_output_tokens: 90,
      total_tokens: 570,
    },
    model_context_window: 200000,
  },
  rate_limits: {
    primary: { used_percent: 93 },
    secondary: { used_percent: 41 },
  },
});

const turnFourFinalTokenUsage = tokenCounterPropsFromTelemetry({
  info: {
    total_token_usage: {
      input_tokens: 7600,
      cached_input_tokens: 1800,
      output_tokens: 2450,
      reasoning_output_tokens: 1320,
      total_tokens: 11370,
    },
    last_token_usage: {
      input_tokens: 720,
      cached_input_tokens: 120,
      output_tokens: 340,
      reasoning_output_tokens: 150,
      total_tokens: 1210,
    },
    model_context_window: 200000,
  },
  rate_limits: {
    primary: { used_percent: 94 },
    secondary: { used_percent: 44 },
  },
});

export const sampleConversation = [
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
        content:
          'Run the tests for this component and keep the command output literal, including the long workspace selector: --test-name-pattern="debounces search calls and preserves typed whitespace" src/components/SearchInput.test.tsx.',
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
        input:
          'node --import tsx --test --test-name-pattern="debounces search calls and preserves typed whitespace" src/components/SearchInput.test.tsx',
        output: `PASS  src/components/SearchInput.test.tsx
  SearchInput
    ✓ renders without crashing (23ms)
    ✓ updates input value on change (15ms)
    ✓ debounces search calls (312ms)
    ✓ cancels pending debounce on unmount (8ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Time:        1.847s
Command:     node --import tsx --test --test-name-pattern="debounces search calls and preserves typed whitespace" src/components/SearchInput.test.tsx`,
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
        ...turnThreeFinalTokenUsage,
      },
    ],
  },
  {
    id: 'turn-4',
    turnNumber: 4,
    timestamp: '10:46:12',
    duration: '31.4s',
    items: [
      {
        id: 'turn-4-user',
        role: 'user',
        content:
          'Use a subagent to inspect why the parser sometimes attaches inherited session metadata to the active transcript. Keep the parent thread focused on orchestration and review the result before you answer.',
        timestamp: '10:46:12',
      },
      {
        id: 'turn-4-token-1',
        type: 'token_counter',
        used: 6010,
        limit: 200000,
        label: 'Context Window',
      },
      {
        id: 'turn-4-thinking',
        role: 'thinking',
        content:
          'This is a good use for a worker because the parser edge case can be inspected independently. I should spawn a subagent, wait for the result, then review it before responding.',
        timestamp: '10:46:13',
      },
      {
        id: 'turn-4-assistant-start',
        role: 'assistant',
        content: 'I will start a worker to inspect the parser edge case, then I will review its result here.',
        timestamp: '10:46:14',
      },
      {
        id: 'turn-4-spawn',
        type: 'tool_call',
        toolKind: 'subagent_spawn',
        tool: 'spawn_agent',
        agentId: '019e27af-615f-7bf0-a26a-ee42ecd83783',
        agentNickname: 'Ada',
        agentRole: 'worker',
        preview: 'Inspect the failing parser case and report the root cause. Do not edit files.',
        summary: 'spawn_agent -> Ada / worker',
        input: `{
  "agent_type": "worker",
  "message": "Inspect the failing parser case and report the root cause. Do not edit files.",
  "reasoning_effort": "xhigh"
}`,
        output: `{
  "agent_id": "019e27af-615f-7bf0-a26a-ee42ecd83783",
  "nickname": "Ada"
}`,
        timestamp: '10:46:15',
        status: 'success',
      },
      {
        id: 'turn-4-assistant-running',
        role: 'assistant',
        content: 'Ada is running. I will wait for the child session to finish before drawing conclusions.',
        timestamp: '10:46:16',
      },
      {
        id: 'turn-4-wait-1',
        type: 'tool_call',
        toolKind: 'subagent_wait',
        tool: 'wait_agent',
        agentId: '019e27af-615f-7bf0-a26a-ee42ecd83783',
        agentNickname: 'Ada',
        agentRole: 'worker',
        preview: 'Completed within 10m',
        summary: 'wait_agent -> Ada',
        input: `{
  "targets": ["019e27af-615f-7bf0-a26a-ee42ecd83783"],
  "timeout_ms": 600000
}`,
        output: `{
  "status": {
    "019e27af-615f-7bf0-a26a-ee42ecd83783": {
      "completed": "The parser is treating inherited metadata as current-session metadata."
    }
  },
  "timed_out": false
}`,
        timestamp: '10:46:29',
        status: 'success',
      },
      {
        id: 'turn-4-notification-1',
        type: 'subagent_notification',
        agentId: '019e27af-615f-7bf0-a26a-ee42ecd83783',
        agentNickname: 'Ada',
        agentRole: 'worker',
        status: 'completed',
        summary: 'The parser is treating inherited metadata as current-session metadata.',
        rawPayload: `<subagent_notification>
{"agent_path":"019e27af-615f-7bf0-a26a-ee42ecd83783","status":{"completed":"The parser is treating inherited metadata as current-session metadata."}}
</subagent_notification>`,
        timestamp: '10:46:29',
      },
      {
        id: 'turn-4-assistant-review',
        role: 'assistant',
        content:
          'Ada found the likely root cause: later inherited metadata is overriding the active session identity. I will send one follow-up asking for the smallest fix before I summarize.',
        timestamp: '10:46:30',
      },
      {
        id: 'turn-4-send-input',
        type: 'tool_call',
        toolKind: 'subagent_send_input',
        tool: 'send_input',
        agentId: '019e27af-615f-7bf0-a26a-ee42ecd83783',
        agentNickname: 'Ada',
        agentRole: 'worker',
        preview: 'Follow up: explain why this happens and suggest the smallest safe fix.',
        summary: 'send_input -> Ada follow-up',
        input: `{
  "target": "019e27af-615f-7bf0-a26a-ee42ecd83783",
  "message": "Follow up: explain why this happens and suggest the smallest safe fix."
}`,
        output: `{
  "submission_id": "submission-789"
}`,
        timestamp: '10:46:31',
        status: 'success',
      },
      {
        id: 'turn-4-wait-2',
        type: 'tool_call',
        toolKind: 'subagent_wait',
        tool: 'wait_agent',
        agentId: '019e27af-615f-7bf0-a26a-ee42ecd83783',
        agentNickname: 'Ada',
        agentRole: 'worker',
        preview: 'Completed within 10m',
        summary: 'wait_agent -> Ada follow-up result',
        input: `{
  "targets": ["019e27af-615f-7bf0-a26a-ee42ecd83783"],
  "timeout_ms": 600000
}`,
        output: `{
  "status": {
    "019e27af-615f-7bf0-a26a-ee42ecd83783": {
      "completed": "The smallest fix is to lock session identity from the first session_meta row only."
    }
  },
  "timed_out": false
}`,
        timestamp: '10:46:40',
        status: 'success',
      },
      {
        id: 'turn-4-notification-2',
        type: 'subagent_notification',
        agentId: '019e27af-615f-7bf0-a26a-ee42ecd83783',
        agentNickname: 'Ada',
        agentRole: 'worker',
        status: 'completed',
        summary: 'The smallest fix is to lock session identity from the first session_meta row only.',
        rawPayload: `<subagent_notification>
{"agent_path":"019e27af-615f-7bf0-a26a-ee42ecd83783","status":{"completed":"The smallest fix is to lock session identity from the first session_meta row only."}}
</subagent_notification>`,
        timestamp: '10:46:40',
      },
      {
        id: 'turn-4-close',
        type: 'tool_call',
        toolKind: 'subagent_close',
        tool: 'close_agent',
        agentId: '019e27af-615f-7bf0-a26a-ee42ecd83783',
        agentNickname: 'Ada',
        agentRole: 'worker',
        preview: 'Previous status: completed',
        summary: 'close_agent -> Ada',
        input: `{
  "target": "019e27af-615f-7bf0-a26a-ee42ecd83783"
}`,
        output: `{
  "previous_status": {
    "completed": "The smallest fix is to lock session identity from the first session_meta row only."
  }
}`,
        timestamp: '10:46:41',
        status: 'success',
      },
      {
        id: 'turn-4-assistant-final',
        role: 'assistant',
        content: `I reviewed Ada's result. The parent parser should treat the first \`session_meta\` in each JSONL file as the session identity and ignore later inherited metadata for identity fields.

The smallest safe fix is to store the first header's session id, parent id, depth, nickname, and role before the content pass, then make later \`session_meta\` rows ordinary context records instead of identity overrides.`,
        timestamp: '10:46:43',
      },
      {
        id: 'turn-4-token-2',
        type: 'token_counter',
        ...turnFourFinalTokenUsage,
      },
    ],
  },
] satisfies ConversationTurnData[];
