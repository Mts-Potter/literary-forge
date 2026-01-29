# PWA Icons & OG Images

Dieses Verzeichnis enthält aktuell **automatisch generierte Placeholder-Icons** mit dem "LF" (Literary Forge) Branding.

## Aktuelle Dateien:

- `icon-192.png` (192x192px) - PWA Icon für kleinere Displays
- `icon-512.png` (512x512px) - PWA Icon für größere Displays
- `logo.png` (512x512px) - Logo für Organization Schema
- `og-image.png` (1200x630px) - Open Graph Image für Social Media Shares

## Wie du eigene Icons erstellst:

### Option 1: Design Tool (empfohlen)
1. Verwende Figma, Canva oder Adobe Illustrator
2. Erstelle ein quadratisches Design (512x512px) mit deinem Branding
3. Exportiere als PNG in den benötigten Größen:
   - 192x192px → `icon-192.png`
   - 512x512px → `icon-512.png` & `logo.png`

### Option 2: Online Icon Generator
Nutze kostenlose Tools wie:
- https://realfavicongenerator.net/
- https://favicon.io/
- https://www.pwabuilder.com/imageGenerator

### Option 3: Professioneller Designer
Beauftrage einen Designer auf Fiverr oder 99designs für professionelle Icons.

## Open Graph Image (Social Media)

Das `og-image.png` (1200x630px) wird angezeigt wenn deine Website auf Social Media geteilt wird.

**Best Practices:**
- Nutze dein Logo/Branding
- Füge einen kurzen, prägnanten Text hinzu
- Vermeide zu kleine Schrift (mind. 32px)
- Teste mit Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/

## Icons ersetzen:

1. Ersetze einfach die PNG-Dateien in diesem Verzeichnis
2. Behalte die gleichen Dateinamen bei
3. Achte auf die korrekten Dimensionen
4. Deploy zu Vercel - die neuen Icons werden automatisch verwendet

## Script regenerieren:

Falls du die Placeholder neu generieren möchtest:
\`\`\`bash
node scripts/generate-icons.js
\`\`\`

---

**Hinweis:** Die aktuellen Placeholder funktionieren perfekt für SEO und PWA - du kannst sie jederzeit durch professionelle Icons ersetzen ohne Code zu ändern!
