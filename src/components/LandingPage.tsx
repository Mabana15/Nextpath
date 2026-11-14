import { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Layers,
  Target,
  Bot,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Award,
  Code2,
} from 'lucide-react';
import { CAREER_PATHS } from '../../shared/careers';
import { BrandLogo } from './BrandLogo';
import { NetworkBackground } from './NetworkBackground';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const JOURNEY_STEPS = [
  {
    step: '01',
    title: 'Identify',
    detail: 'Capture your academic background, projects, certificates, and self-reported skills through structured onboarding.',
  },
  {
    step: '02',
    title: 'Analyze',
    detail: 'Complete a Gemini-generated diagnostic assessment that measures actual applied knowledge instead of guessing.',
  },
  {
    step: '03',
    title: 'Learn',
    detail: 'Receive a personalized multi-week roadmap targeting your exact missing skills and preferred learning style.',
  },
  {
    step: '04',
    title: 'Practice',
    detail: 'Tackle Mission Mode exercises, practical projects, and AI-powered mock interviews tailored to your role.',
  },
  {
    step: '05',
    title: 'Improve',
    detail: 'Adapt your roadmap automatically as you complete missions, close gaps, and consult your personal AI Mentor.',
  },
  {
    step: '06',
    title: 'Achieve',
    detail: 'Build verified career readiness and a portfolio of real projects aligned with industry expectations.',
  },
];

