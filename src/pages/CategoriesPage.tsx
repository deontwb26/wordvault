// Categories tab: create, rename, recolor and delete your categories.
import { useState, type FormEvent } from 'react'
import { useVault } from '../data/VaultContext'
import { createCategory, deleteCategory, updateCategory } from '../data/store'
import { CATEGORY_COLORS, nextColor } from '../utils/colors'
import type { Category } from '../types'

export function CategoriesPage() {
  const { categories, words, refresh } = useVault()
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    setError(null)
    try {
      await action()
      await refresh()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg.includes('duplicate') ? 'A category with that name already exists.' : msg)
    }
  }

  function add(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    run(async () => {
      await createCategory(newName, nextColor(categories.length))
      setNewName('')
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <input
          placeholder="New category, e.g. Public Speaking"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
        <button className="rounded-lg bg-indigo-600 px-4 font-medium text-white hover:bg-indigo-700">Add</button>
      </form>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <ul className="space-y-2">
        {categories.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            wordCount={words.filter((w) => w.categoryIds.includes(c.id)).length}
            onRename={(name) => run(() => updateCategory(c.id, { name: name.trim() }))}
            onRecolor={(color) => run(() => updateCategory(c.id, { color }))}
            onDelete={() => {
              if (confirm(`Delete "${c.name}"? Your words stay saved; only this tag is removed.`)) {
                run(() => deleteCategory(c.id))
              }
            }}
          />
        ))}
      </ul>

      {categories.length === 0 && <p className="pt-8 text-center text-slate-400">No categories yet.</p>}
    </div>
  )
}

function CategoryRow(props: {
  category: Category
  wordCount: number
  onRename: (name: string) => void
  onRecolor: (color: string) => void
  onDelete: () => void
}) {
  const { category, wordCount } = props
  const [name, setName] = useState(category.name)
  const [showColors, setShowColors] = useState(false)

  // Save the new name when you leave the box or press Enter.
  function commit() {
    if (name.trim() && name.trim() !== category.name) props.onRename(name)
    else setName(category.name)
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowColors((s) => !s)}
          className="h-7 w-7 shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
          aria-label="Change color"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label="Category name"
          className="min-w-0 flex-1 rounded px-2 py-1 font-medium hover:bg-slate-50 focus:bg-slate-50"
        />
        <span className="shrink-0 text-sm text-slate-400">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <button onClick={props.onDelete} className="shrink-0 text-sm text-red-600 hover:underline">
          Delete
        </button>
      </div>
      {showColors && (
        <div className="mt-3 flex flex-wrap gap-2 pl-10">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                props.onRecolor(color)
                setShowColors(false)
              }}
              className={`h-7 w-7 rounded-full ${color === category.color ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
              style={{ backgroundColor: color }}
              aria-label={`Use color ${color}`}
            />
          ))}
        </div>
      )}
    </li>
  )
}
