// Pop-up for saving (or editing) a word: pick categories, add a note.
import { useState, type FormEvent } from 'react'
import { useVault } from '../data/VaultContext'
import { createCategory, deleteWord, saveWord } from '../data/store'
import { nextColor } from '../utils/colors'

export function SaveWordDialog({ word, onClose }: { word: string; onClose: () => void }) {
  const { categories, words, refresh } = useVault()
  const existing = words.find((w) => w.word === word.toLowerCase())

  const [selected, setSelected] = useState<string[]>(existing?.categoryIds ?? [])
  const [note, setNote] = useState(existing?.personalNote ?? '')
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  // Run an async action with a busy flag and error message.
  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function addCategory(e: FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const dupe = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (dupe) {
      if (!selected.includes(dupe.id)) toggle(dupe.id)
      setNewName('')
      return
    }
    run(async () => {
      const cat = await createCategory(name, nextColor(categories.length))
      setSelected((s) => [...s, cat.id])
      setNewName('')
      await refresh()
    })
  }

  const save = () =>
    run(async () => {
      await saveWord({ word, personalNote: note.trim(), categoryIds: selected })
      await refresh()
      onClose()
    })

  const remove = () =>
    run(async () => {
      if (!existing || !confirm(`Remove "${word}" from My Words?`)) return
      await deleteWord(existing.id)
      await refresh()
      onClose()
    })

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">
          {existing ? 'Edit' : 'Save'} “{word}”
        </h2>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Categories</p>
          {categories.length === 0 && <p className="text-sm text-slate-400">No categories yet. Add one below.</p>}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = selected.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="rounded-full border-2 px-3 py-1 text-sm font-medium"
                  style={{
                    borderColor: c.color,
                    backgroundColor: on ? c.color : 'transparent',
                    color: on ? 'white' : c.color,
                  }}
                >
                  {on ? '✓ ' : ''}
                  {c.name}
                </button>
              )
            })}
          </div>
          <form onSubmit={addCategory} className="flex gap-2">
            <input
              placeholder="New category"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
            <button disabled={busy} className="rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50">
              Add
            </button>
          </form>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-600">Personal note (optional)</span>
          <textarea
            rows={3}
            placeholder="Your own example sentence or memory hook"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-2">
          {existing && (
            <button onClick={remove} disabled={busy} className="mr-auto text-sm text-red-600 hover:underline">
              Remove word
            </button>
          )}
          <button onClick={onClose} className="ml-auto rounded-lg px-4 py-2 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
