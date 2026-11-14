import crypto from 'crypto';
import { db } from './db.ts';
import { generateStructuredJson, getGeminiClient, GEMINI_MODEL, Type } from './geminiClient.ts';
import { CAREER_PATHS, getCareerByTitleOrId, type CareerPath } from '../shared/careers.ts';

// ---------------------------------------------------------------------------
// Structured Inter-Agent Data Types
// ---------------------------------------------------------------------------

export interface StudentProfileBrief {
  userId: string;
  fullName: string;
  age: number | null;
  location: string;
  education: {
    collegeName: string;
    degree: string;
    department: string;
    academicYear: string;
  };
  selfReportedSkills: {
    programming: string[];
    technical: string[];
    soft: string[];
    levels: Record<string, number>;
  };
  experience: {
    certificates: string[];
    projects: string[];
    internships: string[];
  };
  goals: {
    desiredCareer: string;
    careerInterests: string[];
    preferredLearningStyle: string;
    availableLearningTime: string;
  };
  profileCompletion: number;
  readinessSummary: string;
}

export interface AssessmentQuestion {
  id: string;
  type: 'mcq' | 'knowledge' | 'practical';
  skillTag: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  options?: string[];
  correctAnswer?: string; // Stored server-side; stripped before sending active quiz to client
  evaluationRubric: string;
  maxPoints: number;
}

export interface QuestionEvaluation {
  questionId: string;
  skillTag: string;
  earnedPoints: number;
  maxPoints: number;
  isCorrectOrStrong: boolean;
  feedback: string;
}

export interface AssessmentEvaluationResult {
  overallScore: number;
  maxScore: number;
  verifiedSkills: Record<string, number>; // 0-100 demonstrated proficiency
  questionFeedback: QuestionEvaluation[];
  strengthsSummary: string;
  gapsSummary: string;
  selfReportedVsActualNote: string;
}

export interface SkillAnalysisReport {
  careerGoal: string;
  careerCoveragePercent: number;
  strongSkills: Array<{ name: string; score: number; target: number; note: string }>;
  intermediateSkills: Array<{ name: string; score: number; target: number; note: string }>;
  beginnerSkills: Array<{ name: string; score: number; target: number; note: string }>;
  missingSkills: Array<{ name: string; score: number; target: number; priority: 'High' | 'Medium'; reason: string }>;
  recommendedImprovements: string[];
  skillMatrix: Array<{ skill: string; demonstrated: number; selfReported: number; required: number }>;
  careerDna: {
    archetype: string;
    summary: string;
    traits: Array<{ trait: string; score: number }>;
  };
  summary: string;
}

export interface RoadmapTaskInput {
  dayLabel: string;
  title: string;
  description: string;
  taskType: 'concept' | 'exercise' | 'resource' | 'mini_project';
  resourceTitle: string;
  resourceUrl: string;
  xpPoints: number;
}

export interface RoadmapWeek {
  weekNumber: number;
  theme: string;
  weeklyGoal: string;
  focusSkills: string[];
  miniProject: string;
  tasks: RoadmapTaskInput[];
}

export interface GeneratedRoadmap {
  overview: string;
  weeks: RoadmapWeek[];
}

