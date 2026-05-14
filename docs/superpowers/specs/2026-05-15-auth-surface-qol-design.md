# Auth-Surface QoL — Bezos-Lens-Audit Design

**Datum:** 2026-05-15
**Folge zu:** `2026-05-14-relaunch-design.md` (Public-Surface) und Commits `e2cdbbf` / `d468471` / `7cc2df3` (QoL-Wellen A/B/C auf Public).
**Scope:** Auth-gated Pages und Komponenten, die Mats täglich nutzt.

## 1. Kontext

Der vorherige QoL-Audit (qol-A/B/C, 2026-05-15) hat ausschließlich die Public-Marketing-Surface
behandelt. Hinter Login (`/train`, `/dashboard`, `/settings`, `/settings/data`, `/read/[bookId]`,
`/welcome`, FeedbackView, Mode-Komponenten) verbringt Mats 90 % seiner Zeit, war aber explizit
zurückgestellt. Dieses Dokument schließt die Lücke.

Audit-Methode: Code-Reading aller 5 Auth-Pages + 9 Training-Komponenten + `middleware.ts`,
`app/layout.tsx`, `/api/train/submit`-Route, `components/navigation/Navbar.tsx`, plus
empirische Live-TTFB-Messung (siehe §3.3) und Verifikation gegen `supabase/migrations/`.

## 2. Pain-Befund (verifiziert)

### 2.1 Sprach-Inkonsistenz hinter Login

Public-Pages sind seit qol-A komplett DE. Auth-Pages fallen wieder auf EN zurück:

| Surface | Befund |
|---|---|
| `app/dashboard/page.tsx` | „Welcome back!", „Chunks Studied", „Due Today", „Quick Start", „Available Books", „Practice with this Book", „Back to Home" — alles EN |
| `app/train/page.tsx` Empty-States Z. 200-241, 322-362 | „All Caught Up!", „All Texts Completed!", „Browse Books", „Go to Settings", „Add More Books" — alles EN |
| `app/train/page.tsx` Filter-Banner Z. 102-115, 180-193, 302-314 (dreimal dupliziert) | „Filtered Training", „Remove Filter", „Choose Different Book" — alles EN |
| `app/books/page.tsx` | Komplett EN — duplikatve authed Bücher-Liste |
| `app/settings/page.tsx` Z. 137 | „🔄 Spaced Repetition System (SRS)"-Header mit EN-Abkürzung im DE-Kontext |
| `app/read/[bookId]/page.tsx` Z. 8 | Title „Lesen \| Literary Forge" (alter Brand) |
| `app/settings/layout.tsx` Z. 4 | Title „Einstellungen \| Literary Forge" (alter Brand) |

### 2.2 Klick-Pfade länger als nötig

