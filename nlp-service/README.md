# Literary Forge — NLP Microservice

Separate Python+Flask+spaCy-Service auf Render Free Tier. Liefert 20 Stilfeatures
pro Text. Wird vom Hauptrepo (`literary-forge` auf Vercel) per HTTP konsumiert.

## Warum separat?

Vercel Functions können nicht im selben Projekt Python und Next.js-App-Router-Routes mischen.
spaCy `_md`-Modelle sprengen außerdem Vercel Hobby Function-Size-Limit (250 MB).
Render Free Tier: 750h/Monat, kein CC, Python+spaCy nativ.

## Deployment auf Render (einmalig)

1. Account auf [render.com](https://render.com) anlegen (kein CC nötig).
2. "New +" → "Web Service" → "Connect a repository" → `literary-forge`.
3. **Wichtig**: Root Directory auf `nlp-service` setzen.
4. Render erkennt `render.yaml` automatisch. Bestätigen.
5. Build dauert ~5-10 min (spaCy + Modelle ~700 MB Download).
6. URL notieren (z. B. `https://literary-forge-nlp.onrender.com`).
7. Env-Var `NLP_SHARED_SECRET` setzen (zufälliger String aus `openssl rand -hex 32`).
8. Im Vercel-Dashboard (Hauptrepo) zwei neue Env-Vars setzen:
   - `NLP_SERVICE_URL=https://literary-forge-nlp.onrender.com`
   - `NLP_SHARED_SECRET=<gleicher String wie auf Render>`

## Cold-Start-Handling

Render Free Tier schläft nach 15 min Idle. Wake-Up dauert ~30-60 s.

Mitigation: Das Hauptrepo pingt `/health` automatisch beim Page-Load der
`/train`-Route, sodass der Service warm ist wenn der User submittet.

## Lokal testen

```bash
cd nlp-service
pip install -r requirements.txt
python parse.py
curl -X POST http://localhost:5000/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Als Gregor Samsa eines Morgens erwachte.", "language": "de"}'
```
