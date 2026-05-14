'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  async function start() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            default_mode: 'franklin',
            onboarded_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
      router.push('/train')
      router.refresh()
    } catch {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <article className="max-w-xl w-full bg-[var(--card)] border border-[var(--border)] rounded-lg p-8 space-y-4">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Willkommen.</h1>
        <p className="text-[var(--foreground)] leading-relaxed">
          The Franklin Method bringt dir Schreibstil mit der Methode bei, die Benjamin Franklin 1722
          erfand — heute mit KI-Feedback optimiert. Die ganze Story steht auf{' '}
          <a href="/methode" className="underline">/methode</a>.
        </p>
        <p className="text-[var(--foreground)] leading-relaxed">
          Im Training gibt es drei Übungs-Modi, die du jederzeit per Button unten durchwechseln kannst:
        </p>
        <ul className="list-disc list-inside text-[var(--foreground)] space-y-1 text-sm">
          <li><strong>Franklin</strong> — Lesen → AI-Hints → Inkubation → Rekonstruktion → Vergleich</li>
          <li><strong>Cloze</strong> — Lückentext-Übung, gestuft</li>
          <li><strong>Free</strong> — Lesen, dann frei imitieren mit Stilfeedback</li>
        </ul>
        <p className="text-[var(--muted)] text-sm">
          Du startest in Franklin. Wechsle frei, schau was passt.
        </p>
        <button
          onClick={start}
          disabled={saving}
          className="w-full px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Lade…' : 'Training starten →'}
        </button>
      </article>
    </main>
  )
}
