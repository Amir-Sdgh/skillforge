import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabaseClient'
import { Plus, Trash2, TrendingUp, Star, Award, Zap } from 'lucide-react'
import SkillChart from './SkillChart'

export default function Dashboard({ session }) {
  const [skills, setSkills] = useState([])
  const [categories, setCategories] = useState([])
  const [profile, setProfile] = useState(null) // NEU: Für XP
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState(1)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchInitialData = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    const [skillsRes, catsRes, profileRes] = await Promise.all([
      supabase.from('skills').select('*, categories(*)').order('level', { ascending: false }),
      supabase.from('categories').select('*').or(`user_id.is.null,user_id.eq.${session.user.id}`),
      supabase.from('profiles').select('*').eq('id', session.user.id).single() // NEU: XP laden
    ])
    
    if (catsRes.data) {
      setCategories(catsRes.data)
      if (catsRes.data.length > 0 && !selectedCategoryId) setSelectedCategoryId(catsRes.data[0].id)
    }
    if (skillsRes.data) setSkills(skillsRes.data)
    if (profileRes.data) setProfile(profileRes.data)
    setLoading(false)
  }, [session, selectedCategoryId])

  useEffect(() => {
    const load = async () => { await fetchInitialData(); };
    load();
  }, [fetchInitialData]);

  async function addSkill(e) {
    e.preventDefault()
    if (!newSkillName || !selectedCategoryId) return
    const { data, error } = await supabase
      .from('skills')
      .insert([{ name: newSkillName, level: parseInt(newSkillLevel), user_id: session.user.id, category_id: selectedCategoryId }])
      .select('*, categories(*)')
    if (!error && data) {
      setSkills([data[0], ...skills])
      setNewSkillName('')
      // Bonus: 50 XP für neuen Skill
      await supabase.rpc('increment_xp', { x: 50, row_id: session.user.id });
      fetchInitialData(); // Daten neu laden für XP Update
    }
  }

  async function updateSkillLevel(id, newLevel, currentLevel) {
    if (newLevel < 1 || newLevel > 5) return
    const { error } = await supabase.from('skills').update({ level: newLevel }).eq('id', id)
    
    if (!error) {
      const xpChange = newLevel > currentLevel ? 10 : -5;
      await supabase.rpc('increment_xp', { x: xpChange, row_id: session.user.id });
      setSkills(skills.map(s => s.id === id ? { ...s, level: newLevel } : s))
      // Profil neu laden um XP Anzeige zu aktualisieren
      const { data } = await supabase.from('profiles').select('total_xp').eq('id', session.user.id).single();
      setProfile(prev => ({ ...prev, total_xp: data.total_xp }));
    }
  }

  async function deleteSkill(id) {
    const { error } = await supabase.from('skills').delete().eq('id', id)
    if (!error) setSkills(skills.filter(s => s.id !== id))
  }

  const avgLevel = skills.length > 0 ? (skills.reduce((acc, s) => acc + s.level, 0) / skills.length).toFixed(1) : 0

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700 flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-500"><Award size={24}/></div>
          <div><p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Skills</p><p className="text-2xl font-bold">{skills.length}</p></div>
        </div>
        
        <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700 flex items-center gap-4">
          <div className="bg-yellow-500/20 p-3 rounded-2xl text-yellow-500"><Star size={24}/></div>
          <div><p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Ø Level</p><p className="text-2xl font-bold">{avgLevel}</p></div>
        </div>

        <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700 flex items-center gap-4">
          <div className="bg-purple-500/20 p-3 rounded-2xl text-purple-500"><Zap size={24}/></div>
          <div><p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Gesamt XP</p><p className="text-2xl font-bold text-purple-400">{profile?.total_xp || 0}</p></div>
        </div>

        <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700 flex items-center gap-4">
          <div className="bg-green-500/20 p-3 rounded-2xl text-green-500"><TrendingUp size={24}/></div>
          <div><p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Rang</p><p className="text-2xl font-bold">Lvl {Math.floor((profile?.total_xp || 0) / 100) + 1}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
           <SkillChart skills={skills} categories={categories} />
        </div>
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl">
            <h2 className="text-xs font-black mb-6 uppercase tracking-widest flex items-center gap-2 text-blue-400"><Plus size={16}/> Schmiede</h2>
            <form onSubmit={addSkill} className="space-y-5">
              <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm outline-none" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm outline-none" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} placeholder="Skill Name..."/>
              <input type="range" min="1" max="5" className="w-full accent-blue-500 mt-2" value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)}/>
              <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition shadow-lg">Speichern</button>
            </form>
        </div>
      </div>

      <div className="space-y-10">
        {loading ? (
  <div className="flex justify-center p-20">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
) : (
  <div className="space-y-10">
    {categories.map(cat => {
      const catSkills = skills.filter(s => s.category_id === cat.id);
      if (catSkills.length === 0) return null;
      return (
        <div key={cat.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] text-slate-500 mb-5 ml-2">
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></div>
            {cat.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catSkills.map(skill => (
              <div key={skill.id} className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl group hover:border-slate-400 transition-all duration-300 shadow-lg">
                <div className="flex justify-between items-start mb-5">
                  <h4 className="font-bold text-base tracking-tight">{skill.name}</h4>
                  <button onClick={() => deleteSkill(skill.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14}/>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5 flex-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-700" 
                           style={{ backgroundColor: i < skill.level ? cat.color : '#1e293b' }} />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => updateSkillLevel(skill.id, skill.level - 1, skill.level)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-700 text-xs transition border border-slate-700">-</button>
                    <button onClick={() => updateSkillLevel(skill.id, skill.level + 1, skill.level)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-700 text-xs transition border border-slate-700">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    })}
  </div>
)}
      </div>
    </div>
  )
}