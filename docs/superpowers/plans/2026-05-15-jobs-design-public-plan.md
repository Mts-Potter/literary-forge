# Jobs-Eleganz-Pass Public-Surface — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution. Steps use checkbox (`- [ ]`) syntax. **No TDD** — Projekt-Konvention ist Live-Verify per `tsc`/`grep`/`curl` analog qol-Wellen. Ein Commit pro Welle.

**Goal:** Public-Surface auf editorial-Luxus-Aesthetik (Jobs + Rams + Editorial-Hotel-Web) trimmen: Fraunces-Display-Serif, warm-neutrale Palette, Element-Pruning, Editorial-Re-Layouts.

**Architecture:** Drei sequentielle Wellen analog qol-Pattern. A = Foundation (Theme-Tokens + Fraunces-Font im `app/layout.tsx` + `globals.css`-Variables). B = Reduction (Emojis + Card-Grids + glitzy CTAs entfernen). C = Layout (Editorial-Restructure + Brand-Reste-Migration). Auth-Surface bleibt unangetastet.

**Tech Stack:** Next.js 16.1 App Router · TypeScript · Tailwind v4 (CSS-`@theme`-Direktive) · `next/font/google` für Fraunces · next-themes (class strategy) bleibt.

**Spec:** `docs/superpowers/specs/2026-05-15-jobs-design-public.md`

---

## Welle jobs-A — Foundation

### Task A1: Fraunces-Font im Root-Layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Fraunces-Import via `next/font/google`**

Im Imports-Block ergänzen:
```tsx
import { Fraunces } from "next/font/google"
```

Nach `geistMono`-Konstante einfügen:
```tsx
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
})
```

Body-Class-Liste erweitern (Z. 86):
```tsx
className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased min-h-screen flex flex-col`}
```

### Task A2: Globale CSS-Tokens auf warm-neutrale Palette

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Light + Dark Theme Tokens**

Ersetze Z. 5-21 komplett:
```css
:root {
  --background: #faf7f0;
  --foreground: #1a1612;
  --border: #e8e2d6;
  --card: #fbf9f3;
  --card-hover: #f0ebe0;
  --muted: #756c5d;
  --accent: #b69876;
}

.dark {
  --background: #1a1612;
  --foreground: #f4f1eb;
  --border: #2e2922;
  --card: #221d18;
  --card-hover: #2a241e;
  --muted: #a39989;
  --accent: #b69876;
}
```

- [ ] **Step 2: Theme-inline + Body**

Ersetze Z. 23-34:
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-display: var(--font-fraunces);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}
```

### Task A3: Verifizieren keine Hardcode-Farben regressionen

- [ ] **Step 1: Verbleibende Tailwind-Color-Klassen finden**

Run: `cd ~/literary-forge && grep -rn 'text-blue-\|bg-blue-\|text-green-\|bg-green-\|text-red-\|bg-red-\|text-yellow-\|bg-yellow-' app/ components/ --include='*.tsx'`
Expected: Liste der Stellen.

- [ ] **Step 2: Bewerten + ersetzen**

Für jeden Treffer entscheiden: bleibt (z.B. Score-Band-Farben in FeedbackView — semantisch funktional), oder ersetzt durch `var(--accent)` / `text-[var(--muted)]`. Auth-Surface (FeedbackView Score-Bands, dashboard streak-emoji-fallback) bleibt unangetastet — Spec §5 Non-Goal.

### Task A4: Welle jobs-A commit

- [ ] **Step 1: Tsc-Check**

Run: `cd ~/literary-forge && rm -rf .next/types && npx tsc --noEmit 2>&1 | head -20`
Expected: 0 errors.

- [ ] **Step 2: Commit**

