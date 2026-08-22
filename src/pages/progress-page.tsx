import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '@/context/auth-context';
import { fetchUserConcepts, fetchMasteryHistory } from '@/services/data-service';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ranges = [
  { id: '7' as const, label: '7 Days' },
  { id: '30' as const, label: '30 Days' },
  { id: 'all' as const, label: 'All Time' },
];

export default function ProgressPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<'7' | '30' | 'all'>('30');

  const { data: userConcepts, isLoading } = useQuery({
    queryKey: ['user-concepts', user?.id],
    queryFn: () => fetchUserConcepts(user!.id),
    enabled: !!user,
  });

  const topConcepts = (userConcepts || []).slice(0, 5);
  const conceptIds = topConcepts.map((c) => c.concept_id);

  const { data: history } = useQuery({
    queryKey: ['mastery-history-all', user?.id, conceptIds],
    queryFn: async () => {
      const result: Record<string, { date: string; mastery: number }[]> = {};
      for (const uc of topConcepts) {
        const h = await fetchMasteryHistory(user!.id, uc.concept_id);
        result[uc.concept_name] = h;
      }
      return result;
    },
    enabled: !!user && topConcepts.length > 0,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="mb-6 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const overallMastery = userConcepts && userConcepts.length > 0
    ? Math.round(userConcepts.reduce((s, c) => s + c.mastery_score, 0) / userConcepts.length)
    : 0;
  const questionsSolved = userConcepts?.reduce((s, c) => s + c.attempts, 0) || 0;
  const conceptsImproved = userConcepts?.filter((c) => c.trend === 'up').length || 0;

  // Build chart data by merging all concept histories
  const allDates = new Set<string>();
  const chartData: Record<string, number>[] = [];
  if (history) {
    for (const [conceptName, points] of Object.entries(history)) {
      for (const p of points) allDates.add(p.date);
    }
    const sortedDates = Array.from(allDates).sort();
    const cutoff = new Date();
    if (range === '7') cutoff.setDate(cutoff.getDate() - 7);
    else if (range === '30') cutoff.setDate(cutoff.getDate() - 30);

    for (const date of sortedDates) {
      if (range !== 'all' && new Date(date) < cutoff) continue;
      const row: Record<string, number | string> = { date: new Date(date).toLocaleDateString() };
      if (history) {
        for (const [conceptName, points] of Object.entries(history)) {
          const point = points.find((p) => p.date === date);
          if (point) row[conceptName] = point.mastery;
        }
      }
      chartData.push(row as Record<string, number>);
    }
  }

  const colors = ['hsl(244, 75%, 66%)', 'hsl(257, 90%, 66%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Progress</h1>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="mb-1 flex items-center gap-2"><Target className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Overall Mastery</span></div>
          <p className="text-2xl font-bold text-primary">{overallMastery}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Questions Solved</span></div>
          <p className="text-2xl font-bold">{questionsSolved}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="mb-1 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Concepts Improved</span></div>
          <p className="text-2xl font-bold text-success">{conceptsImproved}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mastery Over Time</h2>
            <div className="flex gap-1">
              {ranges.map((r) => (
                <Button
                  key={r.id}
                  variant={range === r.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRange(r.id)}
                  className={cn('text-xs', range === r.id && 'bg-primary text-primary-foreground')}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                {topConcepts.map((uc, i) => (
                  <Line
                    key={uc.concept_id}
                    type="monotone"
                    dataKey={uc.concept_name}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No history yet. Complete quizzes to track your progress.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