export interface AgentTraceStep {
  agent: string;
  status: 'completed';
  summary: string;
  timestamp: string;
  dataPreview: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 1. PROFILE AGENT
// ---------------------------------------------------------------------------

export function runProfileAgent(userId: string): StudentProfileBrief {
  const row = db
    .prepare('SELECT * FROM student_profiles WHERE user_id = ?')
    .get(userId) as Record<string, unknown> | undefined;

  if (!row) {
    throw new Error('Student profile not found. Complete onboarding first.');
  }

  const programming = safeJsonParse<string[]>(row.programming_skills as string, []);
  const technical = safeJsonParse<string[]>(row.technical_skills as string, []);
  const soft = safeJsonParse<string[]>(row.soft_skills as string, []);
  const levels = safeJsonParse<Record<string, number>>(row.skill_levels as string, {});
  const certificates = safeJsonParse<string[]>(row.certificates as string, []);
  const projects = safeJsonParse<string[]>(row.projects as string, []);
  const internships = safeJsonParse<string[]>(row.internships as string, []);
  const careerInterests = safeJsonParse<string[]>(row.career_interests as string, []);

  const totalClaims = programming.length + technical.length + soft.length;
  const practicalArtifacts = projects.length + internships.length + certificates.length;

  return {
    userId,
    fullName: String(row.full_name || 'Student'),
    age: row.age !== null && row.age !== undefined ? Number(row.age) : null,
    location: String(row.location || ''),
    education: {
      collegeName: String(row.college_name || ''),
      degree: String(row.degree || ''),
      department: String(row.department || ''),
      academicYear: String(row.academic_year || ''),
    },
    selfReportedSkills: {
      programming,
      technical,
      soft,
      levels,
    },
    experience: {
      certificates,
      projects,
      internships,
    },
    goals: {
      desiredCareer: String(row.desired_career || 'Full Stack Developer'),
      careerInterests,
      preferredLearningStyle: String(row.preferred_learning_style || 'Hands-on Projects'),
      availableLearningTime: String(row.available_learning_time || '10-15 hours/week'),
    },
    profileCompletion: Number(row.profile_completion || 0),
    readinessSummary: `${row.degree || 'Student'} (${row.academic_year || 'Current'}) targeting ${row.desired_career || 'Tech Career'} with ${totalClaims} self-reported skills (unverified) and ${practicalArtifacts} experience artifacts.`,
  };
}

// ---------------------------------------------------------------------------
// 2. ASSESSMENT AGENT
// ---------------------------------------------------------------------------

export async function runAssessmentAgentGenerate(
  profile: StudentProfileBrief,
  careerPath: CareerPath
): Promise<AssessmentQuestion[]> {
  const systemInstruction = `You are the Assessment Agent in SkillBridge AI.
Your job is to create a fair, diagnostic, multi-modal skill assessment for a student.
IMPORTANT: Self-reported skills are unverified claims — test actual foundational and applied knowledge across the target career's required skills.
Return exactly 8 questions:
- 4 multiple-choice questions (type: "mcq") with 4 distinct options and exact correctAnswer matching one option string.
- 2 conceptual knowledge questions (type: "knowledge") requiring concise written explanations.
- 2 practical problem-solving tasks (type: "practical") asking the student to write pseudocode, a query, a debugging fix, an architectural step, or a concrete solution.
Match the difficulty spread to the student's academic year (${profile.education.academicYear || 'Undergraduate'}) and target career (${careerPath.title}).`;

  const requiredSkillNames = careerPath.requiredTechnicalSkills.map((s) => s.name);

  const prompt = `Generate a diagnostic assessment for:
Student Education: ${profile.education.degree} in ${profile.education.department} (${profile.education.academicYear})
Target Career: ${careerPath.title}
Required Career Skills: ${requiredSkillNames.join(', ')}
Student Self-Reported Programming Skills: ${profile.selfReportedSkills.programming.join(', ') || 'None listed'}
Student Self-Reported Technical Skills: ${profile.selfReportedSkills.technical.join(', ') || 'None listed'}
Student Projects: ${profile.experience.projects.join('; ') || 'None listed'}

Ensure each question has a unique short id (q1..q8), maps to one of the required career skill names in skillTag, and sets maxPoints so total points across all 8 questions equal 100 (e.g., 10 pts each for 4 MCQs = 40, 15 pts each for 2 knowledge = 30, 15 pts each for 2 practical = 30).`;

  const result = await generateStructuredJson<{ questions: AssessmentQuestion[] }>({
    systemInstruction,
    prompt,
    schema: {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['mcq', 'knowledge', 'practical'] },
              skillTag: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              evaluationRubric: { type: Type.STRING },
              maxPoints: { type: Type.INTEGER },
            },
            required: ['id', 'type', 'skillTag', 'difficulty', 'question', 'evaluationRubric', 'maxPoints'],
          },
        },
      },
      required: ['questions'],
    },
  });

  // Normalize maxPoints to sum to 100 cleanly
  const qs = (result.questions || []).slice(0, 8).map((q, idx) => ({
    ...q,
    id: q.id || `q${idx + 1}`,
    maxPoints: q.type === 'mcq' ? 10 : 15,
  }));

  return qs;
}

export async function runAssessmentAgentEvaluate(
  profile: StudentProfileBrief,
  careerPath: CareerPath,
  questions: AssessmentQuestion[],
  answers: Record<string, string>
): Promise<AssessmentEvaluationResult> {
  const systemInstruction = `You are the Assessment Agent evaluator in SkillBridge AI.
Evaluate the student's actual submitted answers strictly and objectively against each question's rubric.
CRITICAL RULE: Do NOT inflate scores based on self-reported skills. Only demonstrated answers earn credit. Empty or vague answers earn 0-20% of points.
Also output a verifiedSkills object mapping each required career skill to an integer proficiency score (0-100) based ONLY on demonstrated performance in the assessment (skills not tested or answered poorly remain low, 0-35).`;

  const qaPayload = questions.map((q) => ({
    id: q.id,
    type: q.type,
    skillTag: q.skillTag,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    evaluationRubric: q.evaluationRubric,
    maxPoints: q.maxPoints,
    studentAnswer: answers[q.id] || '(No answer submitted)',
  }));

  const requiredSkills = careerPath.requiredTechnicalSkills.map((s) => s.name);

  const prompt = `Evaluate this completed assessment for target career "${careerPath.title}".
Required skills to score (0-100 verified proficiency): ${requiredSkills.join(', ')}.
Student self-reported skill levels (for comparison ONLY, do NOT treat as verified): ${JSON.stringify(profile.selfReportedSkills.levels)}

Questions and Student Answers:
${JSON.stringify(qaPayload, null, 2)}

Return:
- overallScore (sum of earnedPoints)
- maxScore (sum of maxPoints)
- verifiedSkillsList: array of { skillName, verifiedScore (0-100) } covering every required skill
- questionFeedback: array evaluating every question id
- strengthsSummary, gapsSummary, selfReportedVsActualNote`;

  const evalRaw = await generateStructuredJson<{
    overallScore: number;
    maxScore: number;
    verifiedSkillsList: Array<{ skillName: string; verifiedScore: number }>;
    questionFeedback: QuestionEvaluation[];
    strengthsSummary: string;
    gapsSummary: string;
    selfReportedVsActualNote: string;
  }>({
    systemInstruction,
    prompt,
    schema: {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.INTEGER },
        maxScore: { type: Type.INTEGER },
        verifiedSkillsList: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              skillName: { type: Type.STRING },
              verifiedScore: { type: Type.INTEGER },
            },
            required: ['skillName', 'verifiedScore'],
          },
        },
        questionFeedback: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionId: { type: Type.STRING },
              skillTag: { type: Type.STRING },
              earnedPoints: { type: Type.INTEGER },
              maxPoints: { type: Type.INTEGER },
              isCorrectOrStrong: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING },
            },
            required: ['questionId', 'skillTag', 'earnedPoints', 'maxPoints', 'isCorrectOrStrong', 'feedback'],
          },
        },
        strengthsSummary: { type: Type.STRING },
        gapsSummary: { type: Type.STRING },
        selfReportedVsActualNote: { type: Type.STRING },
      },
      required: [
        'overallScore',
        'maxScore',
        'verifiedSkillsList',
        'questionFeedback',
        'strengthsSummary',
        'gapsSummary',
        'selfReportedVsActualNote',
      ],
    },
  });

  const verifiedSkills: Record<string, number> = {};
  for (const item of evalRaw.verifiedSkillsList || []) {
    verifiedSkills[item.skillName] = Math.max(0, Math.min(100, item.verifiedScore));
  }
  for (const reqSkill of requiredSkills) {
    if (verifiedSkills[reqSkill] === undefined) {
      verifiedSkills[reqSkill] = 15;
    }
  }

  const maxScore = questions.reduce((acc, q) => acc + q.maxPoints, 0) || 100;
  const computedSum = (evalRaw.questionFeedback || []).reduce((acc, f) => acc + Math.max(0, Math.min(f.maxPoints, f.earnedPoints)), 0);

  return {
    overallScore: computedSum,
    maxScore,
    verifiedSkills,
    questionFeedback: evalRaw.questionFeedback || [],
    strengthsSummary: evalRaw.strengthsSummary,
    gapsSummary: evalRaw.gapsSummary,
    selfReportedVsActualNote: evalRaw.selfReportedVsActualNote,
  };
}

