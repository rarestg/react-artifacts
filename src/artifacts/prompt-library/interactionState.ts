import type { PromptEntry } from './prompts';
import type { PromptSearchResult } from './search';

export type PromptLibraryInteractionState = {
  searchOpen: boolean;
  activePrompt: PromptEntry | null;
  activeSearchResult: PromptSearchResult | null;
  activeSearchQuery: string;
};

export type PromptLibraryInteractionAction =
  | { type: 'open-prompt-detail'; prompt: PromptEntry }
  | { type: 'close-prompt-detail' }
  | { type: 'set-search-open'; open: boolean }
  | { type: 'toggle-search-open' }
  | { type: 'select-search-result'; result: PromptSearchResult; query: string };

export const initialPromptLibraryInteractionState: PromptLibraryInteractionState = {
  searchOpen: false,
  activePrompt: null,
  activeSearchResult: null,
  activeSearchQuery: '',
};

export function promptLibraryInteractionReducer(
  state: PromptLibraryInteractionState,
  action: PromptLibraryInteractionAction,
): PromptLibraryInteractionState {
  switch (action.type) {
    case 'open-prompt-detail':
      return {
        ...state,
        activePrompt: action.prompt,
        activeSearchResult: null,
        activeSearchQuery: '',
      };
    case 'close-prompt-detail':
      return {
        ...state,
        activePrompt: null,
        activeSearchResult: null,
        activeSearchQuery: '',
      };
    case 'set-search-open':
      return {
        ...state,
        searchOpen: action.open,
      };
    case 'toggle-search-open':
      return {
        ...state,
        searchOpen: !state.searchOpen,
      };
    case 'select-search-result':
      return {
        ...state,
        searchOpen: false,
        activePrompt: action.result.prompt,
        activeSearchResult: action.result,
        activeSearchQuery: action.query,
      };
  }
}
