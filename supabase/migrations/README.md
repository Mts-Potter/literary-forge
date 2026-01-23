# Supabase Migrations

Dieses Verzeichnis enthält alle Datenbank-Migrationen für Literary Forge.

## Migrations ausführen

### 1. Initial Schema (`001_initial_schema.sql`)

Erstellt die Grundstruktur der Datenbank:
- `source_texts` - Lerntexte mit Embeddings
- `user_progress` - SRS-Status für jeden User
- `user_quotas` / `ip_quotas` - Rate Limiting
- RLS Policies
- `check_and_consume_quota()` RPC Function

**Ausführung**:
1. Öffne Supabase Dashboard → SQL Editor
2. Kopiere den kompletten Inhalt von `001_initial_schema.sql`
3. Füge ihn ein und klicke **RUN**

### 2. Admin RLS Policy (`002_admin_rls_policy.sql`)

Ermöglicht authentifizierten Admins das Importieren von Büchern ohne `service_role` Key im Frontend.

**Ausführung**:
1. Öffne Supabase Dashboard → SQL Editor
2. Kopiere den kompletten Inhalt von `002_admin_rls_policy.sql`
3. Füge ihn ein und klicke **RUN**

**Admin-User hinzufügen**:

Nach der Migration musst du dich selbst zum Admin machen:

```sql
-- 1. Finde deine User-ID
SELECT id, email FROM auth.users WHERE email = 'DEINE_EMAIL@EXAMPLE.COM';

-- 2. Füge dich zur admin_users Tabelle hinzu
INSERT INTO admin_users (user_id)
VALUES ('PASTE_USER_ID_HERE');

-- 3. Verifiziere
SELECT * FROM admin_users;
```

**Alternativ (schneller)**:

```sql
-- Füge den User direkt über Email hinzu
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'DEINE_EMAIL@EXAMPLE.COM'
ON CONFLICT (user_id) DO NOTHING;
```

### 3. Enhanced Metadata (`003_enhanced_metadata.sql`)

Erweitert das Schema um Autor-Normalisierung, Compliance-Tracking und pädagogische Metadaten.

**Was wird hinzugefügt**:
- **`authors` Tabelle**: Normalisierte Autor-Daten (Name, Geburt, Tod, Nationalität, Wikidata-ID)
- **Compliance-Felder**: `is_pd_us`, `is_pd_eu`, `rights_details` für Copyright-Status
- **Pädagogische Metadaten**: `cefr_level`, `lexile_score`, `estimated_reading_time_minutes`
- **Bibliografische Daten**: `publication_year`, `source_url`, `cover_image_url`
- **Tags**: Array-Feld für Genre/Kategorie-Tags mit GIN-Index

**Ausführung**:
1. Öffne Supabase Dashboard → SQL Editor
2. Kopiere den kompletten Inhalt von `003_enhanced_metadata.sql`
3. Füge ihn ein und klicke **RUN**

**Daten-Migration**: Die Migration erstellt automatisch einen "Unbekannt"-Autor für bestehende Einträge.

#### Autoren hinzufügen (Beispiel)

```sql
-- Kafka
INSERT INTO authors (name, birth_year, death_year, nationality, wikidata_id)
VALUES ('Kafka, Franz', 1883, 1924, 'Österreich-Ungarn', 'Q905')
RETURNING id;

-- Thomas Mann (seit 2026 PD in DE!)
INSERT INTO authors (name, birth_year, death_year, nationality, wikidata_id)
VALUES ('Mann, Thomas', 1875, 1955, 'Deutschland', 'Q37030')
RETURNING id;

-- Schnitzler
INSERT INTO authors (name, birth_year, death_year, nationality, wikidata_id)
VALUES ('Schnitzler, Arthur', 1862, 1931, 'Österreich', 'Q44331')
RETURNING id;
```

#### Beispiel: Buch mit neuen Feldern einfügen

```sql
-- Annahme: Kafka author_id = 'abc-123...'
INSERT INTO source_texts (
  title, author_id, content, language, difficulty_level,
  publication_year, original_language, source_url,
  is_pd_us, is_pd_eu, rights_details,
  cefr_level, estimated_reading_time_minutes, tags
) VALUES (
  'Die Verwandlung',
  'abc-123...', -- Kafka ID von oben
  '[FULL TEXT]',
  'de', 4, 1915, 'de',
  'https://www.gutenberg.org/ebooks/5200',
  true, -- PD in USA (vor 1931)
  true, -- PD in EU (Kafka starb 1924)
  '{"verification_date": "2026-01-21", "us_rationale": "published_1915", "eu_rationale": "author_died_1924"}'::jsonb,
  'B2', -- CEFR-Level
  90, -- Geschätzte Lesezeit in Minuten
  ARRAY['Novelle', 'Existenzialismus', 'Moderne', 'Klassiker']
);
```

#### Nützliche Queries mit neuen Feldern

