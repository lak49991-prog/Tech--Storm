/*
# LearnLoop learner model: user_concepts, questions, quiz sessions, answers

1. New Tables
- `user_concepts`: per-user mastery tracking per concept (mastery, attempts, correct, incorrect, confidence, trend, mistake types)
- `questions`: generated quiz questions linked to a concept and optionally a document
- `quiz_sessions`: a quiz sitting (diagnostic / adaptive / quick) with score
- `quiz_answers`: individual answers within a session with confidence + mistake type
- `learning_events`: append-only event log for activity feed

2. Security
- RLS on all tables, owner-scoped via auth.uid()
- user_concepts, quiz_sessions, quiz_answers, learning_events: user_id default auth.uid()
- questions: readable by authenticated (shared question bank), owner-scoped inserts via document ownership
*/

-- User concepts (learner model)
CREATE TABLE IF NOT EXISTS user_concepts (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  mastery_score integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  incorrect integer NOT NULL DEFAULT 0,
  average_confidence integer NOT NULL DEFAULT 50,
  last_practiced timestamptz,
  trend text NOT NULL DEFAULT 'stable',
  mistake_types text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, concept_id)
);
ALTER TABLE user_concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_concepts" ON user_concepts;
CREATE POLICY "select_own_user_concepts" ON user_concepts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_user_concepts" ON user_concepts;
CREATE POLICY "insert_own_user_concepts" ON user_concepts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_user_concepts" ON user_concepts;
CREATE POLICY "update_own_user_concepts" ON user_concepts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_user_concepts" ON user_concepts;
CREATE POLICY "delete_own_user_concepts" ON user_concepts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_concepts_user ON user_concepts(user_id);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  question text NOT NULL,
  type text NOT NULL DEFAULT 'mcq',
  options text[] NOT NULL,
  correct_answer text NOT NULL,
  explanation text,
  difficulty text NOT NULL DEFAULT 'medium',
  source_reference text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_questions" ON questions;
CREATE POLICY "read_questions" ON questions FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_questions" ON questions;
CREATE POLICY "insert_own_questions" ON questions FOR INSERT
  TO authenticated WITH CHECK (
    document_id IS NULL OR EXISTS (SELECT 1 FROM documents WHERE documents.id = questions.document_id AND documents.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_questions_concept ON questions(concept_id);
CREATE INDEX IF NOT EXISTS idx_questions_document ON questions(document_id);

-- Quiz sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'diagnostic',
  status text NOT NULL DEFAULT 'in_progress',
  score integer,
  total_questions integer NOT NULL DEFAULT 10,
  correct_count integer NOT NULL DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON quiz_sessions;
CREATE POLICY "select_own_sessions" ON quiz_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_sessions" ON quiz_sessions;
CREATE POLICY "insert_own_sessions" ON quiz_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_sessions" ON quiz_sessions;
CREATE POLICY "update_own_sessions" ON quiz_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_document ON quiz_sessions(document_id);

-- Quiz answers
CREATE TABLE IF NOT EXISTS quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE SET NULL,
  concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  confidence text,
  mistake_type text,
  time_spent_ms integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_answers" ON quiz_answers;
CREATE POLICY "select_own_answers" ON quiz_answers FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM quiz_sessions WHERE quiz_sessions.id = quiz_answers.session_id AND quiz_sessions.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_answers" ON quiz_answers;
CREATE POLICY "insert_own_answers" ON quiz_answers FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM quiz_sessions WHERE quiz_sessions.id = quiz_answers.session_id AND quiz_sessions.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_answers" ON quiz_answers;
CREATE POLICY "update_own_answers" ON quiz_answers FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM quiz_sessions WHERE quiz_sessions.id = quiz_answers.session_id AND quiz_sessions.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_answers_session ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_concept ON quiz_answers(concept_id);

-- Learning events (activity feed)
CREATE TABLE IF NOT EXISTS learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON learning_events;
CREATE POLICY "select_own_events" ON learning_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_events" ON learning_events;
CREATE POLICY "insert_own_events" ON learning_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_user ON learning_events(user_id);
