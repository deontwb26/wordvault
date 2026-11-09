// Looks up a word: checks the local cache first, then the Free Dictionary API.
// All dictionary content comes from the API. Nothing is invented here.
import { db } from '../db'
import type { DictionaryEntry } from '../types'

const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

export type LookupResult =
  | { status: 'ok'; entries: DictionaryEntry[]; fromCache: boolean }
  | { status: 'not_found'; message: string }
  | { status: 'error'; message: string }

// Lookups that are still in progress, by word. If the same word is asked for
// again (e.g. pre-loaded from the dropdown, then you press Enter), both share
// one request instead of calling the API twice.
const inProgress = new Map<string, Promise<LookupResult>>()

export function lookupWord(rawWord: string): Promise<LookupResult> {
  const word = rawWord.trim().toLowerCase()
  if (!word) return Promise.resolve({ status: 'not_found', message: 'Type a word to search.' })

  let pending = inProgress.get(word)
  if (!pending) {
    pending = doLookup(word).finally(() => inProgress.delete(word))
    inProgress.set(word, pending)
  }
  return pending
}

// Start loading a word in the background so it's ready if you pick it.
// Errors are ignored here; a real search will show them.
export function prefetchWord(word: string) {
  lookupWord(word).catch(() => {})
}

async function doLookup(word: string): Promise<LookupResult> {

  // 1. Cache first: instant, and works offline.
  const cached = await db.lookupCache.get(word)
  if (cached) return { status: 'ok', entries: cached.apiResponse, fromCache: true }

  // 2. Ask the API. The free API sometimes fails for a moment (server errors,
  //    or a short block after many lookups), so try up to 3 times.
  const response = await fetchWithRetry(API_URL + encodeURIComponent(word))
  if (!response) {
    return {
      status: 'error',
      message: navigator.onLine
        ? 'The dictionary service is busy right now. Wait a moment and try again.'
        : "You're offline. Only words you've looked up before are available.",
    }
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    return { status: 'error', message: `The dictionary sent an unreadable reply (HTTP ${response.status}).` }
  }

  // Success is an array of entries. "Not found" is an object with a message.
  if (response.ok && Array.isArray(data)) {
    const entries = data as DictionaryEntry[]
    await db.lookupCache.put({ word, apiResponse: entries, fetchedAt: new Date().toISOString() })
    return { status: 'ok', entries, fromCache: false }
  }

  if (response.status === 404) {
    return { status: 'not_found', message: `No definitions found for "${word}".` }
  }
  return { status: 'error', message: `The dictionary returned an error (HTTP ${response.status}). Try again later.` }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Returns the response, or null if every attempt failed.
// A 404 ("word not found") is a real answer, so it isn't retried.
// Note: when the API is busy its error reply is blocked by the browser,
// so it shows up here as a thrown error rather than a status code.
async function fetchWithRetry(url: string, attempts = 3): Promise<Response | null> {
  for (let i = 0; i < attempts; i++) {
    // The API's errors usually clear almost instantly, so retry quickly.
    if (i > 0) await wait(i === 1 ? 200 : 600)
    try {
      const response = await fetch(url)
      if (response.ok || response.status === 404) return response
    } catch {
      // Network error or blocked error reply: try again.
    }
  }
  return null
}
