import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'skillbridge.db');
export const db = new Database(dbPath);

// Enable WAL mode & foreign key enforcement for reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      age INTEGER,
      location TEXT DEFAULT '',
      college_name TEXT DEFAULT '',
      degree TEXT DEFAULT '',
      department TEXT DEFAULT '',
      academic_year TEXT DEFAULT '',
      programming_skills TEXT NOT NULL DEFAULT '[]',
      technical_skills TEXT NOT NULL DEFAULT '[]',
      soft_skills TEXT NOT NULL DEFAULT '[]',
      skill_levels TEXT NOT NULL DEFAULT '{}',
      certificates TEXT NOT NULL DEFAULT '[]',
      projects TEXT NOT NULL DEFAULT '[]',
      internships TEXT NOT NULL DEFAULT '[]',
      desired_career TEXT DEFAULT '',
      career_interests TEXT NOT NULL DEFAULT '[]',
      preferred_learning_style TEXT DEFAULT 'Hands-on Projects',
      available_learning_time TEXT DEFAULT '10-15 hours/week',
      onboarding_step INTEGER NOT NULL DEFAULT 1,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      profile_completion INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      career_goal TEXT NOT NULL,
      questions_json TEXT NOT NULL,
      answers_json TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress',
      score INTEGER DEFAULT 0,
      max_score INTEGER DEFAULT 100,
      verified_skills_json TEXT DEFAULT '{}',
      feedback_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skill_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      career_goal TEXT NOT NULL,
      assessment_id TEXT NOT NULL,
      strong_skills_json TEXT NOT NULL DEFAULT '[]',
      intermediate_skills_json TEXT NOT NULL DEFAULT '[]',
      beginner_skills_json TEXT NOT NULL DEFAULT '[]',
      missing_skills_json TEXT NOT NULL DEFAULT '[]',
      recommended_improvements_json TEXT NOT NULL DEFAULT '[]',
      career_coverage_percent INTEGER NOT NULL DEFAULT 0,
      skill_matrix_json TEXT NOT NULL DEFAULT '[]',
      career_dna_json TEXT NOT NULL DEFAULT '{}',
      summary TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_roadmaps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      career_goal TEXT NOT NULL,
      overview TEXT NOT NULL DEFAULT '',
      weeks_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      roadmap_id TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      day_label TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      task_type TEXT NOT NULL,
      resource_title TEXT DEFAULT '',
      resource_url TEXT DEFAULT '',
      xp_points INTEGER NOT NULL DEFAULT 25,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (roadmap_id) REFERENCES learning_roadmaps(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress_stats (
      user_id TEXT PRIMARY KEY,
      total_xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      streak_days INTEGER NOT NULL DEFAULT 1,
      completed_tasks_count INTEGER NOT NULL DEFAULT 0,
      assessments_completed INTEGER NOT NULL DEFAULT 0,
      interviews_completed INTEGER NOT NULL DEFAULT 0,
      achievements_json TEXT NOT NULL DEFAULT '[]',
      last_activity_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      related_route TEXT DEFAULT 'dashboard',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mentor_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      agent_trace_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interview_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      career_goal TEXT NOT NULL,
      question TEXT NOT NULL,
      user_answer TEXT,
      ai_feedback_json TEXT,
      score INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      orchestrator_goal TEXT NOT NULL,
      steps_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}
