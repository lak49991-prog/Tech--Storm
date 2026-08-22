export type StudyLevel = 'college' | 'school' | 'jee' | 'neet' | 'other';
export type StudyPreference = 'quick' | 'deep' | 'mixed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  study_level: StudyLevel | null;
  study_preference: StudyPreference | null;
  subjects: string[];
  avatar_url: string | null;
  created_at: string;
}

export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export interface StudyDocument {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  status: DocumentStatus;
  summary: string | null;
  page_count: number | null;
  concept_count: number | null;
  estimated_minutes: number | null;
  text_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface Concept {
  id: string;
  name: string;
  description: string | null;
}

export interface DocumentConcept {
  document_id: string;
  concept_id: string;
  importance: number;
}

export interface UserConcept {
  user_id: string;
  concept_id: string;
  concept_name: string;
  mastery_score: number;
  attempts: number;
  correct: number;
  incorrect: number;
  average_confidence: number;
  last_practiced: string | null;
  trend: 'up' | 'down' | 'stable';
  mistake_types: string[];
  updated_at: string;
}

export type QuestionType = 'mcq';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MistakeType =
  | 'concept_gap'
  | 'formula_confusion'
  | 'application'
  | 'calculation'
  | 'interpretation'
  | 'memory_failure'
  | null;

export interface Question {
  id: string;
  document_id: string | null;
  concept_id: string;
  concept_name?: string;
  question: string;
  type: QuestionType;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: Difficulty;
  source_reference: string | null;
}

export type QuizSessionType = 'diagnostic' | 'adaptive' | 'quick';
export type QuizSessionStatus = 'in_progress' | 'completed';

export interface QuizSession {
  id: string;
  user_id: string;
  document_id: string | null;
  type: QuizSessionType;
  status: QuizSessionStatus;
  score: number | null;
  total_questions: number;
  correct_count: number;
  started_at: string;
  completed_at: string | null;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  question_id: string | null;
  concept_id: string;
  selected_answer: string;
  is_correct: boolean;
  confidence: 'low' | 'medium' | 'high' | null;
  mistake_type: MistakeType;
  time_spent_ms: number | null;
  created_at: string;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  document_id: string | null;
  title: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  concept_id: string | null;
  front: string;
  back: string;
  ease: number;
  interval_days: number;
  next_review_at: string;
  review_count: number;
}

export interface FlashcardReview {
  id: string;
  flashcard_id: string;
  rating: 'again' | 'hard' | 'good' | 'easy';
  reviewed_at: string;
}

export interface LearningEvent {
  id: string;
  user_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MasteryHistoryPoint {
  date: string;
  mastery: number;
}

export interface WeaknessDetail {
  concept_id: string;
  concept_name: string;
  mastery_score: number;
  attempts: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  average_confidence: number;
  trend: 'up' | 'down' | 'stable';
  mistake_types: string[];
  weakness_score: number;
  priority: 'high' | 'medium' | 'low';
  history: MasteryHistoryPoint[];
}

export interface DashboardStats {
  overall_mastery: number;
  questions_solved: number;
  weak_concepts: number;
  study_streak: number;
}

export interface Recommendation {
  concept_name: string;
  mastery_score: number;
  reason: string;
  incorrect_recent: number;
}

export interface DocumentAnalysisResult {
  summary: string;
  topics: string[];
  concepts: { name: string; description: string; importance: number }[];
  difficulty: Difficulty;
  learning_objectives: string[];
}

export interface QuizQuestionResult {
  question: string;
  type: QuestionType;
  options: string[];
  correct_answer: string;
  explanation: string;
  concept: string;
  difficulty: Difficulty;
  source_reference: string;
}

export interface AnswerAnalysisResult {
  correct: boolean;
  concept: string;
  mistake_type: MistakeType;
  explanation: string;
  recommended_action: string;
}

export interface SessionAnalysisResult {
  strengths: string[];
  weaknesses: string[];
  mistake_patterns: string[];
  recommendations: string[];
}
