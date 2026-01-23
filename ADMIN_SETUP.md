# Admin Setup Guide

## Wie man Admin-Zugang einrichtet

Die Admin-Funktionen (z.B. `/admin/ingest` für Buch-Import) sind nur für autorisierte Benutzer sichtbar und zugänglich.

### Schritt 1: User-ID herausfinden

1. Gehe zu deinem [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt aus
3. Navigiere zu **Authentication** → **Users**
4. Finde deinen Benutzer und kopiere die **User ID** (UUID)

Beispiel User-ID: `3fa85f64-5717-4562-b3fc-2c963f66afa6`

### Schritt 2: Environment Variable setzen

#### Lokal (.env.local)

Erstelle oder bearbeite `.env.local`:

```bash
# Einzelner Admin
ADMIN_USER_IDS=3fa85f64-5717-4562-b3fc-2c963f66afa6

# Mehrere Admins (komma-getrennt, KEINE Leerzeichen)
ADMIN_USER_IDS=uuid1,uuid2,uuid3
```

#### Vercel (Production)

1. Gehe zu [Vercel Dashboard](https://vercel.com)
2. Wähle dein Projekt **literary-forge**
3. Settings → Environment Variables
4. Füge hinzu:
   - **Key:** `ADMIN_USER_IDS`
   - **Value:** `uuid1,uuid2,uuid3`
   - **Environment:** Production, Preview, Development (alle auswählen)
5. Klicke **Save**
6. Redeploy deine App

### Schritt 3: Verifizieren

1. Starte die App neu (lokal: `npm run dev`)
2. Logge dich ein mit dem Admin-Benutzer
3. Die Navigation sollte jetzt ein 🔒 Admin-Icon zeigen
4. Klicke darauf → Du kommst zur `/admin/ingest` Seite

### Sicherheit

- **Admin-User-IDs sind serverseitig geschützt** (Environment Variable)
- Nicht-Admins werden automatisch zur Startseite weitergeleitet
- Die Navbar zeigt das Admin-Icon nur für autorisierte Benutzer

### Troubleshooting

**Problem:** Admin-Icon erscheint nicht

- ✅ Überprüfe, ob `ADMIN_USER_IDS` korrekt gesetzt ist
- ✅ Stelle sicher, dass die User-ID exakt übereinstimmt (UUID)
- ✅ Bei Vercel: Redeploy nach Environment-Variable-Änderung
- ✅ Lösche Browser-Cache und lade neu

**Problem:** 404 bei `/admin/ingest`

- Die Route existiert nur, wenn du als Admin eingeloggt bist
- Überprüfe deine User-ID in der Environment Variable

---

## Zukünftige Erweiterungen

Für Produktionsumgebungen mit vielen Benutzern sollte ein Rollen-System in der Datenbank implementiert werden:

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'moderator')),
  UNIQUE(user_id)
);
```

Dies ermöglicht flexiblere Rechteverwaltung ohne Code-Änderungen.
