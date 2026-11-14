import { useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, ArrowRight, Compass, AlertCircle } from 'lucide-react';
import { CAREER_PATHS, type CareerPath } from '../../shared/careers';
import { apiRequest } from '../lib/api';
import type { DashboardData } from '../types';

interface CareerExplorerViewProps {
  data: DashboardData;
  onRefreshDashboard: () => Promise<void>;
}

export function CareerExplorerView({ data, onRefreshDashboard }: CareerExplorerViewProps) {
  const { profile, analysis } = data;
  const currentCareerTitle = profile.desiredCareer;
  const [selectedCareerId, setSelectedCareerId] = useState<string>(
    CAREER_PATHS.find((c) => c.title === currentCareerTitle)?.id || CAREER_PATHS[0].id
  );
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedCareer: CareerPath =
    CAREER_PATHS.find((c) => c.id === selectedCareerId) || CAREER_PATHS[0];

  // Build map of student's demonstrated + self-reported skills for Career Simulator comparison
  const demonstratedMap = new Map<string, number>();
  for (const row of analysis?.skillMatrix || []) {
    demonstratedMap.set(row.skill.toLowerCase(), row.demonstrated);
  }
  const claimedSkills = new Set(
    [...profile.programmingSkills, ...profile.technicalSkills].map((s) => s.toLowerCase())
  );

  const computeCareerSimulation = (career: CareerPath) => {
    let sumRatio = 0;
    const matched: Array<{ name: string; status: 'Strong' | 'Partial' | 'Missing'; est: number; target: number }> = [];

    for (const req of career.requiredTechnicalSkills) {
      const reqLower = req.name.toLowerCase();
      let est = 0;
      for (const [k, v] of demonstratedMap.entries()) {
        if (reqLower.includes(k) || k.includes(reqLower)) {
          est = Math.max(est, v);
        }
      }
      if (est === 0) {
        for (const claimed of claimedSkills) {
          if (reqLower.includes(claimed) || claimed.includes(reqLower)) {
            est = Math.max(est, 35); // Unverified claim baseline in simulator
          }
        }
      }
      const ratio = Math.min(1, est / Math.max(1, req.targetLevel));
      sumRatio += ratio;
      matched.push({
        name: req.name,
        status: est >= 70 ? 'Strong' : est >= 30 ? 'Partial' : 'Missing',
        est,
        target: req.targetLevel,
      });
    }

    const matchPercent = Math.round((sumRatio / Math.max(1, career.requiredTechnicalSkills.length)) * 100);
    return { matchPercent, matched };
  };

  const sim = computeCareerSimulation(selectedCareer);
  const isCurrentGoal = selectedCareer.title === currentCareerTitle;

  const handleSwitchCareer = async () => {
    setSwitching(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiRequest('/api/careers/select', {
        method: 'POST',
        body: JSON.stringify({ careerTitle: selectedCareer.title }),
      });
      await onRefreshDashboard();
      setSuccessMsg(`Target career updated to ${selectedCareer.title}. Your skill analysis and roadmap have been rebuilt.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to switch target career.');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-[#35D6FF]">Career Explorer & Simulator</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
          Simulate Career Paths & Skill Fit
        </h1>
        <p className="text-sm text-[#C5B8FF]/80 mt-1">
          Compare your current profile against eight technical roles and switch your active target anytime.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 flex items-center gap-2 text-sm text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-center gap-2 text-sm text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Career List */}
        <div className="lg:col-span-4 space-y-2.5">
          {CAREER_PATHS.map((career) => {
            const active = career.id === selectedCareer.id;
            const cSim = computeCareerSimulation(career);
            const isGoal = career.title === currentCareerTitle;
            return (
              <button
                key={career.id}
                type="button"
                onClick={() => setSelectedCareerId(career.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-[#8257FF]/18 border-[#8257FF] text-white'
                    : 'bg-[#111A33]/75 border-white/10 text-[#C5B8FF] hover:border-white/25 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-sm">{career.title}</span>
                  <span className="font-mono text-xs text-[#35D6FF] tabular-nums">{cSim.matchPercent}% fit</span>
                </div>
                <div className="text-[11px] text-[#C5B8FF]/70 mt-1">
                  {isGoal ? 'Current Active Goal · ' : ''}
                  {career.demandLevel} · {career.avgTimelineMonths} mo
                </div>
              </button>
            );
          })}
        </div>

        {/* Career Simulator Detail */}
        <div className="lg:col-span-8 rounded-2xl bg-[#111A33]/85 border border-white/12 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1.5">
              <div className="text-xs text-[#35D6FF] font-medium">
                {selectedCareer.demandLevel} · Simulated Profile Match: {sim.matchPercent}%
              </div>
              <h2 className="font-display text-2xl font-bold text-white">{selectedCareer.title}</h2>
              <p className="text-sm text-[#C5B8FF]/85 leading-relaxed">{selectedCareer.description}</p>
            </div>

            {!isCurrentGoal ? (
              <button
                type="button"
                disabled={switching}
                onClick={handleSwitchCareer}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                {switching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                {switching ? 'Switching & Rebuilding...' : 'Set as Target Career'}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                Active Career Goal
              </span>
            )}
          </div>

          {/* Simulated Skill Fit Matrix */}
          <div className="space-y-3">
            <h3 className="font-display text-base font-semibold text-white">
              Your Profile vs {selectedCareer.title} Technical Requirements
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {sim.matched.map((m) => (
                <div key={m.name} className="rounded-xl bg-[#0B1020] border border-white/10 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{m.name}</span>
                    <span
                      className={`font-mono tabular-nums ${
                        m.status === 'Strong'
                          ? 'text-[#35D6FF]'
                          : m.status === 'Partial'
                          ? 'text-[#C5B8FF]'
                          : 'text-amber-300'
                      }`}
                    >
                      {m.est}% / {m.target}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={
                        m.status === 'Strong'
                          ? 'h-full bg-[#35D6FF]'
                          : m.status === 'Partial'
                          ? 'h-full bg-[#8257FF]'
                          : 'h-full bg-amber-400'
                      }
                      style={{ width: `${Math.max(4, m.est)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Soft Skills & Requirements */}
          <div className="grid sm:grid-cols-2 gap-6 pt-2 border-t border-white/10">
            <div>
              <h4 className="text-xs font-semibold text-white mb-2">Key Soft Skills</h4>
              <ul className="space-y-1.5 text-xs text-[#C5B8FF]/85">
                {selectedCareer.softSkills.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-2">Core Role Expectations</h4>
              <ul className="space-y-1.5 text-xs text-[#C5B8FF]/85">
                {selectedCareer.requirements.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Projects & Resources */}
          <div className="grid sm:grid-cols-2 gap-6 pt-2 border-t border-white/10">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white">Recommended Projects</h4>
              {selectedCareer.recommendedProjects.map((p) => (
                <div key={p.title} className="rounded-xl bg-[#0B1020] border border-white/10 p-3.5">
                  <div className="text-xs font-semibold text-white">{p.title}</div>
                  <div className="text-[11px] text-[#35D6FF] mt-0.5">{p.difficulty}</div>
                  <p className="text-xs text-[#C5B8FF]/75 mt-1 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white">Curated Learning Resources</h4>
              {selectedCareer.learningResources.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-[#0B1020] border border-white/10 p-3.5 hover:border-[#35D6FF]/50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>{r.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#35D6FF]" />
                  </div>
                  <div className="text-[11px] text-[#C5B8FF]/75 mt-0.5">
                    {r.provider} · {r.type}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {!isCurrentGoal && (
            <div className="pt-2">
              <button
                type="button"
                disabled={switching}
                onClick={handleSwitchCareer}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#35D6FF] hover:underline cursor-pointer"
              >
                Switch roadmap to {selectedCareer.title}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
