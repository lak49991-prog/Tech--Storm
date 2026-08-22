import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Zap, Layers, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { updateProfile } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const studyLevels = [
  { id: 'college', label: 'College', icon: GraduationCap },
  { id: 'school', label: 'School', icon: BookOpen },
  { id: 'jee', label: 'JEE', icon: Layers },
  { id: 'neet', label: 'NEET', icon: Zap },
  { id: 'other', label: 'Other', icon: BookOpen },
];

const subjectOptions = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Economics', 'History', 'English'];

const studyPrefs = [
  { id: 'quick', label: 'Quick Practice', desc: 'Short 5-min sessions' },
  { id: 'deep', label: 'Deep Practice', desc: 'Longer focused sessions' },
  { id: 'mixed', label: 'Mixed', desc: 'A balance of both' },
];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [pref, setPref] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleSubject = (s: string) => {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        study_level: level,
        study_preference: pref,
        subjects,
      });
      await refreshProfile();
      navigate('/dashboard');
    } catch {
      toast({ title: 'Could not save preferences', variant: 'destructive' });
    }
    setSaving(false);
  };

  const canProceed = step === 0 ? !!level : step === 1 ? subjects.length > 0 : !!pref;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-3 w-3 rounded-full" style={{ background: step >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} />
          <div className="flex h-3 w-3 rounded-full" style={{ background: step >= 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} />
          <div className="flex h-3 w-3 rounded-full" style={{ background: step >= 2 ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} />
        </div>

        {step === 0 && (
          <div className="animate-in-up">
            <h2 className="mb-2 text-2xl font-bold">What are you studying?</h2>
            <p className="mb-6 text-muted-foreground">We'll tailor your experience accordingly.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {studyLevels.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                    level === l.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                  )}
                >
                  <l.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in-up">
            <h2 className="mb-2 text-2xl font-bold">Choose your subjects</h2>
            <p className="mb-6 text-muted-foreground">Select all that apply.</p>
            <div className="flex flex-wrap gap-2">
              {subjectOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                    subjects.includes(s) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40',
                  )}
                >
                  {subjects.includes(s) && <Check className="h-3.5 w-3.5" />}
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in-up">
            <h2 className="mb-2 text-2xl font-bold">How do you prefer to study?</h2>
            <p className="mb-6 text-muted-foreground">You can change this later.</p>
            <div className="space-y-3">
              {studyPrefs.map((p) => (
                <Card
                  key={p.id}
                  className={cn('cursor-pointer border transition-all', pref === p.id ? 'border-primary bg-primary/5' : 'hover:border-primary/40')}
                  onClick={() => setPref(p.id)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{p.label}</p>
                      <p className="text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                    {pref === p.id && <Check className="h-5 w-5 text-primary" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
          ) : <div />}
          {step < 2 ? (
            <Button disabled={!canProceed} onClick={() => setStep(step + 1)} className="gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={!canProceed || saving} onClick={handleFinish} className="gap-2">
              {saving ? 'Saving...' : 'Get Started'} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
