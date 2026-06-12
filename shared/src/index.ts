// Shared types between client and server

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  board: string;
  grade: number;
  examDate?: string;
  onboarded: boolean;
}

export interface SubjectGoalInfo {
  subject: string;
  subjectCode: string;
  targetMarks: number;
  totalMarks: number;
  targetPercentage: number;
}

export interface GoalInfo {
  id: string;
  targetPercentage: number;
  examDate: string;
  subjectGoals: SubjectGoalInfo[];
}

export interface FeasibilityInfo {
  weeksRemaining: number;
  totalChapters: number;
  chaptersPerWeek: number;
  level: 'achievable' | 'challenging' | 'very_challenging';
}

export interface MasteryChapter {
  chapterName: string;
  chapterNo: number;
  score: number;
  level: 'weak' | 'moderate' | 'strong';
}

export interface SubjectMastery {
  subjectName: string;
  subjectCode: string;
  averageMastery: number;
  chapters: MasteryChapter[];
}

export interface PlanItemInfo {
  id: string;
  type: 'STUDY' | 'REVISION' | 'PRACTICE';
  date: string;
  durationMin: number;
  description: string;
  completed: boolean;
  completedAt?: string;
  chapter: string;
  subject: string;
}

export interface AdherenceInfo {
  weeklyTotal: number;
  weeklyCompleted: number;
  adherencePercentage: number;
  target: number;
  onTrack: boolean;
}

export interface StreakInfo {
  current: number;
  longest: number;
}
