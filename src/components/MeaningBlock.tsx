import type { Meaning } from '../types'
import { WordList } from './WordList'

// One part of speech (e.g. "adjective") with its numbered definitions.
export function MeaningBlock({ meaning, onSearch }: { meaning: Meaning; onSearch: (word: string) => void }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-700 italic">
        {meaning.partOfSpeech}
      </h3>
      <ol className="list-decimal space-y-3 pl-5">
        {meaning.definitions.map((d, i) => (
          <li key={i} className="space-y-1">
            <p>{d.definition}</p>
            {/* Only show an example when the API provides one. */}
            {d.example && <p className="text-slate-500 italic">"{d.example}"</p>}
            <WordList label="Synonyms" words={d.synonyms} onSearch={onSearch} />
            <WordList label="Antonyms" words={d.antonyms} onSearch={onSearch} />
          </li>
        ))}
      </ol>
      {/* Synonyms/antonyms for the whole part of speech are in the RelatedWords panel. */}
    </section>
  )
}