// ---------------------------------------------------------------------------
// 3. CAREER AGENT
// ---------------------------------------------------------------------------

export function runCareerAgentGetBenchmark(careerTitleOrId: string): CareerPath {
  return getCareerByTitleOrId(careerTitleOrId);
}

export async function runCareerAgentRecommendProjects(
  profile: StudentProfileBrief,
  careerPath: CareerPath,
  missingSkills: string[]
): Promise<Array<{ title: string; difficulty: string; targetSkills: string[]; description: string; deliverables: string[]; estimatedHours: number }>> {
  const systemInstruction = `You are the Career Agent & Project Recommender in SkillBridge AI.
Recommend 3 practical, portfolio-ready engineering/design/analytics projects specifically crafted to bridge the student's verified missing skills for their target career.`;

  const prompt = `Target Career: ${careerPath.title}
Student Level: ${profile.education.degree} (${profile.education.academicYear})
Missing / Weak Skills to Target: ${missingSkills.join(', ') || careerPath.requiredTechnicalSkills.map((s) => s.name).join(', ')}
Existing Projects: ${profile.experience.projects.join('; ') || 'None'}
Available Time: ${profile.goals.availableLearningTime}

Generate 3 distinct, concrete portfolio projects with clear deliverables.`;

  const res = await generateStructuredJson<{
    projects: Array<{
      title: string;
      difficulty: string;
      targetSkills: string[];
      description: string;
      deliverables: string[];
      estimatedHours: number;
    }>;
  }>({
    systemInstruction,
    prompt,
    schema: {
      type: Type.OBJECT,
      properties: {
        projects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              targetSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
              deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimatedHours: { type: Type.INTEGER },
            },
            required: ['title', 'difficulty', 'targetSkills', 'description', 'deliverables', 'estimatedHours'],
          },
        },
      },
      required: ['projects'],
    },
  });

  return res.projects || [];
}

// ---------------------------------------------------------------------------
// 4. SKILL ANALYSIS AGENT
// ---------------------------------------------------------------------------

