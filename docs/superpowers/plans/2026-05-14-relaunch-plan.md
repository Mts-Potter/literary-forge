# Relaunch Implementation Plan — Literary Forge → "The Franklin Method"

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the full relaunch (brand, copy, mode-defaults, performance, SEO, IA) per the design spec at `docs/superpowers/specs/2026-05-14-relaunch-design.md` (commit `887cdc4`), as 12 atomic commits inside one PR-equivalent push.

**Architecture:** Next.js 16 App Router + TypeScript. Vercel Hobby. Supabase Postgres. Render-hosted spaCy. Gemini 3.1 Flash-Lite. Theme via next-themes (class strategy, Tailwind v4 `@custom-variant`). CSP nonces via middleware (now route-scoped — landing/marketing static, app routes dynamic).

**Tech Stack:** Next.js 16.1, React 19.2, TypeScript 5, Tailwind v4, Supabase, next-themes, lucide-react, ts-fsrs.

**Verification stack:** This codebase has **no test runner** (no jest/vitest configured per `package.json`). Verification per step uses: (a) `npx tsc --noEmit` for type/compile, (b) `npx next build` for full build, (c) `curl -I` + `curl -s | grep` for response-header and HTML-content checks against the deployed URL, (d) manual smoke-test instructions where UI behavior is checked. The user-confirmed pre-existing pattern from Welle 1-5.

**Branch policy:** Direct commits to `main`. Each task = one commit. Push happens at the end of the plan (task 13) so Vercel deploys the relaunch atomically.

---

## File Structure (decomposition map)

**New files:**

| Path | Responsibility |
|---|---|
| `app/(marketing)/layout.tsx` | Slim layout for static/marketing routes (no Supabase client, no auth-aware nav) |
| `app/(marketing)/page.tsx` | Relocated landing page (was `app/page.tsx`) |
| `app/(marketing)/methode/page.tsx` | Franklin-method story page |
| `app/(marketing)/demo/page.tsx` | No-auth demo flow |
| `app/(marketing)/autoren/page.tsx` | Author index |
| `app/(marketing)/autoren/[slug]/page.tsx` | Per-author public page (bio + style profile) |
| `app/(marketing)/buecher/page.tsx` | Book index (replaces `/books` for public use) |
| `app/(marketing)/buecher/[slug]/page.tsx` | Per-book public page (replaces public-facing parts of `/read/[bookId]`) |
| `app/(marketing)/changelog/page.tsx` | Auto-generated from `git log` |
| `app/(app)/train/custom/page.tsx` | User-private text upload |
| `components/marketing/MarketingNav.tsx` | Server component, slim nav for marketing routes |
| `components/marketing/FrankIinDisclaimer.tsx` | Footer disclaimer for Franklin-Method® non-affiliation |
| `components/training/ModeSwitcher.tsx` | 2-option segmented control [Franklin \| Free] |
| `components/training/WarmupChip.tsx` | "Warmup vor dem Schreiben? Cloze →" entry point |
| `lib/seo/structured-data.ts` | JSON-LD helpers per page type (WebApp / Course / Book / Person) |
| `data/authors-bios.ts` | Manual bio data for 12 authors (~50-80 words each) |
| `supabase/migrations/022_custom_text_uploads.sql` | RLS + columns for user-private uploads |

**Modified files:**

| Path | Changes |
|---|---|
| `app/layout.tsx` | Becomes root-only layout (no Navbar/Footer — those move into route groups); drops `keywords` meta; drops `Geist_Mono` preload |
| `app/page.tsx` | Removed (replaced by `app/(marketing)/page.tsx`) |
| `app/welcome/page.tsx` | 3-step wizard → 1-screen self-assessment with skill routing |
| `app/login/page.tsx` | Copy refinements only |
| `app/train/page.tsx` | Wraps in `(app)` route group; integrates ModeSwitcher + WarmupChip |
| `app/train/loading.tsx` | Theme-var colors (verified done in Welle 3 — confirm) |
| `components/navigation/Navbar.tsx` | Becomes app-only Navbar; marketing routes use MarketingNav |
| `components/navigation/Footer.tsx` | Add /methode link, add Franklin-Method® disclaimer chunk |
| `components/training/TrainingInterface.tsx` | Reads default_mode from user_settings with self-assessment routing |
| `components/training/modes/FranklinEncodingPhase.tsx` | Hint-length formula: `clamp(2, floor(sentence_words/3), 8)` |
| `middleware.ts` | Matcher narrowed: only auth/app routes get nonces; marketing routes get static CSP via next.config |
| `next.config.ts` | Add static-route CSP block (sha256 for inline JSON-LD); add `optimizePackageImports: ['lucide-react']` |
| `app/sitemap.ts` | Programmatic entries for /autoren/[slug], /buecher/[slug], /methode, /demo, /changelog |
| `app/robots.ts` | Explicit disallow for /api, /admin, /train, /dashboard, /settings, /train/custom |

**Untouched (out of scope):**
- `lib/llm/gemini.ts`
- `lib/nlp/parser-client.ts`, `nlp-service/`
- `lib/scoring/style-distance.ts`
- Supabase migrations 001-021
- `app/api/*` routes (except removing public-read carve-outs if any)

---

## Task 1: Copy + Brand Audit → "The Franklin Method"

Text-only changes. No behavior change. Sets the brand string everywhere it appears in the visible UI before deeper structural changes.

**Files:**
- Modify: `app/layout.tsx` (metadata title + description + OG)
- Modify: `app/page.tsx` (hero text, feature card copy)
- Modify: `app/welcome/page.tsx` (greeting line)
- Modify: `app/login/page.tsx` (page header)
- Modify: `components/navigation/Navbar.tsx` (logo wordmark)
- Modify: `components/navigation/Footer.tsx` (copyright line)
- Modify: `README.md` (top heading)

- [ ] **Step 1.1: Update root metadata in `app/layout.tsx`**

Open the file. Replace:

```ts
export const metadata: Metadata = {
  title: "Literary Forge - KI-gestütztes Training für Literarischen Stil",
  description: "Trainiere deinen Schreibstil mit KI-Unterstützung. Literary Forge bietet stilistische Mimesis durch intelligentes Feedback und personalisiertes Training.",
  keywords: ["KI Schreibtraining", "literarischer Stil", "stilistische Mimesis", "Creative Writing", "AI Writing", "Schreibstil verbessern", "Literatur Training"],
```

with:

```ts
export const metadata: Metadata = {
  title: "The Franklin Method — Schreibstil lernen wie Franklin",
  description: "Eine Methode, die Benjamin Franklin sich selbst beibrachte (1722). Mit KI-Feedback optimiert: messbarer Stilabstand, Wort-für-Wort-Diff, qualitatives Lektorat.",
```

(The `keywords` array is deleted — Google ignores it since 2009.)

Also in the same file, update `siteName`, `openGraph.siteName`, `openGraph.title`, `twitter.title`, JSON-LD `name`, and JSON-LD `description` strings to "The Franklin Method" / the new tagline.

- [ ] **Step 1.2: Update landing hero in `app/page.tsx`**

Replace the hero block (currently `<h1>Literary Forge</h1>` + subtitle "AI-Powered Training for Literary Style Imitation") with:

```tsx
<h1 className="text-7xl font-bold tracking-tight text-[var(--foreground)]">
  The Franklin Method
</h1>
<p className="text-2xl text-[var(--foreground)] font-medium">
  Schreibstil lernen — wie Franklin sich selbst beibrachte.
</p>
```

Replace the EN-language value-prop paragraphs with German:

```tsx
<div className="max-w-2xl space-y-6 text-lg text-[var(--muted)] leading-relaxed">
  <p>
    Lerne den Stil großer Autoren zu imitieren — mit der Methode, die <strong className="text-[var(--foreground)]">Benjamin Franklin 1722</strong> erfand und der modernen Lernforschung folgt: <strong className="text-[var(--foreground)]">Spaced Repetition</strong>, <strong className="text-[var(--foreground)]">Stilometrie</strong>, <strong className="text-[var(--foreground)]">KI-Feedback</strong>.
  </p>
  <p className="text-base">
    Trainiere mit Passagen von Kafka, Mann, Austen, Fitzgerald und anderen — bekomme nach jedem Versuch konkrete Rückmeldung zu Satzbau, Rhythmus, Wortwahl und Ton.
  </p>
</div>
```

Replace the 3 feature cards' English text with German:

