/*
# LearnLoop flashcards: decks, cards, reviews

1. New Tables
- `flashcard_decks`: a deck of flashcards tied to a user and optionally a document
- `flashcards`: individual cards with front/back and simple SRS fields (ease, interval, next review)
- `flashcard_reviews`: log of each review rating

2. Security
- RLS on all tables, owner-scoped via auth.uid()
- flashcard_decks: user_id default auth.uid()
- flashcards, flashcard_reviews: scoped through deck ownership
*/

CREATE TABLE IF NOT EXISTS flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_decks" ON flashcard_decks;
CREATE POLICY "select_own_decks" ON flashcard_decks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_decks" ON flashcard_decks;
CREATE POLICY "insert_own_decks" ON flashcard_decks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_decks" ON flashcard_decks;
CREATE POLICY "update_own_decks" ON flashcard_decks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_decks" ON flashcard_decks;
CREATE POLICY "delete_own_decks" ON flashcard_decks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_decks_user ON flashcard_decks(user_id);

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  concept_id uuid REFERENCES concepts(id) ON DELETE SET NULL,
  front text NOT NULL,
  back text NOT NULL,
  ease double precision NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  next_review_at timestamptz DEFAULT now(),
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_flashcards" ON flashcards;
CREATE POLICY "select_own_flashcards" ON flashcards FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM flashcard_decks WHERE flashcard_decks.id = flashcards.deck_id AND flashcard_decks.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_flashcards" ON flashcards;
CREATE POLICY "insert_own_flashcards" ON flashcards FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM flashcard_decks WHERE flashcard_decks.id = flashcards.deck_id AND flashcard_decks.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_flashcards" ON flashcards;
CREATE POLICY "update_own_flashcards" ON flashcards FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM flashcard_decks WHERE flashcard_decks.id = flashcards.deck_id AND flashcard_decks.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_flashcards" ON flashcards;
CREATE POLICY "delete_own_flashcards" ON flashcards FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM flashcard_decks WHERE flashcard_decks.id = flashcards.deck_id AND flashcard_decks.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);

CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  rating text NOT NULL,
  reviewed_at timestamptz DEFAULT now()
);
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reviews" ON flashcard_reviews;
CREATE POLICY "select_own_reviews" ON flashcard_reviews FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM flashcards JOIN flashcard_decks ON flashcard_decks.id = flashcards.deck_id WHERE flashcards.id = flashcard_reviews.flashcard_id AND flashcard_decks.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_reviews" ON flashcard_reviews;
CREATE POLICY "insert_own_reviews" ON flashcard_reviews FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM flashcards JOIN flashcard_decks ON flashcard_decks.id = flashcards.deck_id WHERE flashcards.id = flashcard_reviews.flashcard_id AND flashcard_decks.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reviews_flashcard ON flashcard_reviews(flashcard_id);

-- Mastery history table for progress charts
CREATE TABLE IF NOT EXISTS mastery_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id uuid REFERENCES concepts(id) ON DELETE CASCADE,
  mastery_score integer NOT NULL,
  recorded_at timestamptz DEFAULT now()
);
ALTER TABLE mastery_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mastery_history" ON mastery_history;
CREATE POLICY "select_own_mastery_history" ON mastery_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_mastery_history" ON mastery_history;
CREATE POLICY "insert_own_mastery_history" ON mastery_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mastery_history_user ON mastery_history(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_history_concept ON mastery_history(concept_id);
