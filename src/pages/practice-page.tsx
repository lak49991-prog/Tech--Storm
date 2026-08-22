import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Target, Zap, Brain, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchWeaknessDetails, createQuizSession, createQuestions } from '@/services/data-service';
import { generateAdaptiveSession } from '@/services/learning-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function PracticePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [starting, setStarting] = useState<null | string>(null);

  const { data: weaknesses, isLoading } = useQuery({
    queryKey: ['weaknesses', user?.id],
    queryFn: () => fetchWeaknessDetails(user!.id),
    enabled: !!user,
  });

  const startAdaptive = async () => {
    if (!user || !weaknesses) return;
    setStarting('adaptive');
    try {
      const questions = await generateAdaptiveSession(weaknesses, 10);
      const session = await createQuizSession(user.id, null, 'adaptive', 10);

      const conceptMap = new Map<string, string>();
      for (const w of weaknesses) {
        conceptMap.set(w.concept_name, w.concept_id);
      }

      const questionsToInsert = questions.map((q) => ({
        document_id: null,
        concept_id: conceptMap.get(q.concept) || '',
        question: q.question,
        type: q.type,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        source_reference: q.source_reference,
      }));
      await createQuestions(questionsToInsert);
      navigate(`/practice/${session.id}`);
    } catch {
      toast({ title: 'We couldn\'t create this practice session.', variant: 'destructive' });
    }
    setStarting(null);
  };

  const startQuick = async () => {
    if (!user || !weaknesses) return;
    setStarting('quick');
    try {
      const topConcepts = weaknesses.slice(0, 4).map((w) => w.concept_name);
      const { mockGenerateQuiz } = await import('@/services/ai-service');
      const questions = await mockGenerateQuiz(topConcepts, 5);
      const session = await createQuizSession(user.id, null, 'quick', 5);

      const conceptMap = new Map<string, string>();
      for (const w of weaknesses) conceptMap.set(w.concept_name, w.concept_id);

      await createQuestions(questions.map((q) => ({
        document_id: null,
        concept_id: conceptMap.get(q.concept) || '',
        question: q.question,
        type: q.type,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        source_reference: q.source_reference,
      })));
      navigate(`/practice/${session.id}`);
    } catch {
      toast({ title: 'We couldn\'t create this practice session.', variant: 'destructive' });
    }
    setStarting(null);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-4 h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const weakest = weaknesses?.[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Practice</h1>
      <p className="mb-6 text-muted-foreground">What should you learn next?</p>

      {weakest && (
        <Card className="mb-4 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Focus area</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{weakest.concept_name}</p>
            <p className="text-sm text-muted-foreground">
              {weakest.incorrect} incorrect answers · Mastery {weakest.mastery_score}%
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer transition-all hover:border-primary/40" >
          <CardContent className="p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Adaptive Practice</h3>
            <p className="mt-1 text-sm text-muted-foreground">10 questions targeting your weakest concepts based on your answer history.</p>
            <Button onClick={startAdaptive} disabled={starting === 'adaptive'} className="mt-4 w-full gap-2">
              {starting === 'adaptive' ? 'Preparing...' : 'Start Adaptive'} <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary/40">
          <CardContent className="p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <Target className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold">Quick Practice</h3>
            <p className="mt-1 text-sm text-muted-foreground">5 quick questions across multiple concepts. Great for a short review.</p>
            <Button variant="outline" onClick={startQuick} disabled={starting === 'quick'} className="mt-4 w-full gap-2">
              {starting === 'quick' ? 'Preparing...' : 'Start Quick'} <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {!weakest && (
        <Card className="mt-4">
          <CardContent className="p-6 text-center text-muted-foreground">
            Upload study material and complete a diagnostic quiz first. LearnLoop needs your answers to adapt.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
