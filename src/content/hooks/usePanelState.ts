import { useReducer, useRef } from 'react'
import { GrammarError } from '../../shared/types'

export type PanelState =
  | { type: 'idle' }
  | { type: 'checking' }
  | { type: 'results'; errors: GrammarError[]; fieldText: string }
  | { type: 'ai-rewriting' }
  | { type: 'ai-result'; rewritten: string; isSelection: boolean }
  | { type: 'translating' }
  | { type: 'translate-result'; translated: string }
  | { type: 'error'; message: string }

type Action =
  | { type: 'CHECKING' }
  | { type: 'RESULTS'; errors: GrammarError[]; fieldText: string }
  | { type: 'AI_REWRITING' }
  | { type: 'AI_RESULT'; rewritten: string; isSelection: boolean }
  | { type: 'TRANSLATING' }
  | { type: 'TRANSLATE_RESULT'; translated: string }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }
  | { type: 'DISMISS'; previousErrors: GrammarError[]; previousFieldText: string }

function reducer(state: PanelState, action: Action): PanelState {
  switch (action.type) {
    case 'CHECKING': return { type: 'checking' }
    case 'RESULTS': return { type: 'results', errors: action.errors, fieldText: action.fieldText }
    case 'AI_REWRITING': return { type: 'ai-rewriting' }
    case 'AI_RESULT': return { type: 'ai-result', rewritten: action.rewritten, isSelection: action.isSelection }
    case 'TRANSLATING': return { type: 'translating' }
    case 'TRANSLATE_RESULT': return { type: 'translate-result', translated: action.translated }
    case 'ERROR': return { type: 'error', message: action.message }
    case 'RESET': return { type: 'idle' }
    case 'DISMISS': return { type: 'results', errors: action.previousErrors, fieldText: action.previousFieldText }
    default: return state
  }
}

export function usePanelState() {
  const [state, dispatch] = useReducer(reducer, { type: 'idle' })
  const previousResultsRef = useRef<{ errors: GrammarError[]; fieldText: string }>({ errors: [], fieldText: '' })

  return {
    state,
    setChecking: () => dispatch({ type: 'CHECKING' }),
    setResults: (errors: GrammarError[], fieldText: string) => {
      previousResultsRef.current = { errors, fieldText }
      dispatch({ type: 'RESULTS', errors, fieldText })
    },
    setAIRewriting: () => dispatch({ type: 'AI_REWRITING' }),
    setAIResult: (rewritten: string, isSelection: boolean) => dispatch({ type: 'AI_RESULT', rewritten, isSelection }),
    setTranslating: () => dispatch({ type: 'TRANSLATING' }),
    setTranslateResult: (translated: string) => dispatch({ type: 'TRANSLATE_RESULT', translated }),
    setError: (message: string) => dispatch({ type: 'ERROR', message }),
    reset: () => dispatch({ type: 'RESET' }),
    dismiss: () => dispatch({ type: 'DISMISS', previousErrors: previousResultsRef.current.errors, previousFieldText: previousResultsRef.current.fieldText }),
  }
}