Run:
```bash
cd ~/literary-forge && git add -A && git commit -m "$(cat <<'EOF'
feat(jobs-A): foundation — Fraunces serif + warm-neutral palette

- next/font/google Fraunces variable (300-500, latin, italic) eingebunden
- CSS-Tokens auf warm-neutrale Palette (#faf7f0/#1a1612 light, #1a1612/#f4f1eb dark)
- einziger Akzent #b69876 (warm gold)
- --font-display Tailwind-Token verfügbar

Layouts unverändert, nur Farben + Schrift-Stack.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Welle jobs-B — Reduction

### Task B1: `/` Landing — 3-Feature-Card-Grid + Emojis raus

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Entferne Karten-Grid Z. 83-107**

Vollständig löschen:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full">
  <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors">
    <div className="text-4xl mb-3">🔄</div>
    ...
  </div>
  ...
</div>
```

- [ ] **Step 2: Body-Hervorhebungen trimmen**

Ersetze Z. 50-57 (Body-Block):
```tsx
<div className="max-w-2xl space-y-6 text-lg text-[var(--muted)] leading-relaxed">
  <p>
    Eine alte Methode, ein neues Medium. Du übst mit Passagen von Kafka, Mann, Austen, Fitzgerald — schreibst sie aus dem Gedächtnis, und bekommst eine ehrliche Rückmeldung zu Satzbau, Rhythmus, Wortwahl und Ton.
  </p>
</div>
```

(Ein Absatz statt zwei. Keine `<strong>`. Keine Aufzählung der Techniken — die wandert in Welle C als Fußnote.)

- [ ] **Step 3: CTA glitter raus**

Ersetze Z. 60-66:
```tsx
<Link
  href="/demo"
  className="inline-flex items-center gap-3 pb-2 text-base font-medium text-[var(--foreground)] border-b border-[var(--foreground)] hover:gap-4 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-200"
>
  Demo ansehen
  <span aria-hidden>→</span>
</Link>
```

(Keine `bg-foreground`, kein `shadow-2xl`, kein `hover:scale-105`.)

### Task B2: `/autoren` Index — Card-Grid → Liste

**Files:**
- Modify: `app/autoren/page.tsx`

- [ ] **Step 1: Card-Grid durch Listen-Pattern ersetzen**

Datei zuerst lesen, dann den `<div className="grid ...">`-Block durch:
```tsx
<ul className="divide-y divide-[var(--border)]">
  {authors.map(a => (
    <li key={a.slug}>
      <Link
        href={`/autoren/${a.slug}`}
        className="flex items-baseline justify-between gap-6 py-6 group"
      >
        <div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-light text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
            {a.name}
          </h2>
          {a.bioSnippet && (
            <p className="text-sm text-[var(--muted)] mt-1">{a.bioSnippet}</p>
          )}
        </div>
        <div className="text-xs font-mono text-[var(--muted)] whitespace-nowrap">
          {a.chunkCount} Chunks
        </div>
      </Link>
    </li>
  ))}
</ul>
```

(`a.bioSnippet` — falls in `authors-bios.ts` ein Snippet-Field existiert, sonst fallback auf erste 80 Zeichen der Bio.)

- [ ] **Step 2: Index-Header trimmen**

Falls die Page einen Header mit großer Headline + Subtext + grid hat: Headline auf Fraunces:
```tsx
<h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-light text-[var(--foreground)] mb-2">
  Autoren
</h1>
<p className="text-sm text-[var(--muted)] mb-12">
  Zwölf Stimmen, ein Korpus. Lesen, imitieren, vergleichen.
</p>
```

### Task B3: `/buecher` Index — Card-Grid → Liste

**Files:**
- Modify: `app/buecher/page.tsx`

- [ ] **Step 1: Card-Grid durch Listen-Pattern ersetzen**

