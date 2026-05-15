# Current State — 2026-05-15 (post jobs-design-public)

Hand-off note for future sessions / future Claude. Read this first when picking up the project.

## What this is

Web app for learning literary writing style via Benjamin Franklin's 1722 copywork method, optimized with AI feedback. Solo-developer side project; user is Mats (German-native, Lehramt student in Bamberg). Primary use is by Mats himself; secondary goal "if a stranger lands here, don't repel them, and Google should be able to index us".

## Stack (settled, don't propose alternatives)

| Layer | Choice |
|---|---|
| Frontend | Next.js 16.1 App Router · TypeScript · Tailwind v4 |
| Auth + DB | Supabase Postgres + RLS |
| LLM | Google Gemini 3.1 Flash-Lite |
| NLP | Python+Flask+spaCy on Render (`nlp-service/`) |
| Scheduling | ts-fsrs (FSRS V5) |
| Theme | next-themes (class strategy) |
| Icons | lucide-react |
| Hosting | Vercel Hobby (free) |
| Mail | Resend (free) |

## Brand

- Visual brand: **"The Franklin Method"** (logo, hero, metadata, OG, JSON-LD)
- Canonical URL: **`literary-forge.vercel.app`** (not migrated, intentional risk mitigation)
- Footer disclaimer separates this from Eric Franklin Method® (somatic education, Wetzikon CH, trademark owner)
- Known competitor: FranklinWrite.com (Darren Liang, $20/yr, copywork drills) — direct positional collision but lower active intensity
- If C&D arrives: §7 in `docs/superpowers/specs/2026-05-14-relaunch-design.md` is the ~4h rollback to "Literary Forge"

## Mode System

Three modes, fixed. **Do not invent new modes/levels.** User explicitly rejected an "Anfänger/Fortgeschritten/Profi" overlay during brainstorming.

| Mode (DB `default_mode`) | UI | Flow |
|---|---|---|
| `franklin` | "Franklin" | Reading → AI-generated hints → incubation (FSRS) → reconstruction → diff |
| `cloze` | "Cloze" | Gap-fill with progressive difficulty levels |
| `free` | "Free" | Read passage, then write your own imitation, get feedback |

Switcher: `components/training/ModeCycleButton.tsx` — a single button positioned BELOW the training content that cycles Franklin → Cloze → Free → Franklin. Persists via `POST /api/user/mode`.

## What's done (commits in main)

**Renovation (Phases 0-8 of `~/.claude/plans/enumerated-crafting-pnueli.md`):**
- Gemini migration · spaCy NLP via Render · 12.540 chunks reprocessed · FSRS live · Multi-mode · Light-mode · GDPR · CSP with route-scoped per-request nonces

**Brand relaunch (2026-05-15):**
- `8e5f1f7` feat(relaunch-A): brand audit + welcome 1-screen + mode cycle button + /methode + /demo + chunk-size + route-scoped CSP
- `67575d6` feat(relaunch-B): /autoren + /buecher with bios + style profiles + sitemap

**QoL Public-Lens (Bezos, 2026-05-15):**
- `e2cdbbf` feat(qol-A): navbar auth-conditional + FeedbackView fully German + 3 CTA-blocks + demo retry
- `d468471` feat(qol-B): stylometry sigma-bars vs corpus + meta on cards + glossary tooltips + book polish
- `7cc2df3` perf(qol-C): static marketing routes (root layout headers-free) — `/`, `/methode`, `/demo`, `/login`, `/welcome` CDN-cached

**Auth-Surface QoL (Bezos, 2026-05-15):**
- `7743984` feat(qol-D): Konsistenz — DE-Sprache hinter Login, `/books` gelöscht, Brand-Titles, Settings Mode-Picker, ClozeDeletion-Banner
- `56275f8` feat(qol-E): Insights — Dashboard 3-Mode-Quick-Start, 7-Tage-Streak-Strip, Pro-Buch-Progress, Author-Header, Hint-History, FeedbackView-Verlaufschart
- `27ad27d` perf(qol-F): Latenz — Dashboard Promise.all, ModeCycle ohne router.refresh, /settings Server-Component, NLP-PreWarm

