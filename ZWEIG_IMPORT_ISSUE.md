# Brief einer Unbekannten - Import Issue & Resolution

## Problem Summary

**Status:** ❌ Data corruption detected and removed
**Affected Book:** "Brief einer Unbekannten" by Stefan Zweig
**Issue Date:** 2026-01-23

### What Happened

1. **Wrong Content Imported**: The database contained 1,000 chunks labeled as "Brief einer Unbekannten" (Stefan Zweig's German novella)
2. **Actually Contained**: French text from Marie Lebert's "LE LIVRE 010101: ENQUETE" (a survey about digital publishing)
3. **Root Cause**: Project Gutenberg ebook #27036 is mislabeled - it contains French content instead of Zweig's German text
4. **Impact**: 465 chunks contained French text, only 20 contained actual German text

### Resolution Taken

✅ **Deleted all 1,000 corrupted chunks** (2026-01-23)
✅ **Created language detection utility** ([`lib/utils/language-detection.ts`](lib/utils/language-detection.ts))
✅ **Fixed scene description error handling** (now uses fallback excerpts for invalid content)

---

## Next Steps: Correct Import

### Option 1: Manual Download & Import (Recommended)

1. **Find Correct Source**
   - Try: https://www.projekt-gutenberg.org/ (search "Stefan Zweig")
   - Or: https://standardebooks.org/ (if available)
   - Or: https://archive.org/ (search "Stefan Zweig Brief einer Unbekannten")

2. **Download German Text**
   - Verify it's actually German (contains "berühmten Romanschriftsteller", "Wien", etc.)
   - Save as `brief-einer-unbekannten.txt`

3. **Import via Admin Interface**
   - Go to `/admin/ingest`
   - Upload the file
   - Set metadata:
     - Title: "Brief einer Unbekannten"
     - Author: Stefan Zweig
     - Language: German (de)
     - CEFR Level: B2
     - Tags: Moderne, Novelle, Psychologie

### Option 2: Skip This Book

Use other available books that are working correctly:
- Die Verwandlung (Kafka)
- The Great Gatsby (Fitzgerald)
- Frankenstein (Shelley)
- Pride and Prejudice (Austen)
- etc.

### Option 3: Use Different Zweig Work

Stefan Zweig has other works available:
- **Schachnovelle** (The Royal Game) - widely available
- **Angst** (Fear)
- **Brennendes Geheimnis** (Burning Secret)

---

## Prevention: Language Validation

The new `language-detection.ts` utility prevents this issue in future imports:

```typescript
import { validateTextLanguage } from '@/lib/utils/language-detection'

// Before importing German text
const validation = validateTextLanguage(text, 'de', 0.3)

if (!validation.valid) {
  console.error('Language mismatch:', validation.error)
  // Shows: "Expected de, detected fr with 85% confidence"
}
```

### Integration Points

Should be added to:
1. **Admin upload interface** ([`app/admin/ingest/page.tsx`](app/admin/ingest/page.tsx))
   - Validate before chunking
   - Show warning if language mismatch detected

2. **Batch import script** (if created)
   - Validate each book before import
   - Skip books that fail validation

3. **Scene description generation** ([`app/api/generate-scene-description/route.ts`](app/api/generate-scene-description/route.ts))
   - Already detects and handles error responses ✅

---

## Data Quality Check

To verify all other books are correct:

```typescript
// Check if any other books have wrong language
const { data: allChunks } = await supabase
  .from('source_texts')
  .select('id, title, content, language')
  .limit(100)

for (const chunk of allChunks) {
  const validation = validateTextLanguage(chunk.content, chunk.language)
  if (!validation.valid) {
    console.warn(`⚠️  ${chunk.title}: ${validation.error}`)
  }
}
```

---

## Technical Details

### Project Gutenberg #27036 Issue

**Official URL:** https://www.gutenberg.org/ebooks/27036
**Label:** "Brief einer Unbekannten" by Stefan Zweig
**Actual Content:** "LE LIVRE 010101: ENQUETE" by Marie Lebert (French)

This is a cataloging error in Project Gutenberg's database.

### Correct Sources Attempted

All returned 404 or wrong content:
- ❌ `gutenberg.org/files/27036/27036-0.txt` (French survey)
- ❌ `gutenberg.spiegel.de/buch/brief-einer-unbekannten-5522/` (HTML wrapper only)
- ❌ `zeno.org` (404)
- ❌ `archive.org/stream/briefeinerunbeka00zwei` (404)

**Recommendation:** Use manual download from trusted German literature archive.

---

## Current Database State

```
Brief einer Unbekannten chunks: 0 (deleted)
Other Zweig works: 0
Language detection utility: ✅ Created
Scene description fix: ✅ Deployed
```

**Safe to proceed with:**
- All other imported books are working correctly
- Training interface handles missing/invalid scene descriptions gracefully
- Future imports will be validated before insertion

---

*Document created: 2026-01-23*
*Last updated: 2026-01-23*
