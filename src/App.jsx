import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'
import Settings from './Settings'
import { LayoutDashboard, UserCircle, LogOut } from 'lucide-react'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Auth />

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white">
        {/* NAVIGATION BAR */}
        <nav className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
            <Link to="/" className="text-xl font-black tracking-tighter text-blue-500 uppercase">SkillForge</Link>
            
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link to="/settings" className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition">
                <UserCircle size={18} /> Profil
              </Link>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-red-400 transition">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </nav>

        {/* SEITEN-INHALT */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard session={session} />} />
            <Route path="/settings" element={<Settings session={session} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App