// Text box + Search button, with a dropdown of word suggestions as you type.
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { suggestWords, type Suggestion } from '../api/datamuse'
import { prefetchWord } from '../api/dictionary'

export function SearchBar({ value, onSearch }: { value: string; onSearch: (word: string) => void }) {
  const [text, setText] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1) // which suggestion the arrow keys are on
  const typed = useRef(false) // only suggest after the user types, not after a search

  // When a search happens elsewhere (e.g. clicking a synonym), show that word.
  useEffect(() => {
    typed.current = false
    setText(value)
    setOpen(false)
  }, [value])

  // Fetch suggestions shortly after the user stops typing.
  useEffect(() => {
    if (!typed.current) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const result = await suggestWords(text)
      if (cancelled) return
      setSuggestions(result)
      setHighlight(-1)
      setOpen(result.length > 0)
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text])

  // Pre-load the highlighted suggestion so it's ready when you pick it.
  // The short delay skips words you only pass over on the way down the list.
  const highlighted = open && highlight >= 0 ? suggestions[highlight]?.word : undefined
  useEffect(() => {
    if (!highlighted) return
    const timer = setTimeout(() => prefetchWord(highlighted), 150)
    return () => clearTimeout(timer)
  }, [highlighted])

  function search(word: string) {
    setOpen(false)
    if (word.trim()) onSearch(word.trim())
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    search(highlight >= 0 && open ? suggestions[highlight].word : text)
  }

  // Up/Down to move through suggestions, Escape to close.
  function handleKeyDown(e: KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1))
    } else if (e.key === 'Escape') {
      e.preventDefault() // stop the browser from also clearing the text
      setOpen(false)
    }
  }

  const isSpelling = suggestions[0]?.kind === 'spelling'

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <input
          type="search"
          autoFocus
          placeholder="Look up a word…"
          value={text}
          onChange={(e) => {
            typed.current = true
            setText(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && typed.current && setOpen(true)}
          onBlur={() => setOpen(false)}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
          aria-controls="word-suggestions"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-lg"
        />
        {open && (
          <ul
            id="word-suggestions"
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            {isSpelling && (
              <li className="px-4 pt-2 pb-1 text-xs font-medium tracking-wide text-amber-700 uppercase">
                Did you mean
              </li>
            )}
            {suggestions.map((s, i) => (
              <li
                key={s.word}
                role="option"
                aria-selected={i === highlight}
                // onMouseDown (not onClick) so it fires before the input loses focus
                onMouseDown={(e) => {
                  e.preventDefault()
                  search(s.word)
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`cursor-pointer px-4 py-2 ${i === highlight ? 'bg-indigo-50 text-indigo-700' : ''}`}
              >
                {s.word}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="rounded-lg bg-indigo-600 px-5 font-medium text-white hover:bg-indigo-700">
        Search
      </button>
    </form>
  )
}
