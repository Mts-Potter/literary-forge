import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Die Methode | The Franklin Method",
  description: "Wie Benjamin Franklin sich Schreibstil selbst beibrachte (1722). Drei Übungen, eine Tradition (imitatio) — heute mit KI optimiert.",
  alternates: { canonical: "/methode" },
}

export default function MethodePage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 space-y-6">
      <h1 className="text-4xl font-bold text-[var(--foreground)]">Die Methode</h1>

      <p className="text-lg text-[var(--foreground)] leading-relaxed">
        Benjamin Franklin war zwölf, als er sich Schreibstil selbst beibrachte.
        Er hatte zufällig einen Band des <em>Spectator</em> gefunden und beschloss,
        dessen Prosa zu imitieren. Was er erfand, beschrieb er später in seiner
        Autobiografie:
      </p>

      <blockquote className="border-l-4 border-[var(--muted)] pl-6 my-6 text-[var(--foreground)] italic leading-relaxed">
        „With this view I took some of the papers, and, making short hints of
        the sentiment in each sentence, laid them by a few days, and then,
        without looking at the book, try&apos;d to compleat the papers again, by
        expressing each hinted sentiment at length, and as fully as it had been
        expressed before, in any suitable words that should come to hand. Then
        I compared my Spectator with the original, discovered some of my
        faults, and corrected them."
        <footer className="text-sm text-[var(--muted)] mt-3 not-italic">
          — Benjamin Franklin, <em>Autobiography</em>, Part One (geschrieben 1771,
          beschrieben Ereignisse von ~1718)
        </footer>
      </blockquote>

      <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-10">
        Die drei Übungen
      </h2>

      <ol className="space-y-3 text-[var(--foreground)] leading-relaxed list-decimal list-inside">
        <li>
          <strong>Hint-and-Reconstruct.</strong> Original lesen → pro Satz ein
          kurzes Stichwort zum Inhalt notieren → ein paar Tage warten → aus den
          Stichworten rekonstruieren → mit Original vergleichen.
        </li>
        <li>
          <strong>Prose-to-Verse-and-Back.</strong> Eine Erzählung in Verse
          umformen, dann (wenn die Prosa vergessen ist) zurück in Prosa. Ziel:
          Wortschatz erweitern.
        </li>
        <li>
          <strong>Jumble-and-Reorder.</strong> Die Stichworte aus Übung 1
          mischen, einige Wochen warten, dann in die beste Reihenfolge
          bringen. Ziel: Strukturgefühl.
        </li>
      </ol>

      <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-10">
        Tradition: <em>imitatio</em>
      </h2>

      <p className="text-[var(--foreground)] leading-relaxed">
        Franklin erfand die Methode nicht aus dem Nichts. Sie reicht zurück zu
        Quintilians <em>Institutio Oratoria</em> Buch X (~95 n. Chr.) und
        Erasmus&apos; <em>De Copia</em> (1512) — die zentrale Übung
        humanistischer Rhetorik-Ausbildung. Der Schüler imitiert nicht
        sklavisch, sondern verinnerlicht ein Vorbild und sucht es schließlich
        zu übertreffen.
      </p>

      <p className="text-[var(--foreground)] leading-relaxed">
        Auch Robert Louis Stevenson schrieb 1887: <em>„I have played the
        sedulous ape to Hazlitt, to Lamb, to Wordsworth, to Sir Thomas Browne,
        to Defoe, to Hawthorne, to Montaigne, to Baudelaire and to Obermann."</em>{' '}
        Verwandte Tradition, andere konkrete Methode.
      </p>

      <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-10">
        Wie wir die Methode optimiert haben
      </h2>

      <p className="text-[var(--foreground)] leading-relaxed">
        Franklin musste sich die Stichworte selbst notieren — die ermüdendste
        Stelle. Bei uns übernimmt das die KI: aus dem Original wird automatisch
        eine Inhaltszusammenfassung erzeugt. Du fokussierst dich auf die
        eigentliche Stil-Imitation.
      </p>

      <p className="text-[var(--foreground)] leading-relaxed">
        Was Franklin nicht messen konnte, messen wir: pro Versuch rechnen wir
        20 Stilmetriken (Satzlängen-Varianz, MTLD, Funktionswort-Verteilung,
        Dependency-Distance, mehr) und vergleichen mit dem statistischen
        Profil des Original-Autors. Der Stilabstand ist deine deterministische
        Bewertung — keine LLM-Halluzination, sondern Burrows&apos;-Δ-Variante.
      </p>

      <p className="text-[var(--foreground)] leading-relaxed">
        Spaced Repetition (FSRS V5) plant die Wiederholungen so, dass du
        Passagen in zunehmenden Abständen rekonstruierst.
      </p>

      <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-10">
        Ehrlichkeit
      </h2>

      <p className="text-[var(--foreground)] leading-relaxed">
        Was wir nicht behaupten: dass die Methode wissenschaftlich validiert
        ist. Spaced Repetition + Retrieval Practice sind für Vokabel-Lernen
        robust evidenzbasiert (Roediger &amp; Karpicke 2006; Dunlosky et al.
        2013). Der Transfer auf produktive Stil-Imitation ist eine plausible
        Hypothese, kein bewiesener Effekt.
      </p>

      <p className="text-[var(--foreground)] leading-relaxed">
        Was wir versprechen: messbare, transparente Rückmeldung auf das, was
        du schreibst. Kritik kommt nach der Submission — nicht währenddessen.
      </p>
    </article>
  )
}
