// Email + password sign-in. Your account is created once in the Supabase
// dashboard (see README), so there's no sign-up form here.
import { useState, type FormEvent } from 'react'
import { supabase, supabaseConfigured } from '../data/supabase'

export function SignInForm({ reason }: { reason?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  if (!supabaseConfigured) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        Supabase isn't set up yet. Add your keys to <code>.env.local</code> (see README).
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-3 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Sign in</h2>
      {reason && <p className="text-sm text-slate-500">{reason}</p>}
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={busy}
        className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
