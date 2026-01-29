# Literary Forge

KI-gestütztes Training für stilistische Mimesis durch Spaced Repetition und linguistische Analyse.

## 🎯 Überblick

Literary Forge ist eine vollständig serverlose Web-Anwendung, die es Nutzern ermöglicht, die Schreibstile großer Autoren zu erlernen. Durch eine Kombination aus:

- **Spaced Repetition (SM-2 Algorithmus)** für langfristiges Lernen
- **Clientseitige NLP-Analyse** (UDPipe, Transformers.js)
- **KI-Feedback** via Claude 3.5 Haiku
- **0€ Fixkosten** dank Vercel & Supabase Free Tier

## 🏗️ Architektur

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + pgvector + Auth)
- **LLM**: Claude 3.5 Haiku via **AWS Bedrock** (nicht direkte Anthropic API)
- **NLP**: Mock-Implementierung (später: UDPipe WASM + Transformers.js)
- **State Management**: Zustand mit localStorage-Persistenz

### Besonderheiten
- **Edge Runtime** für API-Routes (maximale Performance)
- **Rate Limiting** über PostgreSQL (Token-Bucket-Algorithmus)
- **Client-Side Computing** für NLP (keine Serverkosten)
- **Local-First** Datenarchitektur (IndexedDB/localStorage)

## 📋 Setup-Anleitung

### 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein kostenloses Konto
2. Erstelle ein neues Projekt:
   - **Name**: `literary-forge`
   - **Database Password**: Generiere ein sicheres Passwort (speichern!)
   - **Region**: Europe West (Frankfurt)
3. Warte ca. 2 Minuten bis das Projekt bereit ist

### 2. pgvector Extension aktivieren

1. Gehe im Supabase Dashboard zu: **Database → Extensions**
2. Suche nach "vector"
3. Klicke auf **Enable** bei `vector`

### 3. Datenbank-Schema erstellen

1. Gehe zu: **SQL Editor**
2. Öffne die Datei `supabase/migrations/001_initial_schema.sql` in deinem Projekt
3. Kopiere den kompletten SQL-Code
4. Füge ihn im SQL Editor ein und klicke **RUN**

Das Schema erstellt:
- `source_texts` - Die Lerntexte mit Embeddings
- `user_progress` - SRS-Status für jeden Nutzer
- `user_quotas` / `ip_quotas` - Rate Limiting
- `check_and_consume_quota()` - RPC-Funktion für sichere Quotenverwaltung

### 4. API-Credentials extrahieren

1. Gehe zu: **Settings → API**
2. Kopiere folgende Werte:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** → `SUPABASE_SECRET_KEY` ⚠️ GEHEIM!

### 5. AWS Bedrock Credentials (statt direkter Anthropic API)

⚠️ **Wichtig**: Dieses Projekt nutzt AWS Bedrock statt der direkten Anthropic API!

1. Stelle sicher, dass du AWS Bedrock Zugriff auf Claude 3.5 Haiku hast
2. Besorge deine AWS IAM Credentials (Access Key ID + Secret Access Key)
3. Wähle die Region (empfohlen: `us-east-1`)

### 6. Umgebungsvariablen konfigurieren

Öffne `.env.local` und fülle alle Werte aus:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
SUPABASE_SECRET_KEY=eyJhbGc...

# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Bedrock Modell-ID für Claude 3.5 Haiku
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-haiku-20241022-v1:0

