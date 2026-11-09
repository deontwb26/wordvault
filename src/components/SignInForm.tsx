// Email + password sign-in, with a "Create account" mode for new users.
// Each user only ever sees their own words (Row Level Security in Supabase).
import { useState, type FormEvent } from 'react'
import { supabase, supabaseConfigured } from '../data/supabase'

type Mode = 'signin' | 'signup'

export function SignInForm({ reason }: { reason?: string }) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      // The confirmation email links back to whichever site the user is on
      // (localhost or the Vercel URL). That URL must be in Supabase's Redirect URLs.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) {
        setError(error.message)
      } else if (!data.session) {
        // No session yet = Supabase wants the email confirmed first.
        // (If the email is already registered, Supabase also lands here
        // without saying so, to avoid revealing who has an account.)
        setInfo('Check your email for a confirmation link, then sign in here.')
        setMode('signin')
      }
      // If a session came back, the user is signed in and the app updates by itself.
    }
    setBusy(false)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  if (!supabaseConfigured) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        Supabase isn't set up yet. Add your keys to <code>.env.local</code> (see README).
      </p>
    )
  }

  const isSignUp = mode === 'signup'

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-3 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">{isSignUp ? 'Create account' : 'Sign in'}</h2>
      {reason && !isSignUp && <p className="text-sm text-slate-500">{reason}</p>}
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      <input
        type="password"
        required
        minLength={isSignUp ? 6 : undefined}
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        placeholder={isSignUp ? 'Password (at least 6 characters)' : 'Password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-emerald-700">{info}</p>}
      <button
        disabled={busy}
        className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-slate-500">
        {isSignUp ? 'Already have an account? ' : 'New here? '}
        <button
          type="button"
          onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
          className="font-medium text-indigo-600 hover:underline"
        >
          {isSignUp ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </form>
  )
}
