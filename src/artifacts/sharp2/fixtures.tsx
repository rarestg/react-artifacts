import { Folder as FolderIcon, MessageSquare as MessageIcon } from 'lucide-react';
import type { SearchResult } from './components/SearchInput';
import type { ConversationTurnData } from './conversation/types';

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
] satisfies ConversationTurnData[];
