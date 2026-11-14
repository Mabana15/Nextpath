import { useState } from 'react';
import type { SkillAnalysis } from '../types';

interface SkillGalaxyMapProps {
  analysis: SkillAnalysis;
}

interface GalaxyNode {
  name: string;
  tier: 'strong' | 'developing' | 'missing';
  score: number;
  target: number;
  note: string;
  x: number;
  y: number;
  color: string;
}

export function SkillGalaxyMap({ analysis }: SkillGalaxyMapProps) {
  const nodes: GalaxyNode[] = [];
  const centerX = 320;
  const centerY = 210;

  const strongList = analysis.strongSkills.map((s) => ({
    name: s.name,
    tier: 'strong' as const,
    score: s.score,
    target: s.target,
    note: s.note,
    color: '#35D6FF',
  }));

  const devList = [
    ...analysis.intermediateSkills.map((s) => ({
      name: s.name,
      tier: 'developing' as const,
      score: s.score,
      target: s.target,
      note: s.note,
      color: '#8257FF',
    })),
    ...analysis.beginnerSkills.map((s) => ({
      name: s.name,
      tier: 'developing' as const,
      score: s.score,
      target: s.target,
      note: s.note,
      color: '#C5B8FF',
    })),
  ];

  const missingList = analysis.missingSkills.map((s) => ({
    name: s.name,
    tier: 'missing' as const,
    score: s.score,
    target: s.target,
    note: s.reason,
    color: '#F59E0B',
  }));

  const placeOnRing = (
    items: Array<Omit<GalaxyNode, 'x' | 'y'>>,
    radiusX: number,
    radiusY: number,
    offsetRad: number
  ) => {
    items.forEach((item, idx) => {
      const angle = offsetRad + (idx / Math.max(1, items.length)) * Math.PI * 2;
      nodes.push({
        ...item,
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      });
    });
  };

  placeOnRing(strongList, 95, 72, -Math.PI / 4);
  placeOnRing(devList, 170, 122, 0.25);
  placeOnRing(missingList, 248, 165, 0.65);

  const [selectedNode, setSelectedNode] = useState<GalaxyNode | null>(nodes[0] || null);

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-8 rounded-2xl bg-[#0B1020] border border-white/10 p-4 overflow-hidden">
        <svg viewBox="0 0 640 420" className="w-full h-auto max-h-[400px]" role="img" aria-label="Skill Galaxy orbital skill map">
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8257FF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0B1020" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={centerX} cy={centerY} r="230" fill="url(#coreGlow)" />

          {/* Orbital rings */}
          <ellipse cx={centerX} cy={centerY} rx="95" ry="72" fill="none" stroke="rgba(53,214,255,0.22)" strokeDasharray="4 4" />
          <ellipse cx={centerX} cy={centerY} rx="170" ry="122" fill="none" stroke="rgba(130,87,255,0.22)" strokeDasharray="4 4" />
          <ellipse cx={centerX} cy={centerY} rx="248" ry="165" fill="none" stroke="rgba(245,158,11,0.2)" strokeDasharray="4 4" />

          {/* Connection lines */}
          {nodes.map((node) => (
            <line
              key={`line-${node.name}`}
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              stroke={selectedNode?.name === node.name ? node.color : 'rgba(255,255,255,0.08)'}
              strokeWidth={selectedNode?.name === node.name ? 1.8 : 1}
            />
          ))}

          {/* Career Core */}
          <circle cx={centerX} cy={centerY} r="36" fill="#111A33" stroke="#35D6FF" strokeWidth="2" />
          <text x={centerX} y={centerY - 4} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">
            {analysis.careerCoveragePercent}%
          </text>
          <text x={centerX} y={centerY + 10} textAnchor="middle" fill="#C5B8FF" fontSize="8">
            Coverage
          </text>

          {/* Skill Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.name === node.name;
            const shortLabel = node.name.length > 16 ? node.name.slice(0, 15) + '…' : node.name;
            return (
              <g
                key={node.name}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 16 : 12}
                  fill="#111A33"
                  stroke={node.color}
                  strokeWidth={isSelected ? 2.5 : 1.75}
                />
                <text
                  x={node.x}
                  y={node.y + 3}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.score}
                </text>
                <text
                  x={node.x}
                  y={node.y + 26}
                  textAnchor="middle"
                  fill={isSelected ? '#FFFFFF' : '#C5B8FF'}
                  fontSize="9.5"
                  fontWeight={isSelected ? '700' : '500'}
                >
                  {shortLabel}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-[#C5B8FF]/80 border-t border-white/10">
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#35D6FF]" />
            Mastered (Inner Orbit)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8257FF]" />
            Developing (Middle Orbit)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Missing / Priority Gap (Outer Orbit)
          </span>
        </div>
      </div>

      {/* Selected Node Inspector */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0B1020] border border-white/10 p-6 space-y-4">
        {selectedNode ? (
          <>
            <div className="text-xs font-medium" style={{ color: selectedNode.color }}>
              {selectedNode.tier === 'strong'
                ? 'Mastered Competency'
                : selectedNode.tier === 'developing'
                ? 'Developing Competency'
                : 'Missing Priority Skill'}
            </div>
            <h3 className="font-display text-xl font-bold text-white">{selectedNode.name}</h3>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl bg-[#111A33] p-3">
                <div className="text-[11px] text-[#C5B8FF]/70">Demonstrated</div>
                <div className="font-mono text-lg font-bold text-white tabular-nums">
                  {selectedNode.score}%
                </div>
              </div>
              <div className="rounded-xl bg-[#111A33] p-3">
                <div className="text-[11px] text-[#C5B8FF]/70">Role Benchmark</div>
                <div className="font-mono text-lg font-bold text-[#35D6FF] tabular-nums">
                  {selectedNode.target}%
                </div>
              </div>
            </div>
            <p className="text-xs text-[#C5B8FF]/85 leading-relaxed">{selectedNode.note}</p>
          </>
        ) : (
          <p className="text-sm text-[#C5B8FF]">Click any node in the Skill Galaxy to inspect details.</p>
        )}
      </div>
    </div>
  );
}