Analog Task B2:
```tsx
<ul className="divide-y divide-[var(--border)]">
  {books.map(b => (
    <li key={b.slug}>
      <Link
        href={`/buecher/${b.slug}`}
        className="flex items-baseline justify-between gap-6 py-6 group"
      >
        <div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-light text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
            {b.title}
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {b.author}
            {b.year ? ` · ${b.year}` : ''}
            {b.language ? ` · ${b.language === 'de' ? 'Deutsch' : 'Englisch'}` : ''}
            {b.cefr_level ? ` · ${b.cefr_level}` : ''}
          </p>
        </div>
        <div className="text-xs font-mono text-[var(--muted)] whitespace-nowrap">
          {b.chunkCount} Chunks
        </div>
      </Link>
    </li>
  ))}
</ul>
```

(Sprache als Wort statt Emoji-Flagge.)

- [ ] **Step 2: Headline auf Fraunces**

Analog B2-Step-2:
```tsx
<h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-light text-[var(--foreground)] mb-2">
  Bücher
</h1>
<p className="text-sm text-[var(--muted)] mb-12">
  Zwölf gemeinfreie Werke, in Chunks geschnitten und stilometrisch vermessen.
</p>
```

### Task B4: `/buecher/[slug]` Per-Buch — Card-Boxes weg

**Files:**
- Modify: `app/buecher/[slug]/page.tsx`

- [ ] **Step 1: Card-Boxen um Excerpt/Related entfernen**

Lese die Datei. Entferne umgebende `<div className="bg-[var(--card)] border …">`-Wrapper um den Excerpt-Block und Related-Block. Excerpt direkt in den Page-Flow.

- [ ] **Step 2: Related-Works als Liste**

Ersetze ggf. ein Card-Grid für Related durch:
```tsx
<ul className="mt-12 space-y-3 text-sm">
  {related.map(r => (
    <li key={r.slug}>
      <Link
        href={`/buecher/${r.slug}`}
        className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
      >
        {r.title} <span className="text-[var(--muted)]">— {r.author}</span>
      </Link>
    </li>
  ))}
</ul>
```

### Task B5: `/autoren/[slug]` Per-Autor — Sigma-Bars inline

**Files:**
- Modify: `app/autoren/[slug]/page.tsx`

- [ ] **Step 1: Sigma-Bar-Wrapper-Card entfernen**

Den umgebenden Card-Wrapper um die Sigma-Bar-Visualisierung entfernen, sodass die Bars direkt im Text-Fluss stehen — keine Box, kein Border, kein eigenes Background. Eyebrow „Stil im Vergleich zum Korpus" als Fraunces-italic-Subtitle direkt darüber.

- [ ] **Step 2: Werkliste als Liste statt Card-Grid**

Werkliste analog B2-Step-1 (Werk-Titel als Fraunces, Year/Chunks als sans/mono-muted, ohne Card-Box).

### Task B6: Emoji-Sweep alle anderen Public-Pages

**Files:**
- Modify: `app/methode/page.tsx`, `app/demo/DemoClient.tsx`, `app/page.tsx`

- [ ] **Step 1: Inventar**

Run: `grep -rn '🔄\|📊\|🤖\|📚\|🇩🇪\|🇬🇧\|✅\|🎉\|⏰\|⚡\|🔥\|😴\|👤\|💡' app/page.tsx app/methode/ app/demo/ app/autoren/ app/buecher/ app/login/ app/welcome/`

- [ ] **Step 2: Treffer entfernen**

Pro Treffer: das Emoji-Span/Div löschen. Falls es eine Aufzähl-Box war, ersetze die Box durch reinen Text mit `<dt>/<dd>` oder typografische Zwischenüberschrift in Fraunces-italic.

- [ ] **Step 3: Sub-Audit**

Run: `grep -rn '🔄\|📊\|🤖\|📚\|🇩🇪\|🇬🇧' app/page.tsx app/methode/ app/demo/DemoClient.tsx app/autoren/ app/buecher/`
Expected: 0 Treffer.

### Task B7: Welle jobs-B commit

- [ ] **Step 1: Tsc-Check + Akzeptanz-Grep**

Run: `cd ~/literary-forge && npx tsc --noEmit 2>&1 | head -10`
Expected: 0 errors.

