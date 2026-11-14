import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import {
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Bot,
  Sparkles,
} from 'lucide-react';
import type { DashboardData } from '../types';

export type WorkspaceTab = 'dashboard' | 'analysis' | 'roadmap' | 'careers' | 'mentor' | 'profile';

interface DashboardViewProps {
  data: DashboardData;
  onNavigate: (tab: WorkspaceTab) => void;
  onRetakeAssessment: () => void;
}

export function DashboardView({ data, onNavigate, onRetakeAssessment }: DashboardViewProps) {
  const { profile, analysis, tasks, progress, activities, assessments, careerBenchmark, agentTrace } = data;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const roadmapPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const latestScore = assessments[0]?.score ?? 0;
  const latestMax = assessments[0]?.max_score ?? 100;

  const chartData = (analysis?.skillMatrix || []).map((s) => ({
    name: s.skill.length > 14 ? s.skill.slice(0, 13) + '…' : s.skill,
    Demonstrated: s.demonstrated,
    Required: s.required,
  }));

  const radarData = (analysis?.careerDna?.traits || []).map((t) => ({
    trait: t.trait,
    score: t.score,
  }));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#111A33] via-[#151F3D] to-[#111A33] border border-white/12 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs font-medium text-[#35D6FF]">
            {profile.degree} · {profile.department} · Target: {profile.desiredCareer}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {profile.fullName}
          </h1>
          <p className="text-sm text-[#C5B8FF]/85 max-w-2xl leading-relaxed">
            {analysis?.summary ||
              'Complete your AI skill assessment to unlock your verified skill coverage, missing skills breakdown, and adaptive learning roadmap.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('mentor')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Bot className="w-4 h-4" />
            Ask AI Mentor
          </button>
          <button
            type="button"
            onClick={onRetakeAssessment}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1020] hover:bg-white/10 border border-white/15 text-[#C5B8FF] hover:text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Retake Assessment
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-5 space-y-1.5">
          <div className="text-xs text-[#C5B8FF]/75">Career Skill Coverage</div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#35D6FF] tabular-nums">
            {analysis?.careerCoveragePercent ?? 0}%
          </div>
          <div className="text-xs text-slate-400 truncate">{profile.desiredCareer}</div>
        </div>

        <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-5 space-y-1.5">
          <div className="text-xs text-[#C5B8FF]/75">Latest Assessment Score</div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {latestScore}/{latestMax}
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            {assessments.length} diagnostic{assessments.length === 1 ? '' : 's'} taken
          </div>
        </div>

        <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-5 space-y-1.5">
          <div className="text-xs text-[#C5B8FF]/75">Roadmap Missions</div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {completedTasks}/{totalTasks}
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            {roadmapPercent}% complete · Level {progress?.level ?? 1} ({progress?.totalXp ?? 0} XP)
          </div>
        </div>

        <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-5 space-y-1.5">
          <div className="text-xs text-[#C5B8FF]/75">Profile Completion</div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {profile.profileCompletion}%
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="text-xs text-[#35D6FF] hover:underline cursor-pointer"
          >
            Update profile
          </button>
        </div>
      </div>

      {/* Charts Row: Skill Comparison + Career DNA */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Demonstrated vs Required Skills</h2>
              <p className="text-xs text-[#C5B8FF]/75">
                Verified assessment scores compared against {profile.desiredCareer} benchmarks
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analysis')}
              className="text-xs text-[#35D6FF] hover:underline cursor-pointer whitespace-nowrap"
            >
              Open Skill Galaxy →
            </button>
          </div>

          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fill: '#C5B8FF', fontSize: 11 }} angle={-18} textAnchor="end" height={52} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1020',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Demonstrated" fill="#35D6FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Required" fill="#8257FF" radius={[4, 4, 0, 0]} opacity={0.55} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[#C5B8FF]/70">
                No skill comparison data available yet.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Career DNA</h2>
              <p className="text-xs text-[#35D6FF]">
                {analysis?.careerDna?.archetype || 'Emerging Technologist'}
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-[#8257FF]" />
          </div>

          <div className="h-56 w-full">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.12)" />
                  <PolarAngleAxis dataKey="trait" tick={{ fill: '#C5B8FF', fontSize: 10 }} />
                  <Radar dataKey="score" stroke="#35D6FF" fill="#8257FF" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[#C5B8FF]/70">
                Career DNA generates after your diagnostic.
              </div>
            )}
          </div>

          <p className="text-xs text-[#C5B8FF]/80 leading-relaxed">
            {analysis?.careerDna?.summary}
          </p>
        </div>
      </div>

      {/* Missing Skills + Roadmap Snapshot + Recommended Courses */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Missing Skills */}
        <div className="lg:col-span-4 rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white">Priority Missing Skills</h2>
            <span className="font-mono text-xs text-amber-300 tabular-nums">
              {analysis?.missingSkills?.length ?? 0} gaps
            </span>
          </div>
          {analysis?.missingSkills && analysis.missingSkills.length > 0 ? (
            <div className="space-y-3">
              {analysis.missingSkills.slice(0, 4).map((skill) => (
                <div key={skill.name} className="pb-3 border-b border-white/8 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white">{skill.name}</span>
                    <span className="font-mono text-amber-300 tabular-nums">
                      {skill.score}% / {skill.target}%
                    </span>
                  </div>
                  <p className="text-xs text-[#C5B8FF]/75 mt-1 leading-relaxed">{skill.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#C5B8FF]/75">
              No critical missing skills flagged. Keep advancing through your weekly missions!
            </p>
          )}
        </div>

        {/* Upcoming Missions */}
        <div className="lg:col-span-4 rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white">Next Learning Missions</h2>
            <button
              type="button"
              onClick={() => onNavigate('roadmap')}
              className="text-xs text-[#35D6FF] hover:underline cursor-pointer"
            >
              View Roadmap
            </button>
          </div>
          <div className="space-y-3">
            {tasks
              .filter((t) => !t.completed)
              .slice(0, 4)
              .map((task) => (
                <div key={task.id} className="pb-3 border-b border-white/8 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] text-[#35D6FF]">
                    <span>
                      Week {task.weekNumber} · {task.dayLabel}
                    </span>
                    <span className="font-mono tabular-nums">+{task.xpPoints} XP</span>
                  </div>
                  <div className="text-xs font-semibold text-white mt-0.5">{task.title}</div>
                </div>
              ))}
            {tasks.filter((t) => !t.completed).length === 0 && (
              <div className="text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                All current roadmap missions completed!
              </div>
            )}
          </div>
        </div>

        {/* Recommended Courses & Resources */}
        <div className="lg:col-span-4 rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-white">Recommended Courses</h2>
          <div className="space-y-3">
            {careerBenchmark.learningResources.map((res) => (
              <a
                key={res.url}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block pb-3 border-b border-white/8 last:border-b-0 last:pb-0 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white group-hover:text-[#35D6FF] transition-colors">
                    {res.title}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#C5B8FF]/60 shrink-0" />
                </div>
                <div className="text-[11px] text-[#C5B8FF]/70 mt-0.5">
                  {res.provider} · {res.type}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Multi-Agent Trace */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-white">Recent Activity</h2>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.slice(0, 6).map((act) => (
                <div key={act.id} className="flex items-start justify-between gap-4 text-xs pb-2.5 border-b border-white/6 last:border-b-0">
                  <div>
                    <div className="font-semibold text-white">{act.action}</div>
                    <div className="text-[#C5B8FF]/75 mt-0.5">{act.detail}</div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(act.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#C5B8FF]/70">No recent activities logged yet.</p>
          )}
        </div>

        <div className="lg:col-span-6 rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white">Active Agent Orchestration</h2>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="text-xs text-[#35D6FF] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Inspect Payloads
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {agentTrace ? (
            <div className="space-y-2.5">
              {agentTrace.steps.map((s) => (
                <div key={s.agent} className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-white/6 last:border-b-0">
                  <div className="min-w-0">
                    <span className="font-semibold text-white">{s.agent}</span>
                    <p className="text-[#C5B8FF]/75 truncate">{s.summary}</p>
                  </div>
                  <span className="text-emerald-400 text-[11px] shrink-0">Active</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#C5B8FF]/70">Agent trace will appear after assessment completion.</p>
          )}
        </div>
      </div>
    </div>
  );
}
