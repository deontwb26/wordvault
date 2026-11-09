// "Synonyms & antonyms" panel at the bottom of a result.
// Combines the dictionary's lists with extra ones from Datamuse.
import { useEffect, useState } from 'react'
import { relatedWords } from '../api/datamuse'
import type { DictionaryEntry } from '../types'
import { WordList } from './WordList'

// Every synonym/antonym the dictionary gave, across all meanings and definitions.
function fromDictionary(entries: DictionaryEntry[], key: 'synonyms' | 'antonyms'): string[] {
  return entries.flatMap((e) => e.meanings.flatMap((m) => [...m[key], ...m.definitions.flatMap((d) => d[key])]))
}

export function RelatedWords({ entries, onSearch }: { entries: DictionaryEntry[]; onSearch: (word: string) => void }) {
  const word = entries[0].word.toLowerCase()
  const [extra, setExtra] = useState<{ synonyms: string[]; antonyms: string[] } | null>(null)

  useEffect(() => {
    let cancelled = false
    relatedWords(word).then((r) => !cancelled && setExtra(r))
    return () => {
      cancelled = true
    }
  }, [word])

  // Dictionary words first, then Datamuse ones; no duplicates, not the word itself.
  const merge = (a: string[], b: string[]) =>
    [...new Set([...a, ...b].map((w) => w.toLowerCase()))].filter((w) => w !== word)
  const synonyms = merge(fromDictionary(entries, 'synonyms'), extra?.synonyms ?? [])
  const antonyms = merge(fromDictionary(entries, 'antonyms'), extra?.antonyms ?? [])

  return (
    <section className="space-y-2 rounded-lg bg-slate-50 p-4">
      <h3 className="text-sm font-semibold tracking-wide text-indigo-700 uppercase">Synonyms &amp; antonyms</h3>
      {!extra && <p className="text-sm text-slate-400">Finding related words…</p>}
      {extra && (
        <>
          {synonyms.length > 0 ? (
            <WordList label="Synonyms" words={synonyms} onSearch={onSearch} />
          ) : (
            <p className="text-sm text-slate-400">No synonyms found.</p>
          )}
          {antonyms.length > 0 ? (
            <WordList label="Antonyms" words={antonyms} onSearch={onSearch} />
          ) : (
            <p className="text-sm text-slate-400">No antonyms found.</p>
          )}
        </>
      )}
    </section>
  )
}