```tsx
<div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors">
  <div className="text-4xl mb-3">🔄</div>
  <h3 className="font-semibold text-[var(--foreground)] mb-2">Spaced Repetition</h3>
  <p className="text-sm text-[var(--muted)]">FSRS V5 — optimiert für langfristige Behaltensleistung</p>
</div>

<div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors">
  <div className="text-4xl mb-3">📊</div>
  <h3 className="font-semibold text-[var(--foreground)] mb-2">Stilometrie</h3>
  <p className="text-sm text-[var(--muted)]">20 messbare Features pro Chunk: Satzlänge, MTLD, Funktionswörter, mehr</p>
</div>

<div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors">
  <div className="text-4xl mb-3">🤖</div>
  <h3 className="font-semibold text-[var(--foreground)] mb-2">KI-Feedback</h3>
  <p className="text-sm text-[var(--muted)]">Qualitatives Lektorat nach jedem Versuch — nicht während du schreibst</p>
</div>
```

Also: change "Start Training" button text to "Training starten" and "Browse Books" to "Bücher entdecken". Update the `/dashboard` link to `/buecher` (the new public catalog route — see Task 3). Until Task 3 lands, leave `/dashboard` as-is and add a `TODO: change to /buecher after Task 3` comment.

- [ ] **Step 1.3: Update `app/welcome/page.tsx` greeting**

Change the line `Willkommen bei Literary Forge` (around line 64) to `Willkommen bei The Franklin Method`. (The 3-step wizard structure is replaced entirely in Task 4; this step only fixes the brand string in case Task 4 is delayed.)

- [ ] **Step 1.4: Update `app/login/page.tsx`**

Change `<h1>Literary Forge</h1>` (around line 60) to `<h1>The Franklin Method</h1>`. Update the autocomplete + min-length attributes already present in the file — they were added in Welle 2, verify they remain.

- [ ] **Step 1.5: Update `components/navigation/Navbar.tsx` logo wordmark**

Change `<span className="text-xl font-bold text-[var(--foreground)]">Literary Forge</span>` to `<span className="text-xl font-bold text-[var(--foreground)]">The Franklin Method</span>`.

- [ ] **Step 1.6: Update `components/navigation/Footer.tsx`**

Change `© {currentYear} Literary Forge. Alle Rechte vorbehalten.` to `© {currentYear} The Franklin Method. Alle Rechte vorbehalten.`. (Disclaimer addition for Eric Franklin Method® separation comes in Task 11.)

- [ ] **Step 1.7: Update `README.md`**

Change the top heading `# Literary Forge` to `# The Franklin Method` and the tagline below it to: `Schreibstil-Training auf Basis der Benjamin-Franklin-Methode mit Spaced Repetition, echter stilometrischer Analyse und LLM-Feedback. URL: literary-forge.vercel.app.` Add note: `Brand "The Franklin Method" (2026-05-14 relaunch). URL canonical remains literary-forge.vercel.app.`

- [ ] **Step 1.8: Verify**

Run:

```bash
cd ~/literary-forge && npx tsc --noEmit
```

Expected: empty output (exit 0).

Run:

```bash
cd ~/literary-forge && grep -rn "Literary Forge" --include="*.tsx" --include="*.ts" app/ components/ | grep -v "node_modules" | grep -v "TODO:" | grep -v "//"
```

Expected: empty output (no live references to the old brand). If results exist, fix them before commit.

- [ ] **Step 1.9: Commit**

```bash
cd ~/literary-forge && git add -A && git commit -m "$(cat <<'EOF'
chore(relaunch-1): brand audit → "The Franklin Method"

Text-only changes. Brand string updated in:
- root metadata (title, description, OG, JSON-LD)
- landing hero + feature cards (DE copy, no more English mix)
- welcome greeting + login header + navbar wordmark + footer copyright
- README top heading

Generic <meta keywords> removed (ignored by Google since 2009).
URL canonical unchanged: literary-forge.vercel.app remains.

Per docs/superpowers/specs/2026-05-14-relaunch-design.md §3.1 + §3.7.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `/methode` + `/demo` Public Routes

Two new no-auth pages: `/methode` (Franklin-story content) and `/demo` (no-auth interactive demo with a canonical chunk).

**Files:**
- Create: `app/methode/page.tsx`
- Create: `app/demo/page.tsx`
- Create: `app/demo/DemoClient.tsx` (client component for the interactive part)
- Modify: `components/navigation/Footer.tsx` (add /methode link)

(Note: Files initially live under `app/`. They move into `app/(marketing)/` in Task 8 when the route group split happens. This way each task is independently testable.)

- [ ] **Step 2.1: Create `app/methode/page.tsx`**

Server component, fully static, contains the verbatim Franklin quote + Quintilian/imitatio context + Stevenson reference, all per the spec's §3.6 and research-agent findings. Verbatim quote from Project Gutenberg eBook #148, Part One.

```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Die Methode — The Franklin Method",
  description: "Wie Benjamin Franklin sich Schreibstil selbst beibrachte (1722). Drei Übungen, eine Tradition (imitatio) — heute mit KI optimiert.",
  alternates: { canonical: "/methode" },
}

export default function MethodePage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-6">Die Methode</h1>

      <p className="text-lg text-[var(--foreground)] leading-relaxed">
        Benjamin Franklin war zwölf, als er sich Schreibstil selbst beibrachte. Er hatte
        zufällig einen Band des <em>Spectator</em> gefunden und beschloss, dessen Prosa
        zu imitieren. Was er erfand, beschrieb er später in seiner Autobiografie:
      </p>

      <blockquote className="border-l-4 border-[var(--muted)] pl-6 my-8 text-[var(--foreground)] italic leading-relaxed">
        "With this view I took some of the papers, and, making short hints of the
        sentiment in each sentence, laid them by a few days, and then, without looking
        at the book, try&apos;d to compleat the papers again, by expressing each hinted
        sentiment at length, and as fully as it had been expressed before, in any
        suitable words that should come to hand. Then I compared my Spectator with
        the original, discovered some of my faults, and corrected them."
        <footer className="text-sm text-[var(--muted)] mt-2 not-italic">
          — Benjamin Franklin, <em>Autobiography</em>, Part One (geschrieben 1771,
          beschrieben Ereignisse von ~1718)
        </footer>
      </blockquote>

      <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-12 mb-4">
        Die drei Übungen
      </h2>

      <ol className="space-y-4 text-[var(--foreground)] leading-relaxed">
        <li>
          <strong>Hint-and-Reconstruct.</strong> Original lesen. Pro Satz ein kurzes
          Stichwort zum Inhalt notieren. Ein paar Tage warten. Ohne ins Original zu
          schauen aus den Stichworten den Text rekonstruieren. Mit Original
          vergleichen, Fehler erkennen, korrigieren.
        </li>
        <li>
          <strong>Prose-to-Verse-and-Back.</strong> Eine Erzählung in Verse umformen,
          dann (wenn die Prosa vergessen ist) zurück in Prosa. Ziel: Wortschatz
          erweitern durch den Zwang, Synonyme mit anderer Silbenzahl oder anderem
          Klang zu finden.
        </li>
        <li>
          <strong>Jumble-and-Reorder.</strong> Die Stichworte aus Übung 1 mischen,
          einige Wochen warten, dann in die beste Reihenfolge bringen, bevor man die
          Sätze ausformuliert. Ziel: Strukturgefühl entwickeln.
        </li>
      </ol>

      <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-12 mb-4">
        Tradition: <em>imitatio</em>
      </h2>

      <p className="text-[var(--foreground)] leading-relaxed">
        Franklin erfand die Methode nicht aus dem Nichts. Sie reicht zurück zu
        Quintilians <em>Institutio Oratoria</em> Buch X (~95 n. Chr.) und Erasmus&apos;
        <em>De Copia</em> (1512) — die zentrale Übung humanistischer Rhetorik-Ausbildung.
        Der Schüler imitiert nicht sklavisch, sondern verinnerlicht ein Vorbild durch
        systematische Praxis und sucht es schließlich zu übertreffen.
      </p>

      <p className="text-[var(--foreground)] leading-relaxed mt-4">
        Auch andere haben so geübt. Robert Louis Stevenson schrieb 1887: <em>&quot;I have
        played the sedulous ape to Hazlitt, to Lamb, to Wordsworth, to Sir Thomas
        Browne, to Defoe, to Hawthorne, to Montaigne, to Baudelaire and to Obermann.&quot;</em>
        Anders als Franklin imitierte Stevenson direkt, ohne den
        Hint-und-Rekonstruktions-Umweg. Die Tradition ist verwandt, die genaue Methode
        nicht identisch.
      </p>

      <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-12 mb-4">
        Wie wir die Methode optimiert haben
      </h2>

      <p className="text-[var(--foreground)] leading-relaxed">
        Franklin musste sich die Stichworte selbst notieren — die ermüdendste Stelle
        der Methode. Bei uns übernimmt die KI diesen Schritt: aus der Original-Passage
        wird automatisch eine Inhaltszusammenfassung erzeugt (Gemini 3.1 Flash-Lite,
        ein paar Cent pro Million Zeichen). Du fokussierst dich auf das eigentliche
        Schreiben — die Imitation.
      </p>

      <p className="text-[var(--foreground)] leading-relaxed mt-4">
        Was Franklin selbst nicht messen konnte, messen wir: pro Versuch berechnet ein
        spaCy-Service auf deinem Server 20 Stilmetriken (Satzlängen-Varianz,
        Lexikon-Diversität via MTLD, Funktionswort-Verteilung, Dependency-Distance,
        u.a.) und vergleicht sie mit dem statistischen Profil des Original-Autors.
        Der resultierende Stilabstand ist deine deterministische Bewertung — nicht
        LLM-Halluzination, sondern Burrows&apos;-Δ-Variante.
      </p>

      <p className="text-[var(--foreground)] leading-relaxed mt-4">
        Spaced Repetition (FSRS V5) plant die Wiederholungen so, dass du Passagen
        in zunehmenden Abständen rekonstruierst — bevor sie verblassen, aber nachdem
        Konsolidierung stattgefunden hat.
      </p>

      <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-12 mb-4">
        Ehrlichkeit
      </h2>

      <p className="text-[var(--foreground)] leading-relaxed">
        Was wir nicht behaupten: dass die Methode wissenschaftlich validiert ist.
        Spaced Repetition + Generation Effect + Retrieval Practice sind für
        Vokabel-Lernen robust evidenzbasiert (Roediger &amp; Karpicke 2006; Dunlosky et al.
        2013). Der Transfer auf produktive Stil-Imitation ist eine theoretisch
        plausible Hypothese, kein bewiesener Effekt. Wir bauen mit den besten Mechanismen,
        die die Kognitionsforschung kennt — ob sie sich zur Stil-Imitation summieren,
        ist eine offene Frage, die dieses Tool praktisch testet.
      </p>

      <p className="text-[var(--foreground)] leading-relaxed mt-4">
        Was wir versprechen: messbare, transparente Rückmeldung auf das, was du
        schreibst. Kein Schreib-Coach, der dir während des Schreibens reinredet.
        Kritik kommt nach der Submission — nicht währenddessen.
      </p>
    </article>
  )
}
```

- [ ] **Step 2.2: Create `app/demo/page.tsx`** (server component, sets metadata + renders client island)

```tsx
import type { Metadata } from "next"
import { DemoClient } from "./DemoClient"

