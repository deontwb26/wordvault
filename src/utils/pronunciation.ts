// Picks the pronunciation text to show, and plays the word out loud.
import type { DictionaryEntry } from '../types'

// The API sometimes includes partial pronunciations such as "/-əsəs/" (just
// the ending of "hypothesis") or "/ˈkeɪ-/". A leading or trailing hyphen
// means it's a fragment, so we skip it.
function isComplete(text: string | undefined): text is string {
  if (!text) return false
  const inner = text.replace(/^[/[]|[/\]]$/g, '').trim()
  return inner.length > 0 && !inner.startsWith('-') && !inner.endsWith('-')
}

// Accent from an audio file name: ".../hypothesis-us.mp3" -> "us".
function accentOf(url: string): string | undefined {
  return url.match(/-(us|uk|au|ca|ie|nz)\.mp3$/i)?.[1].toLowerCase()
}

export function pickPronunciation(entries: DictionaryEntry[]) {
  const phonetics = entries.flatMap((e) => e.phonetics)
  const withAudio = phonetics.filter((p) => p.audio)

  // Prefer a US recording, otherwise any recording.
  const preferred = withAudio.find((p) => accentOf(p.audio!) === 'us') ?? withAudio[0]

  // Text: the one paired with the chosen recording if it's complete,
  // else any complete one. If there are only fragments, show nothing.
  const text = isComplete(preferred?.text)
    ? preferred.text
    : (phonetics.map((p) => p.text).find(isComplete) ??
      entries.map((e) => e.phonetic).find(isComplete))

  // Recordings to try, preferred first.
  const audioUrls = [...new Set([preferred, ...withAudio].filter(Boolean).map((p) => p!.audio!))]
  return { text, audioUrls }
}

// The API's recordings are copies of Wikimedia Commons files, e.g.
// "hypothesis-us.mp3" comes from "En-us-hypothesis.ogg". Used when the
// API's own audio server is down.
function wikimediaUrl(apiUrl: string, word: string): string | undefined {
  const accent = accentOf(apiUrl)
  if (!accent) return undefined
  return `https://commons.wikimedia.org/wiki/Special:FilePath/En-${accent}-${encodeURIComponent(word)}.ogg`
}

// Resolves when the audio starts playing; rejects if it can't load or play.
function playUrl(url: string): Promise<void> {
  const audio = new Audio(url)
  return audio.play()
}

// Plays the word, trying in order:
// 1. the API's recordings, 2. the original Wikimedia recordings,
// 3. your device's built-in voice (works offline, but sounds synthetic).
export async function playPronunciation(word: string, audioUrls: string[]): Promise<'recording' | 'device-voice' | 'failed'> {
  const urls = [
    ...audioUrls,
    ...audioUrls.map((u) => wikimediaUrl(u, word)).filter((u): u is string => !!u),
  ]
  for (const url of urls) {
    try {
      await playUrl(url)
      return 'recording'
    } catch {
      // Try the next one.
    }
  }

  if ('speechSynthesis' in window) {
    const speech = new SpeechSynthesisUtterance(word)
    speech.lang = 'en-US'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(speech)
    return 'device-voice'
  }
  return 'failed'
}
