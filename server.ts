import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase } from './server/db.ts';
import {
  hashPassword,
  verifyPassword,
  signAuthToken,
  requireAuth,
  validateEmail,
  validatePasswordStrength,
  type AuthenticatedRequest,
} from './server/auth.ts';
import {
  CAREER_PATHS,
  runProfileAgent,
  runAssessmentAgentGenerate,
  runCareerAgentGetBenchmark,
  runCareerAgentRecommendProjects,
  runSkillAnalysisAgent,
  runLearningAgent,
  runProgressAgentRecordMission,
  runMentorAgentChat,
  runMentorAgentGenerateInterview,
  runMentorAgentEvaluateInterview,
  orchestrateCareerPipeline,
  createNotification,
  logActivity,
  safeJsonParse,
  type AssessmentQuestion,
  type AssessmentEvaluationResult,
  type SkillAnalysisReport,
} from './server/agents.ts';

initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Helper: compute profile completion percentage
function computeProfileCompletion(p: Record<string, unknown>): number {
  let score = 0;
  if (p.fullName && String(p.fullName).trim()) score += 10;
  if (p.age) score += 5;
  if (p.collegeName && String(p.collegeName).trim()) score += 10;
  if (p.degree && String(p.degree).trim()) score += 10;
  if (p.department && String(p.department).trim()) score += 10;
  if (p.academicYear && String(p.academicYear).trim()) score += 5;
  if (Array.isArray(p.programmingSkills) && p.programmingSkills.length > 0) score += 15;
  if (Array.isArray(p.technicalSkills) && p.technicalSkills.length > 0) score += 10;
  if (Array.isArray(p.softSkills) && p.softSkills.length > 0) score += 5;
  if (Array.isArray(p.projects) && p.projects.length > 0) score += 5;
  if (p.desiredCareer && String(p.desiredCareer).trim()) score += 10;
  if (p.preferredLearningStyle && String(p.preferredLearningStyle).trim()) score += 5;
  return Math.min(100, score);
}

function serializeProfileRow(row: Record<string, unknown>) {
  return {
    userId: String(row.user_id),
    fullName: String(row.full_name || ''),
    age: row.age !== null && row.age !== undefined ? Number(row.age) : null,
    location: String(row.location || ''),
    collegeName: String(row.college_name || ''),
    degree: String(row.degree || ''),
    department: String(row.department || ''),
    academicYear: String(row.academic_year || ''),
    programmingSkills: safeJsonParse<string[]>(row.programming_skills as string, []),
    technicalSkills: safeJsonParse<string[]>(row.technical_skills as string, []),
    softSkills: safeJsonParse<string[]>(row.soft_skills as string, []),
    skillLevels: safeJsonParse<Record<string, number>>(row.skill_levels as string, {}),
    certificates: safeJsonParse<string[]>(row.certificates as string, []),
    projects: safeJsonParse<string[]>(row.projects as string, []),
    internships: safeJsonParse<string[]>(row.internships as string, []),
    desiredCareer: String(row.desired_career || ''),
    careerInterests: safeJsonParse<string[]>(row.career_interests as string, []),
    preferredLearningStyle: String(row.preferred_learning_style || 'Hands-on Projects'),
    availableLearningTime: String(row.available_learning_time || '10-15 hours/week'),
    onboardingStep: Number(row.onboarding_step || 1),
    onboardingCompleted: Boolean(row.onboarding_completed),
    profileCompletion: Number(row.profile_completion || 0),
    updatedAt: String(row.updated_at || ''),
  };
}

// ---------------------------------------------------------------------------
// AUTH ROUTES
// ---------------------------------------------------------------------------

