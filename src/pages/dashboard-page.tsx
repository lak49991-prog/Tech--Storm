import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, AlertTriangle, Flame, ArrowRight, Clock, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchUserConcepts, fetchLearningEvents, fetchRecentSessions } from '@/services/data-service';
import { getWeaknesses, getRecommendation, calculateDashboardStats, getPriorityLabel } from '@/services/learning-service';
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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const userId = user?.id || '';

  const { data: userConcepts, isLoading } = useQuery({
    queryKey: ['user-concepts', userId],
    queryFn: () => fetchUserConcepts(userId),
    enabled: !!userId,
  });
  const { data: events } = useQuery({
    queryKey: ['learning-events', userId],
    queryFn: () => fetchLearningEvents(userId, 5),
    enabled: !!userId,
  });
  const { data: sessions } = useQuery({
    queryKey: ['recent-sessions', userId],
    queryFn: () => fetchRecentSessions(userId, 3),
    enabled: !!userId,
  });

  if (isLoading) return <DashboardSkeleton />;

  const weaknesses = userConcepts ? getWeaknesses(userConcepts) : [];
  const recommendation = getRecommendation(weaknesses);
  const stats = calculateDashboardStats(userConcepts || []);
  const topWeak = weaknesses.slice(0, 4);
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}, {firstName}.</h1>
        <p className="mt-1 text-muted-foreground">
          {recommendation ? "Let's strengthen what you struggled with last time." : 'Upload material to get started.'}
        </p>
      </div>

      {/* Top stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Target} label="Overall Mastery" value={`${stats.overall_mastery}%`} color="text-primary" />
        <StatCard icon={TrendingUp} label="Questions Solved" value={String(stats.questions_solved)} color="text-foreground" />
        <StatCard icon={AlertTriangle} label="Weak Concepts" value={String(stats.weak_concepts)} color="text-destructive" />
        <StatCard icon={Flame} label="Study Streak" value={`${stats.study_streak} days`} color="text-success" />
      </div>

      {/* Recommendation card */}
      {recommendation && (
        <Card className="mb-6 overflow-hidden border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Recommended for you</span>
                </div>
                <h3 className="text-xl font-bold">Practice {recommendation.concept_name}</h3>
                <p className="mt-1 text-muted-foreground">{recommendation.reason}</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Mastery:</span>
                  <Progress value={recommendation.mastery_score} className="h-2 w-32" />
                  <span className="text-sm font-semibold text-destructive">{recommendation.mastery_score}%</span>
                </div>
              </div>
              <Button asChild className="shrink-0 gap-2">
                <Link to="/practice">
                  Start Practice <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weak concepts */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Weak Concepts</h2>
          <div className="space-y-3">
            {topWeak.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No concepts yet. Upload material to start tracking.</CardContent></Card>
            ) : (
              topWeak.map((w) => {
                const pl = getPriorityLabel(w.mastery_score);
                return (
                  <Link key={w.concept_id} to="/weaknesses">
                    <Card className="cursor-pointer transition-all hover:border-primary/40">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{w.concept_name}</p>
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', priorityColors[pl.variant])}>{pl.label}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={w.mastery_score} className="h-1.5 w-24" />
                            <span className="text-sm font-semibold">{w.mastery_score}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
          <div className="space-y-3">
            {sessions && sessions.length > 0 ? (
              sessions.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{s.type} session</p>
                      <p className="text-xs text-muted-foreground">{s.correct_count}/{s.total_questions} correct</p>
                    </div>
                    <span className="text-lg font-bold">{s.score}%</span>
                  </CardContent>
                </Card>
              ))
            ) : (
              events && events.length > 0 ? (
                events.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{e.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card><CardContent className="p-6 text-center text-muted-foreground">No activity yet.</CardContent></Card>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="mb-6 h-32" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

function cn(...args: (string | undefined | false)[]) {
  return args.filter(Boolean).join(' ');
}
