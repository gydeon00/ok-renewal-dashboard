import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function AuthBar() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    if (!email || !password) {
      alert('Enter email and password.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      window.location.reload()
    }
  }

  return (
    <div style={styles.loginBox}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={styles.input}
      />

      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        style={styles.input}
      />

      <button onClick={signIn} disabled={loading} style={styles.button}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  )
}

const styles = {
  loginBox: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    padding: 8,
    borderRadius: 6,
    border: '1px solid #ccc',
  },
  button: {
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#7f1d1d',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
  },
}