export async function runSkillAnalysisAgent(
  profile: StudentProfileBrief,
  careerPath: CareerPath,
  evaluation: AssessmentEvaluationResult
): Promise<SkillAnalysisReport> {
  const systemInstruction = `You are the Skill Analysis Agent in SkillBridge AI.
Compare the student's DEMONSTRATED assessment proficiency against the target career's required technical and soft skills.
Classify every required skill strictly by demonstrated proficiency:
- Strong (>= 75)
- Intermediate (50-74)
- Beginner (25-49)
- Missing (< 25)
Also generate a "Career DNA" profile reflecting the student's unique blend of analytical, creative, systems, execution, and communication traits.`;

  const skillComparisonInput = careerPath.requiredTechnicalSkills.map((req) => {
    const demonstrated = evaluation.verifiedSkills[req.name] ?? 20;
    const selfReportedKey = Object.keys(profile.selfReportedSkills.levels).find(
      (k) => req.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(req.name.toLowerCase())
    );
    const selfReported = selfReportedKey ? profile.selfReportedSkills.levels[selfReportedKey] : 0;
    return {
      skill: req.name,
      required: req.targetLevel,
      demonstrated,
      selfReported,
      importance: req.importance,
    };
  });

  const prompt = `Analyze skill gap for ${profile.fullName} targeting "${careerPath.title}".
Assessment Score: ${evaluation.overallScore}/${evaluation.maxScore}
Demonstrated vs Required Skills:
${JSON.stringify(skillComparisonInput, null, 2)}
Assessment Strengths: ${evaluation.strengthsSummary}
Assessment Gaps: ${evaluation.gapsSummary}
Student Career Interests: ${profile.goals.careerInterests.join(', ')}

Produce a comprehensive SkillAnalysisReport with concrete, actionable recommendedImprovements and a 5-dimension Career DNA profile (Analytical Thinking, System Architecture, Practical Execution, Creative Problem Solving, Technical Communication).`;

  const aiReport = await generateStructuredJson<{
    strongSkills: Array<{ name: string; score: number; target: number; note: string }>;
    intermediateSkills: Array<{ name: string; score: number; target: number; note: string }>;
    beginnerSkills: Array<{ name: string; score: number; target: number; note: string }>;
    missingSkills: Array<{ name: string; score: number; target: number; priority: 'High' | 'Medium'; reason: string }>;
    recommendedImprovements: string[];
    careerDna: {
      archetype: string;
      summary: string;
      traits: Array<{ trait: string; score: number }>;
    };
    summary: string;
  }>({
    systemInstruction,
    prompt,
    schema: {
      type: Type.OBJECT,
      properties: {
        strongSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              score: { type: Type.INTEGER },
              target: { type: Type.INTEGER },
              note: { type: Type.STRING },
            },
            required: ['name', 'score', 'target', 'note'],
          },
        },
        intermediateSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              score: { type: Type.INTEGER },
              target: { type: Type.INTEGER },
              note: { type: Type.STRING },
            },
            required: ['name', 'score', 'target', 'note'],
          },
        },
        beginnerSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              score: { type: Type.INTEGER },
              target: { type: Type.INTEGER },
              note: { type: Type.STRING },
            },
            required: ['name', 'score', 'target', 'note'],
          },
        },
        missingSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              score: { type: Type.INTEGER },
              target: { type: Type.INTEGER },
              priority: { type: Type.STRING, enum: ['High', 'Medium'] },
              reason: { type: Type.STRING },
            },
            required: ['name', 'score', 'target', 'priority', 'reason'],
          },
        },
        recommendedImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
        careerDna: {
          type: Type.OBJECT,
          properties: {
            archetype: { type: Type.STRING },
            summary: { type: Type.STRING },
            traits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  trait: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                },
                required: ['trait', 'score'],
              },
            },
          },
          required: ['archetype', 'summary', 'traits'],
        },
        summary: { type: Type.STRING },
      },
      required: [
        'strongSkills',
        'intermediateSkills',
        'beginnerSkills',
        'missingSkills',
        'recommendedImprovements',
        'careerDna',
        'summary',
      ],
    },
  });

  const avgCoverage = Math.round(
    skillComparisonInput.reduce((acc, s) => acc + Math.min(1, s.demonstrated / Math.max(1, s.required)), 0) /
      Math.max(1, skillComparisonInput.length) *
      100
  );

  return {
    careerGoal: careerPath.title,
    careerCoveragePercent: Math.max(5, Math.min(100, avgCoverage)),
    strongSkills: aiReport.strongSkills || [],
    intermediateSkills: aiReport.intermediateSkills || [],
    beginnerSkills: aiReport.beginnerSkills || [],
    missingSkills: aiReport.missingSkills || [],
    recommendedImprovements: aiReport.recommendedImprovements || [],
    skillMatrix: skillComparisonInput,
    careerDna: aiReport.careerDna,
    summary: aiReport.summary,
  };
}

// ---------------------------------------------------------------------------
// 5. LEARNING AGENT
// ---------------------------------------------------------------------------

export async function runLearningAgent(
  profile: StudentProfileBrief,
  careerPath: CareerPath,
  analysis: SkillAnalysisReport,
  completedTasksContext: string[] = []
): Promise<GeneratedRoadmap> {
  const systemInstruction = `You are the Learning Agent in SkillBridge AI.
Design a personalized, sequenced 6-week learning roadmap tailored specifically to close the student's missing and beginner skills for "${careerPath.title}".
Respect the student's preferred learning style (${profile.goals.preferredLearningStyle}) and weekly time budget (${profile.goals.availableLearningTime}).
Every week must have:
- weekNumber (1..6)
- theme
- weeklyGoal
- focusSkills
- miniProject
- 4 concrete tasks (mix of concept, resource, exercise, mini_project) with real, valid public learning URLs (e.g., https://developer.mozilla.org, https://react.dev, https://www.kaggle.com/learn, https://roadmap.sh, https://portswigger.net/web-security, https://www.freecodecamp.org).`;

  const prompt = `Build a personalized 6-week roadmap for ${profile.fullName}.
Target Career: ${careerPath.title}
Career Coverage: ${analysis.careerCoveragePercent}%
Missing Skills (Highest Priority): ${analysis.missingSkills.map((s) => `${s.name} (${s.score}/${s.target})`).join(', ') || 'None'}
Beginner Skills: ${analysis.beginnerSkills.map((s) => `${s.name} (${s.score}/${s.target})`).join(', ') || 'None'}
Strong Skills (Skip basics here): ${analysis.strongSkills.map((s) => s.name).join(', ') || 'None'}
Already Completed Tasks: ${completedTasksContext.join(', ') || 'None yet'}
Preferred Learning Style: ${profile.goals.preferredLearningStyle}
Weekly Time Commitment: ${profile.goals.availableLearningTime}
Trusted Career Resources: ${careerPath.learningResources.map((r) => `${r.title} (${r.url})`).join('; ')}`;

  const roadmap = await generateStructuredJson<GeneratedRoadmap>({
    systemInstruction,
    prompt,
    schema: {
      type: Type.OBJECT,
      properties: {
        overview: { type: Type.STRING },
        weeks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              weekNumber: { type: Type.INTEGER },
              theme: { type: Type.STRING },
              weeklyGoal: { type: Type.STRING },
              focusSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              miniProject: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayLabel: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    taskType: { type: Type.STRING, enum: ['concept', 'exercise', 'resource', 'mini_project'] },
                    resourceTitle: { type: Type.STRING },
                    resourceUrl: { type: Type.STRING },
                    xpPoints: { type: Type.INTEGER },
                  },
                  required: ['dayLabel', 'title', 'description', 'taskType', 'resourceTitle', 'resourceUrl', 'xpPoints'],
                },
              },
            },
            required: ['weekNumber', 'theme', 'weeklyGoal', 'focusSkills', 'miniProject', 'tasks'],
          },
        },
      },
      required: ['overview', 'weeks'],
    },
  });

  return roadmap;
}

