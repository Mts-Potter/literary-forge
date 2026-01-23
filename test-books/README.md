# Test Books für Literary Forge

Dieser Ordner enthält gemeinfreie deutsche Klassiker zum Testen des Book Import Systems.

## 📥 Quick Start

```bash
cd ~/literary-forge
./scripts/download_test_books.sh
```

## 📚 Enthaltene Bücher

### 1. Die Verwandlung (Franz Kafka, 1915)
- **Datei**: `kafka_verwandlung.txt`
- **Quelle**: [Project Gutenberg #5200](https://www.gutenberg.org/ebooks/5200)
- **Größe**: ~110 KB (~25.000 Wörter)
- **Status**: ✅ PD in USA & EU
- **CEFR**: B2
- **Tags**: Novelle, Existenzialismus, Kafka, Klassiker, Moderne

**Download**:
```bash
curl -L -o test-books/kafka_verwandlung.txt \
  "https://www.gutenberg.org/files/5200/5200-0.txt"
```

### 2. Traumnovelle (Arthur Schnitzler, 1926)
- **Datei**: `schnitzler_traumnovelle.txt`
- **Quelle**: [Projekt Gutenberg-DE](https://www.projekt-gutenberg.org/schnitzl/traumno/traumno.html)
- **Größe**: ~150 KB (~35.000 Wörter)
- **Status**: ✅ PD in USA & EU
- **CEFR**: B2
- **Tags**: Novelle, Psychologie, Wien, Schnitzler, Moderne

**Download**: Manuell erforderlich (siehe Link oben)

### 3. Buddenbrooks (Thomas Mann, 1901) ⚡ 2026 Showcase
- **Datei**: `mann_buddenbrooks.txt`
- **Quelle**: [Project Gutenberg #10921](https://www.gutenberg.org/ebooks/10921)
- **Größe**: ~1.1 MB (~250.000 Wörter)
- **Status**: ✅ PD in USA & EU (seit 01.01.2026!)
- **CEFR**: C1
- **Tags**: Roman, Familiengeschichte, Nobelpreis, Lübeck, Mann, Moderne

**Download**:
```bash
curl -L -o test-books/mann_buddenbrooks.txt \
  "https://www.gutenberg.org/files/10921/10921-0.txt"
```

## 🧹 Gutenberg Header/Footer

Die Gutenberg-Texte enthalten Lizenz-Header und Footer wie:

```
*** START OF THE PROJECT GUTENBERG EBOOK DIE VERWANDLUNG ***
[TEXT HIER]
*** END OF THE PROJECT GUTENBERG EBOOK DIE VERWANDLUNG ***
```

**Lösung**: Das Import-System ignoriert diese automatisch beim Chunking. Alternativ kannst du sie manuell entfernen.

## 🔄 Empfohlene Test-Reihenfolge

1. **Start mit Die Verwandlung** (klein, ~110 KB)
   - Verarbeitung: ~2-3 Minuten
   - Chunks: ~15-20
   - Ideal für ersten Test

2. **Dann Traumnovelle** (mittel, ~150 KB)
   - Verarbeitung: ~3-5 Minuten
   - Chunks: ~25-30
   - Test für längere Texte

3. **Buddenbrooks als Stresstest** (groß, ~1.1 MB)
   - Verarbeitung: ~20-30 Minuten (!)
   - Chunks: ~150-200
   - Voller Performance-Test

## ⚠️ Performance-Erwartungen

| Buch | Größe | Chunks | Verarbeitungszeit | DB-Insert |
|------|-------|--------|-------------------|-----------|
| Verwandlung | 110 KB | ~15-20 | ~2-3 min | ~0.5 s |
| Traumnovelle | 150 KB | ~25-30 | ~3-5 min | ~0.6 s |
| Buddenbrooks | 1.1 MB | ~150-200 | ~20-30 min | ~1-2 s |

**Hinweis**: Zeiten basieren auf Mock-NLP-Pipeline. Mit echtem UDPipe + Transformers.js können sie höher sein.

## 🧪 Test-Workflow

1. **Führe Seed-Script aus** (falls noch nicht geschehen):
   ```bash
   # Im Supabase Dashboard → SQL Editor
   # Führe aus: 004_seed_test_books.sql
   ```

2. **Starte Dev-Server**:
   ```bash
   npm run dev
   ```

3. **Öffne Import-UI**:
   - [http://localhost:3000/admin/ingest](http://localhost:3000/admin/ingest)

4. **Wähle Buch im Dropdown**:
   - "Die Verwandlung - Kafka, Franz"

5. **Sieh Metadata Preview**:
   - ✅ Safe (US/EU)
   - Tags: Novelle, Existenzialismus, Kafka, Klassiker, Moderne
   - CEFR: B2

6. **Drag & Drop `kafka_verwandlung.txt`**

7. **Klicke "🔍 Text Analysieren"**

8. **Klicke "🔄 Content Aktualisieren"**

9. **Verifiziere in Supabase**:
   ```sql
   SELECT title, author_id, cefr_level, tags, is_pd_us, is_pd_eu
   FROM source_texts
   WHERE title LIKE 'Die Verwandlung%'
   LIMIT 5;
   ```

## 📝 Alternativen zu Gutenberg

Falls Gutenberg-Links nicht funktionieren:

### Standard Ebooks (modern formatiert)
- [standardebooks.org](https://standardebooks.org)
- Hochwertige, clean formatierte PD-Texte
- Meist englisch, aber einige deutsche Werke

### Projekt Gutenberg-DE
- [projekt-gutenberg.org](https://www.projekt-gutenberg.org)
- Große deutsche Klassiker-Sammlung
- HTML-Format (muss zu TXT konvertiert werden)

### Wikisource
- [de.wikisource.org](https://de.wikisource.org)
- Community-geprüfte Texte
- Copy-Paste als TXT möglich

## 🐛 Troubleshooting

### Problem: Download-Script schlägt fehl

```bash
# Prüfe Netzwerk
curl -I https://www.gutenberg.org

# Manueller Download
open https://www.gutenberg.org/ebooks/5200
# → Download → Plain Text UTF-8
```

### Problem: Datei zu groß (Browser-Timeout)

```bash
# Extrahiere nur erste 50 KB für Test
head -c 50000 mann_buddenbrooks.txt > mann_buddenbrooks_excerpt.txt
```

### Problem: Encoding-Fehler

```bash
# Konvertiere zu UTF-8
iconv -f ISO-8859-1 -t UTF-8 input.txt > output.txt
```

---

**Status**: Bereit für End-to-End Test! 🚀
