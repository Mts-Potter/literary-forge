# Literary Forge

Schreibstil-Training auf Basis der Benjamin-Franklin-Methode mit Spaced Repetition, echter stilometrischer Analyse und LLM-Feedback.

**Live:** https://literary-forge.vercel.app

## Tech-Stack

| Schicht | Wahl | Begründung |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind | – |
| Auth + DB | Supabase (Postgres + pgvector) | Free-Tier |
| LLM | Google Gemini 3.1 Flash-Lite | $0.25 / $1.50 per 1M Tokens, kein Fixkosten |
| NLP | spaCy auf Render (Python+Flask, Microservice) | echte Stilometrie statt Browser-Mock |
| Embeddings | Transformers.js (`Xenova/paraphrase-multilingual-MiniLM-L12-v2`) | clientseitig, mehrsprachig |
| Scheduling | ts-fsrs (FSRS-V5) | wissenschaftlich validiert |
| Hosting | Vercel | Free-Tier |
| Mail | Resend | Free-Tier |

## Lernmodi

Drei parallele Übungsarten, FSRS schedult über alle drei:

1. **Franklin-Loop** — Encoding (Lesen + Hint-Extraktion) → Inkubation → Retrieval (Rekonstruktion + Diff-View)
2. **Cloze-Deletion** — vier Stufen (Funktionswörter → Verben → Adjektive → Satzgerüst)
3. **Free-Writing** — Original-Lesephase mit Stilmarker, dann eigene Imitation mit Stilmetrik-Feedback

## Scoring

Primär deterministisch: 20 Stilfeatures pro Chunk (TTR, MTLD, Hapax-Ratio, Satzlängenvarianz, Punktuation, Funktionswort-Verteilung, POS-Ratios, Tempusverteilung, Komposita-Häufigkeit, Direkte-Rede-Anteil etc.), aggregiert zu Autor-Profilen (Mittel + Standardabweichung). User-Text bekommt `style_distance` als mittleren z-Score über alle Features (Burrows'-Δ-Variante), gemappt auf 0-100. LLM nur als qualitative Erklärung obendrauf, nicht als primärer Score.

## Setup

### 1. Supabase

```bash
# Im Dashboard:
# - Neues Projekt erstellen, EU-Frankfurt-Region
# - Database → Extensions → "vector" aktivieren
# - SQL Editor: supabase/migrations/*.sql in numerischer Reihenfolge ausführen
```

### 2. NLP-Microservice (Render)

```bash
cd nlp-service
# Siehe nlp-service/README.md
# Free-Web-Service auf Render, Python 3.12, spaCy de_core_news_sm + en_core_web_sm
```

### 3. Gemini API

```bash
# https://aistudio.google.com/app/apikey
# In .env.local: GEMINI_API_KEY=...
```

### 4. Lokal starten

```bash
cp .env.local.example .env.local  # ausfüllen
npm install
npm run dev
```

## Projektstruktur

```
literary-forge/
├── app/
│   ├── api/
│   │   ├── analyze/             # LLM Style-Analyse (Edge)
│   │   ├── generate-scene-description/  # Plot-Summary via Gemini
│   │   ├── nlp/warm/            # Pre-Warm Render-Service
│   │   └── train/submit/        # Hauptpfad: NLP + Style-Distance + LLM + FSRS-Persist
│   ├── train/page.tsx           # Mode-Dispatcher
│   ├── read/[bookId]/page.tsx   # Lesemodus
│   ├── welcome/page.tsx         # Onboarding (Modus-Wahl)
│   └── settings/data/page.tsx   # GDPR Export/Delete
├── components/
│   └── training/
│       ├── modes/               # Franklin/Cloze/FreeWriting
│       └── shared/              # DiffView, StyleMarkerOverlay
├── lib/
│   ├── llm/gemini.ts            # Gemini-Wrapper
│   ├── nlp/
│   │   ├── parser-client.ts     # Render-spaCy-Client (server-side)
│   │   └── author-profile.ts    # Autor-Stilprofile laden
│   ├── scoring/
│   │   └── style-distance.ts    # Burrows'-Δ-Variante
│   └── srs/fsrs.ts              # ts-fsrs-Wrapper
├── nlp-service/                 # Eigenständiger Python+spaCy-Service für Render
├── scripts/
│   └── reprocess_chunks.py      # Lokales Re-Processing (~12.540 Chunks)
└── supabase/migrations/         # 001-021
```

## Reprocessing

Bei NLP-Pipeline-Änderungen alle Chunks neu mit aktuellem spaCy-Modell rechnen:

```bash
pip install spacy supabase python-dotenv
python -m spacy download de_core_news_sm
python -m spacy download en_core_web_sm

python scripts/reprocess_chunks.py                 # alle Chunks + Autor-Profile
python scripts/reprocess_chunks.py --profiles-only # nur Profile recomputen
python scripts/reprocess_chunks.py --ids id1,id2   # einzelne Chunks
python scripts/reprocess_chunks.py --dry-run       # ohne DB-Write
```

## Kostenstruktur

- Vercel Hobby: 0 €
- Supabase Free: 0 € (Keep-Alive-Cron schützt gegen 7-Tage-Pause)
- Render Free Web Service: 0 € (15-min Idle-Sleep, Pre-Warm bei Page-Load)
- Gemini Tier 1: Pay-per-Use, erwartet < 10 €/Monat bei Self-Use
- Resend Free: 0 €

## Sicherheit

- RLS auf allen Tabellen (Migrations 002, 005, 014, 021)
- Rate Limiting via `check_and_consume_quota` RPC (Migrations 001, 019)
- CSP-Header + Zod-Validation (Migration 013, Phase-Hardening)
- NLP-Microservice mit `NLP_SHARED_SECRET` geschützt
- GDPR-Endpoints (Migration 020) + UI in `/settings/data`

## Renovierungs-Stand (Mai 2026)

Detaillierter Plan: `~/.claude/plans/enumerated-crafting-pnueli.md`.

| Phase | Stand |
|---|---|
| 0 Stabilisierung | ✅ |
| 1 Gemini-Migration | ✅ |
| 2 Echte NLP-Pipeline | ✅ (12 540 Chunks reprocessed Mai 2026) |
| 3 Score-System | ✅ |
| 4 Multi-Mode | ✅ |
| 5 FSRS-Echtbetrieb | ✅ |
| 6 i18n / Theme / Login-Redesign | ⏳ offen |
| 7 Sentry / AWS-Cleanup | ⏳ teils |
| 8 lucide-Icons / EN-Rechtsseiten | ⏳ offen |

## Lizenz

Privates Projekt — nicht festgelegt.