// ---------------------------------------------------------------------------
// 6. PROGRESS AGENT
// ---------------------------------------------------------------------------

export function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedRoute = 'dashboard'
) {
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, is_read, related_route, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(crypto.randomUUID(), userId, type, title, message, relatedRoute, new Date().toISOString());
}

export function logActivity(userId: string, action: string, detail: string) {
  db.prepare(
    `INSERT INTO activity_logs (id, user_id, action, detail, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), userId, action, detail, new Date().toISOString());
}

export function runProgressAgentRecordMission(userId: string, xpDelta: number, reason: string) {
  const now = new Date().toISOString();
  let stats = db.prepare('SELECT * FROM progress_stats WHERE user_id = ?').get(userId) as
    | Record<string, unknown>
    | undefined;

  if (!stats) {
    db.prepare(
      `INSERT INTO progress_stats (user_id, total_xp, level, streak_days, completed_tasks_count, assessments_completed, interviews_completed, achievements_json, last_activity_at)
       VALUES (?, 0, 1, 1, 0, 0, 0, '[]', ?)`
    ).run(userId, now);
    stats = db.prepare('SELECT * FROM progress_stats WHERE user_id = ?').get(userId) as Record<string, unknown>;
  }

  const completedTasksCount = db
    .prepare('SELECT COUNT(*) as cnt FROM learning_tasks WHERE user_id = ? AND completed = 1')
    .get(userId) as { cnt: number };

  const assessmentsCompleted = db
    .prepare(`SELECT COUNT(*) as cnt FROM assessments WHERE user_id = ? AND status = 'completed'`)
    .get(userId) as { cnt: number };

  const interviewsCompleted = db
    .prepare(`SELECT COUNT(*) as cnt FROM interview_sessions WHERE user_id = ? AND user_answer IS NOT NULL`)
    .get(userId) as { cnt: number };

  const newXp = Math.max(0, Number(stats.total_xp || 0) + xpDelta);
  const newLevel = Math.floor(newXp / 150) + 1;
  const achievements = safeJsonParse<Array<{ id: string; title: string; earnedAt: string }>>(
    stats.achievements_json as string,
    []
  );

  const awardIfMissing = (id: string, title: string) => {
    if (!achievements.some((a) => a.id === id)) {
      achievements.push({ id, title, earnedAt: now });
      createNotification(
        userId,
        'milestone_reached',
        `Milestone Unlocked: ${title}`,
        `You earned the "${title}" achievement while progressing on your SkillBridge AI roadmap.`,
        'roadmap'
      );
    }
  };

  if (assessmentsCompleted.cnt >= 1) awardIfMissing('first_assessment', 'Diagnostic Explorer');
  if (completedTasksCount.cnt >= 1) awardIfMissing('first_mission', 'First Mission Cleared');
  if (completedTasksCount.cnt >= 5) awardIfMissing('five_missions', 'Momentum Builder (5 Tasks)');
  if (completedTasksCount.cnt >= 10) awardIfMissing('ten_missions', 'SkillBridge Specialist (10 Tasks)');
  if (interviewsCompleted.cnt >= 1) awardIfMissing('first_interview', 'Interview Challenger');
  if (newLevel >= 3) awardIfMissing('level_3', 'Level 3 Pathfinder');

  db.prepare(
    `UPDATE progress_stats
     SET total_xp = ?, level = ?, completed_tasks_count = ?, assessments_completed = ?, interviews_completed = ?, achievements_json = ?, last_activity_at = ?
     WHERE user_id = ?`
  ).run(
    newXp,
    newLevel,
    completedTasksCount.cnt,
    assessmentsCompleted.cnt,
    interviewsCompleted.cnt,
    JSON.stringify(achievements),
    now,
    userId
  );

  if (xpDelta > 0) {
    logActivity(userId, 'Mission Progress', `${reason} (+${xpDelta} XP)`);
  }
}

// ---------------------------------------------------------------------------
// 7. MENTOR AGENT & INTERVIEW PRACTICE
// ---------------------------------------------------------------------------

export async function runMentorAgentChat(
  userId: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ reply: string; agentsConsulted: string[] }> {
  const profile = runProfileAgent(userId);
  const latestAnalysisRow = db
    .prepare('SELECT * FROM skill_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(userId) as Record<string, unknown> | undefined;

  const progressRow = db
    .prepare('SELECT * FROM progress_stats WHERE user_id = ?')
    .get(userId) as Record<string, unknown> | undefined;

  const pendingTasks = db
    .prepare('SELECT week_number, title, task_type FROM learning_tasks WHERE user_id = ? AND completed = 0 ORDER BY week_number ASC LIMIT 6')
    .all(userId) as Array<{ week_number: number; title: string; task_type: string }>;

  const completedTasks = db
    .prepare('SELECT title FROM learning_tasks WHERE user_id = ? AND completed = 1 ORDER BY completed_at DESC LIMIT 5')
    .all(userId) as Array<{ title: string }>;

  const analysisContext = latestAnalysisRow
    ? {
        careerGoal: latestAnalysisRow.career_goal,
        coveragePercent: latestAnalysisRow.career_coverage_percent,
        strongSkills: safeJsonParse<Array<{ name: string; score: number }>>(latestAnalysisRow.strong_skills_json as string, []).map((s) => `${s.name} (${s.score}%)`),
        missingSkills: safeJsonParse<Array<{ name: string; score: number }>>(latestAnalysisRow.missing_skills_json as string, []).map((s) => `${s.name} (${s.score}%)`),
        summary: latestAnalysisRow.summary,
      }
    : null;

  const systemInstruction = `You are the Mentor Agent of SkillBridge AI — a deeply knowledgeable, encouraging, and practical career mentor.
You have real-time access to the outputs from the Profile Agent, Skill Analysis Agent, Learning Agent, and Progress Agent for THIS specific student:
- Student Name: ${profile.fullName}
- Education: ${profile.education.degree} in ${profile.education.department} (${profile.education.academicYear}) at ${profile.education.collegeName}
- Target Career: ${profile.goals.desiredCareer}
- Learning Style & Time Budget: ${profile.goals.preferredLearningStyle}, ${profile.goals.availableLearningTime}
- Verified Skill Analysis: ${analysisContext ? JSON.stringify(analysisContext) : 'Assessment pending'}
- Progress Stats: ${progressRow ? `Level ${progressRow.level}, ${progressRow.total_xp} XP, ${progressRow.completed_tasks_count} tasks completed` : 'Just starting'}
- Recently Completed Tasks: ${completedTasks.map((t) => t.title).join(', ') || 'None yet'}
- Next Upcoming Roadmap Tasks: ${pendingTasks.map((t) => `Week ${t.week_number}: ${t.title}`).join('; ') || 'None generated yet'}

CRITICAL GUIDELINES:
1. Always personalize your advice using this student's actual verified strengths, missing skills, and upcoming tasks — NEVER give generic boilerplate.
2. Explain complex technical concepts clearly with concrete examples when asked.
3. Recommend specific next steps, projects, or practice exercises tied to their missing skills.
4. Keep formatting clean with clear headings or bullet points.`;

  const ai = getGeminiClient();
  const recentTurns = history.slice(-8).map((m) => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${m.content}`).join('\n');
  const fullPrompt = `${recentTurns ? `Recent Conversation:\n${recentTurns}\n\n` : ''}Student: ${userMessage}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: fullPrompt,
    config: {
      systemInstruction,
    },
  });

  const reply = (response.text ?? '').trim() || 'I could not generate a response right now. Please try asking again.';
  return {
    reply,
    agentsConsulted: ['Profile Agent', 'Skill Analysis Agent', 'Learning Agent', 'Progress Agent', 'Mentor Agent'],
  };
}

export async function runMentorAgentGenerateInterview(
  profile: StudentProfileBrief,
  careerPath: CareerPath,
  missingSkills: string[]
): Promise<{ question: string; focusSkill: string; difficulty: string; hints: string[] }> {
  const systemInstruction = `You are the Mentor Agent conducting realistic technical and behavioral interview practice for a student targeting ${careerPath.title}.`;
  const prompt = `Generate 1 high-value interview question tailored to:
Target Career: ${careerPath.title}
Student Academic Level: ${profile.education.degree} (${profile.education.academicYear})
Priority Missing/Developing Skills: ${missingSkills.join(', ') || careerPath.requiredTechnicalSkills.slice(0, 3).map((s) => s.name).join(', ')}`;

  return generateStructuredJson({
    systemInstruction,
    prompt,
    schema: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        focusSkill: { type: Type.STRING },
        difficulty: { type: Type.STRING },
        hints: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['question', 'focusSkill', 'difficulty', 'hints'],
    },
  });
}

export async function runMentorAgentEvaluateInterview(
  careerTitle: string,
  question: string,
  userAnswer: string
): Promise<{ score: number; strengths: string[]; improvements: string[]; modelAnswer: string; verdict: string }> {
  const systemInstruction = `You are a senior hiring manager and SkillBridge Mentor Agent evaluating a student's interview response for a ${careerTitle} role. Be constructive, honest, and specific.`;
  const prompt = `Question: ${question}\nStudent's Answer: ${userAnswer}\n\nGrade from 0 to 100 and provide strengths, specific improvements, a concise verdict, and an ideal model answer.`;

  return generateStructuredJson({
    systemInstruction,
    prompt,
    schema: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        modelAnswer: { type: Type.STRING },
        verdict: { type: Type.STRING },
      },
      required: ['score', 'strengths', 'improvements', 'modelAnswer', 'verdict'],
    },
  });
}

