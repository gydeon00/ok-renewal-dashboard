import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function AuthBar({ session, isAdmin }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  async function signIn() {
    if (!email) {
      alert('Enter your email')
      return
    }

    setSending(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setSending(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for login link')
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div style={styles.bar}>
      {session ? (
        <>
          <span>
            Signed in as <strong>{session.user.email}</strong>
            {isAdmin ? ' (Admin)' : ''}
          </span>

          <button onClick={signOut} style={styles.button}>
            Sign Out
          </button>
        </>
      ) : (
        <>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            style={styles.input}
          />

          <button onClick={signIn} style={styles.button}>
            {sending ? 'Sending...' : 'Login'}
          </button>
        </>
      )}
    </div>
  )
}

const styles = {
  bar: {
    padding: 12,
    background: '#111',
    color: '#fff',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    padding: 8,
    borderRadius: 5,
    border: '1px solid #ccc',
  },
  button: {
    padding: '8px 12px',
    borderRadius: 5,
    border: 'none',
    background: '#7f1d1d',
    color: '#fff',
    cursor: 'pointer',
  },
}