import type { Metadata } from "next"
import { DemoClient } from "./DemoClient"

export const metadata: Metadata = {
  title: "Eine Runde probieren | The Franklin Method",
  description: "60 Sekunden, ohne Anmeldung. Lies eine Passage, schreib einen Versuch, sieh den Vergleich.",
  alternates: { canonical: "/demo" },
}

const DEMO_CHUNK = {
  text_id: "demo-kafka-verwandlung-1",
  author: "Franz Kafka",
  work: "Die Verwandlung",
  language: "de" as const,
  content:
    "Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen.",
  scene_description:
    "Gregor Samsa erwacht in seinem Bett, verwandelt in ein gewaltiges Ungeziefer. Er liegt auf dem harten Rücken, sieht seinen gewölbten Bauch und die hilflos flimmernden, dünnen Beine.",
}

export default function DemoPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-8">
        <p className="text-sm text-[var(--muted)] uppercase tracking-wide">Demo · keine Anmeldung</p>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mt-2">Eine Runde Franklin</h1>
        <p className="text-[var(--muted)] mt-2">
          Lies die Passage. Schreib einen Versuch in einem ähnlichen Stil. Nach
          der Submission siehst du Stilabstand und LLM-Kommentar.
        </p>
      </header>
      <DemoClient chunk={DEMO_CHUNK} />
    </div>
  )
}
