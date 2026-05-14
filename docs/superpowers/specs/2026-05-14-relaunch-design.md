# Relaunch Design Spec — Literary Forge → "The Franklin Method"

**Date:** 2026-05-14 (revised 2026-05-15)
**Status:** Approved by user 2026-05-14; ready for `superpowers:writing-plans` translation
**Repo:** `/Users/matswollscheid/literary-forge` (URL canonical stays `literary-forge.vercel.app`, brand becomes "The Franklin Method" in copy/visuals)
**Author:** Claude (collaborative brainstorm with Mats)
**Implementation:** triggered separately by user

---

## 0. TL;DR

This spec covers a single atomic relaunch of `literary-forge.vercel.app` across eight concerns: branding, copy/text, mode-system defaults, onboarding, mode-switch visibility, performance, SEO, and information architecture. The relaunch is **one Mega-Spec → one Mega-Implementation** per user choice (Q4 = A); each concern below has a section. Success criteria are concrete and measurable.

**Four load-bearing decisions resolved 2026-05-14 after research:**

1. **Brand: "The Franklin Method"** (user-decided despite documented collision risks). Eric Franklin Method® GmbH (Wetzikon CH, 40-year priority, DACH, IC 41) + FranklinWrite.com (direct copywork competitor) + Copywork.app (active incumbent) are real exposure surfaces — the spec acknowledges them explicitly in §3.1 and codifies mitigations (nominative-fair-use copy, long-tail SEO focus, footer-disclaimer for somatic-collision, custom-content upload as wedge against FranklinWrite). Domain stays `literary-forge.vercel.app` as canonical URL (zero migration risk); brand is visual-text-only.
2. **Three Play-Modes user-switchable on /train, no upfront commitment** (replaces earlier self-assessment routing per user-revised intent 2026-05-15). Onboarding shows a single info card with NO decision required. On `/train`, a 3-option segmented control [Anfänger | Fortgeschritten | Profi] lets the user pick + switch freely. User tests for themselves, no Dunning-Kruger / overconfidence risk. Each play-mode is a tuple of `(format, scoring_strictness, chunk-size-minimum)`. Detailed in §3.3.
3. **Cloze stays, demoted to Warmup-Chip** (NOT in main top-bar segmented control). Cloze trains lexical-collocational style — the strongest evidence base of any mode (Roediger & Karpicke testing effect, Dunlosky et al. "high utility"). Removal would lose a low-load training signal. Detailed in §3.3.
4. **Performance fix: Route-scoped CSP.** Perceived slowness root cause is Phase 7.5 nonces forcing every HTML route to `x-vercel-cache: MISS`. Solution: keep nonces on auth/app routes, remove from landing/marketing routes (re-enable CDN HTML cache). Detailed in §3.4.

---

## 1. Goal & Constraints

### 1.1 Goal (from brainstorming Q1)

**Soft-reach posture (B):** Primary use remains the developer himself. Secondary goal: if a stranger lands on the site, the page must not repel them, and Google should be able to surface relevant pages for relevant searches. No marketing budget. No active campaigns. No EN-i18n (explicitly de-scoped 2026-05-14).

This is **not** a public-launch spec. It is a "make-the-house-presentable-without-throwing-a-party" spec.

### 1.2 Hard constraints

- Free-tier hosting only (Vercel Hobby + Supabase Free + Render Free + Resend Free)
- Single solo developer
- DE-only UI (i18n descoped — memory entry "Phase 6.1 i18n — explizit abgewählt 2026-05-14")
- No paid services that add to fixed cost
- Existing data integrity (12.540 chunks, 12 author profiles, FSRS state, GDPR endpoints) must be preserved
- Must not regress the security posture established in Welle-5 (`feat(welle-5): CSP per-request nonces`)

### 1.3 Non-goals (out of scope)

- i18n / EN translations / EN routes
- Sentry / external error tracking
- Phase 7.4 BFG git-history rewrite (no secret in history per Phase 0.3 audit)
- Paid features / monetization
- Mobile app
- New book imports (the 12.540-chunk corpus is what we have)

---

## 2. Empirical Baseline (verified pre-spec)

Live measurement against `https://literary-forge.vercel.app/` at the moment of writing this spec:

| Metric | Value | Source |
|---|---|---|
| Cold TTFB (Lambda cold start, ~1×/15min) | ~2000 ms | curl run 1 of fresh-DNS sequence |
| Cold TTFB (typical first visit) | 600-1200 ms est. | derived from Vercel Hobby IAD region + DNS lookup |
| Warm TTFB | 270-360 ms | curl runs 2-3 |
| HTML payload | 27-31 KB | curl size_download |
| Cache state on every HTML response | `x-vercel-cache: MISS` | curl -I |
| JS chunks loaded on landing | 10 async-loaded | parsed HTML |
| JS uncompressed (top 2) | 220 KB + 200 KB | du -h .next/static/chunks |
| JS transferred gzipped (total) | ~234 KB | research-agent measurement |
| JS transferred gzipped (top 2) | 71 KB + 54 KB | research-agent measurement |
| CSP enforcement | nonces + `'strict-dynamic'`, no `'unsafe-inline'` in production script-src | curl -I |
| Onboarding wizard | 3 steps (not 4), book pick deferred to /books | app/welcome/page.tsx |
| Default mode (current) | `franklin` | app/welcome/page.tsx:22 |
| Franklin-Encoding hint length validator | "≥3 chars per hint" | FranklinEncodingPhase.tsx:47 — **no chunk-length-relative sizing** |

**User-perception correction:** "wirklich sehr langsam" maps empirically to the **cache-MISS-on-every-visit** problem, not generic slowness. The fix is structural (route-scoped CSP), not optimization-by-trimming.

---

## 3. Decisions with Evidence

### 3.1 Brand Identity — "The Franklin Method" (user-decided, risks acknowledged)

**User decision (re-confirmed 2026-05-14 after presenting collision evidence):** Brand is **"The Franklin Method"**. URL stays `literary-forge.vercel.app` as canonical (zero migration risk, no domain purchase). Brand is visual-text-only: logo, header, OG-images, copy throughout the UI use "The Franklin Method".

**Risks accepted (documented for the record):**