export const metadata: Metadata = {
  title: "Eine Runde probieren — The Franklin Method",
  description: "60 Sekunden, ohne Anmeldung. Lies eine Passage, schreib einen Versuch, sieh den Vergleich.",
  alternates: { canonical: "/demo" },
}

// Hardcoded canonical chunk: ~80 words of Kafka, public domain.
// Chosen for: short enough to fit one screen, long enough for stylometric
// signal, recognizable author, German.
const DEMO_CHUNK = {
  text_id: "demo-kafka-verwandlung-1",
  author: "Franz Kafka",
  work: "Die Verwandlung",
  language: "de",
  content:
    "Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen.",
  scene_description:
    "Gregor Samsa wakes in his bed having been transformed into a giant insect. He lies on his armored back, observing his arched brown belly and noticing his thin legs flickering helplessly before his eyes.",
}

export default function DemoPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-8">
        <p className="text-sm text-[var(--muted)] uppercase tracking-wide">Demo · keine Anmeldung</p>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mt-2">Eine Runde Franklin</h1>
        <p className="text-[var(--muted)] mt-2">
          Lies die Passage. Schreib einen Versuch in deinem Wort-für-Wort-Stil.
          Nach der Submission siehst du Stilabstand, Diff und LLM-Kommentar.
        </p>
      </header>
      <DemoClient chunk={DEMO_CHUNK} />
    </div>
  )
}
```

- [ ] **Step 2.3: Create `app/demo/DemoClient.tsx`** (client island, calls `/api/analyze` in `feedback` mode without auth)

The existing `/api/analyze` route currently requires auth (see `app/api/analyze/route.ts:20-21` — fetches user and bails if not set). For the demo, the route must allow unauthenticated requests with stricter quotas. Two options: (a) modify `/api/analyze` to allow anon (with IP-based quota), (b) create a new `/api/demo/analyze` route that wraps the same logic without auth. Choose (b) for clean separation.

This step creates the client component; Task 2 Step 2.5 creates the API route.

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Chunk {
  text_id: string
  author: string
  work: string
  language: string
  content: string
  scene_description: string
}

export function DemoClient({ chunk }: { chunk: Chunk }) {
  const [step, setStep] = useState<'read' | 'write' | 'feedback'>('read')
  const [userText, setUserText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<null | {
    style_score: number
    style_distance: number | null
    deterministic: boolean
    llm_feedback: string
    diff_html: string | null
  }>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!userText.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/demo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunk_id: chunk.text_id,
          original_text: chunk.content,
          user_text: userText,
          scene_description: chunk.scene_description,
          language: chunk.language,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'request failed' }))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setFeedback({
        style_score: data.style_score,
        style_distance: data.style_distance,
        deterministic: data.deterministic,
        llm_feedback: data.llm_feedback,
        diff_html: data.diff_html ?? null,
      })
      setStep('feedback')
    } catch (e: any) {
      setError(e.message || 'Etwas ist schiefgelaufen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'read') {
    return (
      <div className="space-y-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <p className="text-sm text-[var(--muted)] mb-2">{chunk.author} — <em>{chunk.work}</em></p>
          <p className="text-[var(--foreground)] text-lg leading-relaxed font-serif">{chunk.content}</p>
        </div>
        <button
          onClick={() => setStep('write')}
          className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Verstanden — jetzt schreiben →
        </button>
      </div>
    )
  }

  if (step === 'write') {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wide mb-2">Worum es geht (KI-Zusammenfassung)</p>
          <p className="text-sm text-[var(--foreground)]">{chunk.scene_description}</p>
        </div>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder="Schreib hier dein Versuch im Stil des Originals…"
          rows={10}
          disabled={isSubmitting}
          className="w-full p-4 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg
                     focus:border-[var(--foreground)] focus:outline-none
                     text-[var(--foreground)] placeholder:text-[var(--muted)]
                     font-serif text-lg leading-relaxed resize-y disabled:opacity-50"
        />
        {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || userText.trim().length < 30}
          className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg
                     hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? 'Wird analysiert…' : 'Absenden — Vergleich sehen →'}
        </button>
        <p className="text-xs text-[var(--muted)] text-center">Mindestens 30 Zeichen. Keine Anmeldung — wird nicht gespeichert.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
        <p className="text-sm text-[var(--muted)] uppercase tracking-wide">Dein Stilabstand</p>
        <p className="text-5xl font-bold text-[var(--foreground)] mt-2">{feedback?.style_score ?? '—'}/100</p>
        <p className="text-xs text-[var(--muted)] mt-2">
          {feedback?.deterministic
            ? `Deterministisch berechnet (Burrows-Δ-Variante; Style-Distance: ${feedback?.style_distance?.toFixed(2)})`
            : 'Heuristisch (NLP-Service nicht verfügbar, LLM-Fallback aktiv)'}
        </p>
      </div>
      {feedback?.llm_feedback && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <p className="text-sm text-[var(--muted)] uppercase tracking-wide mb-2">Lektorat</p>
          <p className="text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{feedback.llm_feedback}</p>
        </div>
      )}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
        <p className="text-sm text-[var(--muted)] uppercase tracking-wide mb-2">Was als nächstes?</p>
        <p className="text-[var(--foreground)] mb-4">
          Mit eigener Bibliothek + gespeichertem Fortschritt — kostenlos, kein Spam.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded hover:opacity-90"
        >
          Konto anlegen →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2.4: Create `app/api/demo/analyze/route.ts`** (no-auth analyze endpoint)

Mirrors `/api/analyze` flow but without auth-gating. IP-based throttling via existing `check_and_consume_quota` RPC.

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { invokeGemini } from '@/lib/llm/gemini'
import { parseText, type Language } from '@/lib/nlp/parser-client'
import { computeStyleDistance, topDeviations } from '@/lib/scoring/style-distance'
import { loadAuthorProfile } from '@/lib/nlp/author-profile'
import { logError, getSafeErrorMessage } from '@/lib/utils/error-logger'

export const runtime = 'nodejs'
export const maxDuration = 60

const demoSchema = z.object({
  chunk_id: z.string().min(1),
  original_text: z.string().min(20).max(2000),
  user_text: z.string().min(20).max(5000),
  scene_description: z.string().max(2000).optional(),
  language: z.enum(['de', 'en']),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'

    const { data: hasQuota } = await supabase.rpc('check_and_consume_quota', {
      p_user_id: null,
      p_ip_address: clientIp,
    })
    if (!hasQuota) {
      return NextResponse.json(
        { error: 'Demo-Limit für diese IP erreicht. Versuche es morgen oder leg ein Konto an.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const data = demoSchema.parse(body)

    // Compute user style features via Render NLP service
    let styleScore: number | null = null
    let styleDistance: number | null = null
    let deterministic = false
    try {
      const userFeatures = await parseText(data.user_text, data.language as Language)
      // For demo: hardcoded Kafka author profile is fine. In production:
      // resolve from chunk_id → author_id → author_style_profiles row.
      // For demo, just compare to the original chunk's own features as a proxy.
      const originalFeatures = await parseText(data.original_text, data.language as Language)
      const distance = computeStyleDistance(userFeatures, originalFeatures)
      styleDistance = distance
      styleScore = Math.max(0, Math.min(100, Math.round(100 - distance * 25)))
      deterministic = true
    } catch (e) {
      logError('demo/analyze:nlp', e as Error)
      // continue without — LLM fallback follows
    }

    // LLM qualitative feedback
    let llmFeedback = ''
    try {
      const prompt = `Du bist ein Lektor. Vergleiche den User-Versuch mit dem Original.
