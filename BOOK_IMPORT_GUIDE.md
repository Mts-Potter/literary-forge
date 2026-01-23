# 📚 Book Import System - Anleitung

## Übersicht

Das Book Import System ermöglicht es, komplette Bücher (.txt Dateien) in die Literary Forge Datenbank zu importieren. Die Besonderheit: Die Verarbeitung erfolgt **im Browser** mit denselben Tools (UDPipe + Transformers.js), die auch das Training verwendet. Dies garantiert **wissenschaftliche Konsistenz** der Stilmetriken.

## Architektur

### Warum im Browser?

Im ursprünglichen Bauplan war vorgesehen, UDPipe (WASM) für die stilometrische Analyse zu nutzen. Wenn wir für den Import ein Node.js-Script mit einer anderen Library (z.B. compromise) verwenden würden, wären die Metriken nicht vergleichbar.

**Problem gelöst:** Die Admin-Route `/admin/ingest` läuft im Browser und verwendet exakt dieselbe NLP-Pipeline wie das Training-Interface.

### Technischer Stack

- **Parser**: UDPipe (WASM) für syntaktische Analyse
- **Embeddings**: Transformers.js (Xenova/all-MiniLM-L6-v2, ONNX)
- **Metriken**:
  - Dependency Distance (mittlere syntaktische Komplexität)
  - Adjektiv/Verb-Ratio (Deskriptivität)
  - Satzlängenvarianz (rhythmische Vielfalt)
- **Chunking**: 3-10 Sätze pro Lerneinheit
- **Schwierigkeitsgrad**: Automatisch berechnet (Level 1-5)

## Verwendung

### Schritt 1: Login

1. Navigiere zu `/login`
2. Erstelle einen Account (Sign Up) oder logge dich ein
3. Nach erfolgreichem Login wirst du zu `/admin/ingest` weitergeleitet

### Schritt 2: Buch Vorbereiten

Das System akzeptiert nur `.txt` Dateien. Bereite dein Buch wie folgt vor:

1. **Format**: Plain Text (.txt)
2. **Encoding**: UTF-8
3. **Struktur**: Einfacher Fließtext, keine spezielle Formatierung nötig
4. **Größe**: Empfohlen < 5 MB (größere Dateien können lange dauern)

**Beispiel**: Siehe `test-books/kafka-die-verwandlung-excerpt.txt`

### Schritt 3: Import durchführen

1. **Datei auswählen**: Klicke "Browse" und wähle deine .txt Datei
2. **Metadaten eingeben**:
   - **Titel**: z.B. "Die Verwandlung"
   - **Autor**: z.B. "Franz Kafka"
3. **Analysieren**: Klicke "🔍 Text Analysieren"
   - Das System chunked den Text in 3-10 Satz-Einheiten
   - Für jeden Chunk werden Metriken und Embeddings berechnet
   - Dies kann bei großen Büchern mehrere Minuten dauern
4. **Vorschau prüfen**: Nach der Analyse siehst du die ersten 5 Chunks
5. **Import**: Klicke "💾 In Datenbank Speichern"
   - Die Chunks werden nacheinander in Supabase gespeichert
   - Es gibt eine Rate-Limiting-Pause zwischen den Inserts (100ms)

### Schritt 4: Fertig!

Die importierten Texte stehen nun im System zur Verfügung und können im Training verwendet werden.

## Performance-Hinweise

### Verarbeitungszeit

Die Verarbeitung hängt von mehreren Faktoren ab:

- **Textlänge**: ~1-2 Sekunden pro Chunk
- **CPU-Leistung**: Moderne CPUs sind schneller
- **Browser**: Chrome/Edge sind oft am schnellsten (V8 Engine)

**Beispiel**: Ein 50 KB Text (ca. 10.000 Wörter) wird in etwa 50-100 Chunks aufgeteilt und dauert 2-5 Minuten.

### Speicherverbrauch

- **UDPipe Model**: ~5 MB (einmalig geladen, dann gecacht)
- **Transformers.js Model**: ~23 MB (einmalig geladen, dann gecacht)
- **Arbeitsspeicher während Verarbeitung**: ~200-500 MB

**Tipp**: Schließe andere Browser-Tabs während des Imports, um Ressourcen freizugeben.

## Chunking-Algorithmus

### Regeln

1. **Minimum**: 3 Sätze pro Chunk
2. **Maximum**: 10 Sätze pro Chunk
3. **Präferenz**: Chunks enden an natürlichen Absatzgrenzen

### Beispiel

Input:
```
Satz 1. Satz 2. Satz 3. Satz 4. Satz 5.
Satz 6. Satz 7. Satz 8. Satz 9. Satz 10. Satz 11.
```

Output:
- Chunk 1: Satz 1-5
- Chunk 2: Satz 6-10
- Chunk 3: Satz 11 (nur wenn ≥3 Sätze übrig)

### Warum Chunking?

- **Lernbarkeit**: Kurze Einheiten sind effektiver für Spaced Repetition
- **Stilfokus**: Kleine Chunks isolieren spezifische stilistische Merkmale
- **Performance**: Kleinere Texte werden schneller analysiert

## Schwierigkeitsgrad-Berechnung

Der Schwierigkeitsgrad (1-5) wird automatisch berechnet:

