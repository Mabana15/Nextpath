import type { CareerPath } from '../shared/careers';

export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface StudentProfile {
  userId: string;
  fullName: string;
  age: number | null;
  location: string;
  collegeName: string;
  degree: string;
  department: string;
  academicYear: string;
  programmingSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  skillLevels: Record<string, number>;
  certificates: string[];
  projects: string[];
  internships: string[];
  desiredCareer: string;
  careerInterests: string[];
  preferredLearningStyle: string;
  availableLearningTime: string;
  onboardingStep: number;
  onboardingCompleted: boolean;
  profileCompletion: number;
  updatedAt: string;
}

export interface SafeAssessmentQuestion {
  id: string;
  type: 'mcq' | 'knowledge' | 'practical';
  skillTag: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  options?: string[];
  maxPoints: number;
}

export interface AssessmentFeedbackItem {
  questionId: string;
  skillTag: string;
  earnedPoints: number;
  maxPoints: number;
  isCorrectOrStrong: boolean;
  feedback: string;
}

export interface AssessmentRecord {
  id: string;
  careerGoal: string;
  status: 'in_progress' | 'completed';
  score: number;
  maxScore: number;
  questions: SafeAssessmentQuestion[];
  answers?: Record<string, string>;
  verifiedSkills?: Record<string, number>;
  feedback?: {
    questionFeedback?: AssessmentFeedbackItem[];
    strengthsSummary?: string;
    gapsSummary?: string;
    selfReportedVsActualNote?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface SkillAnalysis {
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

export interface RoadmapWeek {
  weekNumber: number;
  theme: string;
  weeklyGoal: string;
  focusSkills: string[];
  miniProject: string;
}

export interface LearningTask {
  id: string;
  roadmapId: string;
  weekNumber: number;
  dayLabel: string;
  title: string;
  description: string;
  taskType: 'concept' | 'exercise' | 'resource' | 'mini_project';
  resourceTitle: string;
  resourceUrl: string;
  xpPoints: number;
  completed: boolean;
  completedAt?: string | null;
}

export interface ProgressStats {
  totalXp: number;
  level: number;
  streakDays: number;
  completedTasksCount: number;
  assessmentsCompleted: number;
  interviewsCompleted: number;
  achievements: Array<{ id: string; title: string; earnedAt: string }>;
  lastActivityAt: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedRoute: string;
  createdAt: string;
}

export interface AgentTraceStep {
  agent: string;
  status: string;
  summary: string;
  timestamp: string;
  dataPreview: Record<string, unknown>;
}

export interface DashboardData {
  profile: StudentProfile;
  careerBenchmark: CareerPath;
  analysis: SkillAnalysis | null;
  roadmap: {
    id: string;
    careerGoal: string;
    overview: string;
    weeks: RoadmapWeek[];
    updatedAt: string;
  } | null;
  tasks: LearningTask[];
  progress: ProgressStats | null;
  notifications: AppNotification[];
  unreadCount: number;
  activities: Array<{ id: string; action: string; detail: string; created_at: string }>;
  assessments: Array<{
    id: string;
    career_goal: string;
    status: string;
    score: number;
    max_score: number;
    created_at: string;
    completed_at: string | null;
  }>;
  agentTrace: {
    id: string;
    goal: string;
    steps: AgentTraceStep[];
    createdAt: string;
  } | null;
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentsConsulted?: string[];
  createdAt: string;
}
