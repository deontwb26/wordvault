// ---- Shapes of the Free Dictionary API response ----
// Docs: https://dictionaryapi.dev/

export type Phonetic = {
  text?: string
  audio?: string // may be an empty string when there's no recording
}

export type Definition = {
  definition: string
  example?: string // many senses have no example
  synonyms: string[]
  antonyms: string[]
}

export type Meaning = {
  partOfSpeech: string // "noun", "verb", ...
  definitions: Definition[]
  synonyms: string[]
  antonyms: string[]
}

export type DictionaryEntry = {
  word: string
  phonetic?: string
  phonetics: Phonetic[]
  meanings: Meaning[]
  sourceUrls?: string[]
}

// ---- Your own data (stored in Supabase) ----

export type Category = {
  id: string
  name: string
  color: string // hex, e.g. "#6366f1"
  createdAt: string // ISO date
}

export type SavedWord = {
  id: string
  word: string // lowercase
  savedAt: string // ISO date
  personalNote: string
  categoryIds: string[]
}
