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

    if (!currentSession?.user?.id) {
      setIsAdmin(false)
      setCheckingAdmin(false)
      return
    }

    try {
      const adminCheck = supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', currentSession.user.id)
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

  return (
    <>
      <AuthBar session={session} isAdmin={isAdmin} />

      {checkingAdmin ? (
        <div style={{ padding: 20 }}>Checking access...</div>
      ) : isAdmin ? (
        <Upload />
      ) : (
        <div style={{ padding: 20, background: '#fff7ed' }}>
          Signed in, but not currently listed as an admin.
        </div>
      )}

      <Dashboard />
    </>
  )
}

export default App