Run: `grep -rin 'text-4xl mb-3.*🔄\|text-4xl mb-3.*📊\|text-4xl mb-3.*🤖' app/ 2>&1`
Expected: 0 Treffer.

- [ ] **Step 2: Commit**

Run:
```bash
cd ~/literary-forge && git add -A && git commit -m "$(cat <<'EOF'
feat(jobs-B): reduction — Emojis, Feature-Cards, glitzy CTAs raus

Public-Pages:
- / Landing: 3-Card-Grid (🔄 SRS / 📊 Stilometrie / 🤖 KI-Feedback) ersatzlos gestrichen,
  Body trimmen, CTA von shadow-2xl/scale-105/bg-foreground zu schmaler Underline-Link
- /autoren Index: Card-Grid → Listen-Pattern (Titel Fraunces, Bio-Snippet Sans, chunks mono rechts)
- /buecher Index: Card-Grid → Liste, Sprache als Wort statt Emoji-Flagge
- /buecher/[slug]: Card-Wrapper um Excerpt + Related entfernt, Related als Liste
- /autoren/[slug]: Sigma-Bar inline in Text-Fluss (keine Wrapper-Card), Werkliste als Liste
- Globaler Emoji-Sweep: 🔄 📊 🤖 📚 🇩🇪 🇬🇧 etc. auf Public-Surface entfernt

Layout-Architektur unverändert, nur Pruning.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Welle jobs-C — Layout

### Task C1: `/` Editorial-Restructure

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Vertikale Editorial-Komposition statt zentrierte Mitte-Stage**

Ersetze die gesamte `<main>`-Struktur durch:
```tsx
<main className="min-h-screen bg-[var(--background)] flex flex-col">
  <div className="flex-1 flex flex-col justify-center max-w-2xl px-8 md:px-16 py-24">
    <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--muted)] mb-14">
      est. 1722 · benjamin franklin
    </div>

    <h1 className="font-[family-name:var(--font-fraunces)] font-light text-[clamp(48px,7.5vw,96px)] leading-[0.98] tracking-[-0.018em] text-[var(--foreground)]">
      Schreibstil lernen,
      <br />
      <em className="font-light italic">
        wie Franklin sich&nbsp;selbst&nbsp;beibrachte.
      </em>
    </h1>

    <p className="font-[family-name:var(--font-fraunces)] italic font-light text-xl text-[var(--muted)] leading-snug mt-6 max-w-xl">
      Eine alte Methode, ein neues Medium. Lesen, vergessen, rekonstruieren — und nach jedem Versuch eine ehrliche Rückmeldung.
    </p>

    <p className="text-base text-[var(--muted)] leading-relaxed mt-16 max-w-xl">
      Du übst mit Passagen aus Kafka, Mann, Austen, Fitzgerald. Du schreibst sie aus dem Gedächtnis. Was dabei herauskommt, wird zeilenweise mit dem Original verglichen — Satzbau, Rhythmus, Wortwahl, Ton.
    </p>

    <div className="flex items-center gap-8 flex-wrap mt-14">
      <Link
        href="/demo"
        className="inline-flex items-center gap-3 pb-2 text-[15px] font-medium text-[var(--foreground)] border-b border-[var(--foreground)] hover:gap-4 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-200"
      >
        Demo ansehen
        <span aria-hidden>→</span>
      </Link>
      <div className="flex gap-7 text-[13px] text-[var(--muted)]">
        <Link href="/methode" className="hover:text-[var(--foreground)] transition-colors">Methode</Link>
        <Link href="/buecher" className="hover:text-[var(--foreground)] transition-colors">Bücher</Link>
        <Link href="/login" className="hover:text-[var(--foreground)] transition-colors">Anmelden</Link>
      </div>
    </div>

    <p className="font-[family-name:var(--font-fraunces)] italic text-[13px] text-[var(--muted)] leading-relaxed mt-auto pt-16 max-w-md">
      — Spaced Repetition, Stilometrie, qualitatives Lektorat — die Maschinerie steht im Hintergrund. Auf der Bühne stehen die Texte.
    </p>
  </div>
