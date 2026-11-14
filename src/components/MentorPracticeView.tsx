import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Send,
  Trash2,
  Loader2,
  Sparkles,
  Code2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { DashboardData, MentorMessage } from '../types';

interface MentorPracticeViewProps {
  data: DashboardData;
  onRefreshDashboard: () => Promise<void>;
}

type MentorSubTab = 'chat' | 'interview' | 'projects';

export function MentorPracticeView({ data, onRefreshDashboard }: MentorPracticeViewProps) {
  const { profile, analysis } = data;
  const [subTab, setSubTab] = useState<MentorSubTab>('chat');

  // Chat state
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Interview Practice state
  const [interviewQuestion, setInterviewQuestion] = useState<{
    sessionId: string;
    careerGoal: string;
    question: string;
    focusSkill: string;
    difficulty: string;
    hints: string[];
  } | null>(null);
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewEval, setInterviewEval] = useState<{
    score: number;
    strengths: string[];
    improvements: string[];
    modelAnswer: string;
    verdict: string;
  } | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<
    Array<{ id: string; careerGoal: string; question: string; score: number; createdAt: string }>
  >([]);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  // Project Recommender state
  const [recProjects, setRecProjects] = useState<
    Array<{
      title: string;
      difficulty: string;
      targetSkills: string[];
      description: string;
      deliverables: string[];
      estimatedHours: number;
    }>
  >([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  const loadChatHistory = async () => {
    setLoadingChat(true);
    try {
      const res = await apiRequest<{ messages: MentorMessage[] }>('/api/mentor/history');
      setMessages(res.messages || []);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Unable to load mentor history.');
    } finally {
      setLoadingChat(false);
    }
  };

  const loadInterviewHistory = async () => {
    try {
      const res = await apiRequest<{
        sessions: Array<{ id: string; careerGoal: string; question: string; score: number; createdAt: string }>;
      }>('/api/interview/history');
      setInterviewHistory(res.sessions || []);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    loadChatHistory();
    loadInterviewHistory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (textToSend?: string) => {
    const msg = (textToSend ?? inputMsg).trim();
    if (!msg || sending) return;

    setChatError(null);
    if (!textToSend) setInputMsg('');
    setSending(true);

    const optimisticUser: MentorMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await apiRequest<{
        userMessage: MentorMessage;
        assistantMessage: MentorMessage;
      }>('/api/mentor/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msg }),
      });

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        res.userMessage,
        res.assistantMessage,
      ]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setChatError(err instanceof Error ? err.message : 'AI Mentor failed to respond.');
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    await apiRequest('/api/mentor/history', { method: 'DELETE' });
    setMessages([]);
  };

  const generateInterview = async () => {
    setInterviewLoading(true);
    setInterviewError(null);
    setInterviewEval(null);
    setInterviewAnswer('');
    try {
      const res = await apiRequest<{
        sessionId: string;
        careerGoal: string;
        question: string;
        focusSkill: string;
        difficulty: string;
        hints: string[];
      }>('/api/interview/generate', {
        method: 'POST',
        body: JSON.stringify({ careerGoal: profile.desiredCareer }),
      });
      setInterviewQuestion(res);
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : 'Could not generate interview question.');
    } finally {
      setInterviewLoading(false);
    }
  };

  const evaluateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewQuestion) return;
    if (interviewAnswer.trim().length < 10) {
      setInterviewError('Please write a detailed answer before submitting.');
      return;
    }

    setInterviewLoading(true);
    setInterviewError(null);
    try {
      const res = await apiRequest<{
        evaluation: {
          score: number;
          strengths: string[];
          improvements: string[];
          modelAnswer: string;
          verdict: string;
        };
      }>('/api/interview/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: interviewQuestion.sessionId,
          answer: interviewAnswer.trim(),
        }),
      });
      setInterviewEval(res.evaluation);
      await loadInterviewHistory();
      await onRefreshDashboard();
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : 'Could not evaluate answer.');
    } finally {
      setInterviewLoading(false);
    }
  };

  const generateProjects = async () => {
    setLoadingProjects(true);
    setProjectError(null);
    try {
      const res = await apiRequest<{
        projects: Array<{
          title: string;
          difficulty: string;
          targetSkills: string[];
          description: string;
          deliverables: string[];
          estimatedHours: number;
        }>;
      }>('/api/projects/recommend', { method: 'POST' });
      setRecProjects(res.projects || []);
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : 'Unable to generate project recommendations.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const firstMissing = analysis?.missingSkills?.[0]?.name || 'my priority skill gap';
  const suggestedQuestions = [
    `What should I focus on first this week for ${profile.desiredCareer}?`,
    `Explain ${firstMissing} with a clear real-world example.`,
    `Suggest a portfolio project that closes my missing skills.`,
    `How can I prepare for technical interviews as a ${profile.academicYear || 'student'}?`,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#35D6FF]">Mentor Agent & Applied Practice</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            AI Career Mentor, Interview Lab & Projects
          </h1>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111A33] border border-white/10 self-start">
          <button
            type="button"
            onClick={() => setSubTab('chat')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'chat' ? 'bg-[#8257FF] text-white' : 'text-[#C5B8FF] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI Mentor
          </button>
          <button
            type="button"
            onClick={() => setSubTab('interview')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'interview' ? 'bg-[#8257FF] text-white' : 'text-[#C5B8FF] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Interview Practice
          </button>
          <button
            type="button"
            onClick={() => setSubTab('projects')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'projects' ? 'bg-[#8257FF] text-white' : 'text-[#C5B8FF] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Project Recommender
          </button>
        </div>
      </div>

      {/* TAB 1: AI MENTOR CHAT */}
      {subTab === 'chat' && (
        <div className="rounded-2xl bg-[#111A33]/85 border border-white/12 flex flex-col h-[640px]">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-[#35D6FF]" />
              <div>
                <div className="text-sm font-semibold text-white">SkillBridge Mentor Agent</div>
                <div className="text-[11px] text-[#C5B8FF]/75">
                  Connected to your {profile.desiredCareer} assessment, gaps & roadmap progress
                </div>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Chat
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingChat ? (
              <div className="text-xs text-[#C5B8FF]/70">Loading conversation history...</div>
            ) : messages.length === 0 ? (
              <div className="space-y-5 py-6">
                <div className="max-w-lg space-y-2">
                  <h2 className="font-display text-lg font-bold text-white">
                    Hi {profile.fullName}, ask me anything about your {profile.desiredCareer} journey.
                  </h2>
                  <p className="text-xs text-[#C5B8FF]/80 leading-relaxed">
                    I already know your verified strengths, missing skills, and active weekly tasks—so every answer is tailored to where you are right now.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="text-left p-3.5 rounded-xl bg-[#0B1020] border border-white/12 hover:border-[#35D6FF]/50 text-xs text-[#C5B8FF] hover:text-white transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-[#8257FF] text-white'
                        : 'bg-[#0B1020] border border-white/10 text-[#E2E8F0]'
                    }`}
                  >
                    <div>{m.content}</div>
                    {m.role === 'assistant' && m.agentsConsulted && m.agentsConsulted.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-[#35D6FF]/85">
                        Agents consulted: {m.agentsConsulted.join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-[#0B1020] border border-white/10 text-xs text-[#C5B8FF] inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#35D6FF]" />
                  Mentor Agent is analyzing your profile and preparing a personalized answer...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {chatError && (
            <div className="mx-6 mb-2 rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-2 text-xs text-red-200">
              {chatError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-4 border-t border-white/10 flex gap-3"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={`Ask about ${profile.desiredCareer}, concepts, or your roadmap...`}
              className="flex-1 px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF]"
            />
            <button
              type="submit"
              disabled={sending || !inputMsg.trim()}
              className="px-5 py-3 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: AI INTERVIEW PRACTICE */}
      {subTab === 'interview' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 rounded-2xl bg-[#111A33]/85 border border-white/12 p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {profile.desiredCareer} Interview Simulator
                </h2>
                <p className="text-xs text-[#C5B8FF]/80 mt-0.5">
                  Questions target your missing and developing skills, graded by the Mentor Agent.
                </p>
              </div>
              <button
                type="button"
                disabled={interviewLoading}
                onClick={generateInterview}
                className="px-4 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
              >
                {interviewLoading && !interviewQuestion ? 'Generating...' : 'Generate New Question'}
              </button>
            </div>

            {interviewError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {interviewError}
              </div>
            )}

            {!interviewQuestion ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm text-[#C5B8FF]/85">
                  Click "Generate New Question" to practice a realistic interview prompt tailored to your gaps.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl bg-[#0B1020] border border-white/10 p-5 space-y-3">
                  <div className="text-xs text-[#35D6FF]">
                    Focus Skill: {interviewQuestion.focusSkill} · {interviewQuestion.difficulty}
                  </div>
                  <p className="text-base font-medium text-white leading-relaxed">
                    {interviewQuestion.question}
                  </p>
                  {interviewQuestion.hints?.length > 0 && (
                    <div className="pt-2 border-t border-white/10 text-xs text-[#C5B8FF]/75">
                      <strong className="text-white">Hints: </strong>
                      {interviewQuestion.hints.join(' · ')}
                    </div>
                  )}
                </div>

                <form onSubmit={evaluateInterview} className="space-y-4">
                  <textarea
                    rows={6}
                    value={interviewAnswer}
                    onChange={(e) => setInterviewAnswer(e.target.value)}
                    placeholder="Write your structured interview response here..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF]"
                  />
                  <button
                    type="submit"
                    disabled={interviewLoading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8257FF] to-[#35D6FF] text-[#0B1020] font-bold text-sm hover:brightness-110 disabled:opacity-50 cursor-pointer"
                  >
                    {interviewLoading ? 'Evaluating Answer...' : 'Submit for AI Evaluation (+30 XP)'}
                  </button>
                </form>

                {interviewEval && (
                  <div className="rounded-xl bg-[#0B1020] border border-[#35D6FF]/35 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="text-xs text-[#35D6FF]">AI Hiring Feedback</div>
                        <div className="text-sm font-semibold text-white mt-0.5">{interviewEval.verdict}</div>
                      </div>
                      <div className="font-mono text-2xl font-bold text-white tabular-nums">
                        {interviewEval.score}/100
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="font-semibold text-emerald-400 mb-1.5">What Worked Well</div>
                        <ul className="space-y-1 text-[#C5B8FF]/85">
                          {interviewEval.strengths.map((s, i) => (
                            <li key={i}>· {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-semibold text-amber-300 mb-1.5">How to Improve</div>
                        <ul className="space-y-1 text-[#C5B8FF]/85">
                          {interviewEval.improvements.map((s, i) => (
                            <li key={i}>· {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 text-xs">
                      <div className="font-semibold text-white mb-1">Model Answer Reference</div>
                      <p className="text-[#C5B8FF]/85 leading-relaxed">{interviewEval.modelAnswer}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 rounded-2xl bg-[#111A33]/80 border border-white/10 p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-white">Recent Practice Sessions</h3>
            {interviewHistory.length > 0 ? (
              <div className="space-y-3">
                {interviewHistory.map((s) => (
                  <div key={s.id} className="pb-3 border-b border-white/8 last:border-b-0 text-xs">
                    <div className="flex items-center justify-between text-[#35D6FF] font-mono tabular-nums">
                      <span>{s.careerGoal}</span>
                      <span>{s.score}/100</span>
                    </div>
                    <p className="text-[#C5B8FF]/85 mt-1 line-clamp-2">{s.question}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#C5B8FF]/70">No completed interview sessions yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT RECOMMENDER */}
      {subTab === 'projects' && (
        <div className="rounded-2xl bg-[#111A33]/85 border border-white/12 p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                AI Project Recommender for Missing Skills
              </h2>
              <p className="text-xs text-[#C5B8FF]/80 mt-1">
                Generate practical portfolio projects specifically engineered to close your verified gaps for {profile.desiredCareer}.
              </p>
            </div>
            <button
              type="button"
              disabled={loadingProjects}
              onClick={generateProjects}
              className="px-5 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              {loadingProjects ? 'Designing Projects...' : 'Generate Tailored Projects'}
            </button>
          </div>

          {projectError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-200">
              {projectError}
            </div>
          )}

          {recProjects.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#C5B8FF]/80">
              Click "Generate Tailored Projects" to have the Career Agent design 3 portfolio builds targeting your missing skills.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {recProjects.map((proj) => (
                <div
                  key={proj.title}
                  className="rounded-2xl bg-[#0B1020] border border-white/12 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="text-xs text-[#35D6FF] font-mono tabular-nums">
                      {proj.difficulty} · ~{proj.estimatedHours} hrs
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">{proj.title}</h3>
                    <p className="text-xs text-[#C5B8FF]/85 leading-relaxed">{proj.description}</p>
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-white mb-1">Key Deliverables</div>
                      <ul className="space-y-1 text-xs text-[#C5B8FF]/80">
                        {proj.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#35D6FF] shrink-0 mt-0.5" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10 text-[11px] text-[#C5B8FF]">
                    Skills closed: {proj.targetSkills.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
