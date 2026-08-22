import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchWeaknessDetails, fetchMasteryHistory } from '@/services/data-service';
import { getPriorityLabel } from '@/services/learning-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-primary/10 text-primary',
  strong: 'bg-success/10 text-success',
};

const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };
const trendColors = { up: 'text-success', down: 'text-destructive', stable: 'text-muted-foreground' };

export default function WeaknessesPage() {
  const { user } = useAuth();

  const { data: weaknesses, isLoading } = useQuery({
    queryKey: ['weaknesses', user?.id],
    queryFn: () => fetchWeaknessDetails(user!.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Your Weak Spots</h1>
        <p className="mt-1 text-muted-foreground">These concepts need the most attention right now.</p>
      </div>

      {(!weaknesses || weaknesses.length === 0) ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No concepts tracked yet. Upload material and complete a quiz to see your weaknesses.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {weaknesses.map((w) => {
            const pl = getPriorityLabel(w.mastery_score);
            const TrendIcon = trendIcons[w.trend];
            return (
              <Card key={w.concept_id} className="transition-all hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{w.concept_name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[pl.variant]}`}>{pl.label}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={w.mastery_score} className="h-2 w-28" />
                        <span className="text-sm font-bold">{w.mastery_score}%</span>
                        <TrendIcon className={`h-4 w-4 ${trendColors[w.trend]}`} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{w.incorrect} incorrect answers</span>
                        <span>{w.attempts} attempts</span>
                        <span>{w.accuracy}% accuracy</span>
                      </div>
                      {w.mistake_types.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {w.mistake_types.map((mt) => (
                            <span key={mt} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{mt.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button asChild size="sm" className="shrink-0 gap-1.5">
                      <Link to="/practice">Fix This <ArrowRight className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
