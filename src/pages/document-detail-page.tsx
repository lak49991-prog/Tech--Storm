import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Target, Zap, Layers, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchDocument, fetchDocumentConcepts, fetchUserConcepts, fetchFlashcardDecks } from '@/services/data-service';
import { mockGenerateQuiz } from '@/services/ai-service';
import { createQuizSession, createQuestions } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id!),
    enabled: !!id,
  });
  const { data: docConcepts } = useQuery({
    queryKey: ['document-concepts', id],
    queryFn: () => fetchDocumentConcepts(id!),
    enabled: !!id,
  });
  const { data: userConcepts } = useQuery({
    queryKey: ['user-concepts', user?.id],
    queryFn: () => fetchUserConcepts(user!.id),
    enabled: !!user,
  });
  const { data: decks } = useQuery({
    queryKey: ['flashcard-decks', user?.id],
    queryFn: () => fetchFlashcardDecks(user!.id),
    enabled: !!user,
  });

  const getMastery = (conceptName: string) => {
    const uc = userConcepts?.find((c) => c.concept_name === conceptName);
    return uc?.mastery_score ?? null;
  };

  const startDiagnostic = async () => {
    if (!user || !doc || !docConcepts) return;
    setStarting(true);
    try {
      const conceptNames = docConcepts.map((c) => c.concept.name);
      const quizQuestions = await mockGenerateQuiz(conceptNames, 10);
      const session = await createQuizSession(user.id, doc.id, 'diagnostic', 10);
      const questionsToInsert = quizQuestions.map((q) => {
        const concept = docConcepts.find((c) => c.concept.name === q.concept);
        return {
          document_id: doc.id,
          concept_id: concept?.concept.id || '',
          question: q.question,
          type: q.type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          source_reference: q.source_reference,
        };
      });
      await createQuestions(questionsToInsert);
      navigate(`/practice/${session.id}`);
    } catch {
      toast({ title: 'Could not start quiz', variant: 'destructive' });
    }
    setStarting(false);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="mb-4 h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 text-center">
        <p className="text-muted-foreground">Document not found.</p>
        <Button asChild className="mt-4"><Link to="/library">Back to Library</Link></Button>
      </div>
    );
  }

  const linkedDeck = decks?.find((d) => d.document_id === doc.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/library" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Library
      </Link>

      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <FileText className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground uppercase">{doc.file_type} · {doc.page_count || '?'} pages</p>
        </div>
      </div>

      {doc.summary && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI Summary</span>
            </div>
            <p className="text-sm text-muted-foreground">{doc.summary}</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Detected Concepts</h2>
        <div className="space-y-2">
          {docConcepts?.map(({ concept, importance }) => {
            const mastery = getMastery(concept.name);
            return (
              <Card key={concept.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <p className="font-medium">{concept.name}</p>
                    {concept.description && <p className="text-xs text-muted-foreground mt-0.5">{concept.description}</p>}
                  </div>
                  {mastery !== null ? (
                    <div className="flex items-center gap-2">
                      <Progress value={mastery} className="h-2 w-20" />
                      <span className="text-sm font-semibold w-10 text-right">{mastery}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not tested</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Practice this material</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={startDiagnostic} disabled={starting} className="flex-1 gap-2">
              <Target className="h-4 w-4" /> {starting ? 'Starting...' : 'Quick Quiz'}
            </Button>
            <Button variant="outline" asChild className="flex-1 gap-2">
              <Link to="/practice"><Zap className="h-4 w-4" /> Adaptive Practice</Link>
            </Button>
            {linkedDeck && (
              <Button variant="outline" asChild className="flex-1 gap-2">
                <Link to={`/flashcards/${linkedDeck.id}`}><BookOpen className="h-4 w-4" /> Flashcards</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
