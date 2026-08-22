import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, ArrowRight, Sparkles, AlertCircle, Trophy } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchQuizSession, fetchQuizAnswers, saveQuizAnswer, completeQuizSession, upsertUserConcept, recordMasteryHistory, addLearningEvent } from '@/services/data-service';
import { mockAnalyzeAnswer, mockAnalyzeSession } from '@/services/ai-service';
import { calculateMastery, getPriorityLabel } from '@/services/learning-service';
import type { QuizQuestionResult, AnswerAnalysisResult, MistakeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const mistakeTypeLabels: Record<string, string> = {
  concept_gap: 'Concept Gap',
  formula_confusion: 'Formula Confusion',
  application: 'Application Problem',
  calculation: 'Calculation Mistake',
  interpretation: 'Question Interpretation',
  memory_failure: 'Memory Failure',
};

const difficultyWeights: Record<string, number> = { easy: 0.8, medium: 1.0, hard: 1.2 };

export default function QuizSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ['quiz-session', sessionId],
    queryFn: () => fetchQuizSession(sessionId!),
    enabled: !!sessionId,
  });

  const [questions, setQuestions] = useState<QuizQuestionResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnswerAnalysisResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<{ question: QuizQuestionResult; selected: string; analysis: AnswerAnalysisResult; confidence: 'low' | 'medium' | 'high' | null }[]>([]);
  const [finished, setFinished] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    if (!session) return;
    // Load questions from the session - we need to fetch them
    const loadQuestions = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data } = await supabase
          .from('questions')
          .select(`
            *,
            concept:concepts(name)
          `)
          .eq('document_id', session.document_id)
          .order('created_at', { ascending: false })
          .limit(session.total_questions);
        if (data && data.length > 0) {
          const mapped: QuizQuestionResult[] = data.map((q: Record<string, unknown>) => ({
            question: q.question as string,
            type: q.type as 'mcq',
            options: q.options as string[],
            correct_answer: q.correct_answer as string,
            explanation: q.explanation as string,
            concept: (q.concept as Record<string, unknown>)?.name as string,
            difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
            source_reference: q.source_reference as string,
          }));
          setQuestions(mapped);
        }
      } catch { /* ignore */ }
      setLoadingQuestions(false);
    };
    loadQuestions();
  }, [session]);

  const currentQuestion = questions[currentIndex];

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion || !user || !session) return;
    const result = await mockAnalyzeAnswer(currentQuestion, selectedAnswer);
    setAnalysis(result);
    setShowResult(true);
    if (result.correct) setCorrectCount((c) => c + 1);
  };

  const handleNext = async () => {
    if (!currentQuestion || !analysis || !user || !session) return;

    const newAnswers = [...answers, { question: currentQuestion, selected: selectedAnswer!, analysis, confidence }];
    setAnswers(newAnswers);

    // Save answer to DB
    const conceptId = await getConceptId(currentQuestion.concept);
    if (conceptId) {
      await saveQuizAnswer({
        session_id: session.id,
        question_id: null,
        concept_id: conceptId,
        selected_answer: selectedAnswer!,
        is_correct: analysis.correct,
        confidence,
        mistake_type: analysis.mistake_type as MistakeType,
        time_spent_ms: null,
      });

      // Update user concept mastery
      await updateUserConceptMastery(user.id, conceptId, currentQuestion.concept, analysis.correct, confidence, currentQuestion.difficulty);
    }

    if (currentIndex + 1 >= questions.length) {
      // Finish quiz
      const finalCorrect = analysis.correct ? correctCount + 1 : correctCount;
      await completeQuizSession(session.id, finalCorrect, questions.length);
      const sessionAnalysis = await mockAnalyzeSession(questions.map((q) => q.concept), finalCorrect, questions.length);
      await addLearningEvent(user.id, 'quiz_completed', `${session.type} session completed`, { score: Math.round((finalCorrect / questions.length) * 100), total: questions.length });
      queryClient.invalidateQueries({ queryKey: ['user-concepts'] });
      queryClient.invalidateQueries({ queryKey: ['weaknesses'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['learning-events'] });
      setFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setAnalysis(null);
      setShowResult(false);
      setConfidence(null);
    }
  };

  const getConceptId = async (conceptName: string): Promise<string | null> => {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.from('concepts').select('id').eq('name', conceptName).maybeSingle();
    return data?.id || null;
  };

  const updateUserConceptMastery = async (
    userId: string,
    conceptId: string,
    _conceptName: string,
    isCorrect: boolean,
    conf: 'low' | 'medium' | 'high' | null,
    difficulty: string,
  ) => {
    const { supabase } = await import('@/lib/supabase');
    const { data: existing } = await supabase
      .from('user_concepts')
      .select('*')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .maybeSingle();

    const prevMastery = existing?.mastery_score ?? 0;
    const prevAttempts = existing?.attempts ?? 0;
    const prevCorrect = existing?.correct ?? 0;
    const prevIncorrect = existing?.incorrect ?? 0;
    const prevConfidence = existing?.average_confidence ?? 50;
    const prevMistakeTypes = existing?.mistake_types ?? [];

    const newAttempts = prevAttempts + 1;
    const newCorrect = prevCorrect + (isCorrect ? 1 : 0);
    const newIncorrect = prevIncorrect + (isCorrect ? 0 : 1);
    const confValue = conf === 'low' ? 30 : conf === 'medium' ? 60 : conf === 'high' ? 90 : 50;
    const newAvgConfidence = Math.round((prevConfidence * prevAttempts + confValue) / newAttempts);

    const newMistakeTypes = [...prevMistakeTypes];
    if (!isCorrect && analysis?.mistake_type) {
      const mt = analysis.mistake_type as string;
      if (!newMistakeTypes.includes(mt)) newMistakeTypes.push(mt);
    }

    const recentCorrect = isCorrect ? 1 : 0;
    const newMastery = calculateMastery(prevMastery, recentCorrect, 1, newAvgConfidence, [difficultyWeights[difficulty] || 1]);
    const trend = newMastery > prevMastery ? 'up' : newMastery < prevMastery ? 'down' : 'stable';

    await upsertUserConcept(userId, conceptId, {
      mastery_score: newMastery,
      attempts: newAttempts,
      correct: newCorrect,
      incorrect: newIncorrect,
      average_confidence: newAvgConfidence,
      last_practiced: new Date().toISOString(),
      trend,
      mistake_types: newMistakeTypes,
    });
    await recordMasteryHistory(userId, conceptId, newMastery);
  };

  if (isLoading || loadingQuestions) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-6 h-2 w-full" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (finished) {
    return <QuizResults answers={answers} correctCount={correctCount} total={questions.length} sessionType={session?.type || 'diagnostic'} navigate={navigate} />;
  }

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center sm:px-6">
        <p className="text-muted-foreground">We couldn't create this practice session.</p>
        <Button asChild className="mt-4"><Link to="/practice">Back to Practice</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Question {currentIndex + 1} / {questions.length}</span>
          <span className="text-sm font-medium text-muted-foreground">{correctCount} correct</span>
        </div>
        <Progress value={((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100} className="h-2" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{currentQuestion.concept}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">{currentQuestion.difficulty}</span>
          </div>
          <h2 className="mb-6 text-lg font-semibold leading-snug">{currentQuestion.question}</h2>

          <div className="space-y-2">
            {currentQuestion.options.map((option, i) => {
              const isCorrect = option === currentQuestion.correct_answer;
              const isSelected = option === selectedAnswer;
              let style = 'border-border hover:border-primary/40';
              if (showResult && isCorrect) style = 'border-success bg-success/5';
              else if (showResult && isSelected && !isCorrect) style = 'border-destructive bg-destructive/5';
              else if (isSelected) style = 'border-primary bg-primary/5';
              else if (showResult) style = 'border-border opacity-60';

              return (
                <button
                  key={i}
                  disabled={showResult}
                  onClick={() => setSelectedAnswer(option)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm transition-all ${style}`}
                >
                  <span>{option}</span>
                  {showResult && isCorrect && <Check className="h-4 w-4 text-success" />}
                  {showResult && isSelected && !isCorrect && <X className="h-4 w-4 text-destructive" />}
                </button>
              );
            })}
          </div>

          {/* After answer */}
          {showResult && analysis && (
            <div className="mt-5 animate-in-up">
              <div className={`mb-3 flex items-center gap-2 rounded-lg p-3 ${analysis.correct ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {analysis.correct ? <Check className="h-5 w-5 text-success" /> : <X className="h-5 w-5 text-destructive" />}
                <span className={`font-semibold ${analysis.correct ? 'text-success' : 'text-destructive'}`}>{analysis.correct ? 'Correct!' : 'Incorrect'}</span>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Why?</span>
                </div>
                <p className="text-sm text-muted-foreground">{analysis.explanation}</p>
              </div>

              {!analysis.correct && analysis.mistake_type && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning/10 p-3">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-xs font-medium text-warning">Mistake type</p>
                    <p className="text-sm">{mistakeTypeLabels[analysis.mistake_type as string] || analysis.mistake_type}</p>
                  </div>
                </div>
              )}

              {/* Confidence */}
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">How confident were you?</p>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setConfidence(c)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-all ${
                        confidence === c ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleNext} className="mt-5 w-full gap-2">
                {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!showResult && (
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={() => { setSelectedAnswer(null); handleNext(); }} className="text-muted-foreground">
                Skip
              </Button>
              <Button onClick={handleSubmit} disabled={!selectedAnswer} className="flex-1">
                Submit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuizResults({ answers, correctCount, total, sessionType, navigate }: {
  answers: { question: QuizQuestionResult; selected: string; analysis: AnswerAnalysisResult; confidence: 'low' | 'medium' | 'high' | null }[];
  correctCount: number;
  total: number;
  sessionType: string;
  navigate: (path: string) => void;
}) {
  const score = Math.round((correctCount / total) * 100);
  const byConcept = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const entry = byConcept.get(a.question.concept) || { correct: 0, total: 0 };
    entry.total++;
    if (a.analysis.correct) entry.correct++;
    byConcept.set(a.question.concept, entry);
  }
  const concepts = Array.from(byConcept.entries()).map(([name, v]) => ({
    name,
    mastery: Math.round((v.correct / v.total) * 100),
    correct: v.correct,
    total: v.total,
  }));
  const youKnow = concepts.filter((c) => c.mastery >= 60);
  const needPractice = concepts.filter((c) => c.mastery < 60);
  const weakest = needPractice.sort((a, b) => a.mastery - b.mastery)[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Session Complete</h1>
        <p className="mt-1 text-muted-foreground">Your score</p>
        <p className="text-4xl font-bold text-primary">{score}%</p>
        <p className="mt-1 text-sm text-muted-foreground">{correctCount} out of {total} correct</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {youKnow.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-success"><Check className="h-4 w-4" /> You know</h3>
              {youKnow.map((c) => (
                <div key={c.name} className="mb-2 flex items-center justify-between">
                  <span className="text-sm">{c.name}</span>
                  <span className="text-sm font-semibold">{c.mastery}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {needPractice.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-destructive"><AlertCircle className="h-4 w-4" /> Needs practice</h3>
              {needPractice.map((c) => (
                <div key={c.name} className="mb-2 flex items-center justify-between">
                  <span className="text-sm">{c.name}</span>
                  <span className="text-sm font-semibold text-destructive">{c.mastery}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {weakest && (
        <Card className="mb-4 border-primary/20">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">What we noticed</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You scored {weakest.mastery}% on {weakest.name}. Focus on this concept to improve your overall mastery.
            </p>
            <p className="mt-3 text-sm font-medium">Recommended next step</p>
            <p className="text-sm text-muted-foreground">10-minute {weakest.name} Fix</p>
            <Button onClick={() => navigate('/practice')} className="mt-4 w-full gap-2">
              Start Adaptive Practice <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" asChild className="flex-1"><Link to="/dashboard">Dashboard</Link></Button>
        <Button variant="outline" asChild className="flex-1"><Link to="/weaknesses">View Weaknesses</Link></Button>
      </div>
    </div>
  );
}
