import { useMemo } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function SkillTree({ skills }) {
  const nodes = useMemo(() => {
    return skills.map((skill, index) => ({
      id: skill.id,
      data: { label: skill.name },
      // Wir ordnen sie etwas organischer an
      position: { x: (index % 3) * 180, y: Math.floor(index / 3) * 100 },
      style: { 
        background: '#1e293b', 
        color: '#fff', 
        border: '1px solid #334155',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '700',
        padding: '8px',
        width: 120,
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      },
    }));
  }, [skills]);

  const edges = useMemo(() => {
    return skills
      .filter(skill => skill.parent_id !== null)
      .map(skill => ({
        id: `e-${skill.parent_id}-${skill.id}`,
        source: skill.parent_id,
        target: skill.id,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      }));
  }, [skills]);

  if (skills.length === 0) return null;

  return (
    // Höhe von 500px auf 300px reduziert
    <div className="h-[300px] w-full bg-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden relative">
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        fitView
        colorMode="dark"
      >
        <Background color="#334155" gap={15} size={1} />
        <Controls showInteractive={false} className="bg-slate-800 border-slate-700 fill-white" />
      </ReactFlow>
    </div>
  );
}