app.post('/api/auth/register', (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body || {};
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    }
    if (!email || typeof email !== 'string' || !validateEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }
    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) {
      return res.status(400).json({ error: pwdErr });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and confirm password do not match.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);

    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO users (id, full_name, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(userId, fullName.trim(), normalizedEmail, passwordHash, now, now);

      db.prepare(
        `INSERT INTO student_profiles (user_id, full_name, onboarding_step, onboarding_completed, profile_completion, updated_at)
         VALUES (?, ?, 1, 0, 10, ?)`
      ).run(userId, fullName.trim(), now);

      db.prepare(
        `INSERT INTO progress_stats (user_id, total_xp, level, streak_days, completed_tasks_count, assessments_completed, interviews_completed, achievements_json, last_activity_at)
         VALUES (?, 0, 1, 1, 0, 0, 0, '[]', ?)`
      ).run(userId, now);
    });
    tx();

    const token = signAuthToken({ userId, email: normalizedEmail }, true);
    res.cookie('sb_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      token,
      user: { id: userId, fullName: fullName.trim(), email: normalizedEmail },
      onboardingCompleted: false,
      hasCompletedAssessment: false,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Unable to register account right now.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, rememberMe } = req.body || {};
    if (!email || typeof email !== 'string' || !validateEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRow = db
      .prepare('SELECT id, full_name, email, password_hash FROM users WHERE email = ?')
      .get(normalizedEmail) as
      | { id: string; full_name: string; email: string; password_hash: string }
      | undefined;

    if (!userRow || !verifyPassword(password, userRow.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const profileRow = db
      .prepare('SELECT onboarding_completed FROM student_profiles WHERE user_id = ?')
      .get(userRow.id) as { onboarding_completed: number } | undefined;

    const completedAssess = db
      .prepare(`SELECT id FROM assessments WHERE user_id = ? AND status = 'completed' LIMIT 1`)
      .get(userRow.id);

    const remember = Boolean(rememberMe);
    const token = signAuthToken({ userId: userRow.id, email: userRow.email }, remember);
    res.cookie('sb_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    return res.json({
      token,
      user: { id: userRow.id, fullName: userRow.full_name, email: userRow.email },
      onboardingCompleted: Boolean(profileRow?.onboarding_completed),
      hasCompletedAssessment: Boolean(completedAssess),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Unable to log in right now.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('sb_token');
  return res.json({ success: true });
});

app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const userRow = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(normalizedEmail) as { id: string } | undefined;

    if (!userRow) {
      return res.status(404).json({ error: 'No SkillBridge AI account found for that email address.' });
    }

    const resetCode = String(crypto.randomInt(100000, 999999));
    const codeHash = hashPassword(resetCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO password_resets (id, user_id, code_hash, expires_at, used, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(crypto.randomUUID(), userRow.id, codeHash, expiresAt, new Date().toISOString());

    // Since external SMTP is not attached in this sandbox, return the time-limited verification code cleanly
    return res.json({
      success: true,
      message: 'A 6-digit password reset verification code has been generated (valid for 15 minutes).',
      verificationCode: resetCode,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Could not initiate password reset.' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body || {};
    if (!email || !validateEmail(String(email))) {
      return res.status(400).json({ error: 'Valid email is required.' });
    }
    if (!code || String(code).trim().length !== 6) {
      return res.status(400).json({ error: 'Valid 6-digit verification code is required.' });
    }
    const pwdErr = validatePasswordStrength(String(newPassword || ''));
    if (pwdErr) {
      return res.status(400).json({ error: pwdErr });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const userRow = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(String(email).trim().toLowerCase()) as { id: string } | undefined;

    if (!userRow) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const resetRow = db
      .prepare(
        `SELECT * FROM password_resets
         WHERE user_id = ? AND used = 0
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(userRow.id) as
      | { id: string; code_hash: string; expires_at: string }
      | undefined;

    if (!resetRow || new Date(resetRow.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Reset code has expired or is invalid. Request a new code.' });
    }

    if (!verifyPassword(String(code).trim(), resetRow.code_hash)) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      hashPassword(String(newPassword)),
      now,
      userRow.id
    );
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRow.id);

    return res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Could not reset password.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const profileRow = db
    .prepare('SELECT * FROM student_profiles WHERE user_id = ?')
    .get(userId) as Record<string, unknown> | undefined;

  const completedAssess = db
    .prepare(`SELECT id FROM assessments WHERE user_id = ? AND status = 'completed' LIMIT 1`)
    .get(userId);

  return res.json({
    user: req.user,
    onboardingCompleted: Boolean(profileRow?.onboarding_completed),
    hasCompletedAssessment: Boolean(completedAssess),
    profile: profileRow ? serializeProfileRow(profileRow) : null,
  });
});

// ---------------------------------------------------------------------------
// STUDENT PROFILE & ONBOARDING ROUTES
// ---------------------------------------------------------------------------

app.get('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const row = db
    .prepare('SELECT * FROM student_profiles WHERE user_id = ?')
    .get(req.user!.id) as Record<string, unknown> | undefined;

  if (!row) {
    return res.status(404).json({ error: 'Profile not found.' });
  }
  return res.json({ profile: serializeProfileRow(row) });
});

app.put('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const existingRow = db
      .prepare('SELECT * FROM student_profiles WHERE user_id = ?')
      .get(userId) as Record<string, unknown> | undefined;

    if (!existingRow) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const current = serializeProfileRow(existingRow);
    const body = req.body || {};

    const merged = {
      fullName: body.fullName !== undefined ? String(body.fullName).trim() : current.fullName,
      age: body.age !== undefined ? (body.age ? Number(body.age) : null) : current.age,
      location: body.location !== undefined ? String(body.location).trim() : current.location,
      collegeName: body.collegeName !== undefined ? String(body.collegeName).trim() : current.collegeName,
      degree: body.degree !== undefined ? String(body.degree).trim() : current.degree,
      department: body.department !== undefined ? String(body.department).trim() : current.department,
      academicYear: body.academicYear !== undefined ? String(body.academicYear).trim() : current.academicYear,
      programmingSkills: Array.isArray(body.programmingSkills) ? body.programmingSkills : current.programmingSkills,
      technicalSkills: Array.isArray(body.technicalSkills) ? body.technicalSkills : current.technicalSkills,
      softSkills: Array.isArray(body.softSkills) ? body.softSkills : current.softSkills,
      skillLevels:
        body.skillLevels && typeof body.skillLevels === 'object' ? body.skillLevels : current.skillLevels,
      certificates: Array.isArray(body.certificates) ? body.certificates : current.certificates,
      projects: Array.isArray(body.projects) ? body.projects : current.projects,
      internships: Array.isArray(body.internships) ? body.internships : current.internships,
      desiredCareer: body.desiredCareer !== undefined ? String(body.desiredCareer).trim() : current.desiredCareer,
      careerInterests: Array.isArray(body.careerInterests) ? body.careerInterests : current.careerInterests,
      preferredLearningStyle:
        body.preferredLearningStyle !== undefined
          ? String(body.preferredLearningStyle).trim()
          : current.preferredLearningStyle,
      availableLearningTime:
        body.availableLearningTime !== undefined
          ? String(body.availableLearningTime).trim()
          : current.availableLearningTime,
      onboardingStep:
        body.onboardingStep !== undefined ? Number(body.onboardingStep) : current.onboardingStep,
      onboardingCompleted:
        body.onboardingCompleted !== undefined
          ? Boolean(body.onboardingCompleted)
          : current.onboardingCompleted,
    };

    const profileCompletion = computeProfileCompletion(merged);
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE student_profiles SET
        full_name = ?, age = ?, location = ?,
        college_name = ?, degree = ?, department = ?, academic_year = ?,
        programming_skills = ?, technical_skills = ?, soft_skills = ?, skill_levels = ?,
        certificates = ?, projects = ?, internships = ?,
        desired_career = ?, career_interests = ?, preferred_learning_style = ?, available_learning_time = ?,
        onboarding_step = ?, onboarding_completed = ?, profile_completion = ?, updated_at = ?
       WHERE user_id = ?`
    ).run(
      merged.fullName,
      merged.age,
      merged.location,
      merged.collegeName,
      merged.degree,
      merged.department,
      merged.academicYear,
      JSON.stringify(merged.programmingSkills),
      JSON.stringify(merged.technicalSkills),
      JSON.stringify(merged.softSkills),
      JSON.stringify(merged.skillLevels),
      JSON.stringify(merged.certificates),
      JSON.stringify(merged.projects),
      JSON.stringify(merged.internships),
      merged.desiredCareer,
      JSON.stringify(merged.careerInterests),
      merged.preferredLearningStyle,
      merged.availableLearningTime,
      merged.onboardingStep,
      merged.onboardingCompleted ? 1 : 0,
      profileCompletion,
      now,
      userId
    );

    if (merged.fullName && merged.fullName !== req.user!.fullName) {
      db.prepare('UPDATE users SET full_name = ?, updated_at = ? WHERE id = ?').run(
        merged.fullName,
        now,
        userId
      );
    }

    if (merged.onboardingCompleted && !current.onboardingCompleted) {
      logActivity(userId, 'Onboarding Completed', `Profile created for target career: ${merged.desiredCareer}.`);
    } else if (current.onboardingCompleted) {
      logActivity(userId, 'Profile Updated', `Updated student profile (${profileCompletion}% complete).`);
    }

    const updatedRow = db
      .prepare('SELECT * FROM student_profiles WHERE user_id = ?')
      .get(userId) as Record<string, unknown>;

    return res.json({ profile: serializeProfileRow(updatedRow) });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Unable to save profile.' });
  }
});

// ---------------------------------------------------------------------------
// AI SKILL ASSESSMENT & MULTI-AGENT ORCHESTRATION
// ---------------------------------------------------------------------------

app.post('/api/assessments/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const forceNew = Boolean(req.body?.forceNew);

    if (!forceNew) {
      const existingInProgress = db
        .prepare(`SELECT * FROM assessments WHERE user_id = ? AND status = 'in_progress' ORDER BY created_at DESC LIMIT 1`)
        .get(userId) as Record<string, unknown> | undefined;

      if (existingInProgress) {
        const qs = safeJsonParse<AssessmentQuestion[]>(existingInProgress.questions_json as string, []);
        return res.json({
          assessment: {
            id: existingInProgress.id,
            careerGoal: existingInProgress.career_goal,
            status: existingInProgress.status,
            questions: qs.map(({ correctAnswer: _c, evaluationRubric: _r, ...safeQ }) => safeQ),
            createdAt: existingInProgress.created_at,
          },
        });
      }
    }

    const profile = runProfileAgent(userId);
    const careerPath = runCareerAgentGetBenchmark(req.body?.careerGoal || profile.goals.desiredCareer);
    const questions = await runAssessmentAgentGenerate(profile, careerPath);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO assessments (id, user_id, career_goal, questions_json, status, max_score, created_at)
       VALUES (?, ?, ?, ?, 'in_progress', 100, ?)`
    ).run(id, userId, careerPath.title, JSON.stringify(questions), now);

    logActivity(userId, 'Assessment Started', `Generated AI diagnostic for ${careerPath.title}.`);

    return res.status(201).json({
      assessment: {
        id,
        careerGoal: careerPath.title,
        status: 'in_progress',
        questions: questions.map(({ correctAnswer: _c, evaluationRubric: _r, ...safeQ }) => safeQ),
        createdAt: now,
      },
    });
  } catch (err) {
    console.error('Assessment generate error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate AI skill assessment.';
    return res.status(500).json({ error: msg });
  }
});

app.get('/api/assessments/latest', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const row = db
    .prepare('SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(userId) as Record<string, unknown> | undefined;

  if (!row) {
    return res.json({ assessment: null });
  }

  const questions = safeJsonParse<AssessmentQuestion[]>(row.questions_json as string, []);
  const answers = safeJsonParse<Record<string, string>>(row.answers_json as string, {});
  const isCompleted = row.status === 'completed';

  return res.json({
    assessment: {
      id: row.id,
      careerGoal: row.career_goal,
      status: row.status,
      score: row.score,
      maxScore: row.max_score,
      questions: isCompleted
        ? questions
        : questions.map(({ correctAnswer: _c, evaluationRubric: _r, ...safeQ }) => safeQ),
      answers,
      verifiedSkills: safeJsonParse<Record<string, number>>(row.verified_skills_json as string, {}),
      feedback: safeJsonParse<Record<string, unknown>>(row.feedback_json as string, {}),
      createdAt: row.created_at,
      completedAt: row.completed_at,
    },
  });
});

app.post('/api/assessments/:id/submit', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const assessmentId = String(req.params.id);
    const answers = req.body?.answers;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Please submit your answers object.' });
    }

    const row = db
      .prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?')
      .get(assessmentId, userId) as Record<string, unknown> | undefined;

    if (!row) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    db.prepare('UPDATE assessments SET answers_json = ? WHERE id = ? AND user_id = ?').run(
      JSON.stringify(answers),
      assessmentId,
      userId
    );

    const pipelineResult = await orchestrateCareerPipeline({
      userId,
      assessmentId,
      careerGoalOverride: String(row.career_goal),
    });

    return res.json(pipelineResult);
  } catch (err) {
    console.error('Assessment submit error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to evaluate assessment.';
    return res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// DASHBOARD & SKILL ANALYSIS
// ---------------------------------------------------------------------------

app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const profileRow = db
    .prepare('SELECT * FROM student_profiles WHERE user_id = ?')
    .get(userId) as Record<string, unknown> | undefined;

  const latestAnalysisRow = db
    .prepare('SELECT * FROM skill_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(userId) as Record<string, unknown> | undefined;

  const roadmapRow = db
    .prepare('SELECT * FROM learning_roadmaps WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
    .get(userId) as Record<string, unknown> | undefined;

  const tasks = db
    .prepare('SELECT * FROM learning_tasks WHERE user_id = ? ORDER BY week_number ASC, rowid ASC')
    .all(userId) as Array<Record<string, unknown>>;

  const progressRow = db
    .prepare('SELECT * FROM progress_stats WHERE user_id = ?')
    .get(userId) as Record<string, unknown> | undefined;

  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 25')
    .all(userId) as Array<Record<string, unknown>>;

  const activities = db
    .prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 15')
    .all(userId) as Array<Record<string, unknown>>;

  const assessments = db
    .prepare(`SELECT id, career_goal, status, score, max_score, created_at, completed_at FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`)
    .all(userId) as Array<Record<string, unknown>>;

  const latestAgentRun = db
    .prepare('SELECT * FROM agent_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(userId) as Record<string, unknown> | undefined;

  const profile = profileRow ? serializeProfileRow(profileRow) : null;
  const careerPath = profile?.desiredCareer ? runCareerAgentGetBenchmark(profile.desiredCareer) : CAREER_PATHS[0];

  const analysis: SkillAnalysisReport | null = latestAnalysisRow
    ? {
        careerGoal: String(latestAnalysisRow.career_goal),
        careerCoveragePercent: Number(latestAnalysisRow.career_coverage_percent),
        strongSkills: safeJsonParse(latestAnalysisRow.strong_skills_json as string, []),
        intermediateSkills: safeJsonParse(latestAnalysisRow.intermediate_skills_json as string, []),
        beginnerSkills: safeJsonParse(latestAnalysisRow.beginner_skills_json as string, []),
        missingSkills: safeJsonParse(latestAnalysisRow.missing_skills_json as string, []),
        recommendedImprovements: safeJsonParse(latestAnalysisRow.recommended_improvements_json as string, []),
        skillMatrix: safeJsonParse(latestAnalysisRow.skill_matrix_json as string, []),
        careerDna: safeJsonParse(latestAnalysisRow.career_dna_json as string, {
          archetype: 'Emerging Builder',
          summary: '',
          traits: [],
        }),
        summary: String(latestAnalysisRow.summary || ''),
      }
    : null;

  return res.json({
    profile,
    careerBenchmark: careerPath,
    analysis,
    roadmap: roadmapRow
      ? {
          id: roadmapRow.id,
          careerGoal: roadmapRow.career_goal,
          overview: roadmapRow.overview,
          weeks: safeJsonParse(roadmapRow.weeks_json as string, []),
          updatedAt: roadmapRow.updated_at,
        }
      : null,
    tasks: tasks.map((t) => ({
      id: t.id,
      roadmapId: t.roadmap_id,
      weekNumber: Number(t.week_number),
      dayLabel: t.day_label,
      title: t.title,
      description: t.description,
      taskType: t.task_type,
      resourceTitle: t.resource_title,
      resourceUrl: t.resource_url,
      xpPoints: Number(t.xp_points),
      completed: Boolean(t.completed),
      completedAt: t.completed_at,
    })),
    progress: progressRow
      ? {
          totalXp: Number(progressRow.total_xp || 0),
          level: Number(progressRow.level || 1),
          streakDays: Number(progressRow.streak_days || 1),
          completedTasksCount: Number(progressRow.completed_tasks_count || 0),
          assessmentsCompleted: Number(progressRow.assessments_completed || 0),
          interviewsCompleted: Number(progressRow.interviews_completed || 0),
          achievements: safeJsonParse(progressRow.achievements_json as string, []),
          lastActivityAt: progressRow.last_activity_at,
        }
      : null,
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: Boolean(n.is_read),
      relatedRoute: n.related_route,
      createdAt: n.created_at,
    })),
    unreadCount: notifications.filter((n) => !n.is_read).length,
    activities,
    assessments,
    agentTrace: latestAgentRun
      ? {
          id: latestAgentRun.id,
          goal: latestAgentRun.orchestrator_goal,
          steps: safeJsonParse(latestAgentRun.steps_json as string, []),
          createdAt: latestAgentRun.created_at,
        }
      : null,
  });
});

// ---------------------------------------------------------------------------
// LEARNING ROADMAP & MISSION MODE TASKS
// ---------------------------------------------------------------------------

app.patch('/api/tasks/:id/toggle', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const taskId = String(req.params.id);

  const task = db
    .prepare('SELECT * FROM learning_tasks WHERE id = ? AND user_id = ?')
    .get(taskId, userId) as Record<string, unknown> | undefined;

  if (!task) {
    return res.status(404).json({ error: 'Learning task not found.' });
  }

  const nextCompleted = task.completed ? 0 : 1;
  const now = new Date().toISOString();

  db.prepare('UPDATE learning_tasks SET completed = ?, completed_at = ? WHERE id = ? AND user_id = ?').run(
    nextCompleted,
    nextCompleted ? now : null,
    taskId,
    userId
  );

  const xpPoints = Number(task.xp_points || 25);
  const xpDelta = nextCompleted ? xpPoints : -xpPoints;
  runProgressAgentRecordMission(
    userId,
    xpDelta,
    nextCompleted ? `Completed "${task.title}"` : `Reopened "${task.title}"`
  );

  return res.json({ success: true, completed: Boolean(nextCompleted) });
});

app.post('/api/roadmap/adapt', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const profile = runProfileAgent(userId);
    const careerPath = runCareerAgentGetBenchmark(profile.goals.desiredCareer);

    const latestAnalysisRow = db
      .prepare('SELECT * FROM skill_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(userId) as Record<string, unknown> | undefined;

    if (!latestAnalysisRow) {
      return res.status(400).json({ error: 'Complete an AI skill assessment first before adapting your roadmap.' });
    }

    const analysis: SkillAnalysisReport = {
      careerGoal: String(latestAnalysisRow.career_goal),
      careerCoveragePercent: Number(latestAnalysisRow.career_coverage_percent),
      strongSkills: safeJsonParse(latestAnalysisRow.strong_skills_json as string, []),
      intermediateSkills: safeJsonParse(latestAnalysisRow.intermediate_skills_json as string, []),
      beginnerSkills: safeJsonParse(latestAnalysisRow.beginner_skills_json as string, []),
      missingSkills: safeJsonParse(latestAnalysisRow.missing_skills_json as string, []),
      recommendedImprovements: safeJsonParse(latestAnalysisRow.recommended_improvements_json as string, []),
      skillMatrix: safeJsonParse(latestAnalysisRow.skill_matrix_json as string, []),
      careerDna: safeJsonParse(latestAnalysisRow.career_dna_json as string, {
        archetype: 'Builder',
        summary: '',
        traits: [],
      }),
      summary: String(latestAnalysisRow.summary || ''),
    };

    const completedTasks = db
      .prepare('SELECT title FROM learning_tasks WHERE user_id = ? AND completed = 1')
      .all(userId) as Array<{ title: string }>;

    const updatedRoadmap = await runLearningAgent(
      profile,
      careerPath,
      analysis,
      completedTasks.map((t) => t.title)
    );

    const roadmapId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare('DELETE FROM learning_tasks WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM learning_roadmaps WHERE user_id = ?').run(userId);
    db.prepare(
      `INSERT INTO learning_roadmaps (id, user_id, career_goal, overview, weeks_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(roadmapId, userId, careerPath.title, updatedRoadmap.overview, JSON.stringify(updatedRoadmap.weeks), now, now);

    const insertTask = db.prepare(
      `INSERT INTO learning_tasks
       (id, user_id, roadmap_id, week_number, day_label, title, description, task_type, resource_title, resource_url, xp_points, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    );

    for (const week of updatedRoadmap.weeks || []) {
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
      }
    }

    createNotification(
      userId,
      'roadmap_updated',
      'Learning Roadmap Adapted by AI',
      `Your Learning Agent refreshed your ${careerPath.title} roadmap based on your latest progress.`,
      'roadmap'
    );
    logActivity(userId, 'Roadmap Adapted', `Refreshed personalized roadmap for ${careerPath.title}.`);

    return res.json({ success: true, roadmapId });
  } catch (err) {
    console.error('Roadmap adapt error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to adapt roadmap.' });
  }
});

// ---------------------------------------------------------------------------
// CAREER EXPLORER & SIMULATOR
// ---------------------------------------------------------------------------

app.get('/api/careers', (req, res) => {
  res.json({ careers: CAREER_PATHS });
});

app.post('/api/careers/select', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { careerTitle } = req.body || {};
    if (!careerTitle) {
      return res.status(400).json({ error: 'careerTitle is required.' });
    }

    const careerPath = runCareerAgentGetBenchmark(String(careerTitle));
    const now = new Date().toISOString();

    db.prepare('UPDATE student_profiles SET desired_career = ?, updated_at = ? WHERE user_id = ?').run(
      careerPath.title,
      now,
      userId
    );

    const latestCompleted = db
      .prepare(`SELECT * FROM assessments WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1`)
      .get(userId) as Record<string, unknown> | undefined;

    if (latestCompleted) {
      const profile = runProfileAgent(userId);
      const evaluation: AssessmentEvaluationResult = {
        overallScore: Number(latestCompleted.score || 0),
        maxScore: Number(latestCompleted.max_score || 100),
        verifiedSkills: safeJsonParse(latestCompleted.verified_skills_json as string, {}),
        questionFeedback: [],
        strengthsSummary: '',
        gapsSummary: '',
        selfReportedVsActualNote: '',
      };
      const analysis = await runSkillAnalysisAgent(profile, careerPath, evaluation);
      const analysisId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO skill_analyses
         (id, user_id, career_goal, assessment_id, strong_skills_json, intermediate_skills_json, beginner_skills_json, missing_skills_json, recommended_improvements_json, career_coverage_percent, skill_matrix_json, career_dna_json, summary, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        analysisId,
        userId,
        careerPath.title,
        String(latestCompleted.id),
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

      const generatedRoadmap = await runLearningAgent(profile, careerPath, analysis);
      const roadmapId = crypto.randomUUID();
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
        }
      }

      createNotification(
        userId,
        'roadmap_updated',
        `Career Goal Switched to ${careerPath.title}`,
        `Career Agent, Skill Analysis Agent, and Learning Agent updated your gap analysis and roadmap for ${careerPath.title}.`,
        'roadmap'
      );
      logActivity(userId, 'Career Target Updated', `Switched target career to ${careerPath.title}.`);
    }

    return res.json({ success: true, careerTitle: careerPath.title });
  } catch (err) {
    console.error('Select career error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update target career.' });
  }
});

// ---------------------------------------------------------------------------
// AI MENTOR, INTERVIEW PRACTICE & PROJECT RECOMMENDER
// ---------------------------------------------------------------------------

app.get('/api/mentor/history', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare('SELECT id, role, content, agent_trace_json, created_at FROM mentor_messages WHERE user_id = ? ORDER BY created_at ASC')
    .all(req.user!.id) as Array<Record<string, unknown>>;

  return res.json({
    messages: rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      agentsConsulted: safeJsonParse<string[]>(r.agent_trace_json as string, []),
      createdAt: r.created_at,
    })),
  });
});

app.post('/api/mentor/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ error: 'Please enter a message.' });
    }

    const historyRows = db
      .prepare('SELECT role, content FROM mentor_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 20')
      .all(userId) as Array<{ role: 'user' | 'assistant'; content: string }>;

    const userMsgId = crypto.randomUUID();
    const userMsgTime = new Date().toISOString();
    db.prepare(
      `INSERT INTO mentor_messages (id, user_id, role, content, created_at)
       VALUES (?, ?, 'user', ?, ?)`
    ).run(userMsgId, userId, message, userMsgTime);

    const { reply, agentsConsulted } = await runMentorAgentChat(userId, message, historyRows);

    const aiMsgId = crypto.randomUUID();
    const aiMsgTime = new Date().toISOString();
    db.prepare(
      `INSERT INTO mentor_messages (id, user_id, role, content, agent_trace_json, created_at)
       VALUES (?, ?, 'assistant', ?, ?, ?)`
    ).run(aiMsgId, userId, reply, JSON.stringify(agentsConsulted), aiMsgTime);

    return res.json({
      userMessage: { id: userMsgId, role: 'user', content: message, createdAt: userMsgTime },
      assistantMessage: {
        id: aiMsgId,
        role: 'assistant',
        content: reply,
        agentsConsulted,
        createdAt: aiMsgTime,
      },
    });
  } catch (err) {
    console.error('Mentor chat error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'AI Mentor is unavailable right now.' });
  }
});

app.delete('/api/mentor/history', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare('DELETE FROM mentor_messages WHERE user_id = ?').run(req.user!.id);
  return res.json({ success: true });
});

app.post('/api/interview/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const profile = runProfileAgent(userId);
    const careerPath = runCareerAgentGetBenchmark(req.body?.careerGoal || profile.goals.desiredCareer);

    const latestAnalysis = db
      .prepare('SELECT missing_skills_json FROM skill_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(userId) as { missing_skills_json: string } | undefined;

    const missingSkills = safeJsonParse<Array<{ name: string }>>(latestAnalysis?.missing_skills_json, []).map(
      (s) => s.name
    );

    const generated = await runMentorAgentGenerateInterview(profile, careerPath, missingSkills);
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO interview_sessions (id, user_id, career_goal, question, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(sessionId, userId, careerPath.title, generated.question, now);

    return res.json({
      sessionId,
      careerGoal: careerPath.title,
      ...generated,
    });
  } catch (err) {
    console.error('Interview generate error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate interview question.' });
  }
});

app.post('/api/interview/evaluate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { sessionId, answer } = req.body || {};
    if (!sessionId || !answer || String(answer).trim().length < 5) {
      return res.status(400).json({ error: 'Please write a complete answer before submitting.' });
    }

    const session = db
      .prepare('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?')
      .get(String(sessionId), userId) as Record<string, unknown> | undefined;

    if (!session) {
      return res.status(404).json({ error: 'Interview session not found.' });
    }

    const evaluation = await runMentorAgentEvaluateInterview(
      String(session.career_goal),
      String(session.question),
      String(answer)
    );

    db.prepare(
      `UPDATE interview_sessions SET user_answer = ?, ai_feedback_json = ?, score = ? WHERE id = ? AND user_id = ?`
    ).run(String(answer), JSON.stringify(evaluation), evaluation.score, String(sessionId), userId);

    runProgressAgentRecordMission(
      userId,
      30,
      `Completed AI Interview Practice (${evaluation.score}/100)`
    );

    return res.json({ evaluation });
  } catch (err) {
    console.error('Interview evaluate error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to evaluate interview response.' });
  }
});

app.get('/api/interview/history', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT id, career_goal, question, user_answer, ai_feedback_json, score, created_at
       FROM interview_sessions WHERE user_id = ? AND user_answer IS NOT NULL
       ORDER BY created_at DESC LIMIT 10`
    )
    .all(req.user!.id) as Array<Record<string, unknown>>;

  return res.json({
    sessions: rows.map((r) => ({
      id: r.id,
      careerGoal: r.career_goal,
      question: r.question,
      userAnswer: r.user_answer,
      feedback: safeJsonParse(r.ai_feedback_json as string, null),
      score: r.score,
      createdAt: r.created_at,
    })),
  });
});

app.post('/api/projects/recommend', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const profile = runProfileAgent(userId);
    const careerPath = runCareerAgentGetBenchmark(profile.goals.desiredCareer);

    const latestAnalysis = db
      .prepare('SELECT missing_skills_json, beginner_skills_json FROM skill_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(userId) as { missing_skills_json: string; beginner_skills_json: string } | undefined;

    const missing = safeJsonParse<Array<{ name: string }>>(latestAnalysis?.missing_skills_json, []).map((s) => s.name);
    const beginner = safeJsonParse<Array<{ name: string }>>(latestAnalysis?.beginner_skills_json, []).map((s) => s.name);

    const projects = await runCareerAgentRecommendProjects(profile, careerPath, [...missing, ...beginner]);
    return res.json({ projects, careerGoal: careerPath.title });
  } catch (err) {
    console.error('Project recommend error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate project recommendations.' });
  }
});

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------

app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
    .all(req.user!.id) as Array<Record<string, unknown>>;

  return res.json({
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: Boolean(n.is_read),
      relatedRoute: n.related_route,
      createdAt: n.created_at,
    })),
    unreadCount: rows.filter((n) => !n.is_read).length,
  });
});

app.patch('/api/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(
    String(req.params.id),
    req.user!.id
  );
  return res.json({ success: true });
});

app.post('/api/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
  return res.json({ success: true });
});

// ---------------------------------------------------------------------------
// VITE / STATIC SERVING
// ---------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillBridge AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