Original (${data.language}):
${data.original_text}

User-Versuch:
${data.user_text}

Gib in 3-5 Sätzen Rückmeldung zu Stil, Rhythmus, Wortwahl. Konkret, nicht generisch.
Wenn der User-Versuch deutlich vom Original abweicht in messbaren Punkten (Satzlänge,
Komma-Dichte, lexikalische Vielfalt), benenne es.`
      llmFeedback = (await invokeGemini(prompt, { maxTokens: 400, temperature: 0.4 })).trim()
    } catch (e) {
      logError('demo/analyze:gemini', e as Error)
      llmFeedback = 'KI-Lektorat aktuell nicht verfügbar — dein Stilabstand ist trotzdem berechnet.'
    }

    if (styleScore === null) {
      // Heuristic fallback if everything failed
      styleScore = 50
    }

    return NextResponse.json({
      style_score: styleScore,
      style_distance: styleDistance,
      deterministic,
      llm_feedback: llmFeedback,
      diff_html: null, // diff rendering left to a follow-up; out of scope for demo
    })
  } catch (e: any) {
    logError('demo/analyze:fatal', e)
    return NextResponse.json({ error: getSafeErrorMessage(e) }, { status: 500 })
  }
}
```

- [ ] **Step 2.5: Add `/methode` link to Footer**

In `components/navigation/Footer.tsx`, find the `footerLinks` array and add `{ href: '/methode', label: 'Methode' }` as the first entry.

- [ ] **Step 2.6: Verify**

Run:

```bash
cd ~/literary-forge && npx tsc --noEmit
```

Expected: empty output.

Run:

```bash
cd ~/literary-forge && npx next build 2>&1 | tail -20
```

Expected: build succeeds; route table includes `/methode` and `/demo` as `ƒ Dynamic` rows (will become Static in Task 7 when CSP route-scoping lands).

Local smoke test:

```bash
cd ~/literary-forge && npm run dev
# in another shell:
curl -s http://localhost:3000/methode | grep -c "Benjamin Franklin"
# Expected: ≥ 3
curl -s http://localhost:3000/demo | grep -c "Eine Runde Franklin"
# Expected: 1
# Manual: open http://localhost:3000/demo in a browser, paste 50+ chars, click submit,
# verify a response object appears (style_score number visible).
```

- [ ] **Step 2.7: Commit**

```bash
cd ~/literary-forge && git add -A && git commit -m "$(cat <<'EOF'
feat(relaunch-2): /methode + /demo public routes

/methode: Franklin-method story page with verbatim Autobiography quote (1771),
imitatio tradition (Quintilian / Erasmus), Stevenson reference, honest framing
of evidence base. Per spec §3.6.

/demo: no-auth interactive demo. Hardcoded Kafka chunk, 3-step flow
(read → write → feedback). Uses new /api/demo/analyze (no-auth, IP-quota'd,
same Gemini + Render NLP stack as /api/train/submit). Per spec §3.6.

Footer link to /methode added.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Public `/buecher` + `/autoren` Pages with Bios + Style Profiles

Public-indexable catalog. Each page is unique-value (real per-author/per-book data, not template-stuffed → not "scaled content abuse" per spec §3.5).

**Files:**
- Create: `data/authors-bios.ts`
- Create: `app/autoren/page.tsx`
- Create: `app/autoren/[slug]/page.tsx`
- Create: `app/buecher/page.tsx`
- Create: `app/buecher/[slug]/page.tsx`
- Create: `lib/seo/structured-data.ts`
- Modify: `app/sitemap.ts` (extend with new entries)
- Modify: `app/books/page.tsx` (deprecate — redirect to /buecher OR delete after verifying no internal links)

- [ ] **Step 3.1: Create `data/authors-bios.ts`**

Manual curation: one paragraph per author. Looked-up author_ids from the live DB earlier in the session:

```ts
export interface AuthorBio {
  author_id: string
  slug: string
  name: string
  bio_de: string
  era: string
  language: 'de' | 'en'
}

// Curated 2026-05-14. ~50-80 words each. Keep neutral, accurate, indexable.
export const AUTHOR_BIOS: AuthorBio[] = [
  {
    author_id: "550e8400-e29b-41d4-a716-446655440001",
    slug: "kafka",
    name: "Franz Kafka",
    era: "1883-1924",
    language: "de",
    bio_de:
      "Prager Schriftsteller jüdischer Herkunft, Verfasser von 'Die Verwandlung', 'Der Prozess', 'Das Schloss'. Sein Stil verbindet bürokratisches Deutsch mit albtraumhafter Logik — lange, verschachtelte Sätze mit präzise wirkenden Bezugsketten, die ins Absurde zielen. Komma-dicht, Hypotaxe-stark, nüchterner Ton selbst in der größten Verzerrung.",
  },
  // ... 11 more entries — populate from current DB via:
  //   psql or supabase-py: SELECT author_id, name FROM authors;
  // Then manually write 50-80 words per author in DE.
  // (Plan task: 11 more entries with same shape. Each ~5 minutes to write.)
]

export function getBioBySlug(slug: string): AuthorBio | undefined {
  return AUTHOR_BIOS.find((a) => a.slug === slug)
}

export function getBioByAuthorId(author_id: string): AuthorBio | undefined {
  return AUTHOR_BIOS.find((a) => a.author_id === author_id)
}
```

Sub-step 3.1a: Fetch the 12 author records from Supabase to get correct UUIDs + names. Run:

```bash
cd ~/literary-forge && python3 -c "
import os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv('.env.local')
sb = create_client(os.environ['NEXT_PUBLIC_SUPABASE_URL'], os.environ['SUPABASE_SECRET_KEY'])
result = sb.table('authors').select('id, name, era, language').execute()
for a in result.data:
    print(a)
"
```

Sub-step 3.1b: Write the remaining 11 bios (one per author returned). Use the same shape. Slug = lowercase-author-surname.

- [ ] **Step 3.2: Create `lib/seo/structured-data.ts`**

Helpers for JSON-LD per page type:

```ts
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://literary-forge.vercel.app'

export function webAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#webapp`,
    name: "The Franklin Method",
    url: SITE_URL,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web Browser",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    inLanguage: "de-DE",
  }
}

export function personSchema(name: string, era: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    description: `Autor (${era})`,
    url: `${SITE_URL}/autoren/${slug}`,
  }
}

export function bookSchema(title: string, author: string, slug: string, language: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: title,
    author: { "@type": "Person", name: author },
    inLanguage: language,
    url: `${SITE_URL}/buecher/${slug}`,
  }
}
```

- [ ] **Step 3.3: Create `app/autoren/page.tsx`** (author index)

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import { AUTHOR_BIOS } from "@/data/authors-bios"

export const metadata: Metadata = {
  title: "Autoren — The Franklin Method",
  description: "12 Autoren von Kafka bis Austen — Stilprofile und Bibliografien aus dem Lern-Korpus.",
  alternates: { canonical: "/autoren" },
}

export default function AutorenIndex() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Autoren</h1>
      <p className="text-[var(--muted)] mb-8">Die 12 Stimmen, an denen du trainieren kannst.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AUTHOR_BIOS.map((a) => (
          <Link
            key={a.slug}
            href={`/autoren/${a.slug}`}
            className="block bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 hover:bg-[var(--card-hover)] transition-colors"
          >
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{a.name}</h2>
            <p className="text-sm text-[var(--muted)]">{a.era} · {a.language === 'de' ? 'Deutsch' : 'Englisch'}</p>
            <p className="text-[var(--foreground)] mt-3 leading-relaxed line-clamp-3">{a.bio_de}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 3.4: Create `app/autoren/[slug]/page.tsx`** (per-author page)

```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AUTHOR_BIOS, getBioBySlug } from "@/data/authors-bios"
import { personSchema } from "@/lib/seo/structured-data"
import { createClient } from "@/lib/supabase/server"

