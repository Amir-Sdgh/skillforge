import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabaseClient'
import { Plus, Trash2, TrendingUp, Star, Award, Zap } from 'lucide-react'
import SkillChart from './SkillChart'
import SkillTree from './SkillTree'

export default function Dashboard({ session }) {
  const [skills, setSkills] = useState([])
  const [categories, setCategories] = useState([])
  const [profile, setProfile] = useState(null)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState(1)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedParentId, setSelectedParentId] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchInitialData = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    const [skillsRes, catsRes, profileRes] = await Promise.all([
      supabase.from('skills').select('*, categories(*)').order('level', { ascending: false }),
      supabase.from('categories').select('*').or(`user_id.is.null,user_id.eq.${session.user.id}`),
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
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
    const { data, error } = await supabase.from('skills').insert([{ name: newSkillName, level: parseInt(newSkillLevel), user_id: session.user.id, category_id: selectedCategoryId, parent_id: selectedParentId || null }]).select('*, categories(*)')
    if (!error && data) {
      setSkills([data[0], ...skills]); setNewSkillName(''); setSelectedParentId('');
      await supabase.rpc('increment_xp', { x: 50, row_id: session.user.id });
      fetchInitialData();
    }
  }

  async function updateSkillLevel(id, newLevel, currentLevel) {
    if (newLevel < 1 || newLevel > 5) return
    const { error } = await supabase.from('skills').update({ level: newLevel }).eq('id', id)
    if (!error) {
      const xpChange = newLevel > currentLevel ? 10 : -5;
      await supabase.rpc('increment_xp', { x: xpChange, row_id: session.user.id });
      setSkills(skills.map(s => s.id === id ? { ...s, level: newLevel } : s))
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <> {/* <-- DAS HIER HAT GEFEHLT (Fragment Start) */}
          
          {/* 1. COMPACT STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Skills', val: skills.length, icon: Award, col: 'text-blue-500' },
              { label: 'Ø Level', val: avgLevel, icon: Star, col: 'text-yellow-500' },
              { label: 'XP', val: profile?.total_xp || 0, icon: Zap, col: 'text-purple-400' },
              { label: 'Rang', val: `Lvl ${Math.floor((profile?.total_xp || 0) / 100) + 1}`, icon: TrendingUp, col: 'text-green-500' }
            ].map((s, i) => (
              <div key={i} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex items-center gap-3">
                <s.icon size={18} className={s.col} />
                <div>
                  <p className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">{s.label}</p>
                  <p className="text-lg font-bold leading-none mt-1">{s.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 2. MAIN VISUAL GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-4 shadow-inner">
                  <SkillChart skills={skills} categories={categories} />
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-4 flex flex-col">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Skill-Tree</h3>
                  <SkillTree skills={skills} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                <h2 className="text-xs font-black mb-4 uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <Plus size={14}/> Schmiede
                </h2>
                <form onSubmit={addSkill} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <select className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs outline-none focus:border-blue-500 transition text-white" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <input type="text" className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs outline-none focus:border-blue-500 text-white" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} placeholder="Skill..."/>
                  </div>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs outline-none text-white" value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)}>
                    <option value="">Voraussetzung (keine)</option>
                    {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div className="flex items-center gap-3">
                    <input type="range" min="1" max="5" className="flex-1 accent-blue-500" value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)}/>
                    <span className="text-xs font-bold text-blue-400">Lvl {newSkillLevel}</span>
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition shadow-lg">Speichern</button>
                </form>
              </div>
            </div>
          </div>

          {/* 3. SKILL COLLECTION */}
          <div className="space-y-8">
            {categories.map(cat => {
              const catSkills = skills.filter(s => s.category_id === cat.id);
              if (catSkills.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h3 className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4 ml-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: cat.color}}></div> {cat.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {catSkills.map(skill => (
                      <div key={skill.id} className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl group hover:border-slate-500 transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-sm tracking-tight">{skill.name}</h4>
                          <button onClick={() => deleteSkill(skill.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={12}/></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1 flex-1">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: i < skill.level ? cat.color : '#1e293b' }} />
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => updateSkillLevel(skill.id, skill.level - 1, skill.level)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-700 text-[10px] border border-slate-700">-</button>
                            <button onClick={() => updateSkillLevel(skill.id, skill.level + 1, skill.level)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-700 text-[10px] border border-slate-700">+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

        </> 
      )}
    </div>
  )
}