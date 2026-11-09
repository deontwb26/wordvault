// App shell: header, tabs, and which page is showing.
import { useState } from 'react'
import { VaultProvider, useVault } from './data/VaultContext'
import { supabase } from './data/supabase'
import { SignInForm } from './components/SignInForm'
import { SearchPage } from './pages/SearchPage'
import { MyWordsPage } from './pages/MyWordsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { BackupPage } from './pages/BackupPage'

const TABS = ['Search', 'My Words', 'Categories', 'Backup'] as const
type Tab = (typeof TABS)[number]

function Shell() {
  const { session } = useVault()
  const [tab, setTab] = useState<Tab>('Search')
  const [word, setWord] = useState('') // the word currently shown on the Search tab

  // Used by synonyms and My Words: jump to Search and look the word up.
  function openWord(w: string) {
    setWord(w.toLowerCase())
    setTab('Search')
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">
            Word<span className="text-indigo-600">Vault</span>
          </h1>
          {session && (
            <button onClick={() => supabase.auth.signOut()} className="text-sm text-slate-500 hover:text-slate-800">
              Sign out
            </button>
          )}
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
                tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {tab === 'Search' && <SearchPage word={word} onSearch={openWord} />}
        {tab !== 'Search' && !session && <SignInForm reason="Sign in to see your saved words." />}
        {tab === 'My Words' && session && <MyWordsPage onOpenWord={openWord} />}
        {tab === 'Categories' && session && <CategoriesPage />}
        {tab === 'Backup' && session && <BackupPage />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <VaultProvider>
      <Shell />
    </VaultProvider>
  )
}