**Steve-Jobs-Public-Pass (2026-05-15):**
- `3944388` feat(jobs-A): Foundation — Fraunces serif + warm-neutral palette (`#faf7f0`/`#1a1612`) + Akzent `#b69876`
- `a4dcbe3` feat(jobs-B): Reduction — Emojis weg, 3-Card-Grid weg, Card-Wrapper auf /buecher+/autoren weg, glitzy CTA → schmale Underline
- `989d115` feat(jobs-C): Layout — Editorial-Restructure: Eyebrow + Display-Headline + italic Sub + Body + Underline-CTA + Fraunces-Italic-Footnote. Navbar-Logo Fraunces light, Active-State Underline statt Filled-Block. Brand-Migration manifest/not-found/login/layout.

## Live performance (verified 2026-05-15 post jobs-C)

| Route | Warm TTFB | Cache | Bemerkung |
|---|---|---|---|
| `/` | 244-247ms | HIT | ~130ms langsamer als qol-C wegen Fraunces-Font-Subset (Trade-off) |
| `/methode` | 102-227ms | HIT | ✓ |
| `/demo` | 114-115ms | HIT | ✓ |
| `/autoren` | 256-272ms | MISS | dyn-Supabase-Fetch |
| `/buecher` | 322-328ms | MISS | dyn-Supabase-Fetch |
| `/login` | 118-189ms | HIT | ✓ |
| `/dashboard` | 246ms warm | MISS | per-user dyn ✓ |
| `/settings` | 132-192ms | HIT | server-component, kein "Lädt…"-Flash mehr |
| `/train` | 234-253ms | MISS | per-user dyn ✓ |

## Public routes (indexable, in sitemap.xml)

| Route | What |
|---|---|
| `/` | Landing |
| `/methode` | Franklin-method story page |
| `/demo` | No-auth 3-step demo |
| `/autoren` + `/autoren/[slug]` | 12 author pages with bios + style sigma-bars |
| `/buecher` + `/buecher/[slug]` | 12 unique works of the public-domain corpus |
| `/login` | Auth |
| `/datenschutz` `/impressum` `/kontakt` `/urheberrecht` | Legal |

## Auth-gated routes (NOT in sitemap, robots: disallow)

`/train`, `/dashboard`, `/settings`, `/settings/data`, `/admin/*`, `/read/[bookId]`, `/welcome` (post-auth path)

## Known gaps + intentional non-goals

**Open but deferred:**
- Sentry monitoring (needs account+DSN from Mats, self-use → low priority)
- Supabase manual backup (Dashboard click by Mats)
- AWS IAM Console: deactivate key `AKIASJIFO7CEOTQEU6RR` if still active
- TTFB-regression `/` warm 244ms vs spec target <200ms — Fraunces-font-subset cost. Reduzierbar wenn nötig via weight: ["400"] ohne italic.
- Auth-Surface bleibt funktionsorientiert (Bezos-densified) — KEIN Steve-Jobs-Pass auf Auth, das wäre Konflikt mit qol-E.

**Explicitly NOT in scope (do not propose):**
- i18n / EN-translations / `[locale]/` routing → killed during brainstorm 2026-05-14, Mats is German-native
- Renaming away from "The Franklin Method" → Mats took the risk knowingly
- New play-mode levels (Anfänger/Profi) → rejected, use the three existing modes
- Sentry account creation → Mats said low priority
- Mobile app, paid tier, monetization → soft-reach posture

## User preferences (learned in sessions, not subverbable)

- **"Mach alles" means push through:** when Mats says implement everything, do not pause for spec questions unless there's a real conflict between his decisions and evidence
- **Commits per wave, not per file:** A→B→C-style chunking with one commit per wave is preferred
- **Empirical verification > assumption:** always measure (curl, tsc, build) before claiming a thing works
- **Anti-sycophancy with one counter-reason before agreement:** mandated by his SURGICAL-PRECISION hook
- **No technical jargon in explanations:** memory says "Mats kann nicht programmieren" — explanations in plain German prose, no code-snippets in user-facing chat
- **Confirm cost/benefit before destructive ops:** git push, force-push, destructive DB calls require explicit OK or are deferred

## How to resume work

1. `cd ~/literary-forge && git log --oneline -10` to see latest state
2. Read `docs/superpowers/specs/2026-05-14-relaunch-design.md` for design decisions + risk register
3. Read this file
4. Read `~/.claude/projects/-Users-matswollscheid/memory/project_literary_forge.md` (auto-loaded)
5. Decide which surface to optimize next (auth-surface QoL is the natural next target)
6. Apply Bezos-Lens audit pattern: live perf measurement + read flow files + (optional) dispatch agent → 3 prioritized waves → commit per wave → live verify
