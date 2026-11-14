import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { DashboardData } from '../types';

interface RoadmapMissionsViewProps {
  data: DashboardData;
  onRefreshDashboard: () => Promise<void>;
}

export function RoadmapMissionsView({ data, onRefreshDashboard }: RoadmapMissionsViewProps) {
  const { roadmap, tasks, progress } = data;
  const [selectedWeek, setSelectedWeek] = useState<number>(roadmap?.weeks?.[0]?.weekNumber || 1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [adapting, setAdapting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!roadmap) {
    return (
      <div className="rounded-2xl bg-[#111A33]/80 border border-white/12 p-10 text-center space-y-3">
        <h2 className="font-display text-2xl font-bold text-white">Learning Roadmap Pending</h2>
        <p className="text-sm text-[#C5B8FF]/80 max-w-md mx-auto">
          Complete your AI skill assessment to generate a personalized multi-week learning roadmap and Mission Mode tasks.
        </p>
      </div>
    );
  }

  const weeks = roadmap.weeks || [];
  const activeWeek = weeks.find((w) => w.weekNumber === selectedWeek) || weeks[0];
  const weekTasks = tasks.filter((t) => t.weekNumber === (activeWeek?.weekNumber || 1));

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const xpProgressInLevel = (progress?.totalXp ?? 0) % 150;

  const handleToggle = async (taskId: string) => {
    setTogglingId(taskId);
    setError(null);
    try {
      await apiRequest(`/api/tasks/${taskId}/toggle`, { method: 'PATCH' });
      await onRefreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update task.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleAdaptRoadmap = async () => {
    setAdapting(true);
    setError(null);
    try {
      await apiRequest('/api/roadmap/adapt', { method: 'POST' });
      await onRefreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not adapt roadmap.');
    } finally {
      setAdapting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header + Mission Mode Level Banner */}
      <div className="rounded-2xl bg-[#111A33]/85 border border-white/12 p-6 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-[#35D6FF]">
              Personalized Learning Roadmap · {roadmap.careerGoal}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Roadmap & Mission Mode
            </h1>
            <p className="text-sm text-[#C5B8FF]/80 mt-1.5 max-w-2xl">{roadmap.overview}</p>
          </div>
          <button
            type="button"
            disabled={adapting}
            onClick={handleAdaptRoadmap}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 self-start"
          >
            {adapting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {adapting ? 'Adapting with AI...' : 'Adapt Roadmap with AI'}
          </button>
        </div>

        {/* Mission Stats */}
        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div className="rounded-xl bg-[#0B1020] border border-white/10 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#C5B8FF]/80 inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#35D6FF]" />
                Mission Level {progress?.level ?? 1}
              </span>
              <span className="font-mono text-white tabular-nums">{progress?.totalXp ?? 0} XP</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8257FF] to-[#35D6FF]"
                style={{ width: `${Math.round((xpProgressInLevel / 150) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 tabular-nums">
              {150 - xpProgressInLevel} XP to Level {(progress?.level ?? 1) + 1}
            </div>
          </div>

          <div className="rounded-xl bg-[#0B1020] border border-white/10 p-4 space-y-1">
            <div className="text-xs text-[#C5B8FF]/80">Completed Missions</div>
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
              {completedCount} / {totalTasks}
            </div>
            <div className="text-[11px] text-slate-400">
              {totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}% of roadmap finished
            </div>
          </div>

          <div className="rounded-xl bg-[#0B1020] border border-white/10 p-4 space-y-2">
            <div className="text-xs text-[#C5B8FF]/80 inline-flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              Unlocked Achievements ({progress?.achievements?.length ?? 0})
            </div>
            {progress?.achievements && progress.achievements.length > 0 ? (
              <div className="text-xs text-white font-medium truncate">
                {progress.achievements.map((a) => a.title).join(' · ')}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">Complete your first mission to unlock badges.</div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 flex items-center gap-2 text-sm text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Week Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {weeks.map((w) => {
          const wTasks = tasks.filter((t) => t.weekNumber === w.weekNumber);
          const wDone = wTasks.filter((t) => t.completed).length;
          const active = activeWeek?.weekNumber === w.weekNumber;
          return (
            <button
              key={w.weekNumber}
              type="button"
              onClick={() => setSelectedWeek(w.weekNumber)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#8257FF] border-[#8257FF] text-white'
                  : 'bg-[#111A33]/70 border-white/10 text-[#C5B8FF] hover:border-white/25 hover:text-white'
              }`}
            >
              Week {w.weekNumber} ({wDone}/{wTasks.length})
            </button>
          );
        })}
      </div>

      {/* Active Week Details & Tasks */}
      {activeWeek && (
        <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 sm:p-7 space-y-6">
          <div className="border-b border-white/10 pb-5 space-y-2">
            <div className="text-xs text-[#35D6FF] font-medium">
              Week {activeWeek.weekNumber} · Focus: {activeWeek.focusSkills?.join(', ')}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              {activeWeek.theme}
            </h2>
            <p className="text-sm text-[#C5B8FF]/85">{activeWeek.weeklyGoal}</p>
            <div className="pt-2 text-xs text-[#C5B8FF]">
              <strong className="text-white">Weekly Mini-Project:</strong> {activeWeek.miniProject}
            </div>
          </div>

          <div className="space-y-3">
            {weekTasks.map((task) => {
              const busy = togglingId === task.id;
              return (
                <div
                  key={task.id}
                  className={`rounded-xl border p-4 sm:p-5 transition-colors flex items-start gap-4 ${
                    task.completed
                      ? 'bg-emerald-500/5 border-emerald-500/25'
                      : 'bg-[#0B1020] border-white/10 hover:border-white/25'
                  }`}
                >
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggle(task.id)}
                    aria-label={task.completed ? 'Mark mission incomplete' : 'Complete mission'}
                    className="mt-0.5 text-[#35D6FF] hover:scale-110 transition-transform cursor-pointer shrink-0"
                  >
                    {busy ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#8257FF]" />
                    ) : task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 hover:text-[#35D6FF]" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#C5B8FF]/75">
                      <span>
                        {task.dayLabel} · <span className="capitalize">{task.taskType.replace('_', ' ')}</span>
                      </span>
                      <span className="font-mono text-[#35D6FF] tabular-nums">+{task.xpPoints} XP</span>
                    </div>
                    <h3
                      className={`font-display text-base font-semibold ${
                        task.completed ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-xs text-[#C5B8FF]/80 leading-relaxed">{task.description}</p>
                    {task.resourceUrl && (
                      <a
                        href={task.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#35D6FF] hover:underline pt-1"
                      >
                        {task.resourceTitle || 'Open Learning Resource'}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
