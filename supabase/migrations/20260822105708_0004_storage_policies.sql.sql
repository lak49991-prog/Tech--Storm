/*
# Storage policies for documents bucket

1. Security
- Authenticated users can CRUD objects in the `documents` bucket under their own user-id prefix path
- Paths are structured as `<user_id>/<filename>` for ownership isolation
*/

DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
  );
