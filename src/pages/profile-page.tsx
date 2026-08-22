import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, BookOpen, Target, AlertTriangle, Flame, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchUserConcepts, fetchFlashcardDecks } from '@/services/data-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const levelLabels: Record<string, string> = {
  college: 'College',
  school: 'School',
  jee: 'JEE',
  neet: 'NEET',
  other: 'Other',
};

const prefLabels: Record<string, string> = {
  quick: 'Quick Practice',
  deep: 'Deep Practice',
  mixed: 'Mixed',
};

export default function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: userConcepts, isLoading } = useQuery({
    queryKey: ['user-concepts', profile?.id],
    queryFn: () => fetchUserConcepts(profile!.id),
    enabled: !!profile,
  });
  const { data: decks } = useQuery({
    queryKey: ['flashcard-decks', profile?.id],
    queryFn: () => fetchFlashcardDecks(profile!.id),
    enabled: !!profile,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const overallMastery = userConcepts && userConcepts.length > 0
    ? Math.round(userConcepts.reduce((s, c) => s + c.mastery_score, 0) / userConcepts.length)
    : 0;
  const questionsSolved = userConcepts?.reduce((s, c) => s + c.attempts, 0) || 0;
  const weakConcepts = userConcepts?.filter((c) => c.mastery_score < 60).length || 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
              {profile.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{profile.full_name}</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {profile.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study preferences */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Study Preferences</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5" /> Study Level
              </div>
              <p className="font-medium">{levelLabels[profile.study_level || 'other'] || 'Not set'}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-3.5 w-3.5" /> Study Style
              </div>
              <p className="font-medium">{prefLabels[profile.study_preference || 'mixed'] || 'Not set'}</p>
            </div>
          </div>
          {profile.subjects && profile.subjects.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" /> Subjects
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.subjects.map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{s}</span>
                ))}
              </div>
            </div>
          )}
          <Button variant="outline" asChild className="mt-4 w-full">
            <Link to="/onboarding">Edit Preferences</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Your Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Target className="h-3.5 w-3.5" /> Overall Mastery</div>
              <p className="text-2xl font-bold text-primary">{overallMastery}%</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Target className="h-3.5 w-3.5" /> Questions Solved</div>
              <p className="text-2xl font-bold">{questionsSolved}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" /> Weak Concepts</div>
              <p className="text-2xl font-bold text-destructive">{weakConcepts}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Flame className="h-3.5 w-3.5" /> Study Streak</div>
              <p className="text-2xl font-bold text-success">7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard decks */}
      {decks && decks.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Flashcard Decks</h2>
            <div className="space-y-2">
              {decks.map((d) => (
                <Link key={d.id} to={`/flashcards/${d.id}`}>
                  <Card className="cursor-pointer transition-all hover:border-primary/40">
                    <CardContent className="flex items-center justify-between p-4">
                      <p className="font-medium">{d.title}</p>
                      <span className="text-sm text-muted-foreground">Review →</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={handleSignOut} className="w-full gap-2 text-muted-foreground">
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
}
