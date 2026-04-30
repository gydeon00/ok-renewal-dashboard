import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import AuthBar from './AuthBar'
import Upload from './Upload'
import Dashboard from './Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    let active = true

    async function start() {
      const { data } = await supabase.auth.getSession()

      if (!active) return

      setSession(data.session)
      await checkAdmin(data.session)
    }

    start()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!active) return

        setSession(newSession)
        await checkAdmin(newSession)
      }
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function checkAdmin(currentSession) {
    setCheckingAdmin(true)

    if (!currentSession?.user?.email) {
      setIsAdmin(false)
      setCheckingAdmin(false)
      return
    }

    try {
      const adminCheck = supabase
        .from('admins')
        .select('email')
        .eq('email', currentSession.user.email)
        .maybeSingle()

      const timeout = new Promise((resolve) =>
        setTimeout(() => resolve({ data: null, error: 'timeout' }), 5000)
      )

      const result = await Promise.race([adminCheck, timeout])

      if (result.error) {
        console.error('Admin check error:', result.error)
        setIsAdmin(false)
      } else {
        setIsAdmin(!!result.data)
      }
    } catch (err) {
      console.error('Admin check crashed:', err)
      setIsAdmin(false)
    }

    setCheckingAdmin(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
    window.location.reload()
  }

  return (
    <>
      <div style={styles.topBar}>
        {session ? (
          <>
            <span>
              Signed in as <strong>{session.user.email}</strong>
              {isAdmin ? ' (Admin)' : ''}
            </span>

            <button onClick={handleSignOut} style={styles.signOutButton}>
              Sign Out
            </button>
          </>
        ) : (
          <AuthBar session={session} isAdmin={isAdmin} />
        )}
      </div>

      {checkingAdmin ? (
        <div style={styles.notice}>Checking access...</div>
      ) : isAdmin ? (
        <Upload />
      ) : session ? (
        <div style={styles.notice}>
          Signed in, but not currently listed as an admin.
        </div>
      ) : null}

      <Dashboard />
    </>
  )
}

const styles = {
  topBar: {
    padding: 12,
    background: '#111',
    color: '#fff',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    fontFamily: 'Arial, sans-serif',
  },
  signOutButton: {
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#7f1d1d',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  notice: {
    padding: 16,
    background: '#fff7ed',
    fontFamily: 'Arial, sans-serif',
  },
}

export default App