| # | Evidence | Source |
|---|---|---|
| 1 | "Franklin Method®" is a registered, ®-marked, license-required mark of Institute of Franklin Method® GmbH, Wetzikon, Switzerland | franklinmethod.com/terms-conditions/, de.wikipedia.org/wiki/Franklin-Methode |
| 2 | Class 41 (education / training) collision is direct; both are paid teaching methodologies | trademark category mapping |
| 3 | 40-year priority in DACH; secondary meaning established | franklinmethod.com/about/eric-franklin/ |
| 4 | License-only enforcement language: "Certificate to participants does not constitute a license to use the 'Franklin Method®' trademark" | franklinmethod.com/terms-conditions/ |
| 5 | FranklinWrite.com — direct copywork competitor by Darren Liang (Yale English/Education), $20/year, 7 drills based on Franklin's exercises | franklinwrite.com, producthunt.com/products/franklinwrite |
| 6 | Copywork.app — active incumbent with 20+ author guides (Hemingway, Rowling, Orwell, Austen, Fitzgerald, King, Twain, Murakami…), Discord community | copywork.app |
| 7 | SERP for "franklin method writing": slot 1 = FranklinWrite, slot 2 = Copywork.app, slot 3+ = blog content | Google search snapshot 2026-05-14 |
| 8 | "Literary Forge" has zero direct collision; user already owns repo, domain (Vercel), Supabase project | system + memory files |

**Mitigations codified into the spec:**

