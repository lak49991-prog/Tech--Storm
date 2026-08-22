import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, RotateCcw, Check } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchFlashcards, reviewFlashcard } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function FlashcardsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const { data: cards, isLoading } = useQuery({
    queryKey: ['flashcards', deckId],
    queryFn: () => fetchFlashcards(deckId!),
    enabled: !!deckId,
  });

  const handleReview = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!cards) return;
    const card = cards[currentIndex];
    try {
      await reviewFlashcard(card.id, rating, card.ease, card.interval_days);
      setReviewed((prev) => new Set(prev).add(card.id));
      queryClient.invalidateQueries({ queryKey: ['flashcards', deckId] });

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      } else {
        toast({ title: 'All cards reviewed!', description: `You reviewed ${cards.length} flashcards.` });
        navigate('/dashboard');
      }
    } catch {
      toast({ title: 'Could not save review', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-6 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center sm:px-6">
        <p className="text-muted-foreground">No flashcards in this deck.</p>
        <Button asChild className="mt-4"><Link to="/library">Back to Library</Link></Button>
      </div>
    );
  }

  const card = cards[currentIndex];
  const isLast = currentIndex + 1 >= cards.length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Button>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Card {currentIndex + 1} of {cards.length}</p>
        <p className="text-sm text-muted-foreground">{reviewed.size} reviewed</p>
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className="mb-6 flex min-h-[280px] cursor-pointer items-center justify-center rounded-2xl border-2 border-border bg-card p-8 text-center transition-all hover:border-primary/40"
      >
        <div>
          {!flipped ? (
            <>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Question</p>
              <p className="text-xl font-semibold">{card.front}</p>
              <p className="mt-4 text-sm text-muted-foreground">Click to reveal</p>
            </>
          ) : (
            <>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">Answer</p>
              <p className="text-lg leading-relaxed">{card.back}</p>
            </>
          )}
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" onClick={() => handleReview('again')} className="flex-col gap-1 py-3 text-destructive">
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs">Again</span>
          </Button>
          <Button variant="outline" onClick={() => handleReview('hard')} className="flex-col gap-1 py-3 text-warning">
            <span className="text-xs">Hard</span>
          </Button>
          <Button variant="outline" onClick={() => handleReview('good')} className="flex-col gap-1 py-3 text-primary">
            <span className="text-xs">Good</span>
          </Button>
          <Button variant="outline" onClick={() => handleReview('easy')} className="flex-col gap-1 py-3 text-success">
            <Check className="h-4 w-4" />
            <span className="text-xs">Easy</span>
          </Button>
        </div>
      ) : (
        <Button onClick={() => setFlipped(true)} className="w-full">
          Reveal Answer <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {isLast && reviewed.size > 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">Last card — review to finish</p>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
