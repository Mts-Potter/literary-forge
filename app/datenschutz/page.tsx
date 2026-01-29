import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://literary-forge.vercel.app';

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Literary Forge",
  description: "Datenschutzerklärung für Literary Forge. Erfahren Sie, wie wir Ihre personenbezogenen Daten verarbeiten und schützen.",
  alternates: {
    canonical: `${siteUrl}/datenschutz`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Datenschutzerklärung | Literary Forge",
    description: "Datenschutzerklärung für Literary Forge. Informationen zur Datenverarbeitung gemäß DSGVO.",
    url: `${siteUrl}/datenschutz`,
    type: "website",
  },
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-8">
          <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Datenschutz auf einen Blick</h2>
              <h3 className="text-xl font-semibold text-white mb-3">Allgemeine Hinweise</h3>
              <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
                Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Verantwortlicher</h2>
              <p>
                Verantwortlich für die Datenverarbeitung auf dieser Website ist der Betreiber
                dieser Anwendung. Die Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Hosting und Datenverarbeitung</h2>

              <h3 className="text-xl font-semibold text-white mb-3">Vercel (Hosting)</h3>
              <p className="mb-4">
                Diese Website wird auf Servern von Vercel Inc. gehostet. Anbieter ist die
                Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.
              </p>
              <p className="mb-4">
                Vercel erfasst automatisch Informationen über Ihren Besuch in sogenannten
                Server-Log-Dateien. Dies ist notwendig, um die Website bereitzustellen und
                deren Sicherheit zu gewährleisten.
              </p>
              <p className="mb-4">
                Weitere Informationen finden Sie in der Datenschutzerklärung von Vercel:
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline ml-1"
                >
                  https://vercel.com/legal/privacy-policy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Supabase (Datenbank)</h3>
              <p className="mb-4">
                Wir nutzen Supabase für die Speicherung von Nutzerdaten und Inhalten.
                Anbieter ist Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992.
              </p>
              <p className="mb-4">
                Verarbeitete Daten: Email-Adresse, Trainingsfortschritt, gespeicherte Texte.
              </p>
              <p className="mb-4">
                Weitere Informationen:
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline ml-1"
                >
                  https://supabase.com/privacy
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Web Analytics</h2>

              <h3 className="text-xl font-semibold text-white mb-3">Vercel Web Analytics</h3>
              <p className="mb-4">
                Wir nutzen Vercel Web Analytics zur Erfassung anonymisierter Besucherstatistiken
                (Seitenaufrufe, Referrer, geografische Region).
              </p>

              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-4">
                <p className="text-green-400 font-semibold mb-2">✅ Datenschutzfreundlich:</p>
                <ul className="list-disc list-inside space-y-1 text-green-300">
                  <li>Keine Cookies</li>
                  <li>Keine Speicherung von IP-Adressen</li>
                  <li>Keine personenbezogenen Daten</li>
                  <li>Keine Nutzerverfolgung über mehrere Websites</li>
                  <li>DSGVO-konform</li>
                </ul>
              </div>

              <p className="mb-4">
                Anbieter: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
              </p>
              <p>
                Weitere Informationen:
                <a
                  href="https://vercel.com/docs/analytics/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline ml-1"
                >
                  https://vercel.com/docs/analytics/privacy-policy
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. KI-Verarbeitung (AWS Bedrock)</h2>
              <p className="mb-4">
                Für die Analyse und Bewertung Ihrer Texte nutzen wir AWS Bedrock mit dem
                Claude 3.5 Haiku Modell von Anthropic. Die Texte werden zur Verarbeitung
                an AWS-Server übermittelt.
              </p>
              <p className="mb-4">
                Anbieter: Amazon Web Services EMEA SARL, 38 Avenue John F. Kennedy, L-1855 Luxemburg
              </p>
              <p className="mb-4">
                Verarbeitete Daten: Ihre eingereichten Texte werden analysiert, aber nicht
                dauerhaft gespeichert oder für das Training von KI-Modellen verwendet.
              </p>
              <p>
                Weitere Informationen:
                <a
                  href="https://aws.amazon.com/de/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline ml-1"
                >
                  https://aws.amazon.com/de/privacy/
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Authentifizierung</h2>
              <p className="mb-4">
                Die Nutzer-Authentifizierung erfolgt über Supabase Auth. Bei der Registrierung
                werden Ihre Email-Adresse und ein verschlüsseltes Passwort gespeichert.
              </p>
              <p>
                Sie können Ihr Konto jederzeit in den Einstellungen löschen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Ihre Rechte</h2>
              <p className="mb-4">
                Sie haben jederzeit das Recht auf:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Auskunft über Ihre gespeicherten personenbezogenen Daten</li>
                <li>Berichtigung unrichtiger Daten</li>
                <li>Löschung Ihrer Daten</li>
                <li>Einschränkung der Verarbeitung</li>
                <li>Datenübertragbarkeit</li>
                <li>Widerspruch gegen die Verarbeitung</li>
                <li>Beschwerde bei einer Aufsichtsbehörde</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Kontakt</h2>
              <p>
                Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie
                uns über das Feedback-Formular in der Navigation kontaktieren.
              </p>
            </section>

            <section className="text-sm text-gray-500 pt-8 border-t border-[#262626]">
              <p>Stand: Januar 2026</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