</main>
```

### Task C2: `/autoren/[slug]` Editorial-Hero

**Files:**
- Modify: `app/autoren/[slug]/page.tsx`

- [ ] **Step 1: Hero-Block**

Ersetze den Hero (Name + Bio) durch:
```tsx
<header className="mb-16 max-w-2xl">
  <h1 className="font-[family-name:var(--font-fraunces)] font-light text-[clamp(40px,6vw,72px)] leading-[1.02] tracking-[-0.015em] text-[var(--foreground)]">
    {author.name}
  </h1>
  {author.lifespan && (
    <p className="text-sm text-[var(--muted)] mt-3">{author.lifespan}</p>
  )}
  <p className="text-base text-[var(--foreground)] leading-relaxed mt-10 max-w-xl">
    {author.bio}
  </p>
</header>
```

- [ ] **Step 2: „Stil im Vergleich"-Section**

Direkt unter Hero (statt Card-Box):
```tsx
<section className="mb-16 max-w-2xl">
  <p className="font-[family-name:var(--font-fraunces)] italic text-base text-[var(--muted)] mb-6">
    — Stil im Vergleich zum Korpus
  </p>
  {/* existing Sigma-Bar-Component, aber ohne umgebende Card */}
  <div className="space-y-3">
    {sigmaBars}
  </div>
</section>
```

### Task C3: `/buecher/[slug]` Editorial-Hero + Excerpt

**Files:**
- Modify: `app/buecher/[slug]/page.tsx`

- [ ] **Step 1: Hero + Excerpt**

Ersetze Hero-Bereich durch:
```tsx
<header className="mb-12 max-w-2xl">
  <h1 className="font-[family-name:var(--font-fraunces)] font-light text-[clamp(40px,6vw,72px)] leading-[1.02] tracking-[-0.015em] text-[var(--foreground)]">
    {book.title}
  </h1>
  <p className="text-sm text-[var(--muted)] mt-3">
    {book.author}{book.year ? ` · ${book.year}` : ''}
  </p>
</header>

<article className="font-[family-name:var(--font-fraunces)] text-lg leading-[1.7] text-[var(--foreground)] max-w-2xl">
  {excerpt}
</article>
```

- [ ] **Step 2: Related-Works als minimale Liste**

(Ggf. schon in B4 erledigt; hier sicherstellen, keine Cards verbleiben.)

### Task C4: `/login` Brand + flacher Card

**Files:**
- Modify: `app/login/page.tsx`
- Modify: `app/login/layout.tsx`

- [ ] **Step 1: H1 auf „The Franklin Method"**

In `app/login/page.tsx` Z. 62:
```tsx
<h1 className="font-[family-name:var(--font-fraunces)] font-light text-4xl text-[var(--foreground)] mb-2">
  The Franklin Method
</h1>
```

- [ ] **Step 2: Metadata Brand-Migration**

`app/login/layout.tsx`:
```tsx
title: "Anmelden | The Franklin Method",
description: "Melde dich bei The Franklin Method an, um dein personalisiertes Schreibtraining fortzusetzen.",
```

- [ ] **Step 3: Card flacher**

Den Login-Card-Container: rounded-xl → rounded-lg, p-8 → p-10, border-2 → border, kein shadow. Inputs: rounded-md statt rounded-lg, focus-ring → focus:border-[var(--accent)].

- [ ] **Step 4: Italic-Microcopy**

Unter dem Submit-Button:
```tsx
<p className="font-[family-name:var(--font-fraunces)] italic text-sm text-[var(--muted)] text-center mt-6">
  Eine Anmeldung genügt für alle drei Modi.
