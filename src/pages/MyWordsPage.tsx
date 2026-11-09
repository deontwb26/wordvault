// My Words tab: your saved words with filter, search and sort.
import { useMemo, useState } from 'react'
import { useVault } from '../data/VaultContext'
import { CategoryBadge } from '../components/CategoryBadge'
import { SaveWordDialog } from '../components/SaveWordDialog'

type Sort = 'newest' | 'oldest' | 'az' | 'za'

export function MyWordsPage({ onOpenWord }: { onOpenWord: (word: string) => void }) {
  const { words, categories, loading, error } = useVault()
  const [filter, setFilter] = useState('all') // 'all', 'none', or a category id
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('newest')
  const [editing, setEditing] = useState<string | null>(null)

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = words.filter((w) => {
      if (filter === 'none' && w.categoryIds.length > 0) return false
      if (filter !== 'all' && filter !== 'none' && !w.categoryIds.includes(filter)) return false
      return !q || w.word.includes(q) || w.personalNote.toLowerCase().includes(q)
    })
    return list.sort((a, b) => {
      if (sort === 'az') return a.word.localeCompare(b.word)
      if (sort === 'za') return b.word.localeCompare(a.word)
      if (sort === 'oldest') return a.savedAt.localeCompare(b.savedAt)
      return b.savedAt.localeCompare(a.savedAt)
    })
  }, [words, filter, query, sort])

  const control = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search my words or notes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={control + ' min-w-0 flex-1 basis-48'}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={control} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="none">No category</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={control} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A–Z</option>
          <option value="za">Z–A</option>
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading && words.length === 0 && <p className="text-slate-500">Loading…</p>}

      <p className="text-sm text-slate-500">
        {visible.length} of {words.length} words
      </p>

      <ul className="space-y-2">
        {visible.map((w) => (
          <li key={w.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => onOpenWord(w.word)} className="text-lg font-semibold text-indigo-700 hover:underline">
                {w.word}
              </button>
              <button onClick={() => setEditing(w.word)} className="text-sm text-slate-500 hover:text-slate-800">
                Edit
              </button>
            </div>
            {w.categoryIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {w.categoryIds.map((id) => {
                  const c = categoryById.get(id)
                  return c ? <CategoryBadge key={id} category={c} /> : null
                })}
              </div>
            )}
            {w.personalNote && <p className="mt-2 text-sm text-slate-600">{w.personalNote}</p>}
            <p className="mt-2 text-xs text-slate-400">Saved {new Date(w.savedAt).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>

      {!loading && words.length === 0 && (
        <p className="pt-8 text-center text-slate-400">No saved words yet. Search for a word and press Save.</p>
      )}

      {editing && <SaveWordDialog word={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