```sql
-- Zeige alle Bücher, die global sicher sind (US + EU)
SELECT title, a.name as author
FROM source_texts st
JOIN authors a ON st.author_id = a.id
WHERE is_pd_us = true AND is_pd_eu = true;

-- Zeige alle C1-Texte mit Tag 'Moderne'
SELECT title, cefr_level, tags
FROM source_texts
WHERE cefr_level = 'C1' AND tags @> ARRAY['Moderne'];

-- Zeige alle Werke von Thomas Mann
SELECT st.title, st.publication_year, st.cefr_level
FROM source_texts st
JOIN authors a ON st.author_id = a.id
WHERE a.name = 'Mann, Thomas';
```

### 4. Seed Test Books (`004_seed_test_books.sql`)

Seeds drei Test-Bücher mit vollständigen Metadaten zur Validierung der Phase 2 Architektur.

**Was wird eingefügt**:
- **3 Autoren**: Kafka, Schnitzler, Mann (mit Wikidata-IDs)
- **3 Test-Bücher**:
  - Die Verwandlung (Kafka, 1915) - B2, 90 Min
  - Traumnovelle (Schnitzler, 1926) - B2, 120 Min
  - Buddenbrooks (Mann, 1901) - C1, 600 Min ⚡ 2026 Edge Case

**Ausführung**:
1. Stelle sicher, dass Migration 003 bereits ausgeführt wurde
2. Öffne Supabase Dashboard → SQL Editor
3. Kopiere den kompletten Inhalt von `004_seed_test_books.sql`
4. Füge ihn ein und klicke **RUN**

**Wichtig**: Die `content`-Felder enthalten Platzhalter. Nach der Migration:
1. Lade Volltexte von Project Gutenberg herunter
2. Ersetze Platzhalter mit echtem Content via UPDATE-Query
3. Führe Book Import Processing aus (UDPipe + Embeddings)

**Verifikation**:
```sql
-- Zeige alle Test-Bücher mit Compliance-Status
SELECT
  st.title,
  a.name AS author,
  st.publication_year,
  st.is_pd_us,
  st.is_pd_eu,
  st.cefr_level,
  st.estimated_reading_time_minutes,
  st.tags
FROM source_texts st
JOIN authors a ON st.author_id = a.id
WHERE st.id IN (
  '650e8400-e29b-41d4-a716-446655440001', -- Die Verwandlung
  '650e8400-e29b-41d4-a716-446655440002', -- Traumnovelle
  '650e8400-e29b-41d4-a716-446655440003'  -- Buddenbrooks
)
ORDER BY st.publication_year;

-- Test der Helper Function
SELECT
  title,
  is_book_safe_for_region(id, 'GLOBAL') AS globally_safe
FROM source_texts
WHERE author_id = '550e8400-e29b-41d4-a716-446655440003'; -- Thomas Mann
```

## Migration Status überprüfen

Um zu prüfen, welche Tabellen existieren:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Um zu prüfen, ob du Admin bist:

```sql
SELECT is_admin(); -- Returns true/false
```

## Rollback (falls nötig)

Falls eine Migration fehlschlägt oder rückgängig gemacht werden muss:

### Admin RLS Policy entfernen:

```sql
-- Policy entfernen
DROP POLICY IF EXISTS "authenticated_admins_can_insert_texts" ON source_texts;

-- Function entfernen
DROP FUNCTION IF EXISTS is_admin(UUID);

-- Tabelle entfernen
DROP TABLE IF EXISTS admin_users CASCADE;
```

## Troubleshooting

### Fehler: "permission denied for table admin_users"

**Problem**: RLS ist aktiviert, aber du hast keine Policy.

**Lösung**: Füge dich als Admin hinzu (siehe oben) oder deaktiviere temporär RLS:

```sql
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
-- Füge Admin hinzu
INSERT INTO admin_users (user_id) VALUES ('YOUR_ID');
-- Re-aktiviere RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

### Fehler: "duplicate key value violates unique constraint"

**Problem**: Du versuchst denselben User zweimal hinzuzufügen.

**Lösung**: Verwende `ON CONFLICT DO NOTHING`:

```sql
INSERT INTO admin_users (user_id)
VALUES ('YOUR_ID')
ON CONFLICT (user_id) DO NOTHING;
```

### Import funktioniert nicht trotz Admin-Rolle

**Problem**: Policy ist nicht aktiv oder User ist nicht authentifiziert.

**Verifizierung**:

```sql
-- 1. Prüfe, ob User Admin ist
SELECT is_admin();

-- 2. Prüfe, ob Policy existiert
SELECT policyname, tablename
FROM pg_policies
WHERE tablename = 'source_texts';

-- 3. Prüfe aktuelle User-ID
SELECT auth.uid();
```

## Best Practices

1. **Backup vor Migrations**: Erstelle immer ein Backup vor größeren Änderungen
2. **Test in Dev**: Teste Migrations erst in einem Dev-Projekt
3. **Atomic Operations**: Jede Migration sollte atomar sein (entweder komplett erfolgreich oder gar nicht)
4. **Dokumentation**: Dokumentiere jede Migration im SQL-Kommentar

## Migration-Naming Convention

```
XXX_descriptive_name.sql
```

- `XXX` = Sequenz-Nummer (3-stellig, z.B. 001, 002)
- `descriptive_name` = Kurze Beschreibung (snake_case)

Beispiele:
- `001_initial_schema.sql`
- `002_admin_rls_policy.sql`
- `003_add_analytics_tables.sql`