1. **Domain stays `literary-forge.vercel.app`.** No new domain purchase, no DNS migration, no SSL re-issue. The legacy URL keeps SEO authority earned to date (limited but non-zero); brand-mismatch between URL and visible name is a soft-reach-acceptable cost.
2. **Footer disclaimer:** *"The Franklin Method (this site) is unrelated to the Franklin Method® somatic education by Eric Franklin (franklinmethod.com). The two are different products in different fields."* Required for nominative-fair-use safety in DACH.
3. **SEO strategy avoids the head term.** Do NOT compete for "The Franklin Method" (slot 1 = Eric Franklin, slot 2 = FranklinWrite, slot 3 = Copywork.app — unwinnable). Target long-tail keywords instead (see §3.5).
4. **Differentiation wedges** (where we beat both competitors documented in research):
   - **AI critique-feedback on the rewrite** (Copywork.app has none; FranklinWrite claims it but evidence is marketing-only; we have Gemini + deterministic style-distance + diff-view = real critique stack)
   - **Cloze as warmup** (no competitor combines copywork + cloze)
   - **Spaced Repetition with FSRS V5** (no copywork tool uses real SR)
   - **Stylometric measurement** with 20 features per chunk (vs. Copywork.app's "typing accuracy" feedback)
5. **Legal-exposure ceiling:** real but bounded. Eric Franklin's institute (Wetzikon CH GmbH) most likely operates a watch-and-oppose-at-filing strategy (consistent with zero public C&D records). As long as the project does not file its own ® for "The Franklin Method", probability of active enforcement against a solo-dev project is low. Documented; user accepts.
6. **If a C&D arrives:** §7 contains the "back to Literary Forge" rollback path — zero-data-loss, ~4h work, well within tolerable response time.

### 3.2 Goal-Shift — Soft-Reach (B)

Confirmed in brainstorm Q1. No further evidence needed. Drives the rest of the spec: SEO yes, marketing-spend no, EN-i18n no, Sentry no, anti-abuse-quota-tightening no.

### 3.3 Mode System — Default Free-Writing, demote Cloze, keep Franklin-Loop as advanced

**User's intent (Q3 → C):** Default = Free Writing + SR (like original Literary Forge). Cloze raus. Franklin-Loop als opt-in "Advanced".

**Pedagogy-research correction:**

| Finding | Implication for design |
|---|---|
| Retrieval practice + generation effect + spacing are well-established (Roediger & Karpicke 2006; Dunlosky et al. 2013 "high utility"; Bertsch et al. 2007 g≈0.4) — **for declarative memory and vocabulary**. Transfer to productive composition skill is inference, not measurement. | Frame the app honestly as informed prototype, not "evidence-based." (Affects copy, not architecture.) |
| Cognitive Load Theory + worked-example effect (Van Merriënboer & Sweller 2005): for novices, scaffolded reconstruction beats unsupported production. The expertise-reversal effect runs the other way as the user advances. | **Onboarding should NOT default novices to Free Writing.** Either default to Franklin-Loop for new users, or detect skill via self-assessment / first-attempt-score and route accordingly. |
| Cloze trains **lexical-collocational** style — a real component of stylistic gestalt, just not the gestalt itself. | Demote, don't delete. Position as 2-minute warmup. Off main onboarding path. |
| Style operates at clause-and-period level (Beers & Nagy 2009; Crossley et al. 2014). Working-memory limits (Cowan ~4 chunks) mean **reconstruction needs sentence-level minimum (~15-40 words), paragraph max (~200 words).** Beyond that → rote memorization, not stylistic noticing. | **Hard fix: enforce chunk-size constraints.** The "6 words / 4-8 word hints" issue is real and matches research consensus. |
| Burrows' Delta + MTLD are corpus-attribution statistics, unstable on short text (MTLD wants ≥100 tokens). | Show feature-level breakdown, not single distance. Add LLM-rubric qualitative score alongside. |

**Synthesized mode design (revised 2026-05-15 per user feedback "drei spielmodi, switchbar auf /train, man testet selbst"):**

The earlier self-assessment + skill-routing design (still defensible per worked-example research) is replaced by a more user-empowering design: **three named play-modes on `/train`, switchable any time, no upfront decision**. User explores all three and self-selects what works — empirically validates their own skill instead of guessing on a Likert-style self-assessment (which has documented Dunning-Kruger biases).

The three play-modes are 3-tuples of (format, scoring_strictness, chunk_size_min):

| Play-Mode (user-facing) | Format | Scoring | Min chunk words | Style-marker overlay | Notes |
|---|---|---|---|---|---|
| **Anfänger** | Franklin-Reconstruction (read → AI-hints → incubation → reconstruct with hints visible → diff) | lenient (gentler score curve: `score = max(0, 100 - distance × 18)` instead of × 25) | 30 | yes | Worked-example scaffolding for novices |
| **Fortgeschritten** | Free Writing (read with markers → write → diff + score) | standard (`score = max(0, 100 - distance × 25)`) | 60 | yes | The "original Literary Forge" loop |
| **Profi** | Free Writing | strict (`score = max(0, 100 - distance × 32)`) | 100 | no | No style hints; harder scoring; longer chunks |

**Cloze stays available but reframed as Warmup-Chip** (NOT in the main 3-segment control): small chip "Warmup vor dem Schreiben? Cloze →" below the chunk. Opens a 1-card Cloze drill, then returns to the main exercise.

**Storage model:** `user_settings` gains `current_play_mode TEXT CHECK (current_play_mode IN ('anfaenger', 'fortgeschritten', 'profi')) DEFAULT 'anfaenger'`. On `/train` the segmented control reads + writes this column on every switch. No skill_level column (replaced by current_play_mode). On `/train` URL also accepts `?mode=anfaenger|fortgeschritten|profi` for deep-link / share-state purposes.

**Why three:** matches the user's mental model and is the magic number for segmented controls (>5 should be a dropdown per NN/g). Allows true progression (Anfänger → Fortgeschritten → Profi) without an explicit "level up" milestone.

**Welcome page** becomes a 1-screen pure-info card: "Willkommen bei The Franklin Method. Die Methode + Hinweise stehen auf /methode. Es gibt drei Modi (Anfänger, Fortgeschritten, Profi) — du wechselst sie jederzeit oben in /train." Single button "Training starten →". No decision needed; reduced friction.

**Chunk-size hard constraints (codified):**
- Minimum chunk: 1 full sentence (typically 15-40 words for literary prose)
- Typical chunk: 2-4 sentences (60-150 words)
- Maximum useful chunk for reconstruction: ~200 words (1 paragraph)
- Hint length formula (replacing the 4-8-word static range): `hint_word_count = clamp(2, floor(sentence_word_count / 3), 8)`
- Implementation: validate at chunk-fetch time, skip and re-roll any chunk failing the minimum

### 3.4 Performance — Route-scoped CSP, not blanket nonces

**Root cause from §2 baseline:** every HTML response is `MISS` because middleware injects a nonce → forces dynamic rendering → no CDN cache. Single root cause for the perceived slowness on the landing page.

**Approach:**
1. **Restrict middleware matcher to app routes:**
   - Apply nonce/dynamic CSP to: `/train`, `/dashboard`, `/settings/*`, `/admin/*`, `/read/*`, `/welcome` (post-auth), API routes already excluded
   - Exclude from middleware (so landing/marketing/static pages can be statically rendered): `/`, `/datenschutz`, `/impressum`, `/kontakt`, `/urheberrecht`, `/books` (public catalog), `/login`, `/welcome` (pre-auth path)
2. **Static CSP via next.config.ts for non-app routes:** use hash-based CSP (`'sha256-...'` for the JSON-LD inline script) instead of nonce. No `'unsafe-inline'` for scripts. `'unsafe-inline'` for styles (Google Fonts requirement) is acceptable on landing where there is no user input or auth surface.
3. **Bundle reduction on landing:**
   - Extract auth-aware Navbar into a route-group-scoped Navbar (`app/(marketing)/`) without Supabase client
   - Lazy-load FeedbackModal (`next/dynamic`) — currently in main Navbar bundle
   - Drop `Geist_Mono` preload on landing (font not used)
   - Enable `experimental.optimizePackageImports: ['lucide-react']` in next.config.ts (built-in tree-shaking optimization for lucide-react in Next 13.5+)
4. **Server-Component Navbar split:** brand link + nav links rendered as server component (zero JS), client island only for theme toggle, mobile menu, feedback modal trigger
5. **Realistic landing bundle target:** ≤120 KB gzipped transfer (revised from agent's initial 80 KB target; that target is achievable only with route-group splitting which is part of this spec)

**Expected impact:** TTFB on `/` drops from 270-460ms (MISS) to 30-80ms (HIT) once cache is warm. LCP improves ~400-600ms on warm visits, ~1.5s on cold. Bundle on landing drops from 234KB to ~100-120KB gzipped.

**Anti-pattern explicitly avoided:** Wait for Next.js 16.2 Turbopack SRI to mature. It is experimental, doesn't cover inline scripts, not production-ready for this use case in 2026.

### 3.5 SEO Strategy — Long-tail + structured data + content surface

**Soft-reach constraint:** No marketing budget, no link-building campaigns, no scaled content. SEO must work via on-page signals, technical setup, and genuine content depth on the few pages that exist.

**Strategy:**
1. **Drop generic head keywords.** Keywords meta is largely ignored by Google since 2009. Current `<meta name="keywords">` in app/layout.tsx is dead weight; remove.
2. **Page-level meta differentiation.** Every page (/, /books, individual /read/[bookId], /welcome, /datenschutz, /impressum, /kontakt, /urheberrecht) gets its own `generateMetadata` with title + description specific to that page's content.
3. **Long-tail target keywords (German, low-volume but achievable):**
   - "Schreibstil lernen" (medium volume, medium competition)
   - "Stilanalyse Texte" (low volume, low competition)
   - "Kafka Schreibstil imitieren" (very long-tail, very low competition — high win probability)
   - "Stilometrie Übung" (academic long-tail)
   - "Benjamin Franklin Schreibmethode" (very long-tail, nominative-fair-use lane)
4. **Programmatic SEO via author/book pages (must not be scaled content abuse):**
   - Each of the 12 authors gets `/autoren/[slug]` page with: bio summary (one paragraph, manually curated), genuine stylistic-profile visualization (from existing `author_style_profiles` data), 3-5 example chunks, link to /read/[bookId]
   - Each of the 15 books gets `/buecher/[slug]` page (route `/read/[bookId]` already exists, repurpose with full metadata + opengraph)
   - This produces ~27 unique-value content pages, each with real per-page data (not template-stuffed). Per Breakline 2025 guide: "every page delivers unique, verifiable data" = legitimate programmatic SEO, not scaled-content-abuse.
5. **Structured data (JSON-LD):**
   - WebApplication on landing (already done)
   - Article schema on /datenschutz, /impressum (legal pages benefit)
   - Course schema on /train (or LearningResource per Google's spec)
   - Book schema on each /buecher/[slug] page
   - Person schema on each /autoren/[slug] page
6. **Sitemap.xml expansion:** include all programmatic author/book pages
7. **Robots.txt:** explicitly disallow `/api`, `/admin`, `/train`, `/dashboard`, `/settings` (these are auth-gated and have no SEO value)
8. **Honest realism:** Per agent research, new domains <2 years old account for <2% of top-10 rankings (December 2025 core update analysis). Organic-only growth from zero in year one is realistically <50-500 visits/month even with perfect execution. SEO work is necessary but not sufficient — the user has accepted this in the soft-reach posture.

**Explicitly out of scope:** AI Overview optimization, link-building campaigns, programmatic city/category pages (the small-niche content set doesn't support it).

### 3.6 UX Flow — Bezos lens reinterpreted

**User's framing (in turn 1 of brainstorm):** Minimize clicks + latency, Bezos-style.

**Modern UX evidence correction:**
- MeasuringU 2024: clicks explain only ~25% of website task-time variance — weak proxy
- NN/g + Baymard 2024-2025: target is **time-to-first-meaningful-action (TTFMA)** + **interaction cost** (clicks + reading + thinking + scrolling), not click count
- Duolingo + 100-devtool-landing-page research 2025: dominant pattern is **demonstrate, don't explain** for products with non-obvious mental models

**Synthesized flow:**

**Landing (`/`)** — single hero, no scroll required for primary action:
- Headline: "Schreibe wie deine Lieblings­autoren."
- Subhead: "Eine Methode, die Benjamin Franklin sich selbst beibrachte. Mit KI optimiert."
- Primary CTA: **"Eine Runde probieren (60 Sekunden, ohne Anmeldung)"** → `/demo`
- Secondary link, muted: "Anmelden" → `/login`
- Below the fold (only seen if user scrolls): 3 features grid (Spaced Repetition / Stilanalyse / KI-Feedback), no explanation paragraph
- No statistics, no testimonials (no users to quote), no pricing (free)

**Demo (`/demo`)** — NEW page, no-auth path:
- Hardcoded canonical chunk (e.g., 80 words of Mansfield or Kafka, pre-selected so length is appropriate)
- One-sentence frame: "Lies das, schreib einen Versuch. Vergleich kommt automatisch."
- After submission: deterministic style-score + diff view + LLM commentary
- Modal: "Speichern? Dann kannst du das mit deiner eigenen Bibliothek wiederholen." → `/login` with passwordless option
- Same Gemini + Render-NLP stack as `/train`, just stateless / no FSRS write

**Login (`/login`)** — already redesigned in Welle-2, theme-correct. Keep.

**Welcome (`/welcome`)** — pure-info card, NO decision (revised 2026-05-15):
- Heading "Willkommen bei The Franklin Method."
- Body: 3-5 Sätze: Methode-Story auf /methode; auf /train gibt's drei Play-Modes (Anfänger / Fortgeschritten / Profi), die du jederzeit oben switchen kannst; Default ist Anfänger; Cloze als Warmup steht unter dem Text.
- Einzelner Button "Training starten →" → routes to /train
- DB on click: `user_settings.onboarded_at = NOW()`, `current_play_mode = 'anfaenger'`

**Train (`/train`)** — new top-bar (revised 2026-05-15):
- Logo → 3-option segmented control `[Anfänger | Fortgeschritten | Profi]` → streak/score → settings cog
- Below the chunk: chunk-context chip "Aktuell: Mansfield — ändern" (links to /buecher) + WarmupChip "Warmup vor dem Schreiben? Cloze →"
- Mode switch mid-card writes `user_settings.current_play_mode`, immediately re-renders chunk with new format/scoring/min-words config. If current chunk doesn't meet new mode's min-words, inline notice + fetch next valid chunk.

**Books (`/books`)** — public catalog (currently auth-gated, change to public for SEO):
- 15 books, grid layout, each card links to `/buecher/[slug]`

**Buecher/[slug]** — repurpose existing `/read/[bookId]`:
- Public, indexable, rich metadata
- Book schema JSON-LD
- Read-chunk-by-chunk view + stylistic features panel

**Autoren/[slug]** — NEW:
- Public, indexable
- One-paragraph bio (manual curation), Person schema
- Style profile visualization from `author_style_profiles`
- Links to all books in the corpus

**/methode** — NEW:
- Static, indexable
- Tells the Franklin story honestly (with the verbatim Franklin quote, the "imitatio" Quintilian context, the "Stevenson played the sedulous ape" reference)
- "Wie wir die Methode optimiert haben" section with the AI-scene-description framing
- Cross-link to /demo

### 3.7 Copy / Text Updates

**Dead-letter inventory (current → target):**

| File | Current text | Target text |
|---|---|---|
| app/page.tsx (landing) | "AI-Powered Training for Literary Style Imitation" / "Spaced Repetition / Stylometric Analysis / AI Feedback (Detailed evaluation from Claude 3.5 Haiku)" — **all wrong: app is German UI, model is Gemini not Claude** | Per §3.6 landing hero + 3-feature grid in German, correct model attribution if mentioned at all (better: no model attribution on landing — implementation detail) |
| README.md | Already fixed in Welle-1 (Gemini + Multi-Mode + FSRS + Render-spaCy) | OK as-is |
| app/layout.tsx → metadata | `description`: "Trainiere deinen Schreibstil mit KI-Unterstützung." — generic | Replace with per-page generateMetadata, see §3.5 |
| app/welcome/page.tsx | "Diese App lernt dir Schreibstil mit der Methode, die Benjamin Franklin vor 230 Jahren erfand…" — partially-broken German ("lernt dir" instead of "lehrt dich") and the 5-step ordered list belongs on /methode, not in onboarding | Single-screen info card with no decision (per §3.6); Play-Mode-Switch happens on /train |
| app/page.tsx feature cards | "Anki-like algorithm for optimal long-term retention" (EN inside DE app) | German throughout, no English mixed in |

**Tone guideline:** confident-but-honest. The product is "informed prototype, not validated protocol" (per pedagogy research). Marketing copy says "Eine Methode, die Franklin sich selbst beibrachte. Mit KI optimiert." not "Wissenschaftlich bewiesen." That keeps integrity.

### 3.8 Onboarding (already covered in §3.6, summarized here)

- Pre-auth: landing → `/demo` (zero friction, no email gate)
- Post-signup: 1-screen info card (no decision), then directly to `/train`
- No multi-step wizard
- Franklin-method explanation moves to `/methode` (dedicated page) + dismissible banner on first /train visit

### 3.9 Mode-switcher visibility (revised 2026-05-15)

- Top-bar segmented control on `/train`, always visible, 3 options: **Anfänger | Fortgeschritten | Profi**
- Mid-card switching writes `user_settings.current_play_mode`, immediately re-renders the chunk in the new mode + scoring config
- Cloze accessible via secondary "Warmup-Chip" below the chunk-context — NOT in the main switcher

### 3.10 Lessons from Competitors (what to adopt + what to do better)

Verified competitor analysis from research-agent dispatches 2026-05-14. Findings translated into spec items.

**FranklinWrite.com — what we adopt:**

| Their pattern | Our adoption |
|---|---|
| Names exercises after Franklin's actual terms ("Sentiment", "Reconstruction", "Jumble", "Verse") instead of generic "Mode 1/2/3" | Rename our internal mode `franklin` to **"Franklin-Reconstruction"** in user-facing copy. Add a future-roadmap stub for a "Jumble" exercise as a possible advanced mode (post-relaunch). Use "Hints" not "Notes" everywhere (per Franklin's own vocabulary, verified by autobiography research). |
| Single-payment pricing ($20/year, no recurring subscription) | We stay free / self-use. But ADOPT the **mental model** that this is a one-shot purchase relationship, not a SaaS funnel. UX should not nag for re-engagement, no email drips, no "you haven't trained in 3 days" notifications by default. |
| Custom content upload (user pastes their own passage) | **We have admin/ingest already** — gated behind admin role. **New: expose a user-scoped "Mein Text"-Upload** at `/train/custom`. User pastes a passage, it gets NLP'd through the Render service (same pipeline), saved to a user-private corpus with `user_id` ownership + `private: true` flag in `source_texts`. RLS ensures other users never see it. Direct competitor wedge — Copywork.app does this too. |

**FranklinWrite.com — what we do better:**

- **Real AI critique-feedback.** FranklinWrite's "automated feedback" claim is marketing-only per the WebFetch teardown — no AI technical description on landing, no `/how-it-works` or `/drills` page (both return 404). We have: Gemini 3.1 Flash-Lite for qualitative critique + deterministic 20-feature Burrows'-Δ style-distance + word-level diff. **Surface this clearly** on /methode and landing.
- **Active project signaling.** Their Medium is empty, Product Hunt is 5 years old, last sign of activity unclear. We commit to public changelog at `/changelog` (auto-generated from `git log --oneline -20 | grep "^[a-z0-9]\+ feat\|^[a-z0-9]\+ refactor"`) — signals to visitors the project is alive.

**Copywork.app — what we adopt:**

| Their pattern | Our adoption |
|---|---|
| Per-author guides with biographical context | We have `author_style_profiles` with statistical data only. **Add per-author bio paragraphs** (manual curation, ~50-80 words per author × 12 = ~1h work) on `/autoren/[slug]` pages. SEO-positive (unique content per page) + product-positive (user understands who they're imitating). |
| 20+ authors as a corpus | We have 12. Don't expand for the relaunch — but list them clearly so the corpus size isn't hidden. Honest framing: "12 carefully selected authors across DE + EN." |
| Discord community for human feedback | **We do NOT replicate.** Solo-developer free-tier — no community management capacity. Honest scope. |

**Copywork.app — what we do better:**

- **Web-first, not desktop-only.** Their tool is macOS/Windows desktop installs. We're a web app. Zero install. Mobile-readable. Sharper distribution.
- **Multi-mode.** They have "copy this passage word-for-word" as the only mechanic. We have Franklin-Reconstruction (with AI-generated hints — the actual Franklin method) + Free Writing + Cloze warmup. Different cognitive workloads.

**Sudowrite — what we explicitly do NOT adopt:**

- Production-AI ("write the next chapter for me"). Not our category. We are deliberate-practice, not co-writing.
- Subscription tiers / credit-based usage. We are free / self-use.
- Author-style mimicry as a generation feature. We use author profiles for the user's OWN practice + scoring, not to make the AI write like Kafka.

**Lex.page / NovelCrafter — what we explicitly do NOT adopt:**

- Model-choice UI. We pick Gemini and stick — model selection is implementation detail, not a user-facing feature.
- BYOK / bring-your-own-API-key flows. Operational complexity, irrelevant for soft-reach.

**ProWritingAid / Grammarly — what we explicitly do NOT adopt:**

- Real-time-as-you-type style suggestions. The Franklin method requires deliberate practice without correction during writing. Suggestions during reconstruction would invalidate the retrieval-practice mechanism. Feedback comes AFTER submission, never during.

**Net positioning sentence (for landing + /methode):**

> "Eine Methode, die Benjamin Franklin sich selbst beibrachte (1722). Mit KI-Feedback optimiert: messbarer Stilabstand, Wort-für-Wort-Diff, qualitatives Lektorat — keine Korrektur während du schreibst, sondern nach jedem Versuch."

This sentence does the work of:
- Anchoring the historical method (legitimacy)
- Differentiating from FranklinWrite (real critique, not just drills)
- Differentiating from Copywork.app (AI critique + stylometry, not typing-accuracy)
- Differentiating from Sudowrite/Lex (deliberate practice, not co-writing)
- Promising honest scope (after-submission, not during)

---

## 4. Implementation Plan (one mega-implementation, structured for git-commit hygiene)

Per Q4 = A: one PR, atomic deploy.

Suggested commit sequence inside that single PR (for review-readability):

1. `chore(relaunch): copy + brand audit → "The Franklin Method"` — text-only changes, brand-rename in copy, no behavior
2. `feat(relaunch): /methode + /demo public routes` — Franklin-story page + no-auth demo
3. `feat(relaunch): public books + author pages with bios + style profiles, sitemap expansion` — SEO surface
4. `feat(relaunch): onboarding wizard → 1-screen info card + 3-play-mode segmented control on /train` — UX
5. `feat(relaunch): /train 2-option segmented mode switcher + warmup chip + mid-card switch logic`
6. `refactor(relaunch): chunk-size constraints + hint-length formula (clamp(2, sentence/3, 8))`
7. `refactor(relaunch): route-scoped CSP nonces (landing/marketing static, app dynamic)`
8. `perf(relaunch): Navbar server-component split + lucide optimizePackageImports + Geist_Mono drop`
9. `feat(relaunch): per-page generateMetadata + JSON-LD per route (WebApp/Course/Book/Person)`
10. `feat(relaunch): /train/custom user text upload + /changelog auto-generated`
11. `feat(relaunch): footer Franklin-Method® disclaimer + nominative-fair-use copy review`
12. `chore(relaunch): robots.txt update + sitemap.xml regeneration with autoren/buecher`

Each commit testable independently. PR merges atomically.

---

## 5. Success Criteria (concrete + measurable)

### 5.1 Performance (post-deploy, measured against `literary-forge.vercel.app/`)

| # | Criterion | Target | How measured |
|---|---|---|---|
| P1 | Landing TTFB warm | ≤80 ms p50 | `for i in $(seq 1 30); do curl -s -o /dev/null -w "%{time_starttransfer}\n" "https://.../?cb=$RANDOM"; done` median |
| P2 | Landing `x-vercel-cache` | `HIT` after first request | `curl -I` on / after warm-up |
| P3 | Landing LCP mobile p75 | ≤1.8 s | PageSpeed Insights or Lighthouse CI |
| P4 | Landing JS transferred gzipped | ≤120 KB | DevTools Network panel or Lighthouse |
| P5 | App-route CSP still has nonce | yes | `curl -I https://.../train` should show `nonce-...` |
| P6 | Landing CSP no longer has nonce, has script hash | yes | `curl -I https://.../` |
| P7 | No `'unsafe-inline'` in any production script-src | yes | grep CSP headers all routes |

### 5.2 SEO

| # | Criterion | Target | How measured |
|---|---|---|---|
| S1 | Every public route has unique `<title>` + `<meta description>` | yes | curl + grep across all public routes |
| S2 | Sitemap.xml includes all 27+ public pages | yes | `curl https://.../sitemap.xml \| grep -c "<url>"` ≥27 |
| S3 | robots.txt explicitly disallows `/api`, `/admin`, `/train`, `/dashboard`, `/settings` | yes | curl + read |
| S4 | JSON-LD schemas present per page-type (WebApplication on /, Book on /buecher/*, Person on /autoren/*) | yes | curl + grep `application/ld+json` |
| S5 | `<meta name="keywords">` removed | yes | absent |
| S6 | Google Search Console verification meta tag added if user supplies a code | optional | layout supports `<meta name="google-site-verification">` if set |

### 5.3 UX

| # | Criterion | Target | How measured |
|---|---|---|---|
| U1 | Demo round completable without auth | yes | manual test: visit /demo logged-out, submit, see feedback |
| U2 | Onboarding total time-to-first-meaningful-action (TTFMA) for new signup | <90 s | manual stopwatch from signup-button-click to first chunk-render |
| U3 | Mode switcher visible on every /train page-load | yes | screenshot inspection |
| U4 | Mode switch mid-card does not lose user progress | yes | test: type partial input, switch mode, return → input preserved |
| U5 | Light mode + Dark mode both render legibly on /, /demo, /train, /welcome, /books | yes | manual screenshot inspection both themes |

### 5.4 Content / Brand

| # | Criterion | Target | How measured |
|---|---|---|---|
| C1 | No occurrence of "Claude 3.5 Haiku" anywhere in user-facing copy | yes | `grep -ri "Claude 3.5\|Haiku" app/ components/` |
| C2 | No occurrence of "Bedrock" in user-facing copy or env templates | yes | grep |
| C3 | "The Franklin Method" is the visual brand name throughout (logo, page titles, OG, hero); footer disclaimer about Eric Franklin Method® separation present and accurate | yes | grep + visual review on every public page |
| C4 | All UI text is German (no leaked English strings on user-facing pages) | yes | grep `app/` for telltale EN words ("the", "and", "you", "your" outside JSDoc) |
| C5 | /methode page exists with: verbatim Franklin quote (cited), Quintilian/imitatio context, Stevenson reference (cited as kindred), honest "informed prototype" framing | yes | manual content review |

### 5.5 Pedagogy

| # | Criterion | Target | How measured |
|---|---|---|---|
| L1 | Chunk-size validator: respects per-play-mode minimum (Anfänger≥30, Fortgeschritten≥60, Profi≥100 words) | yes | code path + a chunk-fetch trace per mode |
| L2 | Hint-length formula `clamp(2, floor(sentence_word_count / 3), 8)` is enforced for Anfänger-mode (Franklin-Reconstruction); other modes don't use hints | yes | code review |
| L3 | 3-option segmented control [Anfänger \| Fortgeschritten \| Profi] visible on /train every page load | yes | screenshot |
| L4 | Switching play-mode mid-card persists to `user_settings.current_play_mode` AND re-renders with new scoring config | yes | manual test: switch from Anfänger to Profi on the same chunk, observe re-render |
| L5 | Cloze accessible from /train via secondary "Warmup" chip, NOT in main top-bar segmented control | yes | code review + screenshot |
| L6 | Scoring strictness differs per mode: lenient (×18), standard (×25), strict (×32) — same Style-Distance gives 3 different scores | yes | with a fixed `style_distance` input, three modes produce three different `style_score` outputs |

### 5.6 Aggregate "done" criterion

The relaunch is complete when ALL of the following are true:
1. All 25 criteria above pass
2. `next build` succeeds with zero TypeScript errors
3. `git status` clean
4. Manual smoke test: complete one Franklin-Loop full cycle (encoding → wait simulated → retrieval → feedback) without errors
5. Manual smoke test: complete one Free Writing cycle
6. Manual smoke test: visit /demo as logged-out user, submit, see feedback
7. Lighthouse Performance ≥85 (mobile), Accessibility ≥95, SEO ≥95 on `/`

---

## 6. Open Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | C&D from Eric Franklin Method® GmbH (DACH) over the brand name | low-medium | medium | §7 rollback path pre-planned, ~4h to revert; footer disclaimer is first-line defense; user accepted exposure |
| R1b | FranklinWrite / Copywork.app file an opposition or complaint | low | low | Both are US-based; different jurisdiction and class scope; nominative fair use defense is strong |
| R2 | Route-scoped CSP introduces a security regression on app routes | low | high | careful matcher pattern, curl verification per route post-deploy, criterion P5 + P6 |
| R3 | Public /books exposure leaks data not intended for indexing | low | medium | confirm only public-domain texts are indexable (per migration seeds 003+004 with is_pd_us/is_pd_eu flags); only index chunks where both flags = true |
| R4 | Programmatic /autoren/* + /buecher/* triggers Google "scaled content abuse" enforcement | low | medium | each page is unique-value (real stylistic data from real corpus, real author bios), well below the 70K-page threshold Zapier-class sites use; safe by current Google guidance |
| R5 | Welcome-flow shorter to 1 screen but novice users get dropped into /train without context | medium | medium | dismissible info-banner in /train on first visit, persistent /methode footer link, demo round serves as zero-friction tutorial |
| R6 | Cloze code-removal would be destructive; keeping it but demoting requires deliberate UI gating | low | low | UI-only change, no DB / RPC removal |
| R7 | Existing user_settings rows have `default_mode='franklin'` and no `current_play_mode` column | low | low | Migration adds `current_play_mode` with default `'anfaenger'`; back-fill existing rows; old `default_mode` column kept as legacy unused (drop in a later cleanup commit) |

---

## 7. Rollback Path: Back to "Literary Forge" if C&D arrives or User Reverts

Recorded so the rollback is pre-planned, not improvised under pressure.

**Trigger conditions:**
- C&D letter from Eric Franklin's institute (franklinmethod.com / Institute of Franklin Method® GmbH)
- C&D letter from FranklinWrite or related
- User changes mind on brand-risk tolerance
- DPMA / EUIPO opposition if the project ever files its own ®

**Rollback procedure (~4 hours, zero data loss):**

1. **Replace brand text everywhere** — single grep+replace: "The Franklin Method" → "Literary Forge" across:
   - `app/page.tsx` hero + headlines
   - `app/[locale-removed]/layout.tsx` metadata (title, openGraph, twitter)
   - `app/methode/page.tsx` page title (the page itself stays, just renamed)
   - All OG-image assets if generated
   - Logo SVG if it had wordmark
   - `README.md`, `SECURITY.md`, `nlp-service/README.md`
   - JSON-LD `name` fields
2. **Remove footer disclaimer** (no longer needed)
3. **Update sitemap regenerator** to re-emit canonical URLs
4. **Rebuild + redeploy** — one Vercel deploy cycle (~2 min)
5. **Notify the C&D originator in writing** of the change (lawyer-recommended, demonstrates good faith)

Domain stays `literary-forge.vercel.app` throughout (never bought a Franklin-domain), so DNS is untouched. SEO authority earned during the "Franklin Method"-branded period transfers cleanly because the URL never changed.

**Cost ceiling:** ~4h dev + ~€100 if a lawyer-letter response is wanted. Acceptable insurance premium for the brand-decision risk.

---

## 8. Appendix A — Research Sources

(Full citations from the 6 research agents dispatched 2026-05-14 for the spec. Each section above cites in-line.)

**Performance & Web Vitals:**
- Next.js 16 Content Security Policy guide — nextjs.org/docs/app/guides/content-security-policy
- Next.js 16 Server and Client Components — nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js 16.2 Turbopack SRI blog — nextjs.org/blog/next-16-2-turbopack
- web.dev Optimize LCP — web.dev/articles/optimize-lcp
- Vercel Routing Middleware — vercel.com/docs/routing-middleware
- Lucide React tree-shaking — lucide.dev/guide/packages/lucide-react

**SEO 2025-2026:**
- Seer Interactive AIO impact September 2025 — seerinteractive.com/insights/aio-impact-on-google-ctr-september-2025-update
- Ahrefs AI Overviews CTR study — ahrefs.com/blog/ai-overviews-reduce-clicks-update/
- Breakline guide to Scaled Content Abuse — breaklineagency.com/guide-to-googles-scaled-content-abuse/
- Google Search Central — Structured Data Policies — developers.google.com/search/docs/appearance/structured-data/sd-policies
- December 2025 Core Update analysis — thatware.co/google-december-2025-core-update/
- Indie Hackers Reddit-SEO combo — indiehackers.com/post/reddit-seo-the-indie-hacker-combo-that-s-still-criminally-underrated-e952665135

**Franklin Method primary text & rhetoric tradition:**
- Franklin, *Autobiography* Part One — Project Gutenberg eBook #148
- Lemay & Zall, *Autobiography: A Genetic Text* (1981)
- Wood, *The Americanization of Benjamin Franklin* (2004)
- Quintilian, *Institutio Oratoria* Book X
- Terrill, "Reproducing Virtue: Quintilian, Imitation, and Rhetorical Education," *Advances in the History of Rhetoric* 19:2 (2016)
- Stevenson, "A College Magazine," in *Memories and Portraits* (1887)

**UX research:**
- NN/g Progressive Disclosure — nngroup.com/articles/progressive-disclosure/
- NN/g Onboarding Tutorials — nngroup.com/articles/onboarding-tutorials/
- NN/g Tabs Used Right — nngroup.com/articles/tabs-used-right/
- MeasuringU Click vs Clock — measuringu.com/click-clock/
- Baymard Online Learning UX Benchmark 2025 — baymard.com/blog/online-learning-2025-benchmark
- UserGuiding Duolingo Onboarding teardown
- Evil Martians 100 devtool landing pages 2025

**Pedagogy:**
- Roediger & Karpicke 2006, *Psychological Science* 17(3) — testing effect
- Karpicke & Blunt 2011, *Science* 331 — retrieval beats elaborative
- Dunlosky et al. 2013, *Psychological Science in the Public Interest* — practice testing as high-utility
- Macnamara, Hambrick & Oswald 2014, *Psychological Science* 25(8) — deliberate practice meta-analysis
- Van Merriënboer & Sweller 2005, *Educational Psychology Review* 17(2) — cognitive load
- Bertsch et al. 2007, *Memory & Cognition* 35(2) — generation effect meta
- Nakanishi 2015, *TESOL Quarterly* 49(1) — extensive reading meta
- Charney & Carlson 1995, *Research in the Teaching of English* 29(1) — models in writing
- Beers & Nagy 2009, *Reading and Writing* — sentence-level fluency
- Crossley et al. 2014 — syntactic complexity indices

**Market & competitor scan:**
- FranklinWrite — franklinwrite.com
- Copywork.app — copywork.app
- CopyCraft — copyworkapp.com
- Sudowrite — sudowrite.com, docs.sudowrite.com
- NovelCrafter, Squibler, Lex.page, ProWritingAid, AutoCrit, HyperWrite — referenced individually in §3.1

**Trademark + brand:**
- franklinmethod.com (Eric Franklin) — terms-conditions, about
- de.wikipedia.org/wiki/Franklin-Methode
- USPTO TSDR (manual search owed)
- DPMA register.dpma.de (manual search owed)
- EUIPO eSearch (manual search owed)
- WIPO Global Brand Database (manual search owed)

---

## 9. Appendix B — Files affected (high-level inventory)

**New files:**
- `app/demo/page.tsx` — no-auth demo (§3.6)
- `app/methode/page.tsx` — Franklin-method story page, /methode-Slug (§3.6)
- `app/autoren/page.tsx` — author index (§3.5)
- `app/autoren/[slug]/page.tsx` — per-author public page with bio + style profile (§3.5 + §3.10 Copywork-adopted bio paragraphs)
- `app/buecher/page.tsx` — book index (re-purpose existing /books, make public)
- `app/buecher/[slug]/page.tsx` — per-book public page (repurpose /read/[bookId])
- `app/train/custom/page.tsx` — user-private "Mein Text"-Upload (§3.10 wedge against FranklinWrite custom-content)
- `app/changelog/page.tsx` — auto-generated from git log (§3.10 active-project signal)
- `app/(marketing)/layout.tsx` — slim layout for static routes (no Supabase client)
- `components/training/ModeSwitcher.tsx` — top-bar 2-option segmented control [Franklin | Free]
- `components/training/WarmupChip.tsx` — Cloze entry point (§3.9)
- `lib/seo/structured-data.ts` — JSON-LD helpers per page-type
- `data/authors-bios.ts` — manual bio data for 12 authors (~50-80 words each, see §3.10)
- New migration: `supabase/migrations/022_custom_text_uploads.sql` — adds `private boolean` + `owner_user_id uuid` to `source_texts` with RLS policy

**Modified files:**
- `middleware.ts` — narrowed matcher
- `next.config.ts` — `optimizePackageImports`, static CSP for landing route
- `app/layout.tsx` — split into marketing layout + app layout, drop generic `keywords` meta
- `app/page.tsx` — landing redesign
- `app/welcome/page.tsx` — 3 steps → 1 screen
- `app/login/page.tsx` — already redesigned, minor copy
- `components/navigation/Navbar.tsx` — server/client split
- `components/navigation/Footer.tsx` — add `/methode` link
- `components/training/TrainingInterface.tsx` — integrate ModeSwitcher
- `components/training/modes/FranklinEncodingPhase.tsx` — chunk-size + hint-length validator
- `components/admin/BookIngestForm.tsx` — ensure imports correct
- `app/sitemap.ts` — programmatic author + book entries
- `app/robots.ts` — explicit disallow on auth-gated routes
- `lib/srs/fsrs.ts` — possibly mode-specific minimum-interval floors (per pedagogy research §3.3)

**Deleted/removed:**
- generic `<meta name="keywords">` in metadata
- `Geist_Mono` import from root layout (move to /train where used)
- 3-step wizard logic in welcome (replaced by 1-screen info card)

**Untouched (out of scope):**
- `lib/llm/gemini.ts`
- `lib/nlp/parser-client.ts` and Render service
- `lib/scoring/style-distance.ts`
- Supabase migrations 001-021
- `app/api/*` API routes

---

## 10. Sign-off

This spec represents the brainstorm + research output. Per the brainstorming workflow:

1. ✅ Project context explored (deep — 4 prior session-Wellen)
2. ✅ Clarifying questions asked (Q1-Q4 in brainstorm)
3. ✅ 6 parallel research agents dispatched, evidence-grounded
4. ✅ Verification: middleware matcher, welcome wizard, hint-length code path, FranklinWrite + Eric Franklin Method® + Copywork.app market scan
5. → User review of THIS document
6. → Once approved: invoke `superpowers:writing-plans` to produce step-by-step implementation plan

**User review status:** All 5 brainstorm-end questions resolved 2026-05-14:

| # | Question | User decision |
|---|---|---|
| 1 | Brand identity | "The Franklin Method" (over recommendation — risks accepted, mitigations in §3.1, rollback in §7) |
| 2 | Mode-default routing | Three switchable Play-Modes on /train (Anfänger / Fortgeschritten / Profi) — replaces self-assessment per user re-decision 2026-05-15. Cf. §3.3 |
| 3 | Cloze fate | Demote to Warmup-Chip, not in top-bar — §3.3 / §3.9 |
| 4 | /demo no-auth path | In scope (assistant decision) — §3.6 |
| 5 | SEO surface expansion (autoren/buecher) | In scope (assistant decision) — §3.5 |

**Bonus user-asked addition:** "Schau dir auch positive Seiten beim anderen Projekt ab oder was wir besser machen können." → §3.10 Lessons from Competitors written with concrete adoption items + differentiation wedges.

**Next step:** invoke `superpowers:writing-plans` to translate this spec into a step-by-step implementation plan with concrete file edits, build/verify steps per commit, and rollback hooks. User triggers the actual implementation separately.
