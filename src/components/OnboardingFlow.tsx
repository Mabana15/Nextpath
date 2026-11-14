import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { CAREER_PATHS } from '../../shared/careers';
import { apiRequest } from '../lib/api';
import { BrandLogo } from './BrandLogo';
import type { StudentProfile } from '../types';

interface OnboardingFlowProps {
  onComplete: () => void;
  onLogout: () => void;
}

const SUGGESTED_PROGRAMMING = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'SQL', 'HTML/CSS', 'Go'];
const SUGGESTED_TECHNICAL = ['React', 'Node.js', 'Git', 'Docker', 'Figma', 'Linux', 'Pandas', 'REST APIs', 'Tailwind CSS'];
const SUGGESTED_SOFT = ['Problem Solving', 'Communication', 'Team Collaboration', 'Time Management', 'Analytical Thinking', 'Presentation'];

const STEP_LABELS = [
  'Personal Details',
  'Education',
  'Existing Skills',
  'Experience',
  'Career Goals',
];

export function OnboardingFlow({ onComplete, onLogout }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');

  // Step 2
  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  // Step 3
  const [programmingSkills, setProgrammingSkills] = useState<string[]>([]);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const [customProg, setCustomProg] = useState('');
  const [customTech, setCustomTech] = useState('');
  const [customSoft, setCustomSoft] = useState('');

  // Step 4
  const [certificates, setCertificates] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [internships, setInternships] = useState<string[]>([]);
  const [certInput, setCertInput] = useState('');
  const [projectInput, setProjectInput] = useState('');
  const [internInput, setInternInput] = useState('');

  // Step 5
  const [desiredCareer, setDesiredCareer] = useState(CAREER_PATHS[0].title);
  const [careerInterests, setCareerInterests] = useState<string[]>([]);
  const [preferredLearningStyle, setPreferredLearningStyle] = useState('Hands-on Projects');
  const [availableLearningTime, setAvailableLearningTime] = useState('10-15 hours/week');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest<{ profile: StudentProfile }>('/api/profile');
        const p = res.profile;
        setFullName(p.fullName || '');
        setAge(p.age ? String(p.age) : '');
        setLocation(p.location || '');
        setCollegeName(p.collegeName || '');
        setDegree(p.degree || '');
        setDepartment(p.department || '');
        setAcademicYear(p.academicYear || '');
        setProgrammingSkills(p.programmingSkills || []);
        setTechnicalSkills(p.technicalSkills || []);
        setSoftSkills(p.softSkills || []);
        setSkillLevels(p.skillLevels || {});
        setCertificates(p.certificates || []);
        setProjects(p.projects || []);
        setInternships(p.internships || []);
        if (p.desiredCareer) setDesiredCareer(p.desiredCareer);
        setCareerInterests(p.careerInterests || []);
        if (p.preferredLearningStyle) setPreferredLearningStyle(p.preferredLearningStyle);
        if (p.availableLearningTime) setAvailableLearningTime(p.availableLearningTime);
        if (p.onboardingStep >= 1 && p.onboardingStep <= 5) {
          setStep(p.onboardingStep);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load saved profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSkill = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    skill: string
  ) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) {
      setList(list.filter((s) => s !== trimmed));
      setSkillLevels((prev) => {
        const copy = { ...prev };
        delete copy[trimmed];
        return copy;
      });
    } else {
      setList([...list, trimmed]);
      setSkillLevels((prev) => ({ ...prev, [trimmed]: prev[trimmed] ?? 50 }));
    }
  };

  const addCustomItem = (
    val: string,
    setVal: (v: string) => void,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    trackLevel = false
  ) => {
    const trimmed = val.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setList([...list, trimmed]);
    if (trackLevel) {
      setSkillLevels((prev) => ({ ...prev, [trimmed]: prev[trimmed] ?? 50 }));
    }
    setVal('');
  };

  const validateStep = (targetStep: number): string | null => {
    if (targetStep === 1) {
      if (fullName.trim().length < 2) return 'Please enter your full name.';
      const ageNum = Number(age);
      if (!age || isNaN(ageNum) || ageNum < 13 || ageNum > 85) {
        return 'Please enter a valid age between 13 and 85.';
      }
    }
    if (targetStep === 2) {
      if (!collegeName.trim()) return 'Please enter your college or university name.';
      if (!degree.trim()) return 'Please select or enter your degree.';
      if (!department.trim()) return 'Please enter your department or major.';
      if (!academicYear.trim()) return 'Please select your current academic year.';
    }
    if (targetStep === 3) {
      if (programmingSkills.length + technicalSkills.length === 0) {
        return 'Please select or add at least one programming or technical skill.';
      }
    }
    if (targetStep === 5) {
      if (!desiredCareer.trim()) return 'Please select your desired career goal.';
      if (!preferredLearningStyle.trim()) return 'Please select a preferred learning style.';
      if (!availableLearningTime.trim()) return 'Please select your weekly learning availability.';
    }
    return null;
  };

  const persistProgress = async (markComplete: boolean, nextStepNum: number) => {
    setSaving(true);
    setError(null);
    setSavedBanner(null);
    try {
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: fullName.trim(),
          age: age ? Number(age) : null,
          location: location.trim(),
          collegeName: collegeName.trim(),
          degree: degree.trim(),
          department: department.trim(),
          academicYear: academicYear.trim(),
          programmingSkills,
          technicalSkills,
          softSkills,
          skillLevels,
          certificates,
          projects,
          internships,
          desiredCareer,
          careerInterests,
          preferredLearningStyle,
          availableLearningTime,
          onboardingStep: nextStepNum,
          onboardingCompleted: markComplete,
        }),
      });
      if (markComplete) {
        onComplete();
      } else {
        setSavedBanner('Progress saved to your student profile.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your progress.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < 5) {
      const nextStep = step + 1;
      await persistProgress(false, nextStep);
      setSavedBanner(null);
      setStep(nextStep);
    } else {
      await persistProgress(true, 5);
    }
  };

  const allTrackedSkills = [...programmingSkills, ...technicalSkills];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center">
        <div className="text-sm text-[#C5B8FF]">Loading your onboarding profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex flex-col">
      <header className="border-b border-white/10 bg-[#111A33]/60 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-4 text-xs text-[#C5B8FF]">
            <span className="tabular-nums">Step {step} of 5</span>
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
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {STEP_LABELS.map((label, idx) => {
              const sNum = idx + 1;
              const isDone = sNum < step;
              const isCurrent = sNum === step;
              return (
                <div key={label} className="space-y-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      isDone
                        ? 'bg-[#35D6FF]'
                        : isCurrent
                        ? 'bg-[#8257FF]'
                        : 'bg-white/10'
                    }`}
                  />
                  <div
                    className={`text-[11px] font-medium truncate ${
                      isCurrent ? 'text-white' : isDone ? 'text-[#35D6FF]' : 'text-slate-500'
                    }`}
                  >
                    {sNum}. {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-[#111A33]/85 border border-white/12 p-7 sm:p-9 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 flex items-start gap-2.5 text-sm text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {savedBanner && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-start gap-2.5 text-sm text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{savedBanner}</span>
            </div>
          )}

          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Personal Details</h1>
                <p className="text-sm text-[#C5B8FF]/80 mt-1">
                  Tell us who you are so SkillBridge AI can personalize every session for you.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#C5B8FF] mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C5B8FF] mb-1.5">Age *</label>
                  <input
                    type="number"
                    min={13}
                    max={85}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C5B8FF] mb-1.5">Location (Optional)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EDUCATION */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Education Background</h1>
                <p className="text-sm text-[#C5B8FF]/80 mt-1">
                  Your academic foundation helps calibrate your assessment difficulty.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#C5B8FF] mb-1.5">College / University Name *</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. National Institute of Technology"
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C5B8FF] mb-1.5">Degree *</label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  >
                    <option value="">Select degree</option>
                    <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                    <option value="B.Sc.">B.Sc.</option>
                    <option value="BCA">BCA</option>
                    <option value="M.Tech / M.S.">M.Tech / M.S.</option>
                    <option value="MCA">MCA</option>
                    <option value="Diploma / Bootcamp">Diploma / Bootcamp</option>
                    <option value="Self-Taught / Other">Self-Taught / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C5B8FF] mb-1.5">Department / Major *</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#C5B8FF] mb-1.5">Current Academic Year *</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  >
                    <option value="">Select year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="Final Year">Final Year</option>
                    <option value="Recent Graduate">Recent Graduate</option>
                    <option value="Working / Career Switcher">Working / Career Switcher</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EXISTING SKILLS */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Existing Skills</h1>
                <p className="text-sm text-[#C5B8FF]/80 mt-1">
                  Select your current skills and rate your self-reported confidence. Next, our AI Assessment Agent will verify them objectively.
                </p>
              </div>

              {/* Programming */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-white">Programming Languages</label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROGRAMMING.map((skill) => {
                    const active = programmingSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(programmingSkills, setProgrammingSkills, skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#8257FF] border-[#8257FF] text-white'
                            : 'bg-[#0B1020] border-white/15 text-[#C5B8FF] hover:border-white/30'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {skill}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customProg}
                    onChange={(e) => setCustomProg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem(customProg, setCustomProg, programmingSkills, setProgrammingSkills, true);
                      }
                    }}
                    placeholder="Add another programming language..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#0B1020] border border-white/15 text-white text-xs focus:outline-none focus:border-[#35D6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomItem(customProg, setCustomProg, programmingSkills, setProgrammingSkills, true)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Technical */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-white">Technical Tools & Frameworks</label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TECHNICAL.map((skill) => {
                    const active = technicalSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(technicalSkills, setTechnicalSkills, skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#35D6FF]/20 border-[#35D6FF] text-white'
                            : 'bg-[#0B1020] border-white/15 text-[#C5B8FF] hover:border-white/30'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {skill}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customTech}
                    onChange={(e) => setCustomTech(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem(customTech, setCustomTech, technicalSkills, setTechnicalSkills, true);
                      }
                    }}
                    placeholder="Add another framework or tool..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#0B1020] border border-white/15 text-white text-xs focus:outline-none focus:border-[#35D6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomItem(customTech, setCustomTech, technicalSkills, setTechnicalSkills, true)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Soft Skills */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-white">Soft Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SOFT.map((skill) => {
                    const active = softSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(softSkills, setSoftSkills, skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#C5B8FF]/20 border-[#C5B8FF] text-white'
                            : 'bg-[#0B1020] border-white/15 text-[#C5B8FF] hover:border-white/30'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {skill}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customSoft}
                    onChange={(e) => setCustomSoft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem(customSoft, setCustomSoft, softSkills, setSoftSkills, false);
                      }
                    }}
                    placeholder="Add another soft skill..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#0B1020] border border-white/15 text-white text-xs focus:outline-none focus:border-[#35D6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomItem(customSoft, setCustomSoft, softSkills, setSoftSkills, false)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Self-reported Skill Level Sliders */}
              {allTrackedSkills.length > 0 && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="text-xs font-semibold text-white">
                    Self-Reported Confidence Levels (0–100%)
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {allTrackedSkills.map((skill) => {
                      const val = skillLevels[skill] ?? 50;
                      return (
                        <div key={skill} className="bg-[#0B1020] border border-white/10 rounded-xl p-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-white font-medium">{skill}</span>
                            <span className="font-mono text-[#35D6FF] tabular-nums">{val}%</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            step={5}
                            value={val}
                            onChange={(e) =>
                              setSkillLevels((prev) => ({ ...prev, [skill]: Number(e.target.value) }))
                            }
                            className="w-full accent-[#8257FF]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: EXPERIENCE */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Experience & Artifacts</h1>
                <p className="text-sm text-[#C5B8FF]/80 mt-1">
                  List any projects, certificates, or internships you have completed so far (optional if you are just starting out).
                </p>
              </div>

              {/* Projects */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white">Projects</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectInput}
                    onChange={(e) => setProjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem(projectInput, setProjectInput, projects, setProjects);
                      }
                    }}
                    placeholder="e.g. Personal Portfolio Website using React"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomItem(projectInput, setProjectInput, projects, setProjects)}
                    className="px-4 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {projects.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {projects.map((item) => (
                      <li
                        key={item}
                        className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#0B1020] border border-white/10 text-xs text-[#C5B8FF]"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => setProjects(projects.filter((p) => p !== item))}
                          className="text-slate-400 hover:text-red-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Certificates */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white">Certificates</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem(certInput, setCertInput, certificates, setCertificates);
                      }
                    }}
                    placeholder="e.g. Responsive Web Design Certificate"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomItem(certInput, setCertInput, certificates, setCertificates)}
                    className="px-4 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {certificates.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {certificates.map((item) => (
                      <li
                        key={item}
                        className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#0B1020] border border-white/10 text-xs text-[#C5B8FF]"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => setCertificates(certificates.filter((p) => p !== item))}
                          className="text-slate-400 hover:text-red-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Internships */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white">Internships (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={internInput}
                    onChange={(e) => setInternInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem(internInput, setInternInput, internships, setInternships);
                      }
                    }}
                    placeholder="e.g. Summer Web Dev Intern at Acme Corp"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomItem(internInput, setInternInput, internships, setInternships)}
                    className="px-4 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {internships.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {internships.map((item) => (
                      <li
                        key={item}
                        className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#0B1020] border border-white/10 text-xs text-[#C5B8FF]"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => setInternships(internships.filter((p) => p !== item))}
                          className="text-slate-400 hover:text-red-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: CAREER GOALS */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Career Goals & Learning Preferences</h1>
                <p className="text-sm text-[#C5B8FF]/80 mt-1">
                  Select your target role so our agents can generate your diagnostic assessment and adaptive roadmap.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-2">Desired Career *</label>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {CAREER_PATHS.map((c) => {
                    const selected = desiredCareer === c.title;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDesiredCareer(c.title)}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#8257FF]/20 border-[#8257FF] text-white'
                            : 'bg-[#0B1020] border-white/12 text-[#C5B8FF] hover:border-white/30'
                        }`}
                      >
                        <div className="font-display font-semibold text-sm">{c.title}</div>
                        <div className="text-xs text-[#C5B8FF]/70 mt-0.5 line-clamp-1">{c.tagline}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-2">Secondary Career Interests</label>
                <div className="flex flex-wrap gap-2">
                  {CAREER_PATHS.filter((c) => c.title !== desiredCareer).map((c) => {
                    const active = careerInterests.includes(c.title);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setCareerInterests((prev) =>
                            prev.includes(c.title) ? prev.filter((x) => x !== c.title) : [...prev, c.title]
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#35D6FF]/20 border-[#35D6FF] text-white'
                            : 'bg-[#0B1020] border-white/15 text-[#C5B8FF]'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {c.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#C5B8FF] mb-1.5">Preferred Learning Style *</label>
                  <select
                    value={preferredLearningStyle}
                    onChange={(e) => setPreferredLearningStyle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  >
                    <option value="Hands-on Projects">Hands-on Projects</option>
                    <option value="Interactive Coding Exercises">Interactive Coding Exercises</option>
                    <option value="Structured Documentation & Reading">Structured Documentation & Reading</option>
                    <option value="Video Courses & Visual Walkthroughs">Video Courses & Visual Walkthroughs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C5B8FF] mb-1.5">Available Learning Time *</label>
                  <select
                    value={availableLearningTime}
                    onChange={(e) => setAvailableLearningTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                  >
                    <option value="5-8 hours/week">5–8 hours/week</option>
                    <option value="10-15 hours/week">10–15 hours/week</option>
                    <option value="15-20 hours/week">15–20 hours/week</option>
                    <option value="20+ hours/week">20+ hours/week (Intensive)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep((s) => s - 1);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-sm text-[#C5B8FF] hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={() => persistProgress(false, step)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-[#C5B8FF] hover:text-white transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Progress'}
              </button>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {step === 5 ? (
                <>
                  Complete & Start AI Assessment
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
