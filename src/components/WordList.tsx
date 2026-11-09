// A row of clickable words (synonyms or antonyms). Clicking one searches it.
export function WordList({
  label,
  words,
  onSearch,
}: {
  label: string
  words: string[]
  onSearch: (word: string) => void
}) {
  words = [...new Set(words)] // the API sometimes repeats a word
  if (words.length === 0) return null
  return (
    <p className="text-sm">
      <span className="font-medium text-slate-500">{label}: </span>
      {words.map((w, i) => (
        <span key={w}>
          <button onClick={() => onSearch(w)} className="text-indigo-600 hover:underline">
            {w}
          </button>
          {i < words.length - 1 && ', '}
        </span>
      ))}
    </p>
  )
}
