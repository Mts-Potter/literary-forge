import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://literary-forge.vercel.app';

export const metadata: Metadata = {
  title: "Kontakt | Literary Forge",
  description: "Kontaktieren Sie Literary Forge. Haben Sie Fragen oder Feedback zu unserem KI-gestützten Schreibtraining? Wir freuen uns von Ihnen zu hören.",
  alternates: {
    canonical: `${siteUrl}/kontakt`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Kontakt | Literary Forge",
    description: "Kontaktieren Sie Literary Forge. Fragen, Anregungen oder Feedback - wir freuen uns von Ihnen zu hören.",
    url: `${siteUrl}/kontakt`,
    type: "website",
  },
};

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-8">
          <h1 className="text-4xl font-bold mb-8">Kontakt</h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Kontaktieren Sie uns</h2>
              <p className="text-[var(--foreground)] mb-6">
                Haben Sie Fragen, Anregungen oder möchten Sie Kontakt mit uns aufnehmen?
                Wir freuen uns von Ihnen zu hören.
              </p>

              <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">E-Mail</h3>
                    <a
                      href="mailto:mtsmmiv@gmail.com"
                      className="text-[var(--muted)] hover:text-[var(--accent)] underline transition-colors"
                    >
                      mtsmmiv@gmail.com
                    </a>
                  </div>

                  <div className="pt-4 border-t border-[var(--border)]">
                    <h3 className="text-lg font-semibold mb-2">Feedback-Formular</h3>
                    <p className="text-[var(--muted)] text-sm">
                      Sie können uns auch über das Feedback-Formular in der Navigation erreichen.
                      Klicken Sie auf das 💬 Symbol in der Kopfzeile.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Datenschutz</h2>
              <p className="text-[var(--foreground)] text-sm">
                Ihre Daten werden vertraulich behandelt. Weitere Informationen finden Sie in unserer{' '}
                <a href="/datenschutz" className="text-[var(--muted)] hover:text-[var(--accent)] underline transition-colors">
                  Datenschutzerklärung
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
