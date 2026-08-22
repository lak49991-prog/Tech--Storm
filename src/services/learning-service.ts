import type {
  UserConcept,
  WeaknessDetail,
  Recommendation,
  DashboardStats,
  MasteryHistoryPoint,
  QuizQuestionResult,
  Difficulty,
} from '@/types';
import { mockGenerateQuiz } from './ai-service';

export function calculateMastery(
  previousMastery: number,
  recentCorrect: number,
  recentTotal: number,
  avgConfidence: number,
  difficultyWeights: number[] = [],
): number {
  const recentAccuracy = recentTotal > 0 ? (recentCorrect / recentTotal) * 100 : 0;
  const difficultyAdjustment =
    difficultyWeights.length > 0
      ? difficultyWeights.reduce((a, b) => a + b, 0) / difficultyWeights.length
      : 1;
  const confidenceAdjustment = (avgConfidence - 50) / 50;

  const newMastery =
    previousMastery * 0.6 +
    recentAccuracy * 0.3 * difficultyAdjustment +
    confidenceAdjustment * 10 * 0.1;

  return Math.max(0, Math.min(100, Math.round(newMastery)));
}

export function calculateWeaknessScore(uc: UserConcept): number {
  const lowMastery = 100 - uc.mastery_score;
  const recentMistakes = uc.incorrect;
  const repeatedMistakePattern = uc.mistake_types.length * 5;
  const confidenceMismatch = Math.max(0, uc.average_confidence - uc.mastery_score) * 0.3;

  return Math.round(lowMastery + recentMistakes * 2 + repeatedMistakePattern + confidenceMismatch);
}

export function getPriority(weaknessScore: number): 'high' | 'medium' | 'low' {
  if (weaknessScore >= 80) return 'high';
  if (weaknessScore >= 50) return 'medium';
  return 'low';
}

export function getPriorityLabel(mastery: number): { label: string; variant: 'high' | 'medium' | 'low' | 'strong' } {
  if (mastery < 50) return { label: 'HIGH PRIORITY', variant: 'high' };
  if (mastery < 60) return { label: 'NEEDS PRACTICE', variant: 'medium' };
  if (mastery < 75) return { label: 'IMPROVING', variant: 'low' };
  return { label: 'STRONG', variant: 'strong' };
}

export function getWeaknesses(userConcepts: UserConcept[]): WeaknessDetail[] {
  return userConcepts
    .map((uc) => {
      const ws = calculateWeaknessScore(uc);
      const accuracy = uc.attempts > 0 ? (uc.correct / uc.attempts) * 100 : 0;
      return {
        concept_id: uc.concept_id,
        concept_name: uc.concept_name,
        mastery_score: uc.mastery_score,
        attempts: uc.attempts,
        correct: uc.correct,
        incorrect: uc.incorrect,
        accuracy: Math.round(accuracy),
        average_confidence: uc.average_confidence,
        trend: uc.trend,
        mistake_types: uc.mistake_types,
        weakness_score: ws,
        priority: getPriority(ws),
        history: [],
      };
    })
    .sort((a, b) => b.weakness_score - a.weakness_score);
}

export function getRecommendation(weaknesses: WeaknessDetail[]): Recommendation | null {
  if (weaknesses.length === 0) return null;
  const weakest = weaknesses[0];
  return {
    concept_name: weakest.concept_name,
    mastery_score: weakest.mastery_score,
    reason:
      weakest.incorrect >= 6
        ? `You missed ${weakest.incorrect} of your last ${weakest.attempts} ${weakest.concept_name.toLowerCase()} questions.`
        : `Your mastery in ${weakest.concept_name} is ${weakest.mastery_score}%. Let's strengthen this.`,
    incorrect_recent: weakest.incorrect,
  };
}

export function calculateDashboardStats(userConcepts: UserConcept[]): DashboardStats {
  const overallMastery =
    userConcepts.length > 0
      ? Math.round(userConcepts.reduce((sum, uc) => sum + uc.mastery_score, 0) / userConcepts.length)
      : 0;
  const questionsSolved = userConcepts.reduce((sum, uc) => sum + uc.attempts, 0);
  const weakConcepts = userConcepts.filter((uc) => uc.mastery_score < 60).length;

  return {
    overall_mastery: overallMastery,
    questions_solved: questionsSolved,
    weak_concepts: weakConcepts,
    study_streak: 7,
  };
}

export function filterHistoryByRange(
  history: MasteryHistoryPoint[],
  range: '7' | '30' | 'all',
): MasteryHistoryPoint[] {
  if (range === 'all') return history;
  const days = parseInt(range);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return history.filter((h) => new Date(h.date) >= cutoff);
}

export async function generateAdaptiveSession(
  weaknesses: WeaknessDetail[],
  totalQuestions: number = 10,
): Promise<QuizQuestionResult[]> {
  if (weaknesses.length === 0) {
    return mockGenerateQuiz(['Capacitors', 'Electric Field'], totalQuestions);
  }

  const sorted = [...weaknesses].sort((a, b) => b.weakness_score - a.weakness_score);
  const conceptNames: string[] = [];

  const weakest = sorted[0];
  const secondWeakest = sorted[1];
  const reinforcement = sorted[2];

  const weakestCount = Math.ceil(totalQuestions * 0.4);
  const secondCount = Math.ceil(totalQuestions * 0.3);
  const reinforcementCount = Math.ceil(totalQuestions * 0.2);
  const mixedCount = totalQuestions - weakestCount - secondCount - reinforcementCount;

  for (let i = 0; i < weakestCount; i++) conceptNames.push(weakest.concept_name);
  if (secondWeakest) for (let i = 0; i < secondCount; i++) conceptNames.push(secondWeakest.concept_name);
  if (reinforcement) for (let i = 0; i < reinforcementCount; i++) conceptNames.push(reinforcement.concept_name);

  const mixedConcepts = sorted.slice(3, 6).map((w) => w.concept_name);
  if (mixedConcepts.length === 0 && sorted.length > 0) mixedConcepts.push(sorted[0].concept_name);
  for (let i = 0; i < mixedCount; i++) {
    conceptNames.push(mixedConcepts[i % mixedConcepts.length] || sorted[0].concept_name);
  }

  const difficulties: Difficulty[] = [];
  const mistakeTypes = weakest.mistake_types;
  for (let i = 0; i < totalQuestions; i++) {
    if (i < 2) difficulties.push('easy');
    else if (i < 7) difficulties.push('medium');
    else difficulties.push('hard');
  }

  const questions = await mockGenerateQuiz(conceptNames, totalQuestions);

  return questions.map((q, i) => ({
    ...q,
    difficulty: difficulties[i] || q.difficulty,
  }));
}
