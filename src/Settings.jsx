import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabaseClient'
import { Save } from 'lucide-react'

export default function Settings({ session }) {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // 1. Funktion definieren
  const fetchProfile = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setUsername(data.username || '')
      setFirstName(session.user.user_metadata?.first_name || '')
      setLastName(session.user.user_metadata?.last_name || '')
    }
    setLoading(false)
  }, [session])

  // 2. useEffect erst DANACH benutzen
  useEffect(() => {
    const load = async () => {
      await fetchProfile();
    };
    load();
  }, [fetchProfile]);

  async function updateProfile(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username, updated_at: new Date() })
      .eq('id', session.user.id)

    if (error) alert(error.message)
    else alert('Profil erfolgreich aktualisiert!')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Profil-Einstellungen</h2>
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-700">
           <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center border-4 border-slate-700 text-3xl font-bold uppercase">
             {firstName[0]}{lastName[0]}
           </div>
           <div>
             <p className="text-slate-400 text-sm">Angemeldet als</p>
             <p className="font-bold">{session.user.email}</p>
           </div>
        </div>
        <form onSubmit={updateProfile} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 ml-1 mb-2">Vorname</label>
              <input type="text" disabled className="w-full p-3 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed shadow-inner" value={firstName} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 ml-1 mb-2">Nachname</label>
              <input type="text" disabled className="w-full p-3 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed shadow-inner" value={lastName} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 ml-1 mb-2">Username</label>
            <input type="text" className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none transition" 
              value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Wähle einen Usernamen..." />
          </div>
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition flex justify-center items-center gap-2 shadow-lg shadow-blue-900/40">
            <Save size={16} /> {loading ? 'Speichere...' : 'Änderungen speichern'}
          </button>
        </form>
      </div>
    </div>
  )
}