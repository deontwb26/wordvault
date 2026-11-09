// Local browser database (IndexedDB via Dexie).
// Only used to cache dictionary lookups so repeat lookups work offline.
// Your saved words and categories live in Supabase (see src/data/store.ts).
import Dexie, { type Table } from 'dexie'
import type { DictionaryEntry } from './types'

export type CachedLookup = {
  word: string // lowercase, primary key
  apiResponse: DictionaryEntry[] // raw JSON from the API
  fetchedAt: string // ISO date
}

class WordVaultDB extends Dexie {
  lookupCache!: Table<CachedLookup, string>

  constructor() {
    super('wordvault')
    // '&word' = word is the unique primary key
    this.version(1).stores({ lookupCache: '&word, fetchedAt' })
  }
}

export const db = new WordVaultDB()
