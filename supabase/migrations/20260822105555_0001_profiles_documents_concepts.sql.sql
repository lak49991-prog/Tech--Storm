/*
# LearnLoop core schema: profiles, documents, concepts

1. New Tables
- `profiles`: user profile info (study level, preferences, subjects) extending auth.users
- `documents`: uploaded study material metadata + extracted text
- `document_chunks`: text chunks (reserved for future use)
- `concepts`: canonical concept names shared across documents
- `document_concepts`: many-to-many linking documents to concepts with importance

2. Security
- RLS enabled on all tables, owner-scoped via auth.uid()
- profiles: user owns their own profile row (id = auth.uid())
- documents: user owns their documents (user_id default auth.uid())
- document_chunks, document_concepts: scoped through parent document ownership
- concepts: globally readable (authenticated), writes via service role only
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  study_level text,
  study_preference text,
  subjects text[] DEFAULT '{}',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'uploaded',
  summary text,
  page_count integer,
  concept_count integer,
  estimated_minutes integer,
  text_content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Document chunks (reserved)
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chunks" ON document_chunks;
CREATE POLICY "select_own_chunks" ON document_chunks FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_chunks.document_id AND documents.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_chunks" ON document_chunks;
CREATE POLICY "insert_own_chunks" ON document_chunks FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_chunks.document_id AND documents.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_chunks" ON document_chunks;
CREATE POLICY "delete_own_chunks" ON document_chunks FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_chunks.document_id AND documents.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);

-- Concepts (canonical, shared)
CREATE TABLE IF NOT EXISTS concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_concepts" ON concepts;
CREATE POLICY "read_concepts" ON concepts FOR SELECT
  TO authenticated USING (true);

-- Document-concepts link
CREATE TABLE IF NOT EXISTS document_concepts (
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  importance integer DEFAULT 50,
  PRIMARY KEY (document_id, concept_id)
);
ALTER TABLE document_concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_doc_concepts" ON document_concepts;
CREATE POLICY "select_own_doc_concepts" ON document_concepts FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_concepts.document_id AND documents.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_doc_concepts" ON document_concepts;
CREATE POLICY "insert_own_doc_concepts" ON document_concepts FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_concepts.document_id AND documents.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_doc_concepts" ON document_concepts;
CREATE POLICY "delete_own_doc_concepts" ON document_concepts FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_concepts.document_id AND documents.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_doc_concepts_doc ON document_concepts(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_concepts_concept ON document_concepts(concept_id);
