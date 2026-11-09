// Search tab: look up a word and save it.
import { useEffect, useState } from 'react'
import { lookupWord, type LookupResult } from '../api/dictionary'
import { spellingSuggestions } from '../api/datamuse'
import { useVault } from '../data/VaultContext'
import { SearchBar } from '../components/SearchBar'
import { WordResult } from '../components/WordResult'
import { SaveWordDialog } from '../components/SaveWordDialog'
import { SignInForm } from '../components/SignInForm'

export function SearchPage({ word, onSearch }: { word: string; onSearch: (word: string) => void }) {
  const { session, words } = useVault()
  const [result, setResult] = useState<LookupResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState<'save' | 'signin' | null>(null)
  const [attempt, setAttempt] = useState(0) // bumped by "Try again" to re-run the lookup
  const [didYouMean, setDidYouMean] = useState<string[]>([])

  // Look up whenever the current word changes.
  useEffect(() => {
    if (!word) return
    let cancelled = false
    setLoading(true)
    setDidYouMean([])
    lookupWord(word).then(async (r) => {
      if (cancelled) return
      setResult(r)
      setLoading(false)
      // Not found? Probably a typo: offer close spellings.
      if (r.status === 'not_found') {
        const options = await spellingSuggestions(word)
        if (!cancelled) setDidYouMean(options)
      }
    })
    return () => {
      cancelled = true
    }
  }, [word, attempt])

  // Close the sign-in pop-up once signed in.
  useEffect(() => {
    if (session && dialog === 'signin') setDialog('save')
  }, [session, dialog])

  const shownWord = result?.status === 'ok' ? result.entries[0].word.toLowerCase() : ''
  const isSaved = words.some((w) => w.word === shownWord)

  return (
    <div className="space-y-5">
      <SearchBar value={word} onSearch={onSearch} />

      {loading && <p className="text-slate-500">Looking up…</p>}

      {!loading && result?.status === 'not_found' && (
        <div className="space-y-2 rounded-lg bg-slate-100 p-4 text-slate-600">
          <p>{result.message}</p>
          {didYouMean.length > 0 && (
            <p>
              Did you mean{' '}
              {didYouMean.map((w, i) => (
                <span key={w}>
                  <button onClick={() => onSearch(w)} className="font-medium text-indigo-600 hover:underline">
                    {w}
                  </button>
                  {i < didYouMean.length - 1 ? ', ' : '?'}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
      {!loading && result?.status === 'error' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-red-700">
          <p>{result.message}</p>
          <button
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      )}
      {!loading && result?.status === 'ok' && (
        <WordResult
          key={result.entries[0].word}
          entries={result.entries}
          onSearch={onSearch}
          saveButton={
            <button
              onClick={() => setDialog(session ? 'save' : 'signin')}
              className={
                isSaved
                  ? 'rounded-lg bg-emerald-50 px-4 py-2 font-medium text-emerald-700 hover:bg-emerald-100'
                  : 'rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700'
              }
            >
              {isSaved ? '✓ Saved · Edit' : '+ Save'}
            </button>
          }
        />
      )}

      {!word && (
        <p className="pt-8 text-center text-slate-400">Search for any English word to see its meaning.</p>
      )}

      {dialog === 'save' && result?.status === 'ok' && (
        <SaveWordDialog word={result.entries[0].word} onClose={() => setDialog(null)} />
      )}
      {dialog === 'signin' && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={() => setDialog(null)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <SignInForm reason="Sign in to save words to your vault." />
          </div>
        </div>
      )}
    </div>
  )
}
