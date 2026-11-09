// Export everything to a JSON file, and import it back.
// Import merges: it never deletes anything you already have.
import { db, type CachedLookup } from '../db'
import { createCategory, fetchCategories, fetchSavedWords, saveWord } from '../data/store'
import type { Category, SavedWord } from '../types'

type BackupFile = {
  app: 'wordvault'
  version: 1
  exportedAt: string
  categories: Category[]
  savedWords: SavedWord[]
  lookupCache: CachedLookup[]
}

export async function exportBackup() {
  const backup: BackupFile = {
    app: 'wordvault',
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: await fetchCategories(),
    savedWords: await fetchSavedWords(),
    lookupCache: await db.lookupCache.toArray(),
  }

  // Trigger a file download in the browser.
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `wordvault-backup-${backup.exportedAt.slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

export async function importBackup(file: File): Promise<string> {
  let backup: BackupFile
  try {
    backup = JSON.parse(await file.text())
  } catch {
    throw new Error("That file isn't valid JSON.")
  }
  if (backup?.app !== 'wordvault' || !Array.isArray(backup.savedWords)) {
    throw new Error("That file isn't a WordVault backup.")
  }

  // 1. Categories: reuse ones with the same name, create the rest.
  //    Map old ids (from the file) to ids in your current account.
  const existing = await fetchCategories()
  const idMap = new Map<string, string>()
  let newCategories = 0
  for (const cat of backup.categories ?? []) {
    let match = existing.find((c) => c.name.toLowerCase() === cat.name.toLowerCase())
    if (!match) {
      match = await createCategory(cat.name, cat.color)
      existing.push(match)
      newCategories++
    }
    idMap.set(cat.id, match.id)
  }

  // 2. Words: merge with what's already saved (categories are combined,
  //    the note from the file wins if it isn't empty).
  const current = new Map((await fetchSavedWords()).map((w) => [w.word, w]))
  for (const w of backup.savedWords) {
    const mine = current.get(w.word.toLowerCase())
    const imported = w.categoryIds.map((id) => idMap.get(id)).filter((id): id is string => !!id)
    await saveWord({
      word: w.word,
      personalNote: w.personalNote || mine?.personalNote || '',
      categoryIds: [...new Set([...(mine?.categoryIds ?? []), ...imported])],
      savedAt: mine ? undefined : w.savedAt,
    })
  }

  // 3. Lookup cache (so definitions work offline straight away).
  if (Array.isArray(backup.lookupCache)) await db.lookupCache.bulkPut(backup.lookupCache)

  return `Imported ${backup.savedWords.length} words and ${newCategories} new categories.`
}
