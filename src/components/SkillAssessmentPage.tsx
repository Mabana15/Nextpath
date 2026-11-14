import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Loader2,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { BrandLogo } from './BrandLogo';
import type {
  AgentTraceStep,
  AssessmentRecord,
  SkillAnalysis,
} from '../types';

interface SkillAssessmentPageProps {
  forceNew?: boolean;
  onFinishedToDashboard: () => void;
  onLogout: () => void;
}

const ORCHESTRATOR_STAGES = [
  'Profile Agent synthesizing education & goals',
  'Career Agent loading role competency benchmarks',
  'Assessment Agent evaluating actual demonstrated answers',
  'Skill Analysis Agent computing gaps & Career DNA',
  'Learning Agent sequencing personalized weekly roadmap',
  'Progress Agent recording XP & unlocking milestones',
  'Mentor Agent preparing personalized recommendations',
];

export function SkillAssessmentPage({
  forceNew = false,
  onFinishedToDashboard,
  onLogout,
}: SkillAssessmentPageProps) {
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [completedResult, setCompletedResult] = useState<{
    overallScore: number;
    maxScore: number;
    strengthsSummary: string;
    gapsSummary: string;
    selfReportedVsActualNote: string;
    questionFeedback: Array<{
      questionId: string;
      skillTag: string;
      earnedPoints: number;
      maxPoints: number;
      isCorrectOrStrong: boolean;
      feedback: string;
    }>;
    analysis: SkillAnalysis;
    trace: AgentTraceStep[];
  } | null>(null);

  const loadOrGenerateAssessment = async (regenerate = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ assessment: AssessmentRecord }>('/api/assessments/generate', {
        method: 'POST',
        body: JSON.stringify({ forceNew: regenerate || forceNew }),
      });
      setAssessment(res.assessment);
      setAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate AI skill assessment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrGenerateAssessment(false);
  }, []);

  useEffect(() => {
    if (!submitting) return;
    const interval = setInterval(() => {
      setStageIdx((prev) => (prev < ORCHESTRATOR_STAGES.length - 1 ? prev + 1 : prev));
    }, 1700);
    return () => clearInterval(interval);
  }, [submitting]);

  const answeredCount = assessment
    ? assessment.questions.filter((q) => (answers[q.id] || '').trim().length > 0).length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment) return;

    const unanswered = assessment.questions.filter((q) => !(answers[q.id] || '').trim());
    if (unanswered.length > 0) {
      setError(`Please answer all ${assessment.questions.length} questions (${unanswered.length} remaining).`);
      return;
    }

    setError(null);
    setStageIdx(0);
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        evaluation: {
          overallScore: number;
          maxScore: number;
          strengthsSummary: string;
          gapsSummary: string;
          selfReportedVsActualNote: string;
          questionFeedback: Array<{
            questionId: string;
            skillTag: string;
            earnedPoints: number;
            maxPoints: number;
            isCorrectOrStrong: boolean;
            feedback: string;
          }>;
        };
        analysis: SkillAnalysis;
        trace: AgentTraceStep[];
      }>(`/api/assessments/${assessment.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });

      setCompletedResult({
        ...res.evaluation,
        analysis: res.analysis,
        trace: res.trace,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex flex-col">
      <header className="border-b border-white/10 bg-[#111A33]/60 backdrop-blur-lg sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-4 text-xs text-[#C5B8FF]">
            {assessment && !completedResult && (
              <span className="tabular-nums">
                {answeredCount}/{assessment.questions.length} answered
              </span>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        {loading && (
          <div className="rounded-2xl bg-[#111A33]/85 border border-white/12 p-10 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#35D6FF] animate-spin mx-auto" />
            <h2 className="font-display text-xl font-bold text-white">
              Assessment Agent is generating your personalized diagnostic
            </h2>
            <p className="text-sm text-[#C5B8FF]/80 max-w-md mx-auto">
              Tailoring multiple-choice, conceptual, and practical problem-solving questions to your education level and target career...
            </p>
          </div>
        )}

        {!loading && error && !submitting && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex items-center justify-between gap-4 text-sm text-red-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {!assessment && (
              <button
                type="button"
                onClick={() => loadOrGenerateAssessment(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold text-white cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        )}

        {submitting && (
          <div className="rounded-2xl bg-[#111A33]/90 border border-[#8257FF]/40 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-[#35D6FF] animate-spin shrink-0" />
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  Running 7-Agent Career Orchestration
                </h2>
                <p className="text-xs text-[#C5B8FF]/80 mt-0.5">
                  Evaluating your demonstrated answers and generating your personalized Skill Gap Analysis & Roadmap
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {ORCHESTRATOR_STAGES.map((label, idx) => {
                const isDone = idx < stageIdx;
                const isCurrent = idx === stageIdx;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs transition-colors ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : isCurrent
                        ? 'bg-[#8257FF]/15 border-[#8257FF]/60 text-white'
                        : 'bg-[#0B1020]/50 border-white/5 text-slate-500'
                    }`}
                  >
                    <span className="font-mono tabular-nums">0{idx + 1}</span>
                    <span className="flex-1">{label}</span>
                    {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isCurrent && <Loader2 className="w-4 h-4 text-[#35D6FF] animate-spin" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVE ASSESSMENT QUESTIONS */}
        {!loading && !submitting && assessment && !completedResult && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl bg-[#111A33]/85 border border-white/12 p-7">
              <div className="text-xs text-[#35D6FF] font-medium mb-1">
                AI Skill Assessment · {assessment.careerGoal}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Demonstrate Your Knowledge
              </h1>
              <p className="text-sm text-[#C5B8FF]/80 mt-2 leading-relaxed">
                Self-reported skills are only a starting point. Answer these 8 tailored questions—including multiple-choice, conceptual explanations, and practical scenarios—so our AI agents can measure your true skill coverage.
              </p>
            </div>

            {assessment.questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 sm:p-7 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#C5B8FF]/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#35D6FF] tabular-nums">Q{idx + 1}</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase tracking-wide font-semibold text-white">
                      {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'knowledge' ? 'Knowledge Check' : 'Practical Problem'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{q.skillTag}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.difficulty}</span>
                  </div>
                  <span className="font-mono tabular-nums text-[#C5B8FF]">{q.maxPoints} pts</span>
                </div>

                <h2 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                  {q.question}
                </h2>

                {q.type === 'mcq' && q.options && q.options.length > 0 ? (
                  <div className="space-y-2.5 pt-1">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <label
                          key={opt}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                            selected
                              ? 'bg-[#8257FF]/20 border-[#8257FF] text-white'
                              : 'bg-[#0B1020] border-white/12 text-[#C5B8FF] hover:border-white/30'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={opt}
                            checked={selected}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            className="mt-1 accent-[#8257FF]"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={q.type === 'practical' ? 5 : 3}
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder={
                        q.type === 'practical'
                          ? 'Write your code, query, architectural steps, or practical solution here...'
                          : 'Explain your answer clearly and concisely...'
                      }
                      className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF] font-sans"
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#C5B8FF]/75 tabular-nums">
                Completed {answeredCount} of {assessment.questions.length} questions
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#8257FF] to-[#35D6FF] text-[#0B1020] font-bold text-sm hover:brightness-110 transition-all cursor-pointer"
              >
                Submit Assessment & Analyze Skills
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ASSESSMENT RESULTS & SKILL ANALYSIS SUMMARY */}
        {completedResult && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#111A33]/90 border border-[#35D6FF]/30 p-7 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="text-xs text-[#35D6FF] font-medium">
                    AI Assessment & Skill Gap Analysis Complete
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                    {completedResult.analysis.careerGoal} Readiness
                  </h1>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-[#C5B8FF]/75">Assessment Score</div>
                    <div className="font-mono text-2xl font-bold text-white tabular-nums">
                      {completedResult.overallScore}/{completedResult.maxScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#C5B8FF]/75">Career Coverage</div>
                    <div className="font-mono text-2xl font-bold text-[#35D6FF] tabular-nums">
                      {completedResult.analysis.careerCoveragePercent}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-[#0B1020] border border-white/10 p-4 space-y-1.5">
                  <div className="text-xs font-semibold text-emerald-400">Demonstrated Strengths</div>
                  <p className="text-[#C5B8FF]/90 text-xs leading-relaxed">{completedResult.strengthsSummary}</p>
                </div>
                <div className="rounded-xl bg-[#0B1020] border border-white/10 p-4 space-y-1.5">
                  <div className="text-xs font-semibold text-amber-300">Priority Skill Gaps</div>
                  <p className="text-[#C5B8FF]/90 text-xs leading-relaxed">{completedResult.gapsSummary}</p>
                </div>
              </div>

              <div className="rounded-xl bg-[#8257FF]/10 border border-[#8257FF]/30 p-4 text-xs text-[#C5B8FF] leading-relaxed">
                <strong className="text-white">Self-Reported vs Demonstrated Insight: </strong>
                {completedResult.selfReportedVsActualNote}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="text-xs text-[#C5B8FF]/80">
                  Career DNA Archetype: <strong className="text-white">{completedResult.analysis.careerDna.archetype}</strong>
                </div>
                <button
                  type="button"
                  onClick={onFinishedToDashboard}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  Open Personalized Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question-by-question feedback */}
            <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 sm:p-7 space-y-4">
              <h2 className="font-display text-lg font-bold text-white">Question Evaluation Breakdown</h2>
              <div className="space-y-3">
                {completedResult.questionFeedback.map((fb) => (
                  <div
                    key={fb.questionId}
                    className="rounded-xl bg-[#0B1020] border border-white/10 p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        {fb.questionId.toUpperCase()} · {fb.skillTag}
                      </span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          fb.isCorrectOrStrong ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {fb.earnedPoints}/{fb.maxPoints} pts
                      </span>
                    </div>
                    <p className="text-xs text-[#C5B8FF]/85 leading-relaxed">{fb.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Trace */}
            <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Bot className="w-4 h-4 text-[#35D6FF]" />
                Multi-Agent Orchestration Log
              </div>
              <div className="space-y-2">
                {completedResult.trace.map((step) => (
                  <div
                    key={step.agent}
                    className="flex items-start justify-between gap-4 text-xs py-2 border-b border-white/5 last:border-b-0"
                  >
                    <div>
                      <span className="font-semibold text-white">{step.agent}</span>
                      <p className="text-[#C5B8FF]/75 mt-0.5">{step.summary}</p>
                    </div>
                    <span className="text-emerald-400 shrink-0">Completed</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
