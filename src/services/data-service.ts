import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import type {
  StudyDocument,
  Concept,
  UserConcept,
  QuizSession,
  QuizAnswer,
  Question,
  FlashcardDeck,
  Flashcard,
  LearningEvent,
  MasteryHistoryPoint,
  WeaknessDetail,
} from '@/types';

export async function fetchDocuments(userId: string): Promise<StudyDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as StudyDocument[];
}

export async function fetchDocument(id: string): Promise<StudyDocument | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as StudyDocument | null;
}

export async function deleteDocument(id: string): Promise<void> {
  await supabase.from('documents').delete().eq('id', id);
}

export async function uploadFileToStorage(
  userId: string,
  file: File,
): Promise<string> {
  const filePath = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);
  if (error) throw error;
  return filePath;
}

export async function createDocumentRecord(
  userId: string,
  file: File,
  storagePath: string,
): Promise<StudyDocument> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      title: file.name.replace(/\.[^.]+$/, ''),
      file_name: file.name,
      file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      file_size: file.size,
      storage_path: storagePath,
      status: 'uploaded',
    })
    .select()
    .single();
  if (error) throw error;
  return data as StudyDocument;
}

export async function createDocumentFromText(
  userId: string,
  title: string,
  text: string,
): Promise<StudyDocument> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      title,
      file_name: `${title}.txt`,
      file_type: 'txt',
      file_size: new Blob([text]).size,
      storage_path: `pasted/${userId}/${Date.now()}`,
      status: 'uploaded',
      text_content: text,
    })
    .select()
    .single();
  if (error) throw error;
  return data as StudyDocument;
}

export async function updateDocumentStatus(
  id: string,
  status: string,
  updates: Partial<StudyDocument> = {},
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ status, ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchDocumentConcepts(documentId: string): Promise<{ concept: Concept; importance: number }[]> {
  const { data, error } = await supabase
    .from('document_concepts')
    .select('importance, concept:concepts(*)')
    .eq('document_id', documentId)
    .order('importance', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: Record<string, unknown>) => ({
    concept: row.concept as Concept,
    importance: row.importance as number,
  }));
}

export async function upsertConcept(name: string, description: string): Promise<Concept> {
  const { data: existing } = await supabase
    .from('concepts')
    .select('*')
    .eq('name', name)
    .maybeSingle();
  if (existing) return existing as Concept;

  const { data, error } = await supabase
    .from('concepts')
    .insert({ name, description })
    .select()
    .single();
  if (error) throw error;
  return data as Concept;
}

export async function linkDocumentConcept(
  documentId: string,
  conceptId: string,
  importance: number,
): Promise<void> {
  const { error } = await supabase
    .from('document_concepts')
    .upsert({ document_id: documentId, concept_id: conceptId, importance });
  if (error) throw error;
}

export async function fetchUserConcepts(userId: string): Promise<UserConcept[]> {
  const { data, error } = await supabase
    .from('user_concepts')
    .select(`
      *,
      concept:concepts(name)
    `)
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((row: Record<string, unknown>) => ({
    user_id: row.user_id as string,
    concept_id: row.concept_id as string,
    concept_name: (row.concept as Record<string, unknown>).name as string,
    mastery_score: row.mastery_score as number,
    attempts: row.attempts as number,
    correct: row.correct as number,
    incorrect: row.incorrect as number,
    average_confidence: row.average_confidence as number,
    last_practiced: row.last_practiced as string | null,
    trend: row.trend as 'up' | 'down' | 'stable',
    mistake_types: row.mistake_types as string[],
    updated_at: row.updated_at as string,
  }));
}

export async function upsertUserConcept(
  userId: string,
  conceptId: string,
  updates: Partial<UserConcept>,
): Promise<void> {
  const { error } = await supabase
    .from('user_concepts')
    .upsert({ user_id: userId, concept_id: conceptId, ...updates, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function recordMasteryHistory(
  userId: string,
  conceptId: string,
  mastery: number,
): Promise<void> {
  const { error } = await supabase
    .from('mastery_history')
    .insert({ user_id: userId, concept_id: conceptId, mastery_score: mastery });
  if (error) throw error;
}

export async function fetchMasteryHistory(
  userId: string,
  conceptId?: string,
): Promise<MasteryHistoryPoint[]> {
  let query = supabase
    .from('mastery_history')
    .select('mastery_score, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true });
  if (conceptId) query = query.eq('concept_id', conceptId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row: Record<string, unknown>) => ({
    date: row.recorded_at as string,
    mastery: row.mastery_score as number,
  }));
}

export async function fetchMasteryHistoryForConcepts(
  userId: string,
  conceptIds: string[],
): Promise<Record<string, MasteryHistoryPoint[]>> {
  const result: Record<string, MasteryHistoryPoint[]> = {};
  for (const conceptId of conceptIds) {
    result[conceptId] = await fetchMasteryHistory(userId, conceptId);
  }
  return result;
}

export async function createQuestions(questions: Omit<Question, 'id'>[]): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .insert(questions)
    .select();
  if (error) throw error;
  return (data || []) as Question[];
}

export async function createQuizSession(
  userId: string,
  documentId: string | null,
  type: string,
  totalQuestions: number,
): Promise<QuizSession> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      document_id: documentId,
      type,
      status: 'in_progress',
      total_questions: totalQuestions,
    })
    .select()
    .single();
  if (error) throw error;
  return data as QuizSession;
}