</p>
```

### Task C5: Navbar Logo + Active-State

**Files:**
- Modify: `components/navigation/Navbar.tsx`

- [ ] **Step 1: Logo in Fraunces**

Z. 94-98 ersetzen:
```tsx
<Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
  <span className="font-[family-name:var(--font-fraunces)] text-xl font-light text-[var(--foreground)] tracking-tight">
    The Franklin Method
  </span>
</Link>
```

- [ ] **Step 2: Active-State Underline statt Filled-Block**

Z. 107-114 ersetzen (Active-Klassen):
```tsx
className={`inline-flex items-center justify-center w-10 h-10 transition-colors relative ${
  pathname === href
    ? 'text-[var(--foreground)] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-px after:bg-[var(--foreground)]'
    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
}`}
```

(Kein `bg-[var(--foreground)] text-[var(--background)]` rounded-md mehr. Stattdessen Underline-Indicator.)

### Task C6: Public-Surface Brand-Reste

**Files:**
- Modify: `app/manifest.ts`
- Modify: `app/not-found.tsx`

- [ ] **Step 1: PWA-Manifest**

`app/manifest.ts` Z. 5:
```ts
name: 'The Franklin Method',
short_name: 'Franklin Method',
description: 'Schreibstil-Training nach Benjamin Franklins Methode, mit KI-Feedback.',
```

- [ ] **Step 2: 404-Page**

`app/not-found.tsx` Z. 5:
```ts
title: "404 — Seite nicht gefunden | The Franklin Method",
```

Im Body falls vorhanden „Literary Forge" → „The Franklin Method".

- [ ] **Step 3: Legal-Pages bleiben**

`/datenschutz`, `/impressum`, `/urheberrecht`, `/kontakt`: Body bleibt unangetastet (rechtliche Konsistenz). Nur falls Titel-Tag „Literary Forge" hat: lassen — Imprint ist rechtlich gebunden.

### Task C7: Welle jobs-C commit

- [ ] **Step 1: Final-Tsc + Akzeptanz-Grep**

```bash
cd ~/literary-forge && rm -rf .next/types && npx tsc --noEmit 2>&1 | head -20
grep -rn 'Literary Forge' app/manifest.ts app/not-found.tsx app/login/ app/page.tsx 2>&1
grep -rn '🔄\|📊\|🤖\|🇩🇪\|🇬🇧' app/page.tsx app/methode/ app/autoren/ app/buecher/ app/demo/ 2>&1
```
Expected: tsc clean, Brand-Reste 0 (außer Legal), Public-Emoji 0.

- [ ] **Step 2: Commit**

```bash
cd ~/literary-forge && git add -A && git commit -m "$(cat <<'EOF'
feat(jobs-C): editorial layout + brand migration

Layout:
- / Landing: editorial vertical comp (eyebrow → display-headline mit italic-Zeile 2
  → italic Sub-Quote → body → underline-CTA + nav-links inline → fraunces-italic footnote)
- /autoren/[slug]: editorial hero (Name als Display-Serif, Lifespan muted, Bio body),
  Sigma-Bars im Text-Fluss ohne Card
- /buecher/[slug]: Display-Headline, Author+Year sub-meta, Excerpt in Fraunces 18px/1.7
- /login: H1 "The Franklin Method", flacher Card, italic Microcopy
- Navbar: Logo Fraunces light tracking-tight, Active-Indicator Underline statt Filled-Block

Brand-Migration (qol-D Follow-up):
- app/manifest.ts: PWA-Name "The Franklin Method"
- app/not-found.tsx: Title-Tag
- Legal-Pages bleiben absichtlich (Imprint-rechtlich)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final-Push + Live-Verify

### Task F1: Push aller drei Wellen

- [ ] **Step 1: Status-Audit**

```bash
cd ~/literary-forge && git log --oneline -5 && git status
```
Expected: 3 neue Commits (jobs-A, jobs-B, jobs-C) + Spec, working tree clean.

