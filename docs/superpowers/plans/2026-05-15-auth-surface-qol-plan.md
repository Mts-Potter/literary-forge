# Auth-Surface QoL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution. Steps use checkbox (`- [ ]`) syntax for tracking. **No TDD** — Projekt-Konvention ist Live-Verify per `tsc`/`grep`/`curl` analog Wellen qol-A/B/C. Ein Commit pro Welle, nicht pro Task.

**Goal:** Auth-Surface (5 Pages + Mode-Komponenten) gegen Bezos-Lens-Pains konsolidieren: Sprach-Inkonsistenzen, Klick-Latenz, ungenutzte DB-Daten, Default-Smarts.

**Architecture:** Drei sequentielle Wellen wie qol-A/B/C: D = Konsistenz, E = Insights aus DB-Daten, F = Latenz-Reduktion. Keine neuen Migrations, keine neuen Endpoints. Single-Write-Path für Mode-Default via existierender `POST /api/user/mode`.

**Tech Stack:** Next.js 16.1 App Router · TypeScript · Tailwind v4 · Supabase Postgres · Existierende RPCs (`get_grouped_books`, `calculate_user_streaks`).

**Spec:** `docs/superpowers/specs/2026-05-15-auth-surface-qol-design.md`

---

## Welle qol-D — Konsistenz

### Task D1: `/books` löschen, alle 7 Links auf `/dashboard` umrouten

**Files:**
- Delete: `app/books/page.tsx`
- Delete: `app/books/loading.tsx`
- Modify: `app/train/page.tsx` (5 Stellen: Z. 111, 189, 218, 311, 339)
- Modify: `app/read/[bookId]/page.tsx` (2 Stellen: Z. 45, 59)

- [ ] **Step 1: Verifizieren dass `/books` nicht in Navbar referenziert ist**

Run: `grep -rn '"/books"\|href="/books"\|href={`books' app/ components/`
Expected: nur die 7 bekannten Treffer in `/train` und `/read/[bookId]`.

- [ ] **Step 2: Verzeichnis löschen**

Run: `rm -rf app/books/`

- [ ] **Step 3: `/train`-Page Links ersetzen**

In `app/train/page.tsx`, alle 5 Vorkommen von `href="/books"` und `href="/books"` durch `href="/dashboard"` ersetzen.

- [ ] **Step 4: `/read/[bookId]`-Page Links ersetzen**

In `app/read/[bookId]/page.tsx`, beide `href="/books"` durch `href="/dashboard"` ersetzen. Linktext „Zurück zur Bibliothek" → „Zurück zum Dashboard".

- [ ] **Step 5: Grep-Verifikation**

Run: `grep -rn '"/books"' app/ components/`
Expected: 0 Treffer.

### Task D2: `/train` Empty-States nach DE übersetzen

**Files:**
- Modify: `app/train/page.tsx` (Empty-State Z. 200-241, Empty-State Z. 322-362, Filter-Banner 3× Z. 102-115 / 180-193 / 302-314)

