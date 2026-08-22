/*
# Seed demo user Alex with full learning history

1. Purpose
- Creates a demo auth user (alex@learnloop.demo / password: demo1234)
- Seeds profile, 3 documents, concepts, user_concepts with mastery,
  flashcard decks, learning events, mastery history
- Makes the dashboard look populated immediately for the hackathon demo
*/

-- Create demo auth user (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alex@learnloop.demo') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'alex@learnloop.demo',
      crypt('demo1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Alex Rivera"}'
    );
  END IF;
END $$;

-- Profile
INSERT INTO profiles (id, full_name, email, study_level, study_preference, subjects)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Alex Rivera', 'alex@learnloop.demo', 'college', 'mixed', ARRAY['Physics','Chemistry','Mathematics'])
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  study_level = EXCLUDED.study_level,
  study_preference = EXCLUDED.study_preference,
  subjects = EXCLUDED.subjects;

-- Concepts
INSERT INTO concepts (name, description) VALUES
  ('Capacitors', 'Energy storage devices using electric fields; capacitance, series and parallel combinations'),
  ('Electric Field', 'Force per unit charge exerted by a charge distribution'),
  ('Electric Potential', 'Work done per unit charge to move a test charge from infinity to a point'),
  ('Coulombs Law', 'Force between two point charges is proportional to product of charges and inversely proportional to square of distance'),
  ('Gauss Law', 'Electric flux through a closed surface equals enclosed charge over epsilon zero'),
  ('Reaction Mechanisms', 'Step-by-step sequence of elementary reactions by which a chemical change occurs'),
  ('Nucleophiles and Electrophiles', 'Species that donate or accept electron pairs in organic reactions'),
  ('Integration', 'Reverse of differentiation; area under a curve and accumulation functions'),
  ('Limits', 'Value a function approaches as input approaches some value'),
  ('Differential Equations', 'Equations involving derivatives of a function'),
  ('Dielectrics', 'Insulating materials placed between capacitor plates that increase capacitance'),
  ('Energy Stored in Capacitors', 'Formula U = 1/2 C V^2 for energy stored in a charged capacitor')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Documents
INSERT INTO documents (id, user_id, title, file_name, file_type, file_size, storage_path, status, summary, page_count, concept_count, estimated_minutes)
VALUES
  ('d0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Physics — Electrostatics', 'electrostatics.pdf', 'pdf', 2400000, 'demo/electrostatics.pdf', 'ready',
   'Comprehensive coverage of electrostatics including Coulomb''s law, electric fields, potential, Gauss''s law, and capacitors with dielectrics.',
   42, 6, 35),
  ('d0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Organic Chemistry — Reaction Mechanisms', 'reaction-mechanisms.pdf', 'pdf', 1800000, 'demo/reactions.pdf', 'ready',
   'Detailed exploration of organic reaction mechanisms including SN1, SN2, E1, E2 and the role of nucleophiles and electrophiles.',
   28, 2, 25),
  ('d0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Calculus — Integration', 'integration.pdf', 'pdf', 1200000, 'demo/integration.pdf', 'ready',
   'Fundamental theorem of calculus, integration techniques including substitution, parts, and partial fractions.',
   35, 3, 30)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, status = EXCLUDED.status, summary = EXCLUDED.summary,
  page_count = EXCLUDED.page_count, concept_count = EXCLUDED.concept_count, estimated_minutes = EXCLUDED.estimated_minutes;

-- Document-concept links
INSERT INTO document_concepts (document_id, concept_id, importance) VALUES
  ('d0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Capacitors'), 95),
  ('d0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Electric Field'), 90),
  ('d0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Electric Potential'), 85),
  ('d0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Coulombs Law'), 80),
  ('d0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Gauss Law'), 75),
  ('d0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Dielectrics'), 70),
  ('d0000001-0000-0000-0000-000000000002', (SELECT id FROM concepts WHERE name='Reaction Mechanisms'), 95),
  ('d0000001-0000-0000-0000-000000000002', (SELECT id FROM concepts WHERE name='Nucleophiles and Electrophiles'), 80),
  ('d0000001-0000-0000-0000-000000000003', (SELECT id FROM concepts WHERE name='Integration'), 95),
  ('d0000001-0000-0000-0000-000000000003', (SELECT id FROM concepts WHERE name='Limits'), 75),
  ('d0000001-0000-0000-0000-000000000003', (SELECT id FROM concepts WHERE name='Differential Equations'), 70)
ON CONFLICT (document_id, concept_id) DO UPDATE SET importance = EXCLUDED.importance;

