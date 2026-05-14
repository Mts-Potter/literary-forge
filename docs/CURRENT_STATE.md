# Current State — 2026-05-15

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

**QoL (Bezos-Lens, 2026-05-15):**
- `e2cdbbf` feat(qol-A): navbar auth-conditional + FeedbackView fully German + 3 CTA-blocks + demo retry
- `d468471` feat(qol-B): stylometry sigma-bars vs corpus + meta on cards + glossary tooltips + book polish
- `7cc2df3` perf(qol-C): static marketing routes (root layout headers-free) — `/`, `/methode`, `/demo`, `/login`, `/welcome` now CDN-cached

## Live performance (verified 2026-05-15 post-deploy)

| Route | Warm TTFB | Cache |
|---|---|---|
| `/` | 261ms | HIT |
| `/demo` | **103ms** | HIT |
| `/methode` | 232ms | HIT |
| `/login` | 104ms | HIT |
| `/welcome` | 136ms | HIT |

Before qol-C: every route MISS, 270-600ms.

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
- Auth-Surface QoL (the public audit only covered `/`, `/methode`, `/demo`, `/autoren`, `/buecher`. `/train`, `/dashboard`, `/settings` were explicitly left for a follow-up session — they're where the user spends 90% of time.)
- Sentry monitoring (needs account+DSN from Mats, self-use → low priority)
- Supabase manual backup (Dashboard click by Mats)
- AWS IAM Console: deactivate key `AKIASJIFO7CEOTQEU6RR` if still active

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
