import { RefreshCw, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import type { DashboardData } from '../types';
import { SkillGalaxyMap } from './SkillGalaxyMap';

interface SkillAnalysisViewProps {
  data: DashboardData;
  onRetakeAssessment: () => void;
}

export function SkillAnalysisView({ data, onRetakeAssessment }: SkillAnalysisViewProps) {
  const { analysis } = data;

  if (!analysis) {
    return (
      <div className="rounded-2xl bg-[#111A33]/80 border border-white/12 p-10 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">No Skill Analysis Generated Yet</h2>
        <p className="text-sm text-[#C5B8FF]/80 max-w-md mx-auto">
          Complete your AI Skill Assessment so our Skill Analysis Agent can evaluate your demonstrated competencies.
        </p>
        <button
          type="button"
          onClick={onRetakeAssessment}
          className="px-6 py-3 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] text-white text-sm font-semibold cursor-pointer"
        >
          Start AI Skill Assessment
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#35D6FF]">AI Skill Gap Analysis · {analysis.careerGoal}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Skill Galaxy & Competency Report
          </h1>
        </div>
        <button
          type="button"
          onClick={onRetakeAssessment}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] text-white text-xs font-semibold transition-colors cursor-pointer self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-Assess Skills with AI
        </button>
      </div>

      {/* Interactive Skill Galaxy */}
      <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Interactive Skill Galaxy</h2>
          <p className="text-xs text-[#C5B8FF]/75">
            Click any orbiting skill node to compare your verified assessment score against role requirements.
          </p>
        </div>
        <SkillGalaxyMap analysis={analysis} />
      </div>

      {/* 4 Skill Tiers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strong Skills */}
        <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">Strong Skills (75%+)</h3>
            <span className="font-mono text-xs text-[#35D6FF] tabular-nums">{analysis.strongSkills.length}</span>
          </div>
          {analysis.strongSkills.length > 0 ? (
            <div className="space-y-3">
              {analysis.strongSkills.map((s) => (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{s.name}</span>
                    <span className="font-mono text-[#35D6FF] tabular-nums">{s.score}% / {s.target}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#35D6FF]" style={{ width: `${s.score}%` }} />
                  </div>
                  <p className="text-[11px] text-[#C5B8FF]/75">{s.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#C5B8FF]/70">Build up intermediate skills to reach the Strong tier.</p>
          )}
        </div>

        {/* Intermediate Skills */}
        <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">Intermediate Skills (50–74%)</h3>
            <span className="font-mono text-xs text-[#8257FF] tabular-nums">{analysis.intermediateSkills.length}</span>
          </div>
          {analysis.intermediateSkills.length > 0 ? (
            <div className="space-y-3">
              {analysis.intermediateSkills.map((s) => (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{s.name}</span>
                    <span className="font-mono text-[#C5B8FF] tabular-nums">{s.score}% / {s.target}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#8257FF]" style={{ width: `${s.score}%` }} />
                  </div>
                  <p className="text-[11px] text-[#C5B8FF]/75">{s.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#C5B8FF]/70">No skills currently classified in the Intermediate band.</p>
          )}
        </div>

        {/* Beginner Skills */}
        <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">Beginner Skills (25–49%)</h3>
            <span className="font-mono text-xs text-[#C5B8FF] tabular-nums">{analysis.beginnerSkills.length}</span>
          </div>
          {analysis.beginnerSkills.length > 0 ? (
            <div className="space-y-3">
              {analysis.beginnerSkills.map((s) => (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{s.name}</span>
                    <span className="font-mono text-[#C5B8FF] tabular-nums">{s.score}% / {s.target}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#C5B8FF]" style={{ width: `${s.score}%` }} />
                  </div>
                  <p className="text-[11px] text-[#C5B8FF]/75">{s.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#C5B8FF]/70">No skills in the Beginner band.</p>
          )}
        </div>

        {/* Missing Skills */}
        <div className="rounded-2xl bg-[#111A33]/80 border border-amber-400/25 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Missing Skills (&lt;25%)
            </h3>
            <span className="font-mono text-xs text-amber-300 tabular-nums">{analysis.missingSkills.length}</span>
          </div>
          {analysis.missingSkills.length > 0 ? (
            <div className="space-y-3">
              {analysis.missingSkills.map((s) => (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {s.name} · <span className="text-amber-300">{s.priority} Priority</span>
                    </span>
                    <span className="font-mono text-amber-300 tabular-nums">{s.score}% / {s.target}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${Math.max(4, s.score)}%` }} />
                  </div>
                  <p className="text-[11px] text-[#C5B8FF]/75">{s.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Zero missing skills detected for this role!
            </p>
          )}
        </div>
      </div>

      {/* Recommended Improvements */}
      <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#35D6FF]" />
          <h2 className="font-display text-lg font-bold text-white">Recommended Improvements</h2>
        </div>
        <ul className="grid sm:grid-cols-2 gap-3">
          {analysis.recommendedImprovements.map((tip, idx) => (
            <li
              key={idx}
              className="rounded-xl bg-[#0B1020] border border-white/10 p-4 text-xs text-[#C5B8FF]/90 leading-relaxed flex items-start gap-2.5"
            >
              <span className="font-mono text-[#35D6FF] tabular-nums">0{idx + 1}</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
