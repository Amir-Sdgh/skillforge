import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function SkillChart({ skills, categories }) {
  // 1. Daten für das Diagramm vorbereiten
  const chartData = categories.map(cat => {
    const catSkills = skills.filter(s => s.category_id === cat.id);
    const avgLevel = catSkills.length > 0 
      ? catSkills.reduce((acc, s) => acc + s.level, 0) / catSkills.length 
      : 0;

    return {
      subject: cat.name,
      level: avgLevel,
      fullMark: 5,
    };
  });

  // Wenn keine Skills da sind, zeigen wir nichts an
  if (skills.length === 0) return null;

  return (
    <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-3xl h-[300px] w-full shadow-xl backdrop-blur-sm">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 text-center">
        Kompetenz-Profil
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
          <Radar
            name="Skills"
            dataKey="level"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}