```
Difficulty = 0.4 × (Dependency Distance / 5)
           + 0.3 × (Sentence Variance / 10)
           + 0.3 × (Adj/Verb Ratio / 2)
```

- **Level 1-2**: Einfache Sätze, lineare Struktur
- **Level 3**: Durchschnittlich (Belletristik)
- **Level 4-5**: Komplex (Thomas Mann, Prosa-Lyrik)

## Datenbank-Schema

Jeder Chunk wird als Zeile in `source_texts` gespeichert:

```sql
{
  id: UUID,
  title: "Die Verwandlung (Teil 1)",
  author: "Franz Kafka",
  content: "Als Gregor Samsa eines Morgens...",
  language: "de",
  difficulty_level: 4,
  metrics: {
    dependencyDistance: 3.2,
    adjVerbRatio: 0.8,
    sentenceLengthVariance: 12.5
  },
  embedding: [0.123, -0.456, ...], // 384 Dimensionen
  metadata: {
    chunk_index: 0,
    generated_at: "2025-01-21T..."
  }
}
```

## Sicherheit

### Zugangskontrolle

- Die Route `/admin/ingest` ist durch Supabase Auth geschützt
- Nur eingeloggte User können importieren
- Optional: Erweitere `app/admin/ingest/page.tsx` um eine Role-Prüfung

### Rate Limiting

- Zwischen Inserts gibt es eine 100ms Pause
- Verhindert Überlastung der Supabase-Datenbank
- Bei Fehlern werden betroffene Chunks übersprungen

### RLS (Row Level Security)

Die Datenbank-Policies müssen angepasst werden, damit Inserts erlaubt sind:

```sql
-- In deiner Supabase SQL Console:
CREATE POLICY "authenticated_can_insert" ON source_texts
  FOR INSERT TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Hinweis**: Dies erlaubt allen authentifizierten Usern das Einfügen. Für Production sollte eine Admin-Role eingeführt werden.

## Troubleshooting

### "Parser not initialized"

**Problem**: UDPipe-Modell konnte nicht geladen werden.

**Lösung**:
- Prüfe, ob `public/models/german-gsd.udpipe` existiert
- Cache leeren und Seite neu laden

### "Out of memory"

**Problem**: Browser hat nicht genug RAM.

**Lösung**:
- Kleineren Text importieren (< 50 KB)
- Andere Tabs schließen
- Browser neustarten

### "Failed to insert chunk"

**Problem**: Datenbank-Fehler (z.B. RLS-Policy blockiert).

**Lösung**:
- Prüfe Supabase-Logs
- Stelle sicher, dass die Insert-Policy existiert
- Überprüfe Datenbank-Speicherplatz (500 MB Limit im Free Tier)

### "Embedding model download timeout"

**Problem**: Langsame Internetverbindung.

**Lösung**:
- Warte länger (23 MB Download)
- Nutze schnellere Verbindung
- Modell wird nach erstem Download gecacht

## Beispiel-Workflow

```bash
# 1. Test-Excerpt importieren
cd literary-forge
open http://localhost:3000/login

# 2. Login/Sign Up

# 3. In der UI:
# - Datei: test-books/kafka-die-verwandlung-excerpt.txt
# - Titel: Die Verwandlung (Excerpt)
# - Autor: Franz Kafka
# - Klick: Analysieren → warte 30-60 Sek → Klick: Speichern

# 4. Verifiziere in Supabase:
# SQL Editor → SELECT * FROM source_texts;
```

## Best Practices

### Für Entwickler

1. **Teste mit kleinen Texten**: Nutze `test-books/` für erste Tests
2. **Monitoring**: Öffne Browser DevTools Console für detaillierte Logs
3. **Batch-Import**: Importiere nicht mehr als 5 Bücher gleichzeitig (DB-Limit beachten)

### Für Content-Kuratoren

1. **Qualität vor Quantität**: Lieber wenige, gut kuratierte Texte
2. **Diverse Schwierigkeitsgrade**: Importiere Texte verschiedener Komplexität
3. **Autorenstile**: Mehrere Werke eines Autors helfen beim Stil-Lernen
4. **Public Domain**: Achte auf Urheberrechte (Kafka, Goethe, etc. sind sicher)

## Limitierungen

- **Nur Deutsch**: UDPipe-Modell ist für Deutsch trainiert
- **Plain Text**: Keine Markdown, HTML oder andere Formate
- **Speicherplatz**: Supabase Free Tier hat 500 MB Limit
  - Bei ~1 KB pro Chunk → max. ~500.000 Chunks
  - Bei 5 Chunks/Text → max. ~100.000 Texte (mehr als genug!)

## Roadmap

### Phase 2: Erweiterungen

- [ ] Multi-Language Support (EN, FR via UDPipe-Modelle)
- [ ] Batch-Upload (mehrere Dateien gleichzeitig)
- [ ] Import-History (welche Bücher wurden schon importiert?)
- [ ] Auto-Tagging (Genre-Erkennung via LLM)
- [ ] Duplicate-Detection (keine doppelten Imports)

## Support

Bei Problemen oder Fragen:
1. Prüfe diese Anleitung
2. Schaue in die Browser DevTools Console
3. Überprüfe Supabase Logs
4. Öffne ein Issue im Projekt-Repository

---

**Status**: ✅ Ready for Production
**Letzte Aktualisierung**: 2025-01-21
