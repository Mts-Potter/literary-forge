/**
 * Manually curated author bios for /autoren/[slug] pages.
 * One paragraph each, German, ~50-80 words, neutral + indexable + stylistically informative.
 * Source: standard reference (Wikipedia / Brockhaus) + manual prose pass.
 */

export interface AuthorBio {
  author_id: string
  slug: string
  name: string
  era: string
  language: "de" | "en"
  bio_de: string
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c]!)).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export const AUTHOR_BIOS: AuthorBio[] = [
  {
    author_id: "550e8400-e29b-41d4-a716-446655440001",
    slug: "kafka",
    name: "Franz Kafka",
    era: "1883-1924",
    language: "de",
    bio_de:
      "Prager Schriftsteller, Verfasser von Die Verwandlung, Der Prozess, Das Schloss. Sein Stil verbindet bürokratisches Deutsch mit albtraumhafter Logik — lange, verschachtelte Sätze mit präzise wirkenden Bezugsketten, die ins Absurde zielen. Komma-dicht, Hypotaxe-stark, nüchterner Ton selbst in der größten Verzerrung.",
  },
  {
    author_id: "550e8400-e29b-41d4-a716-446655440003",
    slug: "mann",
    name: "Thomas Mann",
    era: "1875-1955",
    language: "de",
    bio_de:
      "Lübecker Romancier, Nobelpreis 1929. Buddenbrooks, Der Zauberberg, Doktor Faustus. Stil: monumentale, oft ironische Periode — Subordination satzweit, Adjektivketten, kommentierende Einschübe. Gegensatz zu Kafka in fast allem: gemächliches Tempo, breites lexikalisches Spektrum, distanzierter, gelegentlich raunender Erzähler.",
  },
  {
    author_id: "04ab992b-57db-4489-ba4d-859463fc207d",
    slug: "goethe",
    name: "Johann Wolfgang von Goethe",
    era: "1749-1832",
    language: "de",
    bio_de:
      "Weimarer Klassiker, Universalgelehrter. Im Korpus mit Die Leiden des jungen Werther (1774) — die Sturm-und-Drang-Briefform, die eine ganze Generation prägte. Stil dort: emphatisch, fragmentarisch, Ausrufezeichen und Gedankenstriche dicht, große lexikalische Range zwischen Naturschwärmerei und Gesellschaftsanalyse.",
  },
  {
    author_id: "57427641-e2ee-4072-8f8f-30ab5dd142cf",
    slug: "storm",
    name: "Theodor Storm",
    era: "1817-1888",
    language: "de",
    bio_de:
      "Husumer Erzähler und Lyriker des Realismus. Der Schimmelreiter (1888) zeigt seinen Stil: gerahmte Erzählung, knappe Hauptsätze, präzise Naturbeobachtung, melancholische Pointierung. Niederdeutsche Vokalfarbe in Beschreibungen, gesprochene Dialoge mit dialektaler Note.",
  },
  {
    author_id: "a2f312e5-f0ad-42de-b13e-e1f3b91e5f5e",
    slug: "austen",
    name: "Jane Austen",
    era: "1775-1817",
    language: "en",
    bio_de:
      "Englische Romanautorin der Regency-Zeit. Pride and Prejudice (1813) zeigt ihren Stil: erlebte Rede vor Flaubert, ironischer Erzähler mit dramatischer Distanz, semikolon-reiche Periode, scharfes Vokabular sozialer Differenzierung. Dialogstärke, Wahrnehmungs-Switches innerhalb eines Satzes.",
  },
  {
    author_id: "b2e349aa-483b-4d86-84c0-1e5d3de67948",
    slug: "shelley",
    name: "Mary Shelley",
    era: "1797-1851",
    language: "en",
    bio_de:
      "Englische Romantikerin, Pionierin der Gothic Novel. Frankenstein (1818) und The Last Man (1826) im Korpus. Stil: hochliterarisches Englisch mit langen periodischen Sätzen, philosophische Einschübe, Briefform und Schachtelerzählung. Lexikalisch reich, syntaktisch lateinisch-hypotaktisch.",
  },
  {
    author_id: "8dd9be9d-8623-427c-a5c1-abce618d7fb0",
    slug: "doyle",
    name: "Arthur Conan Doyle",
    era: "1859-1930",
    language: "en",
    bio_de:
      "Schottischer Arzt und Schriftsteller, Schöpfer von Sherlock Holmes. A Study in Scarlet (1887) zeigt seinen Stil: erzählende Ökonomie, Dialog-getrieben, technisch-präzise Beschreibungen, dramatische Pointierung. Mittlere Satzlänge, geringe Komma-Dichte verglichen mit viktorianischem Mittel.",
  },
  {
    author_id: "a287a3d3-921e-4c85-ac15-4b1b42ab71fb",
    slug: "stoker",
    name: "Bram Stoker",
    era: "1847-1912",
    language: "en",
    bio_de:
      "Irischer Autor, Dracula (1897). Stil über mehrere Erzählerstimmen verteilt (Brief, Tagebuch, Zeitungsausschnitt). Allgemein: viktorianisch-formales Englisch, lange Beschreibungen, dichte Adjektivierung in atmosphärischen Passagen, knappe Funktionsprosa in den Tagebuchpartien.",
  },
  {
    author_id: "cb1184c5-5f1c-47f8-9ec6-2b9ced1fd41d",
    slug: "stevenson",
    name: "Robert Louis Stevenson",
    era: "1850-1894",
    language: "en",
    bio_de:
      'Schottischer Erzähler, Essayist und Reisender. The Strange Case of Dr. Jekyll and Mr. Hyde (1886) im Korpus. Stil: rhythmisch durchgearbeitete Prosa, semikolon-reich, bewusster Wortklang. Stevenson beschrieb selbst, wie er „played the sedulous ape" zu Hazlitt, Lamb, Browne — die Imitatio-Tradition, die diesem Tool zugrundeliegt.',
  },
  {
    author_id: "5bc2b1aa-8495-4d2e-b226-fa7ce0ec69cb",
    slug: "dickens",
    name: "Charles Dickens",
    era: "1812-1870",
    language: "en",
    bio_de:
      "Englischer Romancier des Viktorianismus. A Christmas Carol (1843) im Korpus. Stil: rhythmisch parataktische Aufzählungen, ausgedehnte Personenbeschreibungen mit charakteristischen Tics, breite stilistische Register vom feuilletonistisch-spöttischen bis pathetisch-moralischen Ton. Komma-reich.",
  },
  {
    author_id: "c9944b5c-af04-43ce-bf55-d4f6e64e9286",
    slug: "wilde",
    name: "Oscar Wilde",
    era: "1854-1900",
    language: "en",
    bio_de:
      "Irischer Schriftsteller und Dandy, The Picture of Dorian Gray (1890). Stil: epigrammatisch, antithetisch, paradox. Hohe Adjektivierung in Beschreibungen sinnlicher Oberflächen; im Dialog kompakte Pointen mit symmetrischer Syntax. Erzähler-Distanz mit ästhetizistischer Färbung.",
  },
  {
    author_id: "e430cf76-1def-4eb1-bcff-950f09244a4d",
    slug: "fitzgerald",
    name: "F. Scott Fitzgerald",
    era: "1896-1940",
    language: "en",
    bio_de:
      "US-amerikanischer Erzähler der Lost Generation. The Great Gatsby (1925) im Korpus. Stil: jazzhaft-rhythmisch, sensorisch dicht (Farben, Licht, Geräusche), gehäufte Adverbialbestimmungen, manchmal eine Aufzählung statt einer Pointe. Lyrische Schlusskadenzen.",
  },
]

export function getBioBySlug(s: string): AuthorBio | undefined {
  return AUTHOR_BIOS.find((a) => a.slug === s)
}

export function getBioByAuthorId(id: string): AuthorBio | undefined {
  return AUTHOR_BIOS.find((a) => a.author_id === id)
}

export function slugifyTitle(title: string): string {
  return slug(title.split(" (Teil ")[0])
}
