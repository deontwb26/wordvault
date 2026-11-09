// All reads and writes of your saved words and categories (Supabase).
// Tables are defined in supabase/schema.sql.
import { supabase } from './supabase'
import type { Category, SavedWord } from '../types'

// Turn a Supabase error into a normal JS error so callers can catch it.
function check<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message)
  return result.data as NonNullable<T>
}

// ---------- Categories ----------

export async function fetchCategories(): Promise<Category[]> {
  const rows = check(
    await supabase.from('categories').select('id, name, color, created_at').order('name'),
  )
  return rows.map((r) => ({ id: r.id, name: r.name, color: r.color, createdAt: r.created_at }))
}

export async function createCategory(name: string, color: string): Promise<Category> {
  const r = check(
    await supabase
      .from('categories')
      .insert({ name: name.trim(), color })
      .select('id, name, color, created_at')
      .single(),
  )
  return { id: r.id, name: r.name, color: r.color, createdAt: r.created_at }
}

export async function updateCategory(id: string, changes: { name?: string; color?: string }) {
  check(await supabase.from('categories').update(changes).eq('id', id))
}

// Links to words are removed automatically by the database (on delete cascade).
// The words themselves stay.
export async function deleteCategory(id: string) {
  check(await supabase.from('categories').delete().eq('id', id))
}

// ---------- Saved words ----------

export async function fetchSavedWords(): Promise<SavedWord[]> {
  const rows = check(
    await supabase
      .from('saved_words')
      .select('id, word, personal_note, saved_at, saved_word_categories(category_id)')
      .order('saved_at', { ascending: false }),
  )
  return rows.map((r) => ({
    id: r.id,
    word: r.word,
    personalNote: r.personal_note,
    savedAt: r.saved_at,
    categoryIds: (r.saved_word_categories as { category_id: string }[]).map((l) => l.category_id),
  }))
}

// Save a new word or update an existing one (matched by the word itself).
export async function saveWord(input: {
  word: string
  personalNote: string
  categoryIds: string[]
  savedAt?: string // only used by import, to keep the original date
}) {
  const word = input.word.trim().toLowerCase()

  // Insert, or update the note if the word is already saved.
  const row = {
    word,
    personal_note: input.personalNote,
    ...(input.savedAt ? { saved_at: input.savedAt } : {}),
  }
  const saved = check(
    await supabase
      .from('saved_words')
      .upsert(row, { onConflict: 'user_id,word' })
      .select('id')
      .single(),
  )

  // Replace this word's category links with the new set.
  check(await supabase.from('saved_word_categories').delete().eq('word_id', saved.id))
  if (input.categoryIds.length > 0) {
    check(
      await supabase
        .from('saved_word_categories')
        .insert(input.categoryIds.map((category_id) => ({ word_id: saved.id, category_id }))),
    )
  }
}

export async function deleteWord(id: string) {
  check(await supabase.from('saved_words').delete().eq('id', id))
}