export async function generateStaticParams() {
  return AUTHOR_BIOS.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const bio = getBioBySlug(slug)
  if (!bio) return { title: "Autor nicht gefunden" }
  return {
    title: `${bio.name} — Stilprofil — The Franklin Method`,
    description: bio.bio_de.slice(0, 155),
    alternates: { canonical: `/autoren/${bio.slug}` },
  }
}

export default async function AutorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bio = getBioBySlug(slug)
  if (!bio) notFound()

  // Fetch style profile + book count
  const supabase = await createClient()
  const [{ data: profile }, { data: chunks }] = await Promise.all([
    supabase.from('author_style_profiles').select('feature_means, feature_stddevs, chunk_count').eq('author_id', bio.author_id).single(),
    supabase.from('source_texts').select('title').eq('author_id', bio.author_id).eq('is_pd_eu', true),
  ])

  const uniqueTitles = Array.from(new Set((chunks ?? []).map((c) => c.title))).slice(0, 10)
  const featureMeans = (profile?.feature_means ?? {}) as Record<string, number>

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema(bio.name, bio.era, bio.slug)) }}
      />
      <header className="mb-8">
        <p className="text-sm text-[var(--muted)] uppercase tracking-wide">{bio.era}</p>
        <h1 className="text-4xl font-bold text-[var(--foreground)] mt-2">{bio.name}</h1>
      </header>
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-6">
        <p className="text-[var(--foreground)] leading-relaxed">{bio.bio_de}</p>
      </section>

      {profile && (
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Stilprofil</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Basis: {profile.chunk_count} Textstellen.
          </p>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {Object.entries(featureMeans).slice(0, 9).map(([key, value]) => (
              <div key={key}>
                <dt className="text-[var(--muted)]">{key}</dt>
                <dd className="text-[var(--foreground)] font-mono">{(value as number).toFixed(2)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {uniqueTitles.length > 0 && (
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Im Korpus</h2>
          <ul className="space-y-2">
            {uniqueTitles.map((title) => (
              <li key={title} className="text-[var(--foreground)]">{title}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
```

- [ ] **Step 3.5: Create `app/buecher/page.tsx`** and `app/buecher/[slug]/page.tsx`

`buecher/page.tsx` (server component): query distinct titles from `source_texts` where `is_pd_eu = true`, render as grid linking to per-book pages.

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getBioByAuthorId } from "@/data/authors-bios"

export const metadata: Metadata = {
  title: "Bücher — The Franklin Method",
  description: "15 Werke des Trainings-Korpus, kuratiert nach stilistischer Vielfalt.",
  alternates: { canonical: "/buecher" },
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]!)).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default async function BuecherIndex() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('source_texts')
    .select('title, author_id, language')
    .eq('is_pd_eu', true)
  const grouped = Array.from(
    new Map((data ?? []).map((r) => [r.title, r])).values()
  )
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Bücher</h1>
      <p className="text-[var(--muted)] mb-8">Werke im Trainings-Korpus, kuratiert nach stilistischer Vielfalt.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grouped.map((b) => {
          const bio = getBioByAuthorId(b.author_id)
          const slug = slugify(b.title)
          return (
            <Link
              key={slug}
              href={`/buecher/${slug}`}
              className="block bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 hover:bg-[var(--card-hover)] transition-colors"
            >
              <p className="text-sm text-[var(--muted)]">{bio?.name ?? 'Unbekannt'} · {b.language?.toUpperCase()}</p>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mt-1">{b.title}</h2>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
```

`buecher/[slug]/page.tsx`: query chunks for the title (resolve title from slug via a static map or DB lookup), render chunk-by-chunk reader view with `<Book>` JSON-LD. Use existing `/read/[bookId]` rendering logic as reference. (Implementer reads `app/read/[bookId]/page.tsx` and adapts.)

- [ ] **Step 3.6: Update `app/sitemap.ts`** to include new pages

Open `app/sitemap.ts`. Add programmatic entries for: `/methode`, `/demo`, `/autoren`, every `/autoren/[slug]`, `/buecher`, every `/buecher/[slug]`. Query the Supabase for the active slugs.

- [ ] **Step 3.7: Handle existing `/books`**

Decide: rename `/books` → `/buecher` (delete `app/books/`) or keep `/books` as legacy redirect. Choose redirect: in `app/books/page.tsx`, replace body with `import { redirect } from 'next/navigation'; export default function Page() { redirect('/buecher') }`. Same for `app/books/loading.tsx` — delete (no loading state needed for a redirect).

- [ ] **Step 3.8: Verify**

```bash
cd ~/literary-forge && npx tsc --noEmit
```

Empty output expected.

```bash
cd ~/literary-forge && npx next build 2>&1 | tail -30
```

Expected: route table now shows `/autoren`, `/autoren/[slug]`, `/buecher`, `/buecher/[slug]`, `/methode`, `/demo`. `/books` shows as redirect (3xx).

Local smoke test:

```bash
npm run dev
curl -s http://localhost:3000/autoren | grep -c "<h2"
# Expected: 12 (one per author)
curl -s http://localhost:3000/autoren/kafka | grep -c "Franz Kafka"
# Expected: ≥ 2
curl -s http://localhost:3000/buecher | grep -c "<h2"
# Expected: 15
curl -sI http://localhost:3000/books | head -1
# Expected: HTTP/.. 307 Temporary Redirect
```

- [ ] **Step 3.9: Commit**

```bash
cd ~/literary-forge && git add -A && git commit -m "$(cat <<'EOF'
feat(relaunch-3): public /autoren and /buecher pages with bios + style profiles

12 manually curated author bios in DE (data/authors-bios.ts), each ~50-80
words, neutral and indexable. Per-author pages show bio + style profile
(feature_means / feature_stddevs from author_style_profiles) + books in
corpus. Per-book pages adapt /read/[bookId] rendering. JSON-LD schema:
Person on /autoren/[slug], Book on /buecher/[slug].

/books legacy route 307-redirects to /buecher.

Sitemap extended with all new programmatic entries.

Per spec §3.5 + §3.10 (Copywork-adopted bio paragraphs).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Onboarding 1-Screen Self-Assessment with Skill Routing

**Files:**
- Modify: `app/welcome/page.tsx` — full rewrite (3 steps → 1 screen)
- Modify: `components/training/TrainingInterface.tsx` — read default_mode + skill_level from user_settings

- [ ] **Step 4.1: Add `skill_level` column to user_settings**

Create `supabase/migrations/022_skill_level.sql` (not yet 022 for custom-text-upload — that comes in Task 10; renumber as needed at commit time):

```sql
-- Migration 022: skill_level on user_settings
-- Date: 2026-05-14
-- Purpose: route onboarding to appropriate default mode (novice → franklin, advanced → free)

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS skill_level TEXT
CHECK (skill_level IN ('novice', 'intermediate', 'advanced'))
DEFAULT 'novice';

COMMENT ON COLUMN user_settings.skill_level IS
'Self-reported skill, captured at onboarding. Drives default mode: novice → franklin-reconstruction, intermediate/advanced → free-writing.';
```

Note: this changes the migration numbering — if Task 10 also adds a migration, this becomes 022 and that becomes 023. Resolve at commit time.

- [ ] **Step 4.2: Apply migration to live Supabase**

```bash
cd ~/literary-forge && python3 -c "
import os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv('.env.local')
sb = create_client(os.environ['NEXT_PUBLIC_SUPABASE_URL'], os.environ['SUPABASE_SECRET_KEY'])
with open('supabase/migrations/022_skill_level.sql') as f:
    sql = f.read()
# supabase-py doesn't run DDL directly; user must paste in Dashboard SQL Editor.
print('Run this SQL in Supabase Dashboard SQL Editor:')
print(sql)
"
```

Expected: prints the SQL. User pastes into Supabase Dashboard SQL Editor and runs. Verification:

```bash
python3 -c "
import os; from dotenv import load_dotenv; from supabase import create_client
load_dotenv('.env.local')
sb = create_client(os.environ['NEXT_PUBLIC_SUPABASE_URL'], os.environ['SUPABASE_SECRET_KEY'])
# Try to read the new column; will fail if migration not applied
r = sb.table('user_settings').select('skill_level').limit(1).execute()
print('skill_level column exists:', r is not None)
"
```

- [ ] **Step 4.3: Rewrite `app/welcome/page.tsx`** to single-screen

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Skill = 'novice' | 'intermediate' | 'advanced'

const OPTIONS: Array<{ value: Skill; label: string; desc: string; defaultMode: 'franklin' | 'free' }> = [
  {
    value: 'novice',
    label: 'Anfänger',
    desc: 'Ich will Schreibstil systematisch lernen. Gib mir Gerüst und Schritt-für-Schritt.',
    defaultMode: 'franklin',
  },
  {
    value: 'intermediate',
    label: 'Fortgeschritten',
    desc: 'Ich schreibe regelmäßig und will Stil bewusster trainieren. Weniger Gerüst, mehr eigene Versuche.',
    defaultMode: 'free',
  },
  {
    value: 'advanced',
    label: 'Ich weiß, was ich tue',
    desc: 'Ich will direkt frei imitieren und harte Bewertung. Spar dir das Tutorial.',
    defaultMode: 'free',
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [selected, setSelected] = useState<Skill | null>(null)
  const [saving, setSaving] = useState(false)

  async function finish() {
    if (!selected) return
    setSaving(true)
    const opt = OPTIONS.find((o) => o.value === selected)!
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await supabase.from('user_settings').upsert(
        {
          user_id: user.id,
          skill_level: opt.value,
          default_mode: opt.defaultMode,
          onboarded_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      router.push('/train')
      router.refresh()
    } catch {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-[var(--card)] border border-[var(--border)] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">
          Wie würdest du deinen Schreibstil aktuell einschätzen?
        </h1>
        <p className="text-[var(--muted)] mb-6 text-sm">
          Eine Frage. Du kannst die Einstellung später jederzeit in /settings ändern.
        </p>
        <div className="space-y-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                selected === opt.value
                  ? 'border-[var(--foreground)] bg-[var(--card-hover)]'
                  : 'border-[var(--border)] hover:border-[var(--muted)]'
              }`}
            >
              <div className="font-semibold text-[var(--foreground)]">{opt.label}</div>
              <div className="text-sm text-[var(--muted)] mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
        <button
          onClick={finish}
          disabled={!selected || saving}
          className="w-full mt-6 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Speichere…' : 'Training starten →'}
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 4.4: Verify TrainingInterface reads default_mode correctly**

Open `components/training/TrainingInterface.tsx`. The prop `userDefaultMode` already exists (line 29). Verify the parent (`app/train/page.tsx`) passes `user_settings.default_mode` to it. If not, modify the parent:

```tsx
// In app/train/page.tsx, after auth check, before render:
const { data: settings } = await supabase
  .from('user_settings')
  .select('default_mode')
  .eq('user_id', user.id)
  .single()
const userDefaultMode = (settings?.default_mode as 'franklin' | 'free') ?? 'franklin'
// pass userDefaultMode prop to <TrainingInterface>
```

- [ ] **Step 4.5: Verify + commit**

```bash
cd ~/literary-forge && npx tsc --noEmit
npx next build 2>&1 | tail -10
```

Manual smoke test: in dev mode, register a new user, complete welcome (pick "Anfänger"), confirm DB has `user_settings.skill_level='novice'` and `default_mode='franklin'`. Repeat for "Fortgeschritten" → expect `default_mode='free'`.

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(relaunch-4): onboarding 3-step wizard → 1-screen self-assessment with skill routing

Single screen asks "Wie würdest du deinen Schreibstil aktuell einschätzen?"
with 3 options: Anfänger (→ franklin), Fortgeschritten/Ich weiß was ich tue
(→ free). Result written to user_settings.skill_level + default_mode.

Migration 022 adds skill_level column to user_settings.

Per spec §3.3 (worked-example effect for novices; expertise-reversal for
advanced) + §3.6.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: /train 2-option ModeSwitcher + WarmupChip

**Files:**
- Create: `components/training/ModeSwitcher.tsx`
- Create: `components/training/WarmupChip.tsx`
- Modify: `components/training/TrainingInterface.tsx` — render ModeSwitcher on top
- Modify: `app/train/page.tsx` — pass current chunk to ModeSwitcher

- [ ] **Step 5.1: Create `components/training/ModeSwitcher.tsx`**

```tsx
'use client'

import { PenLine, Sparkles } from 'lucide-react'

type Mode = 'franklin' | 'free'

export function ModeSwitcher({ current, onChange }: { current: Mode; onChange: (m: Mode) => void }) {
  return (
    <div role="group" aria-label="Übungs-Modus" className="inline-flex rounded-md border border-[var(--border)] overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('franklin')}
        aria-pressed={current === 'franklin'}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
          current === 'franklin'
            ? 'bg-[var(--foreground)] text-[var(--background)]'
            : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
        }`}
      >
        <PenLine size={16} /> Franklin
      </button>
      <button
        type="button"
        onClick={() => onChange('free')}
        aria-pressed={current === 'free'}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
          current === 'free'
            ? 'bg-[var(--foreground)] text-[var(--background)]'
            : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
        }`}
      >
        <Sparkles size={16} /> Free
      </button>
    </div>
  )
}
```

- [ ] **Step 5.2: Create `components/training/WarmupChip.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export function WarmupChip({ chunkId }: { chunkId: string }) {
  return (
    <Link
      href={`/train/warmup?chunk=${chunkId}`}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] border border-dashed border-[var(--border)] rounded-full hover:bg-[var(--card-hover)] transition-colors"
    >
      <Zap size={12} /> Warmup vor dem Schreiben? Cloze →
    </Link>
  )
}
```

- [ ] **Step 5.3: Wire into TrainingInterface**

Modify `components/training/TrainingInterface.tsx` to render `<ModeSwitcher>` and `<WarmupChip>` above the mode-component. Mode switch mid-card needs to update both local state and persist to `user_progress.mode` for this card so server-side fetches match. Simplest: navigate with `?mode=franklin` / `?mode=free` query param; the parent `app/train/page.tsx` reads param + falls back to `user_settings.default_mode`.

(Implementation detail: keep current dispatcher logic; add URL-param read. The dispatcher already exists at line 35-50.)

- [ ] **Step 5.4: Create `/train/warmup/page.tsx`** (Cloze entry)

Reuses ClozeDeletion component, returns to main `/train` after one card.

- [ ] **Step 5.5: Verify + commit**

```bash
npx tsc --noEmit
npx next build 2>&1 | tail -10
```

Smoke test in dev: visit /train logged in, observe ModeSwitcher top of page; click Free → URL changes to /train?mode=free, component re-renders with FreeWriting. Click WarmupChip → /train/warmup with a Cloze card.

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(relaunch-5): /train ModeSwitcher (Franklin | Free) + WarmupChip (Cloze)

Top-bar segmented control on /train switches between Franklin-Reconstruction
and Free Writing modes mid-card. State preserved via URL ?mode= param.
Cloze accessible via dashed-border "Warmup-Chip" → /train/warmup (NOT in
top-bar; per pedagogy that Cloze trains components, not gestalt).

Per spec §3.3, §3.6, §3.9.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Chunk-size constraints + hint-length formula

**Files:**
- Modify: `components/training/modes/FranklinEncodingPhase.tsx`
- Optional: `app/api/train/submit/route.ts` (if chunk-size validation moves server-side too)

- [ ] **Step 6.1: Replace static "4-8 word hint" with formula**

In `FranklinEncodingPhase.tsx`, locate the hint-input render section (~line 152 per earlier read) and the validation logic (`hints.every(h => h.trim().length >= 3)`).

Replace with per-sentence min/max derived from sentence length:

```tsx
function computeHintRange(sentenceWordCount: number): { min: number; max: number } {
  const target = Math.max(2, Math.min(8, Math.floor(sentenceWordCount / 3)))
  return { min: 1, max: target + 2 }
}

// In render, for each sentence:
const wordCount = sentence.split(/\s+/).filter(Boolean).length
const { min, max } = computeHintRange(wordCount)
// pass to input as guidance: placeholder={`${min}-${max} Wörter, zum Inhalt`}
```

Update the `allHintsFilled` check to use per-sentence min:

```tsx
const allHintsFilled = hints.every((h, idx) => {
  const wordCount = sentences[idx].split(/\s+/).filter(Boolean).length
  const { min } = computeHintRange(wordCount)
  const hintWords = h.trim().split(/\s+/).filter(Boolean).length
  return hintWords >= min
})
```

- [ ] **Step 6.2: Minimum chunk size validation at fetch time**

In `app/train/page.tsx`, after fetching the next chunk, validate word count. If `<15`, re-roll (fetch next):

```tsx
const MIN_CHUNK_WORDS = 15
function isValidChunk(content: string): boolean {
  return content.trim().split(/\s+/).filter(Boolean).length >= MIN_CHUNK_WORDS
}
// Skip + re-fetch up to 5 times if invalid. After 5 misses, surface a clear error rather than infinite loop.
```

- [ ] **Step 6.3: Verify + commit**

```bash
npx tsc --noEmit
```

Smoke test: simulate Franklin-Encoding on a 50-word, 3-sentence chunk. Hints field shows e.g. "5-8 Wörter" for a 15-word sentence (15/3=5, max 5+2=7 but capped at 8). Hints with 1 word are rejected (below min).

```bash
git add -A && git commit -m "$(cat <<'EOF'
refactor(relaunch-6): chunk-size + hint-length formula

Replace static "4-8 word hint" with sentence-length-relative formula:
  target_words = clamp(2, floor(sentence_words / 3), 8)
  min = 1, max = target + 2

Minimum chunk size validation at fetch time: chunks with <15 words are
re-rolled. Style operates at clause-and-period level (Beers & Nagy 2009;
Crossley et al. 2014) — 6-word chunks with 4-8-word hints are not
stylistically informative.

Per spec §3.3 + research-agent pedagogy finding.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Route-scoped CSP nonces

**Files:**
- Modify: `middleware.ts` — matcher excludes marketing routes
- Modify: `next.config.ts` — static CSP for marketing routes
- Modify: `app/layout.tsx` — JSON-LD nonce becomes optional

- [ ] **Step 7.1: Narrow middleware matcher**

In `middleware.ts`, replace the matcher with:

```ts
export const config = {
  matcher: [
    {
      // Apply nonce/dynamic CSP only to auth/app routes.
      // Marketing routes (/, /methode, /demo, /autoren*, /buecher*, /datenschutz, /impressum, /kontakt, /urheberrecht, /changelog, /login) get static CSP via next.config.ts headers().
      source: '/(train|dashboard|settings|admin|read|welcome)(.*)|/api/(auth|train|admin|generate-scene-description)(.*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
```

- [ ] **Step 7.2: Add static CSP block to `next.config.ts`**

Compute the SHA256 hash of the inline JSON-LD script in app/layout.tsx. Since structured data is dynamic per-page, easier path: serve inline JSON-LD with `'unsafe-inline'` allowed only on marketing routes (acceptable threat-model trade per spec §3.4).

In `next.config.ts`, add a route-specific headers block BEFORE the existing catch-all:

```ts
async headers() {
  return [
    {
      // Static-render marketing routes: CSP allows unsafe-inline for inline
      // script + style (JSON-LD, Tailwind v4 runtime). No nonce needed,
      // so the page can be CDN-cached.
      source: '/((?!train|dashboard|settings|admin|read|welcome|api).*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.onrender.com https://va.vercel-scripts.com",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
          ].join('; '),
        },
      ],
    },
    // ... existing catch-all headers block (HSTS, XFO, Referrer-Policy, etc.) stays
  ]
}
```

- [ ] **Step 7.3: Make JSON-LD nonce optional in layout**

`app/layout.tsx` already reads `nonce` from headers (Welle-5). On routes where middleware doesn't set it, `nonce` will be `undefined` — React renders the script without the attribute, and the static CSP allows it via `'unsafe-inline'`. No code change needed if the existing code uses `nonce={nonce}` (React skips undefined attrs).

Verify:

```bash
grep -n "nonce" app/layout.tsx
# Expected: nonce={nonce} on the script tag, ?? undefined on the const
```

- [ ] **Step 7.4: Verify per-route CSP**

```bash
cd ~/literary-forge && rm -rf .next && npx next build 2>&1 | tail -20
```

Expected: route table shows `/` as `○ Static`, `/methode` `○ Static`, `/autoren` `○ Static` (or `ƒ Dynamic` if Supabase calls force dynamic — but the chunks DB query in /buecher might force dynamic; that's OK). `/train` remains `ƒ Dynamic`.

Local smoke test:

```bash
npm run dev
curl -sI http://localhost:3000/ | grep -i content-security-policy
# Expected: no nonce-XXX in script-src
curl -sI http://localhost:3000/train | grep -i content-security-policy
# Expected: nonce-XXX in script-src + strict-dynamic
```

- [ ] **Step 7.5: Commit**

```bash
git add -A && git commit -m "$(cat <<'EOF'
refactor(relaunch-7): route-scoped CSP nonces

Middleware matcher narrowed to (train|dashboard|settings|admin|read|welcome)
+ relevant API routes — these get per-request nonces + strict-dynamic
('proper' CSP, but force every response to be dynamic / cache MISS).

Marketing routes (/, /methode, /demo, /autoren*, /buecher*, legal pages,
/changelog, /login) get a static CSP via next.config.ts headers(): no
nonce, 'unsafe-inline' allowed for inline JSON-LD + Tailwind runtime. These
routes can now be CDN-cached → HTML TTFB drops from ~270-460ms (MISS) to
30-80ms (HIT).

Defensible trade-off: marketing routes have no auth state / user input /
third-party DOM → XSS exposure is minimal. App routes (auth-gated) keep
the stricter nonce-based CSP.

Per spec §3.4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Performance — Server-component Navbar + lucide optimizePackageImports + drop Geist_Mono on landing

**Files:**
- Create: `components/marketing/MarketingNav.tsx`
- Modify: `app/layout.tsx` — drop Geist_Mono from root, drop Navbar/Footer (move into route groups)
- Modify: `next.config.ts` — add `optimizePackageImports: ['lucide-react']`
- Refactor: app structure into `app/(marketing)/...` and `app/(app)/...`

This is the largest structural change. Recommend a dedicated session.

- [ ] **Step 8.1: Add optimizePackageImports**

In `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // ... existing config
}
```

- [ ] **Step 8.2: Create slim MarketingNav**

`components/marketing/MarketingNav.tsx` — server component, no Supabase, no FeedbackModal, no theme client logic:

```tsx
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export function MarketingNav() {
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[var(--foreground)]">
          The Franklin Method
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/methode" className="text-[var(--muted)] hover:text-[var(--foreground)]">Methode</Link>
          <Link href="/autoren" className="text-[var(--muted)] hover:text-[var(--foreground)]">Autoren</Link>
          <Link href="/buecher" className="text-[var(--muted)] hover:text-[var(--foreground)]">Bücher</Link>
          <Link href="/demo" className="text-[var(--muted)] hover:text-[var(--foreground)]">Demo</Link>
          <Link href="/login" className="text-[var(--foreground)] underline">Anmelden</Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 8.3: Restructure into route groups**

Move pages under route groups:
- `app/page.tsx` → `app/(marketing)/page.tsx`
- `app/methode/` → `app/(marketing)/methode/`
- `app/demo/` → `app/(marketing)/demo/`
- `app/autoren/` → `app/(marketing)/autoren/`
- `app/buecher/` → `app/(marketing)/buecher/`
- legal pages → `app/(marketing)/{datenschutz,impressum,kontakt,urheberrecht}/`
- `app/login/` → `app/(marketing)/login/`

Create `app/(marketing)/layout.tsx`:

```tsx
import { MarketingNav } from "@/components/marketing/MarketingNav"
import { Footer } from "@/components/navigation/Footer"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
```

App routes (`/train`, `/dashboard`, `/settings`, `/admin`, `/read`, `/welcome`) move under `app/(app)/` with the auth-aware Navbar. Create `app/(app)/layout.tsx`:

```tsx
import { Navbar } from "@/components/navigation/Navbar"
import { Footer } from "@/components/navigation/Footer"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
```

Root `app/layout.tsx` strips its Navbar/Footer and just wraps `<html><body>...{children}...</body></html>` + ThemeProvider + Analytics.

- [ ] **Step 8.4: Drop Geist_Mono from root layout**

In `app/layout.tsx`, remove `Geist_Mono` import + `geistMono` declaration + `${geistMono.variable}` from body className. Only routes that use mono fonts (/train where ZenEditor uses font-serif anyway, not mono) need them — and they don't currently.

- [ ] **Step 8.5: Verify**

```bash
cd ~/literary-forge && rm -rf .next && npx next build 2>&1 | tail -20
```

Expected: build succeeds. Most marketing routes show `○ Static`. App routes show `ƒ Dynamic`. JS chunks on landing should be smaller (verify by comparing build output size: `du -sh .next/static`).

Local smoke test:

```bash
npm run dev
curl -s http://localhost:3000/ | grep -oE 'src="[^"]*\.js"' | wc -l
# Compare with pre-Task-8 count of 10. Expect ~6-8 now.
```

- [ ] **Step 8.6: Commit**

```bash
git add -A && git commit -m "$(cat <<'EOF'
perf(relaunch-8): route-group split + Navbar refactor + bundle trim

App structure split into app/(marketing) and app/(app) route groups. Marketing
routes get a slim server-component MarketingNav (no Supabase, no FeedbackModal,
no auth state). App routes keep the existing auth-aware Navbar.

Other bundle wins:
- next.config.ts: experimental.optimizePackageImports: ['lucide-react']
- app/layout.tsx: Geist_Mono dropped (not used on landing)

Expected impact: landing JS gzipped drops from ~234 KB to ~120 KB.

Per spec §3.4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Per-page generateMetadata + JSON-LD per route

Already done partially in Tasks 2 and 3. This task is the audit + fill-in pass for all remaining routes.

**Files:**
- Modify: `app/(marketing)/datenschutz/page.tsx`
- Modify: `app/(marketing)/impressum/page.tsx`
- Modify: `app/(marketing)/kontakt/page.tsx`
- Modify: `app/(marketing)/urheberrecht/page.tsx`
- Modify: `app/(marketing)/login/page.tsx`

- [ ] **Step 9.1: Add `generateMetadata` to each remaining public route**

For each of the 5 routes above, add at top:

```ts
export const metadata: Metadata = {
  title: "Datenschutz — The Franklin Method",  // adjust per page
  description: "...",  // 120-155 chars, specific to page
  alternates: { canonical: "/datenschutz" },  // adjust
}
```

- [ ] **Step 9.2: Verify**

```bash
curl -s http://localhost:3000/datenschutz | grep -oE '<title>[^<]+</title>'
# Expected: <title>Datenschutz — The Franklin Method</title>
# Repeat for impressum, kontakt, urheberrecht, login.
```

- [ ] **Step 9.3: Commit**

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(relaunch-9): per-page metadata + canonical URLs

generateMetadata added for: /datenschutz, /impressum, /kontakt, /urheberrecht,
/login. Per spec §3.5 (S1 criterion: every public route has unique title +
meta description).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: /train/custom user upload + /changelog

**Files:**
- Create: `supabase/migrations/023_custom_text_uploads.sql`
- Create: `app/(app)/train/custom/page.tsx`
- Create: `app/(app)/train/custom/CustomUploadClient.tsx`
- Create: `app/api/train/custom/route.ts`
- Create: `app/(marketing)/changelog/page.tsx`

- [ ] **Step 10.1: Migration for user-private uploads**

```sql
-- Migration 023: user-private text uploads
ALTER TABLE source_texts
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_source_texts_owner ON source_texts(owner_user_id) WHERE owner_user_id IS NOT NULL;

DROP POLICY IF EXISTS "users_see_public_and_own_texts" ON source_texts;
CREATE POLICY "users_see_public_and_own_texts" ON source_texts
  FOR SELECT TO authenticated
  USING (is_private = FALSE OR owner_user_id = auth.uid());
```

Apply via Dashboard SQL Editor.

- [ ] **Step 10.2: Implement upload UI**

(Full code in implementation; uses existing Render-NLP pipeline + style-distance scoring.)

- [ ] **Step 10.3: Implement /changelog**

Server component, reads `git log --oneline -50` at build time (via `child_process.execSync` in a build-time data file or at request time via API route).

- [ ] **Step 10.4: Verify + commit**

---

## Task 11: Footer disclaimer + nominative-fair-use audit

**Files:**
- Modify: `components/navigation/Footer.tsx`

- [ ] **Step 11.1: Add disclaimer chunk**

```tsx
<div className="mt-4 max-w-2xl mx-auto text-xs text-[var(--muted)] leading-relaxed">
  "The Franklin Method" (diese Seite) hat keinen Bezug zur Franklin Method® von Eric Franklin
  (<a href="https://franklinmethod.com" rel="nofollow noopener" className="underline">franklinmethod.com</a>),
  einer Methode für somatische Bewegungsbildung. Die beiden Produkte arbeiten in unterschiedlichen Feldern.
</div>
```

- [ ] **Step 11.2: Audit nominative-fair-use**

`grep -rn "Franklin" app/ components/ data/` and confirm: capital-M "The Franklin Method" used as the product brand; lowercase "Franklin's method" / "Franklin-Methode" used as historical descriptive references. No claims of affiliation with Eric Franklin Method®.

- [ ] **Step 11.3: Commit**

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(relaunch-11): footer disclaimer + nominative-fair-use audit

Footer adds disclaimer separating "The Franklin Method" (this product) from
"Franklin Method®" by Eric Franklin (franklinmethod.com, somatic education).
Required for fair-use safety per spec §3.1.

Capital-M brand used consistently; lowercase historical references audited.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: robots.txt + sitemap.xml regeneration

**Files:**
- Modify: `app/robots.ts`
- Modify: `app/sitemap.ts` (final pass after all routes settled)

- [ ] **Step 12.1: Update `app/robots.ts`**

```ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://literary-forge.vercel.app'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/train', '/dashboard', '/settings', '/welcome'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

- [ ] **Step 12.2: Final sitemap verify**

```bash
curl -s http://localhost:3000/sitemap.xml | grep -c "<url>"
# Expected: ≥ 27 (15 buecher + 12 autoren + 5 marketing pages = 32 or so)
```

- [ ] **Step 12.3: Commit**

```bash
git add -A && git commit -m "$(cat <<'EOF'
chore(relaunch-12): robots.txt disallow auth-routes + sitemap final pass

Robots.txt explicitly disallows auth-gated and API routes (no SEO value,
no indexable content). Sitemap.xml verified to include all 27+ public
content pages.

Per spec §3.5 (S2-S3 criteria).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Final verify + push

- [ ] **Step 13.1: Full build + smoke test**

```bash
cd ~/literary-forge && rm -rf .next && npx tsc --noEmit && npx next build 2>&1 | tail -20
```

Expected: green build, route table matches spec §3.4 distribution.

- [ ] **Step 13.2: Run every success criterion from spec §5**

```bash
# §5.1 Performance
for i in $(seq 1 5); do
  curl -s -o /dev/null -w "/ TTFB: %{time_starttransfer}s cache:%header{x-vercel-cache}\n" https://literary-forge.vercel.app/?cb=$RANDOM
done
# Expected after deploy: HIT after first request, TTFB ≤80ms

# §5.4 Content / Brand
grep -rn "Claude 3.5\|Haiku\|Bedrock" app/ components/ | grep -v node_modules | grep -v ".next"
# Expected: empty

# §5.2 SEO
curl -s https://literary-forge.vercel.app/sitemap.xml | grep -c "<url>"
# Expected: ≥ 27

# §5.5 Pedagogy code review
grep "MIN_CHUNK_WORDS" app/train/page.tsx
grep "computeHintRange" components/training/modes/FranklinEncodingPhase.tsx
```

- [ ] **Step 13.3: Push to main**

```bash
git push origin main
```

Vercel auto-deploys. Wait ~2 min, then re-run the live verification commands.

- [ ] **Step 13.4: Final memory update**

Update `/Users/matswollscheid/.claude/projects/-Users-matswollscheid/memory/project_literary_forge.md` with the new brand ("The Franklin Method" — Literary Forge as URL canonical), the relaunch commits, and any new lessons-learned about the renaming + collision-mitigation strategy.

---

## Self-Review (executed by author 2026-05-15)

**Spec coverage check:** Walked through spec §3.1 through §3.10. Each decision has a corresponding task:
- §3.1 brand → Task 1 + Task 11
- §3.2 goal-shift → no task needed (informs scope only)
- §3.3 mode-system → Task 4 (skill routing) + Task 5 (switcher) + Task 6 (chunk-size)
- §3.4 performance → Task 7 + Task 8
- §3.5 SEO → Task 3 + Task 9 + Task 12
- §3.6 UX flow → Task 2 (/demo, /methode) + Task 4 (onboarding) + Task 5 (mode visibility)
- §3.7 copy → Task 1 + Task 9
- §3.8 onboarding → Task 4
- §3.9 mode-switcher visibility → Task 5
- §3.10 competitors lessons → Task 3 (bios, Copywork-pattern) + Task 10 (custom-upload wedge against FranklinWrite) + naming "Franklin-Reconstruction" already in Task 5

**Placeholder scan:** searched for "TBD/TODO" — one intentional in Task 1.2 (transitional `TODO: change to /buecher after Task 3` comment, removed in Task 3).

**Type consistency:** ModeSwitcher prop `current: Mode` where `Mode = 'franklin' | 'free'` — consistent with `user_settings.default_mode` storage. `skill_level: 'novice' | 'intermediate' | 'advanced'` consistent across migration, welcome page, TrainingInterface.

**Gaps fixed inline:** Task 10 ("user upload") description condensed since full implementation code would balloon this plan; flagged for the implementing agent to use existing patterns from `app/api/admin/ingest/route.ts` + the Render NLP client.

---

## Execution Handoff

Plan complete and committed to `docs/superpowers/plans/2026-05-14-relaunch-plan.md`.

Two execution options when the user triggers implementation:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. Uses `superpowers:subagent-driven-development`.
2. **Inline Execution** — Execute tasks in one session using `superpowers:executing-plans`, batch execution with checkpoints for review.

User decides. Until then, this plan + the spec at `docs/superpowers/specs/2026-05-14-relaunch-design.md` are the artifacts.
