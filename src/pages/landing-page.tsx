import { Link } from 'react-router-dom';
import { Brain, Upload, Target, Lightbulb, TrendingUp, ArrowRight, Sparkles, Zap, Clock, CheckCircle2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">LearnLoop</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-in-up">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI Learning Coach
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Study smarter by learning{' '}
                <span className="text-primary">what you don't know</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Upload your study material. Practice with AI. Understand your mistakes. LearnLoop remembers your weaknesses and adapts your next session.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="gap-2">
                  <Link to="/signup">
                    Start Learning Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">See How It Works</Link>
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Free for students</span>
              </div>
            </div>

            {/* Hero visual */}
            <div className="animate-in-up" style={{ animationDelay: '0.15s' }}>
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/60 bg-card/50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-lg text-muted-foreground">Four steps to mastery.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { num: '01', icon: Upload, title: 'Upload', desc: 'Upload your study material — PDF or text.' },
              { num: '02', icon: Target, title: 'Practice', desc: 'Take an AI-generated quiz on the concepts.' },
              { num: '03', icon: Lightbulb, title: 'Understand', desc: 'Learn why you got questions wrong and what mistakes you make.' },
              { num: '04', icon: TrendingUp, title: 'Improve', desc: 'Your next quiz adapts to your weaknesses automatically.' },
            ].map((step, i) => (
              <Card key={step.num} className="relative animate-in-up p-6" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="absolute right-5 top-5 text-3xl font-bold text-muted/40">{step.num}</span>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* USP Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Not another quiz generator.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most AI study tools generate questions. LearnLoop learns from your answers.
          </p>

          <div className="mt-12 flex flex-col items-center gap-3">
            {[
              { label: 'Student answers', icon: Target },
              { label: 'Mistake detected', icon: Zap },
              { label: 'Weak concept identified', icon: Brain },
              { label: 'Learner profile updated', icon: User },
              { label: 'Next practice adapts', icon: TrendingUp },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex flex-col items-center">
                <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 animate-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <step.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="h-6 w-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-card/50 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to learn what you don't know?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join LearnLoop and turn your mistakes into mastery.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link to="/signup">
                Start Learning Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Try Demo Account</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Demo: alex@learnloop.demo / demo1234
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">LearnLoop</span>
          </div>
          <p className="text-xs text-muted-foreground">Don't just study. Learn what you don't know.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroDashboard() {
  return (
    <Card className="overflow-hidden p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, Alex</p>
          <p className="text-lg font-semibold">Your Learning Dashboard</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <Clock className="h-3 w-3" />
          7 day streak
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Mastery', value: '72%', color: 'text-primary' },
          { label: 'Questions Solved', value: '186', color: 'text-foreground' },
          { label: 'Weak Concepts', value: '4', color: 'text-destructive' },
          { label: 'Study Streak', value: '7 days', color: 'text-success' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Weakest Concept</p>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">HIGH PRIORITY</span>
        </div>
        <p className="text-lg font-semibold">Capacitors</p>
        <div className="mt-2 flex items-center gap-2">
          <Progress value={35} className="h-2 flex-1" />
          <span className="text-sm font-semibold text-destructive">35%</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">You missed 6 of your last 10 capacitor questions.</p>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary/5 p-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs text-primary">Next quiz will focus on capacitors based on your history.</p>
      </div>
    </Card>
  );
}