export async function fetchQuizSession(id: string): Promise<QuizSession | null> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as QuizSession | null;
}

export async function completeQuizSession(
  sessionId: string,
  correctCount: number,
  totalQuestions: number,
): Promise<void> {
  const score = Math.round((correctCount / totalQuestions) * 100);
  const { error } = await supabase
    .from('quiz_sessions')
    .update({
      status: 'completed',
      correct_count: correctCount,
      score,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function saveQuizAnswer(answer: Omit<QuizAnswer, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('quiz_answers').insert(answer);
  if (error) throw error;
}

export async function fetchQuizAnswers(sessionId: string): Promise<QuizAnswer[]> {
  const { data, error } = await supabase
    .from('quiz_answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as QuizAnswer[];
}

export async function fetchRecentSessions(userId: string, limit: number = 5): Promise<QuizSession[]> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as QuizSession[];
}

export async function addLearningEvent(
  userId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase
    .from('learning_events')
    .insert({ user_id: userId, event_type: eventType, description, metadata });
  if (error) throw error;
}

export async function fetchLearningEvents(userId: string, limit: number = 5): Promise<LearningEvent[]> {
  const { data, error } = await supabase
    .from('learning_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as LearningEvent[];
}

export async function fetchFlashcardDecks(userId: string): Promise<FlashcardDeck[]> {
  const { data, error } = await supabase
    .from('flashcard_decks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as FlashcardDeck[];
}

export async function fetchFlashcards(deckId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as Flashcard[];
}

export async function createFlashcardDeck(
  userId: string,
  title: string,
  documentId: string | null,
): Promise<FlashcardDeck> {
  const { data, error } = await supabase
    .from('flashcard_decks')
    .insert({ user_id: userId, title, document_id: documentId })
    .select()
    .single();
  if (error) throw error;
  return data as FlashcardDeck;
}

export async function createFlashcards(
  deckId: string,
  cards: { front: string; back: string; concept_id: string | null }[],
): Promise<void> {
  const { error } = await supabase.from('flashcards').insert(
    cards.map((c) => ({ deck_id: deckId, ...c })),
  );
  if (error) throw error;
}

export async function reviewFlashcard(
  flashcardId: string,
  rating: 'again' | 'hard' | 'good' | 'easy',
  currentEase: number,
  currentInterval: number,
): Promise<void> {
  let newEase = currentEase;
  let newInterval = currentInterval;

  switch (rating) {
    case 'again':
      newEase = Math.max(1.3, newEase - 0.2);
      newInterval = 0;
      break;
    case 'hard':
      newEase = Math.max(1.3, newEase - 0.15);
      newInterval = Math.max(1, currentInterval);
      break;
    case 'good':
      newInterval = currentInterval === 0 ? 1 : Math.round(currentInterval * newEase);
      break;
    case 'easy':
      newEase = newEase + 0.15;
      newInterval = currentInterval === 0 ? 2 : Math.round(currentInterval * newEase * 1.3);
      break;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  const { error: updateError } = await supabase
    .from('flashcards')
    .update({
      ease: newEase,
      interval_days: newInterval,
      next_review_at: nextReview.toISOString(),
      review_count: 1,
    })
    .eq('id', flashcardId);
  if (updateError) throw updateError;

  const { error: reviewError } = await supabase
    .from('flashcard_reviews')
    .insert({ flashcard_id: flashcardId, rating });
  if (reviewError) throw reviewError;
}

export async function fetchWeaknessDetails(userId: string): Promise<WeaknessDetail[]> {
  const { data, error } = await supabase
    .from('user_concepts')
    .select(`
      *,
      concept:concepts(name)
    `)
    .eq('user_id', userId)
    .order('mastery_score', { ascending: true });
  if (error) throw error;

  return (data || []).map((row: Record<string, unknown>) => {
    const mastery = row.mastery_score as number;
    const incorrect = row.incorrect as number;
    const attempts = row.attempts as number;
    const correct = row.correct as number;
    const mistakeTypes = row.mistake_types as string[];
    const avgConfidence = row.average_confidence as number;

    const lowMastery = 100 - mastery;
    const recentMistakes = incorrect;
    const repeatedPattern = mistakeTypes.length * 5;
    const confidenceMismatch = Math.max(0, avgConfidence - mastery) * 0.3;
    const weaknessScore = Math.round(lowMastery + recentMistakes * 2 + repeatedPattern + confidenceMismatch);

    return {
      concept_id: row.concept_id as string,
      concept_name: (row.concept as Record<string, unknown>).name as string,
      mastery_score: mastery,
      attempts,
      correct,
      incorrect,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      average_confidence: avgConfidence,
      trend: row.trend as 'up' | 'down' | 'stable',
      mistake_types: mistakeTypes,
      weakness_score: weaknessScore,
      priority: weaknessScore >= 80 ? 'high' : weaknessScore >= 50 ? 'medium' : 'low',
      history: [],
    };
  });
}

export async function updateProfile(
  userId: string,
  updates: { study_level?: string; study_preference?: string; subjects?: string[] },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}
