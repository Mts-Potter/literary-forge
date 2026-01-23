#!/bin/bash

# Download Test Books for Literary Forge
# Downloads three public domain German classics from Project Gutenberg

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 Downloading Test Books from Project Gutenberg...${NC}\n"

# Create test-books directory if it doesn't exist
mkdir -p test-books

# 1. Die Verwandlung (Kafka, 1915)
echo -e "${GREEN}Downloading: Die Verwandlung (Kafka)...${NC}"
curl -L -o test-books/kafka_verwandlung.txt \
  "https://www.gutenberg.org/files/5200/5200-0.txt"

# 2. Traumnovelle (Schnitzler, 1926)
# Note: Not available on gutenberg.org main site, using alternative source
echo -e "${GREEN}Downloading: Traumnovelle (Schnitzler)...${NC}"
echo "⚠️  Traumnovelle ist nicht auf gutenberg.org verfügbar."
echo "   Bitte manuell von einer anderen Quelle herunterladen:"
echo "   - https://www.projekt-gutenberg.org/schnitzl/traumno/traumno.html"
echo "   - Oder Standard Ebooks: https://standardebooks.org"
echo ""
touch test-books/schnitzler_traumnovelle.txt
echo "[PLACEHOLDER: Bitte manuell herunterladen]" > test-books/schnitzler_traumnovelle.txt

# 3. Buddenbrooks (Mann, 1901)
echo -e "${GREEN}Downloading: Buddenbrooks (Mann)...${NC}"
curl -L -o test-books/mann_buddenbrooks.txt \
  "https://www.gutenberg.org/files/10921/10921-0.txt"

echo ""
echo -e "${GREEN}✅ Download abgeschlossen!${NC}"
echo ""
echo "📂 Dateien gespeichert in: test-books/"
echo ""
ls -lh test-books/*.txt
echo ""
echo -e "${BLUE}Hinweise:${NC}"
echo "1. Die Gutenberg-Texte enthalten Header/Footer (Lizenzinfo)"
echo "   Diese werden automatisch vom Import-System ignoriert."
echo ""
echo "2. Traumnovelle muss manuell heruntergeladen werden:"
echo "   - Besuche: https://www.projekt-gutenberg.org/schnitzl/traumno/traumno.html"
echo "   - Speichere als TXT in: test-books/schnitzler_traumnovelle.txt"
echo ""
echo "3. Bereit für Test-Import:"
echo "   npm run dev"
echo "   → http://localhost:3000/admin/ingest"
echo ""
