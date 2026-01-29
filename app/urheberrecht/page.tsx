import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://literary-forge.vercel.app';

export const metadata: Metadata = {
  title: "Urheberrecht | Literary Forge",
  description: "Urheberrechtliche Hinweise für Literary Forge. Informationen zu Nutzungsrechten und Schutz geistigen Eigentums.",
  alternates: {
    canonical: `${siteUrl}/urheberrecht`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Urheberrecht | Literary Forge",
    description: "Urheberrechtliche Hinweise und Nutzungsrechte für Literary Forge.",
    url: `${siteUrl}/urheberrecht`,
    type: "website",
  },
};

export default function UrheberrechtPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-8">
          <h1 className="text-4xl font-bold mb-8">Urheberrecht</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">Copyright © Literary Forge</h2>
              <p className="text-gray-300 leading-relaxed">
                Alle Inhalte dieser Webseite, einschließlich Texte, Grafiken, Bilder, Code und Design,
                sind urheberrechtlich geschützt und Eigentum von Literary Forge bzw. der jeweiligen
                Rechteinhaber.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Nutzungsrechte</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Die Nutzung der Inhalte dieser Webseite ist ausschließlich für den persönlichen,
                nicht-kommerziellen Gebrauch gestattet. Jede anderweitige Nutzung, insbesondere:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Vervielfältigung</li>
                <li>Bearbeitung oder Veränderung</li>
                <li>Verbreitung oder öffentliche Wiedergabe</li>
                <li>Kommerzielle Nutzung</li>
                <li>Weitergabe an Dritte</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                bedarf der vorherigen schriftlichen Zustimmung durch Literary Forge.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">KI-generierte Inhalte</h2>
              <p className="text-gray-300 leading-relaxed">
                Literary Forge nutzt KI-Technologie zur Textgenerierung und -analyse. Die durch Nutzer
                generierten Inhalte bleiben im Besitz der jeweiligen Nutzer. Literary Forge erhebt
                keinen Anspruch auf Urheberrechte an nutzergenerierten Inhalten.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Rechtsverletzungen melden</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Sollten Sie der Meinung sein, dass Inhalte auf dieser Webseite Ihre Urheberrechte
                verletzen, kontaktieren Sie uns bitte umgehend unter:
              </p>
              <a
                href="mailto:mtsmmiv@gmail.com"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                mtsmmiv@gmail.com
              </a>
              <p className="text-gray-300 text-sm mt-4">
                Wir werden Ihre Anfrage umgehend prüfen und gegebenenfalls entsprechende Maßnahmen ergreifen.
              </p>
            </section>

            <section className="pt-6 border-t border-[#262626]">
              <p className="text-gray-400 text-sm">
                Stand: Januar 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