# Rate Limiting Configuration
MAX_DAILY_ANALYSES_PER_USER=5
```

### 7. Development Server starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

### 8. Content Import (Optional)

Um Bücher in die Datenbank zu importieren:

1. Navigiere zu `/login` und erstelle einen Account
2. Gehe zu `/admin/ingest` (oder klicke "📚 Admin Import" auf der Startseite)
3. Wähle eine `.txt` Datei (siehe `test-books/` für Beispiele)
4. Fülle Titel und Autor aus
5. Klicke "Analysieren" und dann "Speichern"

**Detaillierte Anleitung**: Siehe [BOOK_IMPORT_GUIDE.md](BOOK_IMPORT_GUIDE.md)

**Wichtig**: Das Import-System nutzt dieselbe NLP-Pipeline (UDPipe + Transformers.js) wie das Training, um wissenschaftliche Konsistenz der Stilmetriken zu garantieren.

## 📁 Projektstruktur

```
literary-forge/
├── app/
│   ├── page.tsx                    # Landing Page
│   ├── layout.tsx                  # Root Layout
│   └── api/
│       └── analyze/route.ts        # LLM Edge Function
├── components/
│   └── editor/
│       └── ZenEditor.tsx           # Typewriter-Editor
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase Client
│   │   ├── server.ts               # Server Supabase Client
│   │   └── types.ts                # TypeScript Types
│   ├── nlp/
│   │   ├── parsing.ts              # UDPipe Parser (Mock)
│   │   ├── embeddings.ts           # Embedding Generator (Mock)
│   │   └── metrics.ts              # Stylometrische Berechnungen
│   └── srs/
│       └── sm2.ts                  # SM-2 Algorithmus
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Datenbank-Schema
```

## 🔒 Sicherheit

- **Row Level Security (RLS)** auf allen Tabellen
- **Rate Limiting** via PostgreSQL mit `SECURITY DEFINER` und fixed `search_path`
- **Edge-Only API Calls** - kein direkter Client-Zugriff auf RPC
- **IP-Extraktion** mit CSV-Handling für `x-forwarded-for`

## 💰 Kostenstruktur (Free Tier)

### Limits
- **Vercel**: 100 GB Bandwidth, 100 GB-Hours Edge
- **Supabase**: 500 MB Datenbank, 2 GB Egress/Monat
- **Anthropic**: Pay-as-you-go

### Bei 100 aktiven Usern/Tag
- **Vercel**: 0€ (innerhalb Free Tier)
- **Supabase**: 0€ (Local-First hält DB klein)
- **AWS Bedrock**: ~10-15€/Monat (5 Analysen/User × Claude 3.5 Haiku Preise auf Bedrock)

**Skalierung**: Serverkosten wachsen nicht mit Nutzern, da NLP-Arbeit auf Clients läuft!

## 🚀 Deployment

### Vercel (empfohlen)

```bash
# Mit Vercel CLI
vercel

# Oder via GitHub Integration
git push origin main
```

Vergiss nicht die Environment Variables im Vercel Dashboard zu setzen!

## 🛣️ Roadmap

### Phase 1: Foundation (✅ Erledigt)
- [x] Next.js Setup mit TypeScript & Tailwind
- [x] Supabase Integration
- [x] NLP Mock-Implementierung
- [x] API Route für LLM
- [x] Zen Editor Component

### Phase 2: Echte NLP Integration
- [ ] Transformers.js für Embeddings
- [ ] UDPipe WASM für Dependency Parsing
- [ ] Web Worker für Threading

### Phase 3: UI/UX
- [ ] Diff-Visualisierung (Phase 2 Feedback)
- [ ] Dashboard für SRS-Fortschritt
- [ ] Onboarding-Flow
- [ ] Auth (Email/Password + Anonym)

### Phase 4: Content & Production
- [ ] Erste 10-20 Source Texts laden
- [ ] Production Deployment
- [ ] Domain Setup

## 📚 Technische Details

### Stilmetriken (Vektor B)
- **Dependency Distance**: Mittlere Distanz zwischen abhängigen Wörtern
- **Adjektiv/Verb-Ratio**: Verhältnis von Adjektiven zu Verben
- **Satzlängenvarianz**: Standardabweichung der Wortanzahl pro Satz

### Spaced Repetition (SM-2)
- **Fuzzy Grading**: Levenshtein-Distanz statt manueller Bewertung
- **Intervalle**: 1 Tag → 6 Tage → n × EF-Faktor
- **Easiness Factor**: 1.3 - 2.5 (dynamisch angepasst)

### Rate Limiting
- **Authenticated Users**: 5 LLM-Calls/Tag
- **Anonymous Users**: 3 LLM-Calls/Tag (IP-basiert)
- **Reset**: Täglich um Mitternacht (UTC)

## 🤝 Contributing

Aktuell ist dies ein privates Projekt. Bei Interesse an Zusammenarbeit bitte Kontakt aufnehmen.

## 📄 Lizenz

Noch nicht festgelegt.

## 🙏 Danksagungen

- AWS Bedrock für Claude 3.5 Haiku Zugang
- Anthropic für das Claude-Modell
- Vercel für generous Free Tier
- Supabase für PostgreSQL + pgvector
- Universal Dependencies für UDPipe

---

**Status**: 🚧 In Entwicklung - Phase 1 abgeschlossen
