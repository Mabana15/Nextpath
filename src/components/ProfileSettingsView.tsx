import { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, Bot } from 'lucide-react';
import { CAREER_PATHS } from '../../shared/careers';
import { apiRequest } from '../lib/api';
import type { DashboardData } from '../types';

interface ProfileSettingsViewProps {
  data: DashboardData;
  onRefreshDashboard: () => Promise<void>;
}

export function ProfileSettingsView({ data, onRefreshDashboard }: ProfileSettingsViewProps) {
  const { profile, agentTrace } = data;

  const [fullName, setFullName] = useState(profile.fullName);
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [location, setLocation] = useState(profile.location);
  const [collegeName, setCollegeName] = useState(profile.collegeName);
  const [degree, setDegree] = useState(profile.degree);
  const [department, setDepartment] = useState(profile.department);
  const [academicYear, setAcademicYear] = useState(profile.academicYear);
  const [programmingText, setProgrammingText] = useState(profile.programmingSkills.join(', '));
  const [technicalText, setTechnicalText] = useState(profile.technicalSkills.join(', '));
  const [softText, setSoftText] = useState(profile.softSkills.join(', '));
  const [projectsText, setProjectsText] = useState(profile.projects.join('\n'));
  const [certificatesText, setCertificatesText] = useState(profile.certificates.join('\n'));
  const [desiredCareer, setDesiredCareer] = useState(profile.desiredCareer);
  const [preferredLearningStyle, setPreferredLearningStyle] = useState(profile.preferredLearningStyle);
  const [availableLearningTime, setAvailableLearningTime] = useState(profile.availableLearningTime);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parseCommaList = (val: string) =>
    val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const parseLineList = (val: string) =>
    val
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    setSaving(true);
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
          programmingSkills: parseCommaList(programmingText),
          technicalSkills: parseCommaList(technicalText),
          softSkills: parseCommaList(softText),
          projects: parseLineList(projectsText),
          certificates: parseLineList(certificatesText),
          desiredCareer,
          preferredLearningStyle,
          availableLearningTime,
        }),
      });
      await onRefreshDashboard();
      setSuccess('Student profile saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-[#35D6FF]">Profile & Multi-Agent System</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
          Student Profile & Agent Orchestration Inspector
        </h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 rounded-2xl bg-[#111A33]/85 border border-white/12 p-6 sm:p-7 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-display text-lg font-bold text-white">Edit Student Profile</h2>
            <span className="font-mono text-xs text-[#35D6FF] tabular-nums">
              {profile.profileCompletion}% Complete
            </span>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {success}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">College / University</label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Degree</label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Desired Career</label>
              <select
                value={desiredCareer}
                onChange={(e) => setDesiredCareer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              >
                {CAREER_PATHS.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Learning Style</label>
              <select
                value={preferredLearningStyle}
                onChange={(e) => setPreferredLearningStyle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              >
                <option value="Hands-on Projects">Hands-on Projects</option>
                <option value="Interactive Coding Exercises">Interactive Coding Exercises</option>
                <option value="Structured Documentation & Reading">Structured Documentation & Reading</option>
                <option value="Video Courses & Visual Walkthroughs">Video Courses & Visual Walkthroughs</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Available Time</label>
              <select
                value={availableLearningTime}
                onChange={(e) => setAvailableLearningTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              >
                <option value="5-8 hours/week">5–8 hours/week</option>
                <option value="10-15 hours/week">10–15 hours/week</option>
                <option value="15-20 hours/week">15–20 hours/week</option>
                <option value="20+ hours/week">20+ hours/week (Intensive)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">
                Programming Skills (comma-separated)
              </label>
              <input
                type="text"
                value={programmingText}
                onChange={(e) => setProgrammingText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">
                Technical Tools & Frameworks (comma-separated)
              </label>
              <input
                type="text"
                value={technicalText}
                onChange={(e) => setTechnicalText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">
                Soft Skills (comma-separated)
              </label>
              <input
                type="text"
                value={softText}
                onChange={(e) => setSoftText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Projects (one per line)</label>
              <textarea
                rows={3}
                value={projectsText}
                onChange={(e) => setProjectsText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#C5B8FF] mb-1">Certificates (one per line)</label>
              <textarea
                rows={2}
                value={certificatesText}
                onChange={(e) => setCertificatesText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white text-sm font-semibold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </form>

        {/* Multi-Agent Pipeline Inspector */}
        <div className="lg:col-span-5 rounded-2xl bg-[#111A33]/85 border border-white/12 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Bot className="w-5 h-5 text-[#35D6FF]" />
            <div>
              <h2 className="font-display text-lg font-bold text-white">7-Agent Orchestration Trace</h2>
              <p className="text-xs text-[#C5B8FF]/75">
                Structured data exchanged between SkillBridge AI agents
              </p>
            </div>
          </div>

          {agentTrace ? (
            <div className="space-y-3">
              <div className="text-xs text-[#35D6FF] font-medium">{agentTrace.goal}</div>
              {agentTrace.steps.map((step, idx) => (
                <div
                  key={step.agent}
                  className="rounded-xl bg-[#0B1020] border border-white/10 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      0{idx + 1}. {step.agent}
                    </span>
                    <span className="text-emerald-400">Completed</span>
                  </div>
                  <p className="text-xs text-[#C5B8FF]/85">{step.summary}</p>
                  <pre className="text-[10px] font-mono text-slate-400 bg-black/30 rounded-lg p-2 overflow-x-auto">
                    {JSON.stringify(step.dataPreview, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#C5B8FF]/75">
              Complete an AI assessment to inspect live structured handoffs across all 7 agents.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