const AGENT_SYSTEM = [
  { name: 'Profile Agent', role: 'Synthesizes education, learning budget, and experience history.' },
  { name: 'Assessment Agent', role: 'Generates adaptive MCQs, concept checks, and practical problems.' },
  { name: 'Skill Analysis Agent', role: 'Separates verified proficiency from self-reported claims.' },
  { name: 'Career Agent', role: 'Benchmarks capabilities against 8 technical career tracks.' },
  { name: 'Learning Agent', role: 'Sequences weekly goals, daily tasks, and curated resources.' },
  { name: 'Progress Agent', role: 'Tracks XP missions, unlocks milestones, and triggers alerts.' },
  { name: 'Mentor Agent', role: 'Coaches 1-on-1 using your live assessment and roadmap state.' },
];

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [selectedCareerId, setSelectedCareerId] = useState(CAREER_PATHS[0].id);
  const activeCareer = CAREER_PATHS.find((c) => c.id === selectedCareerId) || CAREER_PATHS[0];

  return (
    <div className="relative min-h-screen bg-[#0B1020] text-white overflow-x-hidden">
      <NetworkBackground />

      {/* Subtle top radial ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(130,87,255,0.22),rgba(53,214,255,0.06)_45%,transparent_75%)] z-0"
      />

      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1020]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-8">
          <BrandLogo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#C5B8FF]">
            <a href="#why-skillbridge" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Why SkillBridge
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#features" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#career-paths" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Career Paths
            </a>
            <button
              type="button"
              onClick={onLogin}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Login
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-lg bg-[#8257FF] hover:bg-[#7142FF] text-white text-sm font-semibold transition-all shadow-[0_0_24px_rgba(130,87,255,0.35)] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-7">
              <p className="text-sm font-medium text-[#35D6FF] tracking-wide">
                Discover Your Skills · Design Your Future
              </p>

              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.08]"
                style={{ fontSize: 'clamp(2.35rem, 4.4vw, 3.85rem)', textWrap: 'balance' }}
              >
                Your Skills. Your Future.{' '}
                <span className="bg-gradient-to-r from-[#8257FF] via-[#C5B8FF] to-[#35D6FF] bg-clip-text text-transparent">
                  Powered by AI.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#C5B8FF]/90 leading-relaxed max-w-2xl">
                SkillBridge AI evaluates your actual technical knowledge—not just your resume claims—uncovers the exact skills separating you from your target role, and orchestrates seven specialized Gemini AI agents to build your adaptive learning roadmap and 1-on-1 career mentorship.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#8257FF] to-[#6B42F5] hover:brightness-110 text-white font-semibold text-sm transition-all shadow-[0_0_30px_rgba(130,87,255,0.4)] cursor-pointer whitespace-nowrap shrink-0"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#111A33] hover:bg-[#172344] border border-white/15 text-white font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Login to Account
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium text-[#35D6FF] hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Explore Features
                </a>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#C5B8FF]/80">
                <span>8 Career Pathways</span>
                <span aria-hidden="true">·</span>
                <span>7 Coordinated AI Agents</span>
                <span aria-hidden="true">·</span>
                <span>Verified Skill Diagnostics</span>
              </div>
            </div>

            {/* Right Architectural Pipeline Visualization */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#111A33]/85 backdrop-blur-xl border border-white/12 p-6 sm:p-7 space-y-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="font-display font-semibold text-white text-lg">
                      Multi-Agent Career Engine
                    </h2>
                    <p className="text-xs text-[#C5B8FF]/75 mt-0.5">
                      Identify → Analyze → Learn → Practice → Improve → Achieve
                    </p>
                  </div>
                  <Bot className="w-5 h-5 text-[#35D6FF]" />
                </div>

                <div className="space-y-3">
                  {AGENT_SYSTEM.map((agent, idx) => (
                    <div
                      key={agent.name}
                      className="flex items-start gap-3.5 py-2 border-b border-white/5 last:border-b-0"
                    >
                      <span className="font-mono text-xs text-[#35D6FF] tabular-nums pt-0.5">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">{agent.name}</div>
                        <div className="text-xs text-[#C5B8FF]/75 leading-relaxed">{agent.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why SkillBridge AI */}
        <section id="why-skillbridge" className="border-t border-white/10 bg-[#111A33]/35 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium text-[#35D6FF] mb-2">Why SkillBridge AI</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Stop guessing what to learn next. Measure what you truly know.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-7 space-y-3">
                <Target className="w-6 h-6 text-[#8257FF]" />
                <h3 className="font-display text-xl font-semibold text-white">
                  Verified Over Self-Reported
                </h3>
                <p className="text-sm text-[#C5B8FF]/80 leading-relaxed">
                  Listing a language on a resume is not mastery. Our Assessment Agent tests practical problem-solving and conceptual depth to pinpoint real readiness.
                </p>
              </div>
              <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-7 space-y-3">
                <Compass className="w-6 h-6 text-[#35D6FF]" />
                <h3 className="font-display text-xl font-semibold text-white">
                  Role-Specific Gap Mapping
                </h3>
                <p className="text-sm text-[#C5B8FF]/80 leading-relaxed">
                  Compare your verified skills directly against industry benchmarks across 8 high-growth technical roles—see strong, developing, and missing areas instantly.
                </p>
              </div>
              <div className="rounded-2xl bg-[#111A33]/80 border border-white/10 p-7 space-y-3">
                <Layers className="w-6 h-6 text-[#C5B8FF]" />
                <h3 className="font-display text-xl font-semibold text-white">
                  Adaptive Weekly Execution
                </h3>
                <p className="text-sm text-[#C5B8FF]/80 leading-relaxed">
                  Your roadmap evolves with your progress, time budget, and learning style—turning overwhelming syllabi into focused daily missions and real projects.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium text-[#35D6FF] mb-2">How It Works</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Six structured stages from student profile to career readiness
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {JOURNEY_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl bg-[#111A33]/65 border border-white/10 p-6 flex flex-col justify-between gap-4 hover:border-[#8257FF]/50 transition-colors"
                >
                  <div>
                    <span className="font-mono text-xs text-[#35D6FF] tabular-nums">{item.step}</span>
                    <h3 className="font-display text-xl font-semibold text-white mt-2">{item.title}</h3>
                    <p className="text-sm text-[#C5B8FF]/80 mt-2 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI-Powered Features */}
        <section id="features" className="py-20 border-t border-white/10 bg-[#111A33]/35">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium text-[#35D6FF] mb-2">AI-Powered Features</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Built to turn skill gaps into measurable momentum
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Sparkles,
                  title: 'Skill Galaxy',
                  desc: 'An interactive orbital skill map visualizing your mastered, developing, and missing competencies around your target career.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Career DNA',
                  desc: 'A personalized capability profile synthesizing analytical thinking, systems design, execution, and communication traits.',
                },
                {
                  icon: Award,
                  title: 'Mission Mode',
                  desc: 'Transform weekly learning tasks into XP-earning missions with levels, streaks, and milestone achievements.',
                },
                {
                  icon: Compass,
                  title: 'Career Simulator',
                  desc: 'Test how your current demonstrated skills transfer across 8 different tech careers before committing.',
                },
                {
                  icon: Bot,
                  title: 'AI Interview Practice',
                  desc: 'Practice role-specific technical and behavioral questions with structured hiring-grade feedback and model answers.',
                },
                {
                  icon: Code2,
                  title: 'Project Recommender',
                  desc: 'Get tailored portfolio project blueprints engineered specifically to close your highest-priority skill gaps.',
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="rounded-2xl bg-[#0B1020]/80 border border-white/10 p-6 space-y-3"
                  >
                    <Icon className="w-5 h-5 text-[#8257FF]" />
                    <h3 className="font-display text-lg font-semibold text-white">{feat.title}</h3>
                    <p className="text-sm text-[#C5B8FF]/80 leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Discover Career Paths */}
        <section id="career-paths" className="py-20 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-medium text-[#35D6FF] mb-2">Discover Career Paths</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Explore eight specialized technical tracks
              </h2>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                {CAREER_PATHS.map((career) => {
                  const isActive = career.id === activeCareer.id;
                  return (
                    <button
                      key={career.id}
                      type="button"
                      onClick={() => setSelectedCareerId(career.id)}
                      className={`text-left px-4 py-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#8257FF]/15 border-[#8257FF] text-white'
                          : 'bg-[#111A33]/60 border-white/10 text-[#C5B8FF] hover:border-white/25 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-semibold text-sm">{career.title}</span>
                        <span className="text-xs text-[#35D6FF] tabular-nums">
                          {career.avgTimelineMonths} mo
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-7 rounded-2xl bg-[#111A33]/85 border border-white/12 p-7 space-y-6">
                <div className="space-y-2 border-b border-white/10 pb-5">
                  <div className="text-xs text-[#35D6FF]">
                    {activeCareer.demandLevel} · Est. {activeCareer.avgTimelineMonths} months structured path
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white">{activeCareer.title}</h3>
                  <p className="text-sm text-[#C5B8FF]/85 leading-relaxed">{activeCareer.description}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-3">Core Technical Skills</h4>
                    <ul className="space-y-2">
                      {activeCareer.requiredTechnicalSkills.slice(0, 6).map((skill) => (
                        <li key={skill.name} className="flex items-center justify-between text-xs text-[#C5B8FF]">
                          <span>{skill.name}</span>
                          <span className="font-mono text-[#35D6FF] tabular-nums">{skill.targetLevel}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-white mb-3">Recommended Portfolio Projects</h4>
                    <div className="space-y-3">
                      {activeCareer.recommendedProjects.map((proj) => (
                        <div key={proj.title} className="text-xs">
                          <div className="font-semibold text-white">{proj.title}</div>
                          <div className="text-[#C5B8FF]/75 mt-0.5">{proj.difficulty} · {proj.skillsPracticed.slice(0, 2).join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onGetStarted}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Assess Readiness for {activeCareer.title}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Personalized Learning CTA Section */}
        <section className="py-20 border-t border-white/10 bg-[#111A33]/40">
          <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
            <BookOpen className="w-8 h-8 text-[#35D6FF] mx-auto" />
            <h2
              className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mx-auto"
              style={{ textWrap: 'balance' }}
            >
              Personalized Learning That Adapts With Every Milestone
            </h2>
            <p className="text-base text-[#C5B8FF]/85 max-w-2xl mx-auto leading-relaxed">
              Create your student profile in minutes, complete your AI skill assessment, and receive an actionable roadmap, Skill Galaxy map, and personal Gemini Mentor tailored to your schedule.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#8257FF] to-[#35D6FF] text-[#0B1020] font-bold text-sm hover:brightness-110 transition-all cursor-pointer"
              >
                Start Your AI Assessment
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="px-7 py-3.5 rounded-xl bg-[#111A33] border border-white/15 text-white font-semibold text-sm hover:bg-[#19264B] transition-colors cursor-pointer"
              >
                Returning Student Login
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0B1020] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#C5B8FF]/70">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-white">SkillBridge AI</span>
            <span aria-hidden="true">·</span>
            <span>Discover Your Skills. Design Your Future.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#why-skillbridge" className="hover:text-white transition-colors">Why SkillBridge</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#career-paths" className="hover:text-white transition-colors">Career Paths</a>
            <button type="button" onClick={onLogin} className="hover:text-white transition-colors cursor-pointer">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
