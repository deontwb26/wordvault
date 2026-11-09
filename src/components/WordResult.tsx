// Shows a looked-up word: pronunciation, audio, and meanings by part of speech.
import { useState } from 'react'
import type { DictionaryEntry, Meaning } from '../types'
import { pickPronunciation, playPronunciation } from '../utils/pronunciation'
import { MeaningBlock } from './MeaningBlock'
import { RelatedWords } from './RelatedWords'

// The API can return several entries for one word. Merge meanings that share
// a part of speech so "noun" appears once.
function groupMeanings(entries: DictionaryEntry[]): Meaning[] {
  const groups = new Map<string, Meaning>()
  for (const entry of entries) {
    for (const m of entry.meanings) {
      const g = groups.get(m.partOfSpeech)
      if (g) {
        g.definitions.push(...m.definitions)
        g.synonyms = [...new Set([...g.synonyms, ...m.synonyms])]
        g.antonyms = [...new Set([...g.antonyms, ...m.antonyms])]
      } else {
        groups.set(m.partOfSpeech, { ...m, definitions: [...m.definitions] })
      }
    }
  }
  return [...groups.values()]
}

export function WordResult({
  entries,
  onSearch,
  saveButton,
}: {
  entries: DictionaryEntry[]
  onSearch: (word: string) => void
  saveButton: React.ReactNode
}) {
  const word = entries[0].word
  const { text, audioUrls } = pickPronunciation(entries)
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'device-voice' | 'failed'>('idle')
  const canSpeak = audioUrls.length > 0 || 'speechSynthesis' in window

  async function listen() {
    setAudioState('loading')
    const result = await playPronunciation(word, audioUrls)
    setAudioState(result === 'recording' ? 'idle' : result)
  }

  return (
    <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">{word}</h2>
          <div className="mt-1 flex items-center gap-3">
            {text && <span className="text-slate-500">{text}</span>}
            {canSpeak && (
              <button
                onClick={listen}
                disabled={audioState === 'loading'}
                className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                aria-label="Play pronunciation"
              >
                {audioState === 'loading' ? 'Loading…' : '▶ Listen'}
              </button>
            )}
            {audioState === 'device-voice' && (
              <span className="text-xs text-slate-400">No recording available, used your device's voice</span>
            )}
            {audioState === 'failed' && <span className="text-xs text-red-600">Couldn't play audio</span>}
          </div>
        </div>
        {saveButton}
      </header>

      {groupMeanings(entries).map((m) => (
        <MeaningBlock key={m.partOfSpeech} meaning={m} onSearch={onSearch} />
      ))}

      <RelatedWords entries={entries} onSearch={onSearch} />
    </article>
  )
}