- [ ] **Step 1: Erster Empty-State („All Caught Up!") komplett DE**

Ersetze Block Z. 200-241:
- Headline „All Caught Up!" → „Alles abgearbeitet!"
- Subline „No reviews due right now…" → „Aktuell keine Wiederholungen fällig. Stark — komm später wieder oder füge mehr Bücher hinzu."
- Tip „💡 Tip: You can also enable Linear Mode in settings…" → „💡 Tipp: Du kannst in den Einstellungen auch den linearen Modus aktivieren, um Texte ohne Wiederholungs-Plan durchzugehen."
- Buttons: „📚 Browse Books" → „📚 Bücher durchstöbern"; „Go to Settings" → „Einstellungen"; „Add More Books" → „Mehr Bücher hinzufügen"

- [ ] **Step 2: Zweiter Empty-State („All Texts Completed!") komplett DE**

Ersetze Block Z. 322-362 analog:
- „All Texts Completed!" → „Alle Texte durch!"
- „You've seen all available texts in linear mode." → „Du hast im linearen Modus alle Texte gesehen."
- Tip „💡 Tip: Enable Spaced Repetition…" → „💡 Tipp: Schalte in den Einstellungen Spaced Repetition ein, damit Texte basierend auf deinem Lernstand wiederkehren."
- Buttons analog Step 1.

- [ ] **Step 3: Filter-Banner 3× nach DE übersetzen**

Ersetze in allen drei Vorkommen (Z. 102-115, 180-193, 302-314):
- „📚 Filtered Training:" → „📚 Gefiltertes Training:"
- „Remove Filter" → „Filter entfernen"
- „Choose Different Book" → „Anderes Buch wählen"

- [ ] **Step 4: Grep-Verifikation**

Run: `grep -in 'all caught up\|all texts completed\|browse books\|filtered training' app/train/page.tsx`
Expected: 0 Treffer.

### Task D3: `/dashboard` komplett DE

**Files:**
- Modify: `app/dashboard/page.tsx` (alle UI-Strings Z. 110-296)

- [ ] **Step 1: Header DE**

- „Welcome back! Here's your learning overview." → „Willkommen zurück. Dein aktueller Lernstand auf einen Blick."

- [ ] **Step 2: Stats-Cards DE**

- „Chunks Studied" → „Trainierte Chunks"
- „Due Today" → „Heute fällig"
- „Avg. Repetitions" → „⌀ Wiederholungen"
- „Current Streak" → „Aktuelle Serie"
- „days"/„day" Konditional → „Tage"/„Tag"
- „Best:" → „Bestwert:"

- [ ] **Step 3: Quick-Actions DE**

- „Quick Start" → „Schnellstart" (wird in Welle qol-E ersetzt — hier nur DE-Pass)
- „Start X Reviews" → „X Wiederholungen starten"
- „Learn New Chunks" → „Neue Chunks lernen"
- „📚 Import Books" → „📚 Bücher importieren"

- [ ] **Step 4: Available Books-Section DE**

- „Available Books" → „Verfügbare Bücher"
- „No books imported yet." → „Noch keine Bücher importiert."
- „Import First Book" → „Erstes Buch importieren"
- „Language:" → „Sprache:"
- „German"/„English" Display bleibt mit Emoji-Flags, Text dahinter weg
- „CEFR:" bleibt (Fachbegriff)
- „Chunks:" → „Chunks:" (kann gleich bleiben, Lehnwort)
- „more" → „weitere"
- „Practice with this Book" → „Mit diesem Buch üben"

- [ ] **Step 5: Footer DE**

- „← Back to Home" → „← Zur Startseite"

- [ ] **Step 6: Grep-Verifikation**

Run: `grep -in 'welcome back\|chunks studied\|due today\|avg\. repetitions\|current streak\|quick start\|available books\|practice with\|back to home' app/dashboard/page.tsx`
Expected: 0 Treffer.

### Task D4: Brand-Titles auf „The Franklin Method" konsolidieren

**Files:**
- Modify: `app/read/[bookId]/page.tsx` Z. 8
- Modify: `app/settings/layout.tsx` Z. 4

- [ ] **Step 1: `/read/[bookId]` Title-Tag**

Z. 8: `title: 'Lesen | Literary Forge'` → `title: 'Lesen | The Franklin Method'`

- [ ] **Step 2: `/settings/layout.tsx` Title-Tag**

Z. 4: `title: "Einstellungen | Literary Forge"` → `title: "Einstellungen | The Franklin Method"`
Description Z. 5: „Verwalten Sie Ihre Literary Forge Einstellungen und Präferenzen." → „Verwalte deine Einstellungen für The Franklin Method."

- [ ] **Step 3: Grep-Verifikation**

Run: `grep -rn 'Literary Forge' app/ components/`
Expected: 0 Treffer (oder dokumentierte Ausnahmen — siehe Stop, wenn welche gefunden).

### Task D5: Settings-Seite ausbauen (Mode-Picker, GDPR-Link, Zurück zu Dashboard)

**Files:**
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: State + Loader für Mode erweitern**

Im `useState`-Block (nach Z. 9) ergänzen:
```tsx
const [defaultMode, setDefaultMode] = useState<'franklin' | 'cloze' | 'free'>('franklin')
```

In `loadSettings()` (nach Z. 47) zusätzlich `default_mode` aus `user_settings` lesen:
```tsx
const { data, error } = await supabase
  .from('user_settings')
  .select('enable_srs, default_mode')
  .eq('user_id', user.id)
  .single()
...
if (data) {
  setEnableSRS(data.enable_srs)
  setDefaultMode((data.default_mode ?? 'franklin') as 'franklin' | 'cloze' | 'free')
}
```

- [ ] **Step 2: Mode-Persistenz-Helper hinzufügen**

Direkt unter `toggleSRS` ergänzen:
```tsx
async function changeMode(next: 'franklin' | 'cloze' | 'free') {
  const prev = defaultMode
  setDefaultMode(next)
  setSaving(true)
  try {
    const res = await fetch('/api/user/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: next }),
    })
    if (!res.ok) throw new Error('save failed')
  } catch {
    setDefaultMode(prev)
    alert('Fehler beim Speichern des Modus')
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 3: Mode-Picker-Card vor SRS-Card einfügen**

Direkt nach Z. 130 (vor `{/* SRS Settings Card */}`):
```tsx
<div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
  <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
    Standard-Trainings-Modus
  </h3>
  <p className="text-sm text-[var(--muted)] mb-3">
    Wird beim Öffnen von /train verwendet. Du kannst auch direkt aus dem Dashboard in einen Modus starten oder im Training per Button wechseln.
  </p>
  <div className="grid grid-cols-3 gap-2">
    {(['franklin', 'cloze', 'free'] as const).map(m => (
      <button
        key={m}
        onClick={() => changeMode(m)}
        disabled={saving}
        className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors
          ${defaultMode === m
            ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
            : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--card-hover)]'}
          disabled:opacity-50`}
      >
        {m === 'franklin' ? 'Franklin' : m === 'cloze' ? 'Cloze' : 'Free'}
      </button>
    ))}
  </div>
  <p className="text-xs text-[var(--muted)] mt-2">
    Franklin: Lesen → Hints → Rekonstruktion · Cloze: Lückentext (in Arbeit) · Free: lesen, dann frei imitieren
  </p>
</div>
```

- [ ] **Step 4: GDPR-Daten-Link nach Account-Card einfügen**

Nach dem Sign-Out-Button (Z. 234-243), VOR dem schließenden `</div>` der Account-Card:
```tsx
<Link
  href="/settings/data"
  className="block text-center w-full mt-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-semibold hover:bg-[var(--card-hover)] transition-colors"
>
  Daten exportieren oder löschen
</Link>
```

(Falls `Link` noch nicht importiert: Top-of-File ergänzen.)

- [ ] **Step 5: Zurück-Link umrouten + SRS-Header-Sprache**

Z. 119-123: `href="/"` → `href="/dashboard"`, Text „← Zurück" → „← Dashboard"
Z. 137: „🔄 Spaced Repetition System (SRS)" → „🔄 Verteiltes Wiederholen (SRS)"

- [ ] **Step 6: Verifikation**

Run: `npx tsc --noEmit 2>&1 | grep -v 'node_modules' | head -20`
Expected: Keine neuen Type-Errors.

### Task D6: ClozeDeletion Dead-End auflösen

**Files:**
- Modify: `components/training/modes/ClozeDeletion.tsx`

- [ ] **Step 1: Banner verbessern + Mode-Wechsel-Buttons direkt rein**

Ersetze den gesamten Render (Z. 27-50):
```tsx
return (
  <div className="max-w-4xl mx-auto p-6">
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-500/20 text-yellow-300 rounded">
          IN ARBEIT
        </span>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Cloze-Modus (Vorschau)
        </h1>
      </div>
      <p className="text-[var(--foreground)] mb-4">
        Der Cloze-Modus (Lückentext, gestuft) ist noch nicht fertig implementiert. Aktuell siehst du nur die Karten-Info ohne Übungs-Interaktion. Wechsle zurück zu Franklin oder Free, um zu trainieren.
      </p>
      <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg mb-4">
        <p className="text-sm text-[var(--muted)] mb-1">Aktuelle Karte:</p>
        <p className="text-lg text-[var(--foreground)] font-serif">{initialChunk.source_texts.title}</p>
      </div>
      <p className="text-sm text-[var(--muted)]">
        Tipp: Mit dem Modus-Button unten kannst du jederzeit zu Franklin oder Free wechseln, ohne die Karte zu verlieren.
      </p>
    </div>
  </div>
)
```

(Der eigentliche Modus-Wechsel-Button bleibt durch `TrainingInterface` unten gerendert — kein eigener Button nötig.)

- [ ] **Step 2: Unused `useRouter` entfernen**

Imports Z. 12 entfernen, `const router = useRouter()` entfernen.

### Task D7: Welle D commit + Live-Verify

- [ ] **Step 1: Tsc-Check**

Run: `npx tsc --noEmit`
Expected: 0 neue Errors (bestehende ignorieren).

- [ ] **Step 2: Final-Grep aller Akzeptanz-Bedingungen**

Run: `grep -rn '"/books"' app/ components/ && echo "FAIL: /books links remain" || echo "OK: no /books links"`
Run: `grep -rin 'all caught up\|all texts completed\|browse books\|filtered training' app/`
Run: `grep -rin 'Literary Forge' app/ components/`
Expected: alle 0 Treffer.

- [ ] **Step 3: Commit als Wave**

Run:
```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(qol-D): auth-surface Konsistenz — DE-Sprache + Brand + /books-Cleanup

- /train Empty-States + Filter-Banner komplett DE
- /dashboard alle Labels/Buttons/Texte DE
- /books gelöscht (Duplikat zur Dashboard-Bücherliste), alle 7 Links auf /dashboard umgeroutet
- /read und /settings/layout Brand-Titles auf "The Franklin Method"
- /settings: Mode-Picker (Franklin/Cloze/Free) + GDPR-Daten-Link + "Zurück" zu /dashboard + SRS-Header DE
- ClozeDeletion: klarer "in Arbeit"-Banner, kein Dead-End mehr nach /settings

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Vercel-Deploy abwarten + Live-Verify**

Run: nach ~60s
```bash
for url in / /train /dashboard /settings; do
  for i in 1 2 3; do
    curl -s -o /dev/null -w "$url run$i: ttfb=%{time_starttransfer}s cache=%header{x-vercel-cache} status=%{http_code}\n" \
      "https://literary-forge.vercel.app$url"
  done
done
```
Expected: alle status=200, vergleichbare TTFB zur Baseline.

---

## Welle qol-E — Insights aus DB-Daten

### Task E1: Dashboard 3-Mode-Quick-Start

**Files:**
- Modify: `app/dashboard/page.tsx` (Quick-Actions-Block Z. 181-199)

- [ ] **Step 1: Default-Mode aus DB lesen**

In der Page-Function nach `progressData`-Fetch ergänzen:
```tsx
const { data: userSettings } = await supabase
  .from('user_settings')
  .select('default_mode')
  .eq('user_id', user.id)
  .single()
const userDefaultMode = (userSettings?.default_mode ?? 'franklin') as 'franklin' | 'cloze' | 'free'
```

- [ ] **Step 2: Quick-Start-Block umbauen**

Ersetze gesamten „Quick Start"-Card-Block (vorher 2 Buttons) durch 3-Mode-Variante + Import-Link:
```tsx
<div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-8">
  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">Schnellstart</h2>
  <p className="text-sm text-[var(--muted)] mb-4">
    Direkt in einen Modus starten — der Standard ist <strong className="text-[var(--foreground)]">{userDefaultMode === 'franklin' ? 'Franklin' : userDefaultMode === 'cloze' ? 'Cloze' : 'Free'}</strong>.
  </p>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
    <Link
      href="/train?mode=franklin"
      className={`px-4 py-3 rounded-lg font-semibold text-center transition-colors
        ${userDefaultMode === 'franklin'
          ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
          : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)]'}`}
    >
      Franklin
    </Link>
    <Link
      href="/train?mode=cloze"
      className={`px-4 py-3 rounded-lg font-semibold text-center transition-colors
        ${userDefaultMode === 'cloze'
          ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
          : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)]'}`}
    >
      Cloze
    </Link>
    <Link
      href="/train?mode=free"
      className={`px-4 py-3 rounded-lg font-semibold text-center transition-colors
        ${userDefaultMode === 'free'
          ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
          : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)]'}`}
    >
      Free
    </Link>
  </div>
  <div className="flex items-center justify-between text-sm">
    <span className="text-[var(--muted)]">
      {dueToday > 0 ? `${dueToday} Wiederholung${dueToday === 1 ? '' : 'en'} heute fällig` : 'Keine Wiederholungen fällig'}
    </span>
    <Link
      href="/admin/ingest"
      className="text-[var(--muted)] hover:text-[var(--foreground)] underline"
    >
      📚 Bücher importieren
    </Link>
  </div>
</div>
```

- [ ] **Step 3: `/train`-Page ?mode=-Query auswerten**

In `app/train/page.tsx` Z. 21-37 die `searchParams` erweitern und `mode` aus URL aufnehmen, dann an `TrainingInterface` als override durchreichen (Sequenz wird in F-Welle stabilisiert; für jetzt: `?mode=` overridet `userDefaultMode`-Wahl):

In den `searchParams`-Type:
```tsx
searchParams: Promise<{ exclude?: string; book?: string; mode?: string }>
```

Nach `params`-Destructuring:
```tsx
const modeOverride = params.mode === 'franklin' || params.mode === 'cloze' || params.mode === 'free'
  ? params.mode
  : null
```

In den 3 `<TrainingInterface ...>`-Calls (Z. 117, 195, 317) den Prop ergänzen:
```tsx
<TrainingInterface initialChunk={chunk} userId={user.id} userDefaultMode={modeOverride ?? userDefaultMode} />
```

### Task E2: 7-Tage-Streak-Strip

**Files:**
- Create: `lib/dashboard/streak-calendar.ts`
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Helper für Last-7-Days-Aktivität**

Erstelle `lib/dashboard/streak-calendar.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export interface StreakDay {
  date: string // YYYY-MM-DD
  reviews: number
}

export async function fetchLast7Days(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakDay[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const { data } = await supabase
    .from('review_history')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())

  const counts = new Map<string, number>()
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    counts.set(d.toISOString().slice(0, 10), 0)
  }
  for (const row of data ?? []) {
    const key = new Date(row.created_at as string).toISOString().slice(0, 10)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([date, reviews]) => ({ date, reviews }))
}
```

- [ ] **Step 2: Streak-Strip ins Dashboard einbinden**

In `app/dashboard/page.tsx` Import ergänzen:
```tsx
import { fetchLast7Days } from '@/lib/dashboard/streak-calendar'
```

Nach `streakData`-Fetch:
```tsx
const last7 = await fetchLast7Days(supabase, user.id)
```

Direkt unter den Stats-Cards (nach Z. 178, vor Quick-Start-Card) einfügen:
```tsx
<div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-8">
  <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">Letzte 7 Tage</h2>
  <div className="flex items-end gap-2 h-16">
    {last7.map(d => {
      const max = Math.max(...last7.map(x => x.reviews), 1)
      const h = (d.reviews / max) * 100
      const labelDay = new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short' })
      return (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${labelDay} ${d.date}: ${d.reviews} Reviews`}>
          <div
            className={`w-full rounded-t ${d.reviews > 0 ? 'bg-[var(--foreground)]' : 'bg-[var(--border)]'}`}
            style={{ height: `${Math.max(h, 6)}%` }}
          />
          <span className="text-xs text-[var(--muted)]">{labelDay[0]}</span>
        </div>
      )
    })}
  </div>
</div>
```

### Task E3: Pro-Autor-Progress auf Buch-Karten

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Pro-Buch trainierte-Chunks-Aggregation**

In der Page-Function nach `books`-Fetch ergänzen:
```tsx
const { data: progressByChunk } = await supabase
  .from('user_progress')
  .select('text_id, source_texts!inner(title)')
  .eq('user_id', user.id)

const trainedByTitle = new Map<string, number>()
for (const row of progressByChunk ?? []) {
  const title = (row.source_texts as any)?.title as string | undefined
  if (!title) continue
  // Base-Title extrahieren (alles vor " (Teil ")
  const baseTitle = title.includes(' (Teil ') ? title.split(' (Teil ')[0] : title
  trainedByTitle.set(baseTitle, (trainedByTitle.get(baseTitle) ?? 0) + 1)
}
```

- [ ] **Step 2: Progress-Balken pro Buch-Card rendern**

In der `books.map`-Schleife nach „Tags"-Block und vor „Action Button" einfügen:
```tsx
{(() => {
  const trained = trainedByTitle.get(book.title) ?? 0
  const pct = book.chunkCount > 0 ? Math.min(100, Math.round((trained / book.chunkCount) * 100)) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
        <span>Fortschritt</span>
        <span>{trained}/{book.chunkCount}</span>
      </div>
      <div className="h-2 bg-[var(--background)] border border-[var(--border)] rounded overflow-hidden">
        <div
          className="h-full bg-[var(--foreground)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
})()}
```

### Task E4: Autor-Header im Training-Kontext

**Files:**
- Modify: `components/training/TrainingInterface.tsx`

- [ ] **Step 1: Author-Name-Display über dem Mode-Render**

In `TrainingInterface.tsx` direkt vor `{renderMode()}` (Z. 79) einfügen:
```tsx
{(() => {
  const st = initialChunk.source_texts as any
  const author = Array.isArray(st?.author) ? st.author[0]?.name : st?.author?.name
  const metrics = st?.metrics
  if (!author && !metrics?.avg_sentence_length) return null
  return (
    <div className="max-w-4xl mx-auto px-6 pt-4">
      <div className="bg-[var(--card)]/50 border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--muted)]">
        <span className="text-[var(--foreground)] font-semibold">{author ?? 'Unbekannt'}</span>
        {metrics?.avg_sentence_length && (
          <> · ⌀ Satzlänge im Korpus: <span className="text-[var(--foreground)]">{metrics.avg_sentence_length.toFixed(1)} Wörter</span></>
        )}
        {st?.title && <> · <span className="italic">{st.title}</span></>}
      </div>
    </div>
  )
})()}
```

### Task E5: FranklinEncoding History-Toggle

**Files:**
- Modify: `components/training/modes/FranklinEncodingPhase.tsx`

- [ ] **Step 1: Existierende Hints beim Mount laden**

Nach `useState`-Block (Z. 42-45) ergänzen:
```tsx
const [previousHints, setPreviousHints] = useState<{sentence: string, hint: string}[] | null>(null)
const [showPrevious, setShowPrevious] = useState(false)

useEffect(() => {
  let cancelled = false
  async function loadPrev() {
    const { data } = await supabase
      .from('user_hints')
      .select('hints')
      .eq('user_id', userId)
      .eq('text_id', initialChunk.text_id)
      .single()
    if (!cancelled && data?.hints) setPreviousHints(data.hints as any)
  }
  loadPrev()
  return () => { cancelled = true }
}, [supabase, userId, initialChunk.text_id])
```

(Falls `useEffect` noch nicht importiert: `import { useState, useEffect } from 'react'`)

- [ ] **Step 2: Toggle-Button im Hinting-View einblenden**

Direkt nach dem „Phase 2"-Headline-Block (Z. 145-153), VOR dem `<div className="space-y-4">`:
```tsx
{previousHints && previousHints.length > 0 && (
  <div className="mb-4 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
    <button
      onClick={() => setShowPrevious(v => !v)}
      className="text-sm text-[var(--foreground)] underline"
    >
      {showPrevious ? '▼ Alte Hints ausblenden' : '▶ Deine alten Hints zu diesem Chunk anzeigen'}
    </button>
    {showPrevious && (
      <ol className="mt-3 space-y-2 list-decimal list-inside text-sm text-[var(--muted)] font-serif">
        {previousHints.map((h, idx) => (
          <li key={idx}><span className="text-[var(--foreground)]">{h.hint}</span></li>
        ))}
      </ol>
    )}
  </div>
)}
```

### Task E6: FeedbackView Verlaufs-Mini-Chart

**Files:**
- Modify: `components/training/FeedbackView.tsx`
- Modify: `components/training/modes/FranklinRetrievalPhase.tsx` (Übergabe der History)
- Modify: `components/training/modes/FreeWriting.tsx` (Übergabe der History)

- [ ] **Step 1: FeedbackView akzeptiert optionalen history-Prop**

In `FeedbackView.tsx` Props-Interface erweitern:
```tsx
history?: { created_at: string; accuracy_score: number }[]
```

Direkt unter dem „Score-Header"-Block (nach FSRS-Schedule, vor LLM-Sub-Scores), einfügen:
```tsx
{feedback && feedback.style_score != null && Array.isArray((arguments[0] as any).history) && (arguments[0] as any).history.length > 0 && (
  <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 mb-4">
    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">Dein Verlauf für diesen Chunk</h2>
    <div className="flex items-end gap-2 h-20">
      {((arguments[0] as any).history as {accuracy_score: number}[]).slice(-5).map((h, idx, arr) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-[var(--foreground)] rounded-t"
            style={{ height: `${Math.max((h.accuracy_score / 100) * 100, 6)}%` }}
            title={`${h.accuracy_score.toFixed(0)}/100`}
          />
          <span className="text-xs text-[var(--muted)]">#{arr.length - idx}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

(Hinweis: Im finalen Code wird `history` aus dem Props-Destructuring oben verwendet, nicht `arguments[0]`. Diese Step-Vorlage ist Pseudo — saubere Variante: `history?: …` in den Props oben rein und im Render verwenden.)

**Sauber:** Im Props-Destructuring (Z. 47-57) ergänzen: `history`. Im Render-Block Bedingung `history && history.length > 0` checken.

- [ ] **Step 2: FranklinRetrievalPhase füllt history**

In `FranklinRetrievalPhase.tsx` `handleSubmit` direkt vor `setFeedback(result)`:
```tsx
const { data: histRows } = await supabase
  .from('review_history')
  .select('created_at, accuracy_score')
  .eq('user_id', userId)
  .eq('text_id', initialChunk.text_id)
  .order('created_at', { ascending: true })
  .limit(5)
result._history = histRows ?? []
```

Beim Render der FeedbackView (Z. 122-166 → in Welle E muss dieser Pfad eigentlich auch FeedbackView nutzen): wenn der bestehende Inline-Render in FranklinRetrievalPhase Z. 122-166 die alte Inline-Variante ist, ersetze ihn durch:
```tsx
return (
  <FeedbackView
    original={initialChunk.source_texts.content}
    user={userText}
    feedback={feedback}
    history={feedback._history ?? []}
    onContinue={handleContinue}
  />
)
```

Import oben ergänzen: `import { FeedbackView } from '../FeedbackView'`

- [ ] **Step 3: FreeWriting füllt history analog**

In `FreeWriting.tsx` `handleSubmit` analog:
```tsx
const { data: histRows } = await supabase
  .from('review_history')
  .select('created_at, accuracy_score')
  .eq('user_id', userId)
  .eq('text_id', initialChunk.source_texts.id)
  .order('created_at', { ascending: true })
  .limit(5)
result._history = histRows ?? []
```

Und beim `<FeedbackView … />`-Call (Z. 150-155) `history={feedback._history ?? []}` ergänzen.

(Hinweis: `userId` muss in FreeWriting verfügbar sein — ist es laut Props bereits, siehe Z. 37.)

### Task E7: Welle E commit + Live-Verify

- [ ] **Step 1: Tsc-Check**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: 0 neue Errors.

- [ ] **Step 2: Commit**

Run:
```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(qol-E): auth-surface Insights — DB-Daten sichtbar machen

- Dashboard: 3-Mode-Quick-Start (Franklin/Cloze/Free Direct-Buttons), Default-Mode-Highlight
- Dashboard: 7-Tage-Streak-Strip aus review_history
- Dashboard: Pro-Buch-Fortschritt (trainierte/total Chunks) auf Buch-Karten
- TrainingInterface: Autor-Header mit Korpus-Avg-Sentence-Length
- FranklinEncoding: Toggle "alte Hints anzeigen" wenn schon mal eingegeben
- FeedbackView: Verlaufs-Mini-Chart letzte 5 Versuche dieses Chunks
- /train: ?mode=franklin|cloze|free Query-Override für Direct-Start

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Live-Verify** (analog Task D7 Step 4)

---

## Welle qol-F — Latenz

### Task F1: Dashboard Promise.all-Parallelisierung

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Parallel-Fetches mit Promise.all**

Ersetze die sequentiellen Aufrufe in `DashboardPage` durch:
```tsx
const [
  { data: progressData },
  { data: streakData },
  { data: userSettings },
  groupedBooksResult,
  last7,
  { data: progressByChunk },
] = await Promise.all([
  supabase.from('user_progress').select('text_id, next_review, reps, difficulty').eq('user_id', user.id),
  supabase.rpc('calculate_user_streaks', { p_user_id: user.id }),
  supabase.from('user_settings').select('default_mode').eq('user_id', user.id).single(),
  supabase.rpc('get_grouped_books'),
  fetchLast7Days(supabase, user.id),
  supabase.from('user_progress').select('text_id, source_texts!inner(title)').eq('user_id', user.id),
])
```

Anschließend die nachgelagerte Buch-Verarbeitung (Fallback-Loop) entlang `groupedBooksResult` umstellen.

### Task F2: ModeCycle kein Chunk-Reshuffle

**Files:**
- Modify: `components/training/TrainingInterface.tsx`

- [ ] **Step 1: `router.refresh()` entfernen, Local-State + Persist genügen**

In `TrainingInterface.tsx` Z. 39-53, ersetze `handleModeChange`:
```tsx
function handleModeChange(next: TrainMode) {
  setMode(next)
  startTransition(async () => {
    try {
      await fetch('/api/user/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: next }),
      })
    } catch {
      // best-effort
    }
  })
}
```

(Kein `router.refresh()` mehr — der Chunk bleibt, der Mode-Default ist persistiert für nächste `/train`-Öffnung.)

### Task F3: Settings Server-Component

**Files:**
- Modify: `app/settings/page.tsx` (Umbau)
- Create: `app/settings/SettingsClient.tsx`

- [ ] **Step 1: Page als Server-Component, Client-Form ausgelagert**

`app/settings/page.tsx` wird zu Server-Component:
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Einstellungen | The Franklin Method',
  description: 'Verwalte deine Einstellungen für The Franklin Method.',
  robots: { index: false, follow: false },
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('user_settings')
    .select('enable_srs, default_mode')
    .eq('user_id', user.id)
    .single()

  return (
    <SettingsClient
      userEmail={user.email ?? ''}
      userId={user.id}
      createdAt={user.created_at ?? ''}
      initialEnableSRS={settings?.enable_srs ?? true}
      initialDefaultMode={(settings?.default_mode ?? 'franklin') as 'franklin' | 'cloze' | 'free'}
    />
  )
}
```

- [ ] **Step 2: Existierende Client-Logik in `SettingsClient` extrahieren**

`app/settings/SettingsClient.tsx` neu mit gesamtem bisherigen Client-Body aus alter `page.tsx` (`'use client'`-direktive, useState, toggleSRS, changeMode, Render-JSX). Props statt initialer DB-Fetch.

(Im Detail: alter `loadSettings()` entfällt komplett; `useState`s nehmen Initial-Werte aus Props; kein `loading`-Flash mehr nötig.)

- [ ] **Step 3: Tsc-Check**

Run: `npx tsc --noEmit 2>&1 | head -10`
Expected: 0 neue Errors.

### Task F4: NLP-Warm-Verbreitung

**Files:**
- Modify: `components/training/modes/FranklinEncodingPhase.tsx`
- Modify: `app/dashboard/page.tsx` (Client-Side-Trigger via mini-component oder Inline-Script entfällt — Server-Components können keine Effekte. Stattdessen: Pre-Warm-Trigger als Client-Component im Dashboard.)
- Create: `components/training/NlpPreWarm.tsx`

- [ ] **Step 1: Pre-Warm-Komponente**

`components/training/NlpPreWarm.tsx`:
```tsx
'use client'
import { useEffect } from 'react'

export function NlpPreWarm() {
  useEffect(() => {
    fetch('/api/nlp/warm').catch(() => {})
  }, [])
  return null
}
```

- [ ] **Step 2: In FranklinEncoding einbauen**

In `FranklinEncodingPhase.tsx` Top-of-File Import: `import { NlpPreWarm } from '../NlpPreWarm'`
Im `return`-Block (sowohl `step === 'reading'` als auch `hinting`) als erstes Element: `<NlpPreWarm />`

- [ ] **Step 3: Im Dashboard einbauen**

In `app/dashboard/page.tsx` Import + im Top-Level-Render direkt unter dem Outer-Div: `<NlpPreWarm />`.

### Task F5: Dashboard-Skeleton auf 4 Cards

**Files:**
- Modify: `app/dashboard/loading.tsx`

- [ ] **Step 1: 4. Stat-Card im Skeleton ergänzen**

In `app/dashboard/loading.tsx` den `[1, 2, 3]`-Array auf `[1, 2, 3, 4]` erweitern und den Grid auf `md:grid-cols-2 lg:grid-cols-4` umstellen (passt zur echten Page).

### Task F6: Welle F commit + Live-Verify

- [ ] **Step 1: Tsc-Check**

Run: `npx tsc --noEmit`
Expected: 0 neue Errors.

- [ ] **Step 2: Commit**

Run:
```bash
git add -A
git commit -m "$(cat <<'EOF'
perf(qol-F): auth-surface Latenz — Parallel-Fetches + ModeCycle + Server-Component

- Dashboard Promise.all für progress + streak + settings + books + last7 + perBookProgress
- ModeCycle: kein router.refresh() mehr — Chunk bleibt erhalten, Default-Persist asynchron
- /settings als Server-Component (kein "Lädt Einstellungen…"-Flash mehr)
- NLP-Pre-Warm ergänzt in FranklinEncoding und /dashboard
- Dashboard-Loading-Skeleton auf 4 Stat-Cards (matcht echte Render)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Live-Verify mit erwarteten Schwellen**

```bash
for url in / /train /dashboard /settings; do
  for i in 1 2 3; do
    curl -s -o /dev/null -w "$url run$i: ttfb=%{time_starttransfer}s cache=%header{x-vercel-cache} status=%{http_code}\n" \
      "https://literary-forge.vercel.app$url"
  done
done
```
Expected: `/dashboard` warm < 200 ms, `/settings` warm vergleichbar (jetzt server-rendered). `/train` MISS bleibt struktur-bedingt.

### Task F7: Push final

- [ ] **Step 1: Status checken**

Run: `git status && git log --oneline -5`
Expected: working tree clean, 3 neue Commits qol-D/E/F oben drauf.

- [ ] **Step 2: Push**

Run: `git push`
Expected: erfolgreich nach `main`.

---

## Self-Review (Plan vs Spec)

1. **Spec-Coverage:**
   - §2.1 Sprach-Inkonsistenz → Tasks D2, D3, D4, D5 (Step 5), D6 ✓
   - §2.2 Klick-Pfade → Tasks D5 (Mode-Picker), E1 (Quick-Start), D5 (GDPR-Link, Zurück-Link) ✓
   - §2.3 Latenz → Tasks F1, F2, F3, F4, F5 ✓
   - §2.4 Ungenutzte DB-Daten → Tasks E2, E3, E4, E5, E6 ✓
   - §2.5 Sonstige Code-Pains → D1 (/books-Cleanup), D6 (Cloze-Dead-End), F5 (Skeleton-Match), Welle-E covers History ✓

2. **Placeholder-Scan:** Keine TBDs, alle Code-Blöcke konkret. Eine Stelle (E6 Step 1) hat einen Pseudo-Code-Hinweis — der saubere Variant-Hinweis steht direkt darunter; bei Implementation den sauberen Pfad nehmen.

3. **Typ-Konsistenz:** `userDefaultMode` Typ `'franklin' | 'cloze' | 'free'` durchgehend. `default_mode`-Feld passt zu Schema (Migration 017 + 018-Folge).

4. **Risiko-Check:** Task E6 (FeedbackView History) hat semantische Überlappung mit dem alten Inline-Render in `FranklinRetrievalPhase.tsx` (Z. 122-166). Schritt 2 ersetzt diesen — Code-Duplikat aufgelöst.
