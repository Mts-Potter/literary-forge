export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-8">
          <h1 className="text-4xl font-bold mb-8">Kontakt</h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Kontaktieren Sie uns</h2>
              <p className="text-gray-300 mb-6">
                Haben Sie Fragen, Anregungen oder möchten Sie Kontakt mit uns aufnehmen?
                Wir freuen uns von Ihnen zu hören.
              </p>

              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">E-Mail</h3>
                    <a
                      href="mailto:mtsmmiv@gmail.com"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      mtsmmiv@gmail.com
                    </a>
                  </div>

                  <div className="pt-4 border-t border-[#262626]">
                    <h3 className="text-lg font-semibold mb-2">Feedback-Formular</h3>
                    <p className="text-gray-400 text-sm">
                      Sie können uns auch über das Feedback-Formular in der Navigation erreichen.
                      Klicken Sie auf das 💬 Symbol in der Kopfzeile.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Datenschutz</h2>
              <p className="text-gray-300 text-sm">
                Ihre Daten werden vertraulich behandelt. Weitere Informationen finden Sie in unserer{' '}
                <a href="/datenschutz" className="text-blue-400 hover:text-blue-300 underline">
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