// ---------------------------------------------------------------------------
// CENTRAL ORCHESTRATOR
// ---------------------------------------------------------------------------

export async function orchestrateCareerPipeline(params: {
  userId: string;
  assessmentId: string;
  careerGoalOverride?: string;
}): Promise<{
  evaluation: AssessmentEvaluationResult;
  analysis: SkillAnalysisReport;
  roadmapId: string;
  trace: AgentTraceStep[];
}> {
  const { userId, assessmentId, careerGoalOverride } = params;
  const trace: AgentTraceStep[] = [];

  // Step 1: Profile Agent retrieves student information
  const profile = runProfileAgent(userId);
  const targetCareerTitle = careerGoalOverride || profile.goals.desiredCareer || 'Full Stack Developer';
  trace.push({
    agent: 'Profile Agent',
    status: 'completed',
    summary: `Synthesized profile for ${profile.fullName} targeting ${targetCareerTitle}.`,
    timestamp: new Date().toISOString(),
    dataPreview: {
      education: profile.education.degree,
      selfReportedCount:
        profile.selfReportedSkills.programming.length + profile.selfReportedSkills.technical.length,
      timeBudget: profile.goals.availableLearningTime,
    },
  });

  // Step 2: Career Agent loads benchmark requirements
  const careerPath = runCareerAgentGetBenchmark(targetCareerTitle);
  trace.push({
    agent: 'Career Agent',
    status: 'completed',
    summary: `Loaded ${careerPath.requiredTechnicalSkills.length} competency benchmarks for ${careerPath.title}.`,
    timestamp: new Date().toISOString(),
    dataPreview: {
      career: careerPath.title,
      coreSkills: careerPath.requiredTechnicalSkills.map((s) => s.name),
    },
  });

  // Step 3: Assessment Agent evaluates submitted answers (or uses existing verified skills)
  const assessmentRow = db
    .prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?')
    .get(assessmentId, userId) as Record<string, unknown> | undefined;

  if (!assessmentRow) {
    throw new Error('Assessment record not found.');
  }

  const questions = safeJsonParse<AssessmentQuestion[]>(assessmentRow.questions_json as string, []);
  const answers = safeJsonParse<Record<string, string>>(assessmentRow.answers_json as string, {});

  let evaluation: AssessmentEvaluationResult;
  if (assessmentRow.status === 'completed' && assessmentRow.verified_skills_json) {
    const existingFeedback = safeJsonParse<Record<string, unknown>>(assessmentRow.feedback_json as string, {});
    evaluation = {
      overallScore: Number(assessmentRow.score || 0),
      maxScore: Number(assessmentRow.max_score || 100),
      verifiedSkills: safeJsonParse<Record<string, number>>(assessmentRow.verified_skills_json as string, {}),
      questionFeedback: (existingFeedback.questionFeedback as QuestionEvaluation[]) || [],
      strengthsSummary: String(existingFeedback.strengthsSummary || ''),
      gapsSummary: String(existingFeedback.gapsSummary || ''),
      selfReportedVsActualNote: String(existingFeedback.selfReportedVsActualNote || ''),
    };
  } else {
    evaluation = await runAssessmentAgentEvaluate(profile, careerPath, questions, answers);
    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE assessments
       SET status = 'completed', score = ?, max_score = ?, verified_skills_json = ?, feedback_json = ?, completed_at = ?
       WHERE id = ? AND user_id = ?`
    ).run(
      evaluation.overallScore,
      evaluation.maxScore,
      JSON.stringify(evaluation.verifiedSkills),
      JSON.stringify({
        questionFeedback: evaluation.questionFeedback,
        strengthsSummary: evaluation.strengthsSummary,
        gapsSummary: evaluation.gapsSummary,
        selfReportedVsActualNote: evaluation.selfReportedVsActualNote,
      }),
      completedAt,
      assessmentId,
      userId
    );
  }

  trace.push({
    agent: 'Assessment Agent',
    status: 'completed',
    summary: `Evaluated demonstrated skills: scored ${evaluation.overallScore}/${evaluation.maxScore}.`,
    timestamp: new Date().toISOString(),
    dataPreview: {
      score: evaluation.overallScore,
      maxScore: evaluation.maxScore,
      verifiedSkillsCount: Object.keys(evaluation.verifiedSkills).length,
    },
  });

  // Step 4: Skill Analysis Agent identifies strengths & gaps
  const analysis = await runSkillAnalysisAgent(profile, careerPath, evaluation);
  const analysisId = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO skill_analyses
     (id, user_id, career_goal, assessment_id, strong_skills_json, intermediate_skills_json, beginner_skills_json, missing_skills_json, recommended_improvements_json, career_coverage_percent, skill_matrix_json, career_dna_json, summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    analysisId,
    userId,
    careerPath.title,
    assessmentId,
    JSON.stringify(analysis.strongSkills),
    JSON.stringify(analysis.intermediateSkills),
    JSON.stringify(analysis.beginnerSkills),
    JSON.stringify(analysis.missingSkills),
    JSON.stringify(analysis.recommendedImprovements),
    analysis.careerCoveragePercent,
    JSON.stringify(analysis.skillMatrix),
    JSON.stringify(analysis.careerDna),
    analysis.summary,
    now
  );

  trace.push({
    agent: 'Skill Analysis Agent',
    status: 'completed',
    summary: `Computed ${analysis.careerCoveragePercent}% career coverage; found ${analysis.missingSkills.length} missing skills.`,
    timestamp: new Date().toISOString(),
    dataPreview: {
      coverage: analysis.careerCoveragePercent,
      strong: analysis.strongSkills.map((s) => s.name),
      missing: analysis.missingSkills.map((s) => s.name),
      archetype: analysis.careerDna.archetype,
    },
  });

  // Step 5: Learning Agent builds personalized roadmap & tasks
  const generatedRoadmap = await runLearningAgent(profile, careerPath, analysis);
  const roadmapId = crypto.randomUUID();

  // Clear previous uncompleted roadmap tasks if switching/updating, or replace active roadmap cleanly
  db.prepare('DELETE FROM learning_tasks WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM learning_roadmaps WHERE user_id = ?').run(userId);

  db.prepare(
    `INSERT INTO learning_roadmaps (id, user_id, career_goal, overview, weeks_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(roadmapId, userId, careerPath.title, generatedRoadmap.overview, JSON.stringify(generatedRoadmap.weeks), now, now);

  const insertTask = db.prepare(
    `INSERT INTO learning_tasks
     (id, user_id, roadmap_id, week_number, day_label, title, description, task_type, resource_title, resource_url, xp_points, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
  );

  let taskCount = 0;
  for (const week of generatedRoadmap.weeks || []) {
    for (const task of week.tasks || []) {
      insertTask.run(
        crypto.randomUUID(),
        userId,
        roadmapId,
        week.weekNumber,
        task.dayLabel || 'Day 1',
        task.title,
        task.description,
        task.taskType || 'concept',
        task.resourceTitle || '',
        task.resourceUrl || '',
        task.xpPoints || 25
      );
      taskCount++;
    }
  }

  trace.push({
    agent: 'Learning Agent',
    status: 'completed',
    summary: `Created a ${generatedRoadmap.weeks.length}-week roadmap with ${taskCount} personalized missions.`,
    timestamp: new Date().toISOString(),
    dataPreview: {
      weeks: generatedRoadmap.weeks.length,
      tasks: taskCount,
      learningStyle: profile.goals.preferredLearningStyle,
    },
  });

  // Step 6: Progress Agent updates XP, achievements, and real notifications
  runProgressAgentRecordMission(userId, 50, `Completed AI Skill Assessment for ${careerPath.title}`);
  createNotification(
    userId,
    'assessment_completed',
    'AI Skill Assessment Completed',
    `You scored ${evaluation.overallScore}/${evaluation.maxScore} for ${careerPath.title}. Your verified skill gap report is ready.`,
    'analysis'
  );
  createNotification(
    userId,
    'roadmap_updated',
    'Personalized Learning Roadmap Generated',
    `Your ${generatedRoadmap.weeks.length}-week roadmap targeting ${analysis.missingSkills.length} skill gaps is now active.`,
    'roadmap'
  );
  createNotification(
    userId,
    'new_task',
    'New Week 1 Learning Missions Available',
    `Start with "${generatedRoadmap.weeks[0]?.tasks?.[0]?.title || 'Week 1 Foundations'}" to earn XP.`,
    'roadmap'
  );

  trace.push({
    agent: 'Progress Agent',
    status: 'completed',
    summary: `Awarded +50 XP, updated milestones, and dispatched personalized notifications.`,
    timestamp: new Date().toISOString(),
    dataPreview: {
      xpAwarded: 50,
      notificationsCreated: 3,
    },
  });

  // Step 7: Mentor Agent prepares welcome guidance note
  const firstGap = analysis.missingSkills[0]?.name || analysis.beginnerSkills[0]?.name || careerPath.requiredTechnicalSkills[0].name;
  createNotification(
    userId,
    'mentor_tip',
    'New Mentor Recommendation',
    `Focus this week on "${firstGap}" — ask your AI Mentor anytime for guided practice or concept explanations.`,
    'mentor'
  );

  trace.push({
    agent: 'Mentor Agent',
    status: 'completed',
    summary: `Primed mentor context with ${careerPath.title} gap profile and recommended starting focus on ${firstGap}.`,
    timestamp: new Date().toISOString(),
    dataPreview: {
      recommendedFocus: firstGap,
      archetype: analysis.careerDna.archetype,
    },
  });

  // Persist agent orchestration run
  db.prepare(
    `INSERT INTO agent_runs (id, user_id, orchestrator_goal, steps_json, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), userId, `Full Career Pipeline: ${careerPath.title}`, JSON.stringify(trace), now);

  logActivity(userId, 'AI Pipeline Complete', `Generated skill analysis and ${generatedRoadmap.weeks.length}-week roadmap for ${careerPath.title}.`);

  return { evaluation, analysis, roadmapId, trace };
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export { CAREER_PATHS };