- [ ] **Step 2: Push**

```bash
cd ~/literary-forge && git push
```

### Task F2: Vercel-Deploy abwarten + Live-Verify

- [ ] **Step 1: Poll bis Vercel ref den neuesten SHA hat**

```bash
HEAD=$(cd ~/literary-forge && git rev-parse HEAD | cut -c1-7)
attempt=0
until [ $attempt -ge 30 ]; do
  current=$(gh api repos/Mts-Potter/literary-forge/deployments --jq '.[0].sha[0:7]')
  echo "attempt $((attempt+1)): vercel sha=$current target=$HEAD"
  if [ "$current" = "$HEAD" ]; then
    sleep 20
    break
  fi
  sleep 10
  attempt=$((attempt+1))
done
```

- [ ] **Step 2: TTFB + UI-Akzeptanz**

```bash
for url in / /methode /demo /autoren /buecher /login; do
  for i in 1 2 3; do
    curl -s -o /dev/null -w "$url run$i: ttfb=%{time_starttransfer}s cache=%header{x-vercel-cache} status=%{http_code}\n" \
      "https://literary-forge.vercel.app$url"
  done
done

echo "--- UI-Marker ---"
curl -s "https://literary-forge.vercel.app/" | grep -ioE 'est\. 1722|Schreibstil lernen' | head -2
curl -s "https://literary-forge.vercel.app/" | grep -ioE 'Spaced Repetition.*Stilometrie.*KI-Feedback' && echo "WARN: 3-Card-Grid noch sichtbar"
```

Expected: alle 200, neuer Hero-Eyebrow „est. 1722" auf `/`, alte 3-Card-Grid weg.

---

## Self-Review (Plan vs Spec)

1. **Spec-Coverage:**
   - §3 Doktrin → Tasks A1+A2 (Font), A2+A3 (Palette), B1-B6 (Pruning), C1-C5 (Layout) ✓
   - §4 Page-Decisions: `/` → C1, `/methode` → keine eigenständige Layout-Task (Body-Trimmen + Emoji-Sweep in B6 reicht laut Spec), `/demo` → kein Task (Spec §4 sagt „bleibt funktional", nur Fraunces für Reading), `/autoren` → B2 + C2, `/buecher` → B3 + C3, `/login` → C4, Legal → C6, Navbar+Footer → C5 ✓
   - Footer-Update aus Spec §4: nicht explizit als Task. **Lücke — füge ich hier inline ein:** in Task C5 zusätzlich Footer Brand-Disclaimer-Block typografisch ruhig (Fraunces italic). Note: das ist Spec §4 letztem Absatz „Footer bleibt strukturell, Brand-Disclaimer-Block wird typografisch ruhiger". Werde ich bei Implementation-Anfang von C5 mit aufgreifen.
   - §6 Wellen-Plan 3-stufig → A/B/C ✓
   - §7 Risiken (Font-Load, Color-Refactor, Auth-Konflikt, Rollback) → in A3 explizit gegrept, in F1/F2 verifyzeitlich beobachtet.
   - §8 Akzeptanz-Kriterien → in B7/C7 grep-Checks.

2. **Placeholder-Scan:** Keine TBDs, keine vagen „add appropriate handling". Code-Blöcke konkret. Eine Stelle (Task B5-Step-1) sagt „den umgebenden Card-Wrapper entfernen, sodass Bars direkt im Text-Fluss stehen" — präzise genug (Mats-Implementation liest existing Datei).

3. **Typ-Konsistenz:** CSS-Variable-Namen (`--background`, `--foreground`, `--card`, `--border`, `--muted`, `--accent`, `--font-fraunces`, `--font-display`) durchgehend konsistent. Klasse `font-[family-name:var(--font-fraunces)]` einheitlich (Tailwind v4 arbitrary-property-Syntax).

4. **Footer-Gap aus §4-Implementation:** als Memo in C5 dokumentiert. Sonst keine Lücken.