-- User concepts (learner model for Alex)
INSERT INTO user_concepts (user_id, concept_id, mastery_score, attempts, correct, incorrect, average_confidence, last_practiced, trend, mistake_types) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Capacitors'), 35, 20, 7, 13, 72, now() - interval '2 hours', 'up', ARRAY['application','formula_confusion']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Electric Field'), 89, 22, 20, 2, 85, now() - interval '2 hours', 'up', ARRAY[]::text[]),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Electric Potential'), 72, 18, 13, 5, 78, now() - interval '2 hours', 'stable', ARRAY['concept_gap']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Reaction Mechanisms'), 49, 16, 8, 8, 65, now() - interval '1 day', 'down', ARRAY['application','memory_failure']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Nucleophiles and Electrophiles'), 68, 14, 10, 4, 72, now() - interval '1 day', 'up', ARRAY[]::text[]),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Integration'), 58, 19, 11, 8, 70, now() - interval '3 days', 'up', ARRAY['calculation','application']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Limits'), 92, 15, 14, 1, 88, now() - interval '3 days', 'stable', ARRAY[]::text[]),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Differential Equations'), 64, 12, 8, 4, 74, now() - interval '3 days', 'stable', ARRAY['formula_confusion']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Coulombs Law'), 85, 16, 14, 2, 82, now() - interval '5 days', 'stable', ARRAY[]::text[]),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', (SELECT id FROM concepts WHERE name='Gauss Law'), 76, 14, 11, 3, 80, now() - interval '5 days', 'up', ARRAY['concept_gap'])
ON CONFLICT (user_id, concept_id) DO UPDATE SET
  mastery_score = EXCLUDED.mastery_score, attempts = EXCLUDED.attempts, correct = EXCLUDED.correct,
  incorrect = EXCLUDED.incorrect, average_confidence = EXCLUDED.average_confidence,
  last_practiced = EXCLUDED.last_practiced, trend = EXCLUDED.trend, mistake_types = EXCLUDED.mistake_types;

-- Mastery history for progress charts
INSERT INTO mastery_history (user_id, concept_id, mastery_score, recorded_at)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, c.id, s.mastery, s.recorded_at
FROM concepts c
CROSS JOIN LATERAL (
  VALUES
    (20, now() - interval '21 days'), (25, now() - interval '14 days'), (30, now() - interval '7 days'), (35, now() - interval '2 hours')
) AS s(mastery, recorded_at)
WHERE c.name = 'Capacitors'
ON CONFLICT DO NOTHING;

INSERT INTO mastery_history (user_id, concept_id, mastery_score, recorded_at)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, c.id, s.mastery, s.recorded_at
FROM concepts c
CROSS JOIN LATERAL (
  VALUES
    (70, now() - interval '21 days'), (78, now() - interval '14 days'), (84, now() - interval '7 days'), (89, now() - interval '2 hours')
) AS s(mastery, recorded_at)
WHERE c.name = 'Electric Field'
ON CONFLICT DO NOTHING;

INSERT INTO mastery_history (user_id, concept_id, mastery_score, recorded_at)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, c.id, s.mastery, s.recorded_at
FROM concepts c
CROSS JOIN LATERAL (
  VALUES
    (55, now() - interval '21 days'), (58, now() - interval '14 days'), (52, now() - interval '7 days'), (49, now() - interval '1 day')
) AS s(mastery, recorded_at)
WHERE c.name = 'Reaction Mechanisms'
ON CONFLICT DO NOTHING;

INSERT INTO mastery_history (user_id, concept_id, mastery_score, recorded_at)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, c.id, s.mastery, s.recorded_at
FROM concepts c
CROSS JOIN LATERAL (
  VALUES
    (45, now() - interval '21 days'), (52, now() - interval '14 days'), (55, now() - interval '7 days'), (58, now() - interval '3 days')
) AS s(mastery, recorded_at)
WHERE c.name = 'Integration'
ON CONFLICT DO NOTHING;

-- Flashcard decks
INSERT INTO flashcard_decks (id, user_id, document_id, title)
VALUES
  ('f0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd0000001-0000-0000-0000-000000000001', 'Electrostatics Key Concepts'),
  ('f0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd0000001-0000-0000-0000-000000000002', 'Reaction Mechanisms')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Flashcards
INSERT INTO flashcards (deck_id, concept_id, front, back)
VALUES
  ('f0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Capacitors'), 'What is capacitance?', 'The ratio of charge stored on a conductor to the potential difference: C = Q/V, measured in Farads.'),
  ('f0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Capacitors'), 'Formula for equivalent capacitance in series?', '1/C_eq = 1/C1 + 1/C2 + ... + 1/Cn. The reciprocal of equivalent capacitance equals the sum of reciprocals.'),
  ('f0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Capacitors'), 'Formula for equivalent capacitance in parallel?', 'C_eq = C1 + C2 + ... + Cn. Equivalent capacitance is the sum of individual capacitances.'),
  ('f0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Electric Field'), 'Define electric field intensity', 'The force experienced per unit positive test charge: E = F/q, direction is that of the force on a positive charge.'),
  ('f0000001-0000-0000-0000-000000000001', (SELECT id FROM concepts WHERE name='Electric Potential'), 'What is electric potential?', 'The work done per unit charge to bring a test charge from infinity to a point: V = W/q, measured in Volts.'),
  ('f0000001-0000-0000-0000-000000000002', (SELECT id FROM concepts WHERE name='Reaction Mechanisms'), 'What is an SN2 reaction?', 'A bimolecular nucleophilic substitution with concerted bond making and breaking, showing inversion of configuration.'),
  ('f0000001-0000-0000-0000-000000000002', (SELECT id FROM concepts WHERE name='Reaction Mechanisms'), 'Difference between SN1 and SN2?', 'SN1 is unimolecular via carbocation intermediate (two steps). SN2 is concerted (one step) with backside attack.')
ON CONFLICT DO NOTHING;

-- Learning events
INSERT INTO learning_events (user_id, event_type, description, metadata)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'quiz_completed', 'Completed Electrostatics Quiz', '{"score":68,"total":10}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'quiz_completed', 'Capacitors practice', '{"score":52,"total":10}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'flashcards_reviewed', 'Reviewed 10 flashcards', '{"count":10}')
ON CONFLICT DO NOTHING;
