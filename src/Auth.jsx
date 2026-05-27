import { useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('') 
  const [lastName, setLastName] = useState('')   
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`
          }
        }
      })
      if (error) alert(error.message)
      else alert('Check deine E-Mails (oder logg dich direkt ein, falls Bestätigung aus ist)!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-black text-center mb-2 tracking-tighter uppercase text-blue-500">SkillForge</h1>
        <p className="text-slate-400 text-center mb-8 text-sm italic">
          {isSignUp ? 'Erstelle dein Kompetenz-Profil' : 'Willkommen zurück'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 ml-1 mb-1">Vorname</label>
                <input type="text" className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500 transition" 
                  value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 ml-1 mb-1">Nachname</label>
                <input type="text" className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500 transition" 
                  value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 ml-1 mb-1">E-Mail</label>
            <input type="email" className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500 transition" 
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 ml-1 mb-1">Passwort</label>
            <input type="password" placeholder="Min. 6 Zeichen" className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500 transition" 
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl mt-4 transition shadow-lg shadow-blue-900/40 uppercase tracking-widest text-xs">
            {loading ? 'Schmiede...' : isSignUp ? 'Account erstellen' : 'Einloggen'}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-xs text-slate-500 mt-6 hover:text-white transition uppercase tracking-widest">
          {isSignUp ? 'Schon dabei? Login' : 'Neu hier? Account erstellen'}
        </button>
      </div>
    </div>
  )
}