- **Dashboard → Cloze/Free trainieren:** 3 Klicks (`/dashboard` → „Start Reviews" → /train → ModeCycle → Reload). Reduzierbar auf 1 Klick.
- **Settings:** kein UI für `user_settings.default_mode`. Nur via `/train` über ModeCycleButton änderbar. SRS-Toggle ja, Mode-Picker nein.
- **`/settings/data`** (GDPR-Export/Delete) existiert, ist aber von `/settings` nicht verlinkt.
- **Settings „← Zurück"** (Z. 119-123) führt zu `/` (Landing). Für authed User natürlicher: `/dashboard`.

### 2.3 Latenz

Live-TTFB gemessen 2026-05-15, drei Runs pro URL, ohne Login-Cookie (Shell-Render vor `redirect('/login')`):

| Route | Cold | Warm |
|---|---|---|
| `/train` | 707 ms | 301–312 ms |
| `/dashboard` | 408 ms | 258–268 ms |
| `/settings` | 435 ms | 134–142 ms |

Bottlenecks im Code:
- `app/dashboard/page.tsx` macht 4 sequentielle DB-Calls (`progressData` → `calculate_user_streaks` RPC → `get_grouped_books` RPC). Parallelisierbar mit `Promise.all` → erwartete Einsparung 100–200 ms.
- `components/training/TrainingInterface.tsx` Z. 41-52: ModeCycle ruft `router.refresh()`, der den kompletten `/train`-Server-Pfad mit neuer SRS-Queue-Selection ausführt. Folge: Mode-Wechsel kann den aktuellen Chunk verschieben (UX-Falle) und kostet 300–700 ms.
- `app/settings/page.tsx` ist Client-Component mit `loadSettings()` in `useEffect` → „Lädt Einstellungen…"-Flash 200–500 ms.
- `fetch('/api/nlp/warm')` läuft nur in `FranklinRetrievalPhase` und `FreeWriting`. In `FranklinEncodingPhase` und auf `/dashboard` fehlt der Pre-Warm; Render-Cold-Start (5–30 s) kann beim ersten `/api/train/submit` voll durchschlagen.

### 2.4 Ungenutzte DB-Daten

- `streakData.longest_streak` nur als Mini-Subtext. Kein 7-Tage-Strip-Visual.
- `user_progress.difficulty` / `.stability` (FSRS-Felder) werden nirgends visualisiert.
- `author_style_profiles` (Korpus-Means/Stddevs pro Autor) werden im Score verrechnet, aber im `/train`-Header nicht sichtbar gemacht („du imitierst Kafka — avg sentence length 18").
- `user_hints.hints` (Franklin-Encoding-Hints) sind retrospektiv nicht abrufbar.
- Pro Autor: `chunk_count` vorhanden, **trainierte Chunks pro Autor** nicht ausgewiesen.

### 2.5 Sonstige Code-Pains

- `components/training/modes/ClozeDeletion.tsx` ist 51-Zeilen-Skeleton („in Arbeit") — der `ModeCycleButton` cycelt aber durch Cloze als ob es funktional wäre. Klick führt in Dead-End: einziger Ausweg „Modus in Settings ändern", aber Settings hat keinen Mode-Picker (zirkulär).
- `app/welcome/page.tsx` Z. 29-30: `catch {}` ohne UI-Feedback bei DB-Fail.
- `app/dashboard/loading.tsx` zeigt 3 Stat-Cards, `app/dashboard/page.tsx` rendert 4 → visueller Sprung beim Skeleton-Swap.
- `app/books/page.tsx` (211 LOC) ist fast 1:1-Kopie der Bücherliste in `app/dashboard/page.tsx`. Nirgends in Navbar verlinkt. Reine Duplikation.

## 3. Entscheidungen (getroffen 2026-05-15)

Beim Audit-Approval von Mats festgelegt:

| Entscheidung | Wahl |
|---|---|
| Cloze-Mode in ModeCycle | drin behalten, mit deutlicherem „in Arbeit"-Banner |
| `app/books/page.tsx` | löschen, alle 7 Link-Verweise auf `/dashboard` umrouten |
| Mode-Picker | beide Stellen bauen (Settings als Defaults-Home + Dashboard-Quick-Start für direkten Modus-Einstieg) |
| Single-Write-Path | beide UIs nutzen existierende `POST /api/user/mode` → strukturell synchronisiert |
| Sprache | DE überall hinter Login (Brand-Konsistenz mit Public-Pages) |

## 4. Non-Goals (explizit ausgeschlossen)

- Neue Mode-Levels oder „Schwierigkeitsstufen" (Memory: vom User abgelehnt)
- i18n / EN-Translations (Memory: abgewählt)
- Cloze-Funktionsausbau (späterer Sub-Sprint)
- Sentry / AWS-Cleanup (User-Hand)
- Domain-Migration (Brand bleibt `literary-forge.vercel.app`)

## 5. Wellen-Plan

Pattern wie qol-A/B/C: drei Wellen, ein Commit pro Welle, Live-Verify pro Welle, Push am Ende.

### Welle qol-D — Konsistenz (Stabilität)

**Dateien:**
- `app/train/page.tsx` — Empty-States DE, Filter-Banner DE, `/books` → `/dashboard`
- `app/dashboard/page.tsx` — alle Labels/Buttons/Texte DE
- `app/books/page.tsx` — löschen
- `app/books/loading.tsx` — löschen
- `app/read/[bookId]/page.tsx` — Title-Tag „The Franklin Method", `/books` → `/dashboard`
- `app/settings/layout.tsx` — Title-Tag „The Franklin Method"
- `app/settings/page.tsx` — Mode-Picker (3 Buttons Franklin/Cloze/Free) + `/settings/data`-Link + „Zurück" zu `/dashboard` + SRS-Header DE
- `components/training/modes/ClozeDeletion.tsx` — klarerer „in Arbeit"-Banner mit „Modus wechseln"-Button direkt rein (statt nach Settings)

**Akzeptanz:**
- `grep -rn '"/books"' app/ components/` → 0 Treffer
- `grep -in 'all caught up\|all texts completed\|browse books' app/` → 0 Treffer
- Settings-Page hat sichtbaren Mode-Picker (3 Buttons) und Link „Daten exportieren / löschen"
- ModeCycle auf Cloze landet nicht mehr in „Settings ändern"-Dead-End

### Welle qol-E — Insights (ungenutzte DB-Daten)

**Dateien:**
- `app/dashboard/page.tsx` — 3-Mode-Quick-Start (Franklin/Cloze/Free Direct-Buttons) + 7-Tage-Streak-Strip + pro Autor-Karte „X/Y trainiert"-Progress
- `lib/utils/books.ts` (oder neu `lib/dashboard/author-progress.ts`) — Helper zum Aggregieren von „trainierte Chunks pro Autor"
- `components/training/modes/FranklinEncodingPhase.tsx` — wenn schon Hints existieren: „alte Hints ansehen"-Toggle
- `components/training/FeedbackView.tsx` — Verlaufs-Mini-Chart der letzten 5 Versuche dieses Chunks (aus `review_history`)
- `app/train/page.tsx` ODER `components/training/TrainingInterface.tsx` — Autor-Header mit Korpus-Means im Training-Kontext

**Akzeptanz:**
- Dashboard zeigt 3 direkte Mode-Start-Buttons statt nur einen
- Dashboard zeigt Streak-Visual über letzte 7 Tage
- Jede Autor/Buch-Karte zeigt einen Fortschrittsbalken
- FranklinEncoding bietet History-Toggle wenn Hints vorhanden
- FeedbackView zeigt Verlaufs-Chart der letzten ≤5 Versuche

### Welle qol-F — Latenz (Perf)

**Dateien:**
- `app/dashboard/page.tsx` — `Promise.all` für `progressData` + `streakData` + `books`
- `app/dashboard/loading.tsx` — 4 Skeleton-Stat-Cards statt 3
- `components/training/TrainingInterface.tsx` — ModeCycle: kein `router.refresh()`, nur Local-State + Persist; Chunk-Wechsel nur explizit über „nächste Karte"
- `app/settings/page.tsx` — Umbau zu Server-Component (Auth-Check serverseitig, kein „Lädt…"-Flash)
- `components/training/modes/FranklinEncodingPhase.tsx` — `fetch('/api/nlp/warm')` ergänzen
- `app/dashboard/page.tsx` — `fetch('/api/nlp/warm')`-Call (Hintergrund) ergänzen, damit Train-Klick auf heißem NLP landet

**Akzeptanz:**
- Live-TTFB `/dashboard` warm < 200 ms (Vorher: 258 ms; Reduktion durch Parallelisierung erwartet)
- Live-TTFB `/settings` warm < 150 ms (vergleichbar zu heute, aber kein clientseitiger Flash-Frame)
- ModeCycle wechselt nicht mehr den aktuellen Chunk
- `app/dashboard/loading.tsx`-Skeleton matcht die echte Render (4 Cards)

## 6. Daten- und Schema-Impact

- **Keine Migrations** in Welle D/E/F. Alle Reads über bestehende Tables/RPCs (`user_progress`, `user_settings`, `user_hints`, `review_history`, `author_style_profiles`, `calculate_user_streaks`, `get_grouped_books`).
- **Keine neuen Endpoints.** Mode-Persistenz nutzt existierende `POST /api/user/mode`.

## 7. Live-Verify pro Welle

Nach jedem Commit + Vercel-Auto-Deploy:

```
for url in / /train /dashboard /settings; do
  for i in 1 2 3; do
    curl -s -o /dev/null -w "$url run$i: ttfb=%{time_starttransfer}s cache=%header{x-vercel-cache} status=%{http_code}\n" \
      "https://literary-forge.vercel.app$url"
  done
done
```

Plus `grep`-Checks für die jeweiligen Akzeptanz-Bedingungen im Code.

## 8. Rollback-Strategie

Pro Welle ein eigener Commit → `git revert <sha>` rollt nur diese Welle zurück.
Falls eine Welle Brand- oder Mode-Invarianten verletzt (Memory: drei Modi, Brand „The Franklin Method", URL bleibt), sofortiger Revert ohne weitere Diskussion.

## 9. Was bewusst NICHT gemacht wird in diesen Wellen

- Cloze-Funktionsimplementierung (eigener Sub-Sprint, später)
- FSRS-Tuning (Library-Defaults laufen, kein Sample)
- Test-Suite-Aufbau (Self-Use-Projekt, kein CI-Bedarf)
- Performance-Optimierungen jenseits der genannten (z. B. ISR auf Per-User-Pages — nicht sinnvoll)

## 10. Erfolgskriterium

Nach Welle F:
- Keine EN-Inkonsistenz mehr in Auth-Surface (grep-verifiziert)
- Keine Dead-Links auf gelöschte Routen
- Mode-Picker zentral in Settings + Direkt-Start im Dashboard
- Dashboard-TTFB warm < 200 ms
- ModeCycle wechselt keinen Chunk mehr ungewollt
- Mindestens drei neue Insights aus DB-Daten sichtbar (Streak-Strip, Pro-Autor-Progress, Hint-History)
