export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-8">
          <h1 className="text-4xl font-bold mb-8">Impressum</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">Angaben gemäß § 5 TMG</h2>
              <div className="text-gray-300">
                <p className="font-semibold">Mats Alexander Wollscheid</p>
                <p className="mt-2">Hegelstraße 51</p>
                <p>96052 Bamberg</p>
                <p className="mt-2">Deutschland</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Kontakt</h2>
              <div className="text-gray-300">
                <p>E-Mail: <a href="mailto:mtsmmiv@gmail.com" className="text-blue-400 hover:text-blue-300 underline">mtsmmiv@gmail.com</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Haftungsausschluss</h2>

              <h3 className="text-xl font-semibold mt-4 mb-2">Haftung für Inhalte</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
                Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
                Tätigkeit hinweisen.
              </p>

              <h3 className="text-xl font-semibold mt-4 mb-2">Haftung für Links</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
                Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
                Seiten verantwortlich.
              </p>

              <h3 className="text-xl font-semibold mt-4 mb-2">Urheberrecht</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
                dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
                der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
                Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
