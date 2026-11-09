// Backup tab: export everything to JSON, or import a backup file.
import { useState, type ChangeEvent } from 'react'
import { useVault } from '../data/VaultContext'
import { exportBackup, importBackup } from '../utils/backup'

export function BackupPage() {
  const { refresh, words, categories } = useVault()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<string>) {
    setBusy(true)
    setMessage(null)
    try {
      setMessage({ ok: true, text: await action() })
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // lets you pick the same file again later
    if (!file) return
    run(async () => {
      const result = await importBackup(file)
      await refresh()
      return result
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-600">
        Your words sync to Supabase automatically. A backup file is an extra copy you keep yourself.
      </p>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Export</h2>
        <p className="text-sm text-slate-500">
          Downloads {words.length} words, {categories.length} categories and cached definitions as one JSON file.
        </p>
        <button
          disabled={busy}
          onClick={() => run(async () => (await exportBackup(), 'Backup downloaded.'))}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Export to JSON
        </button>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Import</h2>
        <p className="text-sm text-slate-500">
          Merges a backup into your vault. Nothing you already have is deleted.
        </p>
        <label className="inline-block cursor-pointer rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50">
          Choose backup file…
          <input type="file" accept="application/json,.json" onChange={handleFile} disabled={busy} className="hidden" />
        </label>
      </section>

      {busy && <p className="text-slate-500">Working…</p>}
      {message && (
        <p className={`rounded-lg p-3 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
