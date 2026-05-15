# Steve-Jobs-Eleganz-Pass auf Public-Surface — Design

**Datum:** 2026-05-15
**Folge zu:** qol-A/B/C (Public-Polish), qol-D/E/F (Auth-Surface).
**Scope:** Public-Surface komplett (`/`, `/methode`, `/demo`, `/autoren`, `/autoren/[slug]`, `/buecher`, `/buecher/[slug]`, `/login`, Legal). **Nicht Auth-Surface** — die bleibt funktionsorientiert.

## 1. Kontext

Bisherige Public-Wellen (qol-A bis C) haben Bezos-Lens-Pains gefixt: tote Links, kalte Routen, fehlende Meta-Daten. Die Surface ist *technisch* poliert, aber visuell noch im „funktional-dunkel"-Idiom (pure black background, sans-serif everywhere, multiple emoji icons, glänzende CTA-Boxen mit Drop-Shadow + Scale-Hover, redundante Feature-Card-Grids).

Dieser Pass übersetzt drei Doktrinen ins UI:

1. **Steve Jobs:** „Design is how it works." Ruthless elimination — wenn ohne besser, dann weg. Single intuitive action statt feature inventory. Source: [Fast Company — 6 pillars](https://www.fastcompany.com/1665375/the-6-pillars-of-steve-jobss-design-philosophy), [press.farm — design philosophy](https://press.farm/understanding-steve-jobs-design-philosophy/).
2. **Dieter Rams:** Innovativ, nützlich, ästhetisch, verständlich, ehrlich, unaufdringlich, langlebig, konsistent, so wenig Design wie möglich. Source: [Interaction Design Foundation](https://ixdf.org/literature/article/dieter-rams-10-timeless-commandments-for-good-design).
3. **Luxushotel-Editorial 2026:** Generous whitespace, expressive serif, rich neutrals, single confident CTA, content-as-gallery-piece. Beispiele: The Hoxton, The Ned London. Source: [Mediaboom — Luxury Hotel Trends](https://mediaboom.com/news/hotel-website-design-trends/), [blocHaus — Luxury Minimalism](https://www.blochaus.com/blog/luxury-minimalism-in-hotels).

## 2. Design-Doktrin (verdichtet, projektspezifisch)

| Achse | Aktuell | Neue Doktrin |
|---|---|---|
| Schrift Display | Geist Sans 7xl Bold tracking-tight | **Fraunces** variable Serif (opsz/SOFT), Weight 300-400, sehr großzügiges Leading |
| Schrift Body | Geist Sans | **Geist Sans** bleibt — bekannt, leistbar, knapp |
| Schrift Mono | Geist Mono no-preload | bleibt unverändert |
| Hintergrund Light | unklar / weiß | `#faf7f0` warm-creme (papyrus) |
| Hintergrund Dark | pure black | `#1a1612` deep warm charcoal (kein pure-black) |
| Vordergrund Light | unklar | `#1a1612` |
| Vordergrund Dark | pure white | `#f4f1eb` off-white papyrus |
| Akzent | div. (Blau für CEFR, Gold-Border auf Quote, etc.) | **ein einziger warmer Gold** `#b69876` für Hover/Active |
| Border | grau | sehr zurückhaltend `#26221d` (dark) / `#e8e2d6` (light) |
| Spacing-Scale | Tailwind-Default (4/8/12/16…) | erhöht auf 24/32/48/64/96 für Sektion-Spacing, vertikaler Rhythmus |
| Motion | hover:opacity-90, hover:scale-105, shadow-2xl, transition-all | 200ms ease-out, kein scale, kein shadow, nur color- und gap-Transitionen |
| Emojis | überall (🔄 📊 🤖 📚 🇩🇪 ✅ ⏰ etc.) | nur wenn funktional unverzichtbar (nirgends auf Public-Surface) |
| Sprache | DE mit informellen Hervorhebungen | DE mit serif-italic Akzent für Zitate, kein <strong> Inflation |

## 3. Element-Pruning-Regeln

Auf Public-Surface entfernt:

- **Alle dekorativen Emojis** (🔄 📊 🤖 📚 🇩🇪 🇬🇧 — durch Text-Klassifikation ersetzt wo Information nötig).
- **3-Feature-Card-Grid auf `/`** (🔄 Spaced Repetition, 📊 Stilometrie, 🤖 KI-Feedback) — Info dupliziert den Body-Paragraph; wird zur kursiven Fußnote oder fällt komplett.
- **Multi-CTA-Stack** — eine starke CTA pro Page, Sub-Links als Text-Reihe.
- **Drop-Shadow + Scale-Hover** auf CTAs — wird durch Underline + Gap-Animation ersetzt.
- **Tag-Pills** auf Buch-Karten (Genre-Chips) — Genre wandert in den Untertitel-Satz.
- **„Tipp:"-Boxen** ohne aktionablen Nutzen.
- **CEFR-Badge in Blau** — Text-Inline statt Pill, Farbe weg.
- **Sub-Sigma-Bars-Wrapper-Cards** auf `/autoren/[slug]` — Bars direkt in den Text-Fluss eingebettet.

## 4. Layout-Decisions pro Page

### `/` (Landing)

- Eyebrow „est. 1722 · benjamin franklin" oben.
- Display-Headline zweizeilig: „Schreibstil lernen, *wie Franklin sich selbst beibrachte.*" (Z. 2 in Kursiv-Variant Fraunces).
- Sub: kurze kursive Serif-Aussage über die Methode.
- Body-Paragraph: 1 Absatz, sans-serif, keine `<strong>`-Inflation, 540px max-width.
- CTA: schmal, unterstrichen, „Demo ansehen →", Hover öffnet Gap + wechselt zu Gold.
- Sub-Links: „Methode · Bücher · Anmelden" als 13px-Text-Reihe rechts neben der CTA.
- Footnote unten kursiv: „Spaced Repetition, Stilometrie, qualitatives Lektorat — die Maschinerie steht im Hintergrund."

### `/methode`

- Display-Headline (Fraunces) für den Story-Einstieg, dann editorial body bei 65ch max-width.
- Verbatim-Autobiografie-Zitat als Dropcap-Block-Quote (Serif, italic, größerer Schriftgrad).
- Glossary-Tooltips (Burrows-Δ, MTLD, FSRS, Dependency-Distance) bleiben — sie sind funktional, der Glossar-Inhalt selbst wird typografisch knapper.
- Sektionswechsel durch generous vertical spacing (mind. 96px), keine Card-Boxen.

### `/demo`

- DemoClient-Three-Step bleibt funktional, aber:
  - „Reading"-Phase: Original-Text in Serif statt Mono / Sans
  - ZenEditor in Demo: gleicher Treatment (Serif body) wenn der User schreibt
  - Feedback-Step: bestehend, aber Score-Card in dezenter Serif-Display-Number

### `/autoren` (Index)

- Liste statt Card-Grid.
- Eine Zeile pro Autor: **Autor-Name** (Fraunces, large, ~32px), `—`, Bio-Snippet (Sans, 1 Zeile, muted), `→` chunk_count (mono, klein, rechts).
- Klick auf gesamte Zeile navigiert; einziger Hover-State: Gold-Color-Sweep über Name.

### `/autoren/[slug]` (Per-Autor)

- Hero-Block: Autor-Name (Display-Serif), Lebensdaten (Sans muted small), Bio als editorial paragraph (Serif 18px / 1.65).
- Sigma-Bar-Stilometrie INLINE im Text-Fluss: ein-spaltige minimale Glyph-Bars unter „Stil im Vergleich zum Korpus" mit Feature-Name und z-Wert; keine umgebende Card-Box.
- Werkliste: Liste-Pattern wie `/autoren`-Index, pro Werk Titel + Year + chunk_count.
- Single-CTA am Ende: „Mit X trainieren →".

### `/buecher` (Index)

- Liste, gleiches Pattern wie `/autoren`-Index.
- Eine Zeile: **Titel** (Display-Serif) `—` Autor (Sans muted), `(Jahr · Sprache · CEFR · X Chunks)` (Sans, klein, muted, mono für Zahlen).

### `/buecher/[slug]` (Per-Buch)

- Hero: Buchtitel (Display), Autor + Year als sub-meta.
- Excerpt-Block großzügig in Serif, 16-18px, line-height 1.7.
- Related-Works: 3 minimale Listen-Zeilen, kein Card-Treatment.
- Single-CTA: „Mit diesem Buch trainieren →".

### `/login`

- Visual-Brand-Stelle: H1 von „Literary Forge" → „The Franklin Method" (out-of-scope-Reste aus qol-D, hier mitgenommen).
- Login-Form bleibt funktional; Card-Box wird flacher (kein border-radius-xl, dezenter border, weniger padding).
- Sub-Microcopy in Fraunces italic („Eine Anmeldung genügt für alle drei Modi.").

### Legal (`/datenschutz`, `/impressum`, `/urheberrecht`, `/kontakt`)

- Brand-Text in Body bleibt unverändert (rechtliche Konsistenz mit Eric-Franklin-Method-Disclaimer aus qol-A).
- Nur Typografie aktualisiert: Display-Serif für H1, Body bleibt Sans.

### Navbar + Footer (global, aber Public-zentriert)

- Logo „The Franklin Method" wechselt Font zu Fraunces light (340 weight).
- Icon-Buttons (Home, BookOpen, Library, Sparkles): bleiben funktional, lucide-react bleibt; aber Active-State wechselt von filled-foreground-block zu Underline-only.
- Footer: bleibt strukturell, Brand-Disclaimer-Block wird typografisch ruhiger (Fraunces italic für Disclaimer-Satz).

## 5. Non-Goals

- **Auth-Surface**: bleibt funktionsorientiert. Nicht in dieser Welle.
- **Hero-Bilder/Photography**: keine Stock-Fotos, keine Hero-Images. Typografische Hierarchie trägt allein.
- **Dark-Mode-Aufgabe**: bleibt erhalten, beide Themes werden mit neuer Palette versorgt.
- **Tailwind-Config-Refactor**: kein vollständiger Theme-Reset. Wir erweitern, ersetzen nicht.
- **Animation-Library**: keine Framer-Motion-Einführung. CSS-Transitions reichen.
- **Brand-Migration**: URL bleibt `literary-forge.vercel.app`. Visual-Brand `The Franklin Method` bleibt.

## 6. Wellen-Plan

Drei Wellen analog qol-Pattern, ein Commit pro Welle, Live-Verify nach jeder.

### Welle jobs-A — Foundation (Tokens + Typography)

Theme-Layer ohne Layout-Änderungen.

- `app/layout.tsx`: Fraunces-Font-Family hinzufügen (variable subset opsz+SOFT, weights 300-500, italic-supported).
- `app/globals.css`: CSS-Variables aktualisieren: `--background`, `--foreground`, `--card`, `--border`, `--muted`, `--accent` für Light + Dark Theme mit neuer Palette.
- `tailwind.config` (oder Tailwind v4 inline-config in `globals.css`): font-family-display = `Fraunces`-Stack; spacing-scale-Extension für editorial values.
- Akzeptanz: alle Public-Routen lassen sich noch normal aufrufen, Farbtöne sind warm, Display-Headlines sind Serif. Funktional unverändert.

### Welle jobs-B — Reduction (Element-Pruning)

Inhaltliche Reduktion ohne Re-Layout.

- `/`: 3-Feature-Card-Grid entfernen, Body trimmen, Headline mit `<em>` für Zeile 2.
- Alle Public-Pages: Emojis entfernen (außer Footer-Disclaimer wo sie ggf. rechtliche Eindeutigkeit unterstützen).
- Card-Boxen auf `/buecher`, `/autoren` zurückbauen — Liste-Pattern.
- Tag-Pills weg, Genre als Inline-Text.
- CEFR-Badge: Pill weg, Inline-Text.
- CTA-Stack: nur 1 CTA pro Page, Sub-Links als Text-Reihe.
- Akzeptanz: `grep -rin '🔄\|📊\|🤖\|🇩🇪\|🇬🇧\|✅\|🎉' app/page.tsx app/methode/ app/demo/ app/autoren/ app/buecher/ app/login/` → 0 Treffer.

### Welle jobs-C — Layout (Editorial Re-Layout)

Strukturelle Layout-Restructure.

- `/`: Eyebrow + Headline + Sub + Body + CTA + Footnote-Vertical-Editorial-Layout.
- `/autoren/[slug]`: Sigma-Bars inline-text-flow, Werkliste als Liste.
- `/buecher/[slug]`: Excerpt-zentriert, Related-Works als Liste.
- `/login`: H1 auf „The Franklin Method", flacher Card, italic Microcopy.
- Navbar + Footer Brand-Logo in Fraunces, Active-State Unterstrich.
- `app/manifest.ts`, `app/not-found.tsx`, `app/login/layout.tsx`: Brand-Reste (`Literary Forge` → `The Franklin Method`) als Mitnahme aus qol-D-Follow-up #25.
- Akzeptanz: visuell — Public-Routen erinnern an Editorial-Magazin, nicht an Dashboard. Live-Verify TTFB darf nicht regression-en (Fraunces lädt schmal: nur subset).

## 7. Risiko + Rollback

- **Risiko Fraunces Font-Load**: neue Fontdatei = neuer Round-Trip. Mitigation: `next/font/google` mit `subset: 'latin'`, `display: 'swap'`, `preload: true` (display-relevant), `weight: variable` aber `opsz` definiert.
- **Risiko Color-Token-Refactor**: bestehende Tailwind-Klassen mit hardcodierten Farben (z. B. `text-blue-400`) könnten unbehandelt EN-Style bleiben.
  Mitigation: vor Welle jobs-A `grep -rn 'text-blue\|bg-blue\|text-green\|bg-green\|text-red\|bg-red\|text-yellow' app/ components/` durchgehen und gegen `var(--accent)` ersetzen wo es Sinn ergibt.
- **Risiko Auth-Surface-Konflikt**: Theme-Tokens betreffen auch Auth-Pages. Mitigation: in jobs-A Auth-Surface bewusst beobachten (Dashboard, /train, /settings) — falls Welle-jobs-A Spacing oder Color zu unruhig macht, isolieren wir Public via Wrapper.
- **Rollback**: pro Welle ein Commit → `git revert <sha>` rollt nur diese Welle zurück.

## 8. Akzeptanz-Kriterien (final)

Nach Welle jobs-C deployed:

- `grep -rin 'emoji-icon\|text-4xl mb-3' app/` für Public-Pages → 0 (keine emoji-icon-Cards mehr).
- `/` zeigt eine einzige CTA, kein 3-Card-Grid.
- `/autoren` und `/buecher` rendern als Listen, nicht als Grid mit Karten-Boxen.
- Display-Headlines auf allen Public-Pages sind Serif (Fraunces).
- Body-Hintergrund: warm-creme (Light) bzw. warm-charcoal (Dark) — nicht pure white / black.
- `/login` zeigt H1 „The Franklin Method".
- TTFB auf `/` (warm HIT) bleibt unter 200 ms.
- Lighthouse-Accessibility-Score nicht regressed (>= 95).

## 9. Was bewusst NICHT gemacht wird

- Hero-Imagery / Stock-Fotos.
- Animation-Library (Framer Motion etc.).
- Dark-Mode-Removal (beide Themes bleiben).
- Auth-Surface-Veränderung.
- Tailwind-v4-Refactor zu OKLCH-Tokens (späterer Sub-Sprint, falls je nötig).
- Tippspeed-Animation / Typewriter-Effekte (User hat in Phase 6.7 entfernt — bleibt entfernt).
