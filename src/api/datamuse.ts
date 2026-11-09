// Word suggestions, spelling help and extra synonyms/antonyms from the free
// Datamuse API (https://www.datamuse.com/api/). No key needed.
// Like the dictionary, all words come from the API. Nothing is invented here.

const API = 'https://api.datamuse.com/words'

type DatamuseWord = { word: string; score?: number; tags?: string[] }

// How common a word is (occurrences per million words). Needs md=f in the request.
function frequency(w: DatamuseWord): number {
  const tag = w.tags?.find((t) => t.startsWith('f:'))
  return tag ? Number(tag.slice(2)) : 0
}

// Single words only (Datamuse also returns phrases like "ambiguous nucleus").
const isSingleWord = (w: DatamuseWord) => /^[a-z'-]+$/i.test(w.word)

async function query(params: Record<string, string>): Promise<DatamuseWord[]> {
  try {
    const res = await fetch(`${API}?${new URLSearchParams(params)}`)
    return res.ok ? await res.json() : []
  } catch {
    return [] // offline or service down: just show no suggestions
  }
}

export type Suggestion = { word: string; kind: 'completion' | 'spelling' }

// For the search box dropdown.
// - Completions: real words starting with what you typed ("seren" -> serene, serendipity).
// - Spelling fixes: common words that sound like what you typed ("recieve" -> receive).
//   Shown first when they're far more common than any completion, which
//   usually means you made a typo (common misspellings appear as "words" too).
// Suggestions already fetched this session, so backspacing is instant.
const suggestionCache = new Map<string, Suggestion[]>()

export async function suggestWords(text: string): Promise<Suggestion[]> {
  const q = text.trim().toLowerCase()
  if (q.length < 2) return []
  const cached = suggestionCache.get(q)
  if (cached) return cached
  const result = await fetchSuggestions(q)
  // Only remember non-empty results: empty can mean the service hiccuped.
  if (result.length > 0) suggestionCache.set(q, result)
  return result
}

async function fetchSuggestions(q: string): Promise<Suggestion[]> {

  const [prefixed, soundAlike] = await Promise.all([
    query({ sp: q + '*', md: 'f', max: '15' }),
    q.length >= 4 ? query({ sl: q, md: 'f', max: '20' }) : Promise.resolve([]),
  ])

  const completions = prefixed.filter((w) => isSingleWord(w) && frequency(w) >= 0.05)
  // Keep Datamuse's order (closest sound first), skipping rare words.
  const fixes = soundAlike.filter((w) => isSingleWord(w) && !w.word.startsWith(q) && frequency(w) >= 1)

  const bestCompletion = Math.max(0, ...completions.map(frequency))
  const bestFix = Math.max(0, ...fixes.map(frequency))
  const looksLikeTypo = fixes.length > 0 && (completions.length === 0 || bestFix > 10 * bestCompletion)

  if (!looksLikeTypo) {
    return completions.slice(0, 8).map((w) => ({ word: w.word, kind: 'completion' }))
  }
  // Typo: correct spellings first, then any common completions.
  return [
    ...fixes.slice(0, 4).map((w): Suggestion => ({ word: w.word, kind: 'spelling' })),
    ...completions
      .filter((w) => frequency(w) >= 1)
      .slice(0, 4)
      .map((w): Suggestion => ({ word: w.word, kind: 'completion' })),
  ]
}

// Common words that sound like `word`, closest first. Used for typos.
export async function spellingSuggestions(word: string): Promise<string[]> {
  const q = word.trim().toLowerCase()
  if (q.length < 3) return []
  return (await query({ sl: q, md: 'f', max: '20' }))
    .filter((w) => isSingleWord(w) && w.word !== q && frequency(w) >= 1)
    .slice(0, 5)
    .map((w) => w.word)
}

// Extra synonyms and antonyms for a word.
export async function relatedWords(word: string): Promise<{ synonyms: string[]; antonyms: string[] }> {
  const q = word.trim().toLowerCase()
  const [syn, ant] = await Promise.all([
    query({ rel_syn: q, max: '15' }),
    query({ rel_ant: q, max: '15' }),
  ])
  const words = (list: DatamuseWord[]) => list.filter(isSingleWord).map((w) => w.word)
  return { synonyms: words(syn), antonyms: words(ant) }
}
