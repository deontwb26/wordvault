// Holds the signed-in user, your categories and saved words, and shares
// them with every page. Call refresh() after any change.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { fetchCategories, fetchSavedWords } from './store'
import type { Category, SavedWord } from '../types'

type Vault = {
  session: Session | null
  categories: Category[]
  words: SavedWord[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const VaultContext = createContext<Vault | null>(null)

export function VaultProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [words, setWords] = useState<SavedWord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep track of sign-in / sign-out.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const refresh = useCallback(async () => {
    if (!session) {
      setCategories([])
      setWords([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [c, w] = await Promise.all([fetchCategories(), fetchSavedWords()])
      setCategories(c)
      setWords(w)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [session])

  // Reload whenever the signed-in user changes.
  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <VaultContext.Provider value={{ session, categories, words, loading, error, refresh }}>
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const vault = useContext(VaultContext)
  if (!vault) throw new Error('useVault must be used inside <VaultProvider>')
  return vault
}
