"""
Literary Forge — NLP Microservice (Phase 2)

Separate Flask-Service auf Render, gerufen vom Next.js-Hauptrepo. Liefert
20 Stilfeatures pro Text-Input. Modelle: spaCy de_core_news_sm +
en_core_web_sm (medium models, ausgewogen Größe/Qualität).

Endpoints:
  GET  /health              — Liveness probe für Render + Keep-Alive
  POST /parse               — Feature-Extraktion. Body: {text, language, secret}

Auth: Shared-Secret via NLP_SHARED_SECRET env var. Schlechte Secrets → 401.
"""

import os
import math
import re
from collections import Counter
from typing import Any

import spacy
from flask import Flask, jsonify, request
from flask_cors import CORS

# ----------------------------------------------------------------------
# Modelle einmalig laden (Cold-Start). Bei 'free'-Plan dauert ~30-60 s.
# ----------------------------------------------------------------------
NLP_MODELS: dict[str, Any] = {
    "de": spacy.load("de_core_news_sm", disable=["ner"]),
    "en": spacy.load("en_core_web_sm", disable=["ner"]),
}

# Top-50 deutsche Funktionswörter (für Burrows' Delta Anker).
# Stand: Dornseiff/Wortschatz Leipzig Common-Words-Listen.
TOP_FUNCTION_WORDS_DE = [
    "der", "die", "und", "in", "zu", "den", "das", "nicht", "von", "sie",
    "ist", "des", "sich", "mit", "dem", "dass", "er", "es", "ein", "ich",
    "auf", "so", "eine", "auch", "als", "an", "nach", "wie", "im", "für",
    "man", "aber", "aus", "durch", "wenn", "nur", "war", "noch", "werden",
    "bei", "hat", "wir", "was", "wird", "sein", "einen", "welche", "sind",
    "oder", "zur",
]
TOP_FUNCTION_WORDS_EN = [
    "the", "of", "and", "to", "a", "in", "is", "it", "you", "that",
    "he", "was", "for", "on", "are", "with", "as", "I", "his", "they",
    "be", "at", "one", "have", "this", "from", "or", "had", "by", "not",
    "word", "but", "what", "some", "we", "can", "out", "other", "were", "all",
    "there", "when", "up", "use", "your", "how", "said", "an", "each", "she",
]

# Conjunctions for sub-sentence approximation
SUB_CONJUNCTIONS_DE = {"dass", "weil", "wenn", "als", "ob", "da", "obwohl",
                       "während", "nachdem", "bevor", "damit", "sodass", "indem"}
SUB_CONJUNCTIONS_EN = {"that", "because", "when", "as", "if", "since",
                       "although", "while", "after", "before", "so", "though"}

app = Flask(__name__)
CORS(app)


def variance(values: list[float]) -> float:
    if not values:
        return 0.0
    mean = sum(values) / len(values)
    return sum((v - mean) ** 2 for v in values) / len(values)


def compute_features(text: str, language: str) -> dict[str, Any]:
    """20 Stilfeatures basierend auf Stamatatos 2009 + Burrows' Delta."""
    nlp = NLP_MODELS.get(language)
    if nlp is None:
        raise ValueError(f"Unsupported language: {language}")

    doc = nlp(text)

    tokens = [t for t in doc if not t.is_space]
    words = [t for t in tokens if t.is_alpha]
    sentences = list(doc.sents)
    sentence_lengths = [len([t for t in s if t.is_alpha]) for s in sentences]
    n_words = len(words)

    if n_words == 0 or not sentences:
        return {"error": "Text contains no analyzable words"}

    # Lexikalische Features
    word_lower = [w.text.lower() for w in words]
    word_counts = Counter(word_lower)
    types = len(word_counts)
    ttr = types / n_words

    # MTLD (Measure of Textual Lexical Diversity, McCarthy 2010)
    # Forward + Backward MTLD-Mittelung
    def mtld_pass(seq: list[str], threshold: float = 0.72) -> float:
        if len(seq) < 10:
            return 0.0
        factors, types_seen, tokens_seen = 0, set(), 0
        for w in seq:
            types_seen.add(w)
            tokens_seen += 1
            if tokens_seen > 0 and (len(types_seen) / tokens_seen) <= threshold:
                factors += 1
                types_seen, tokens_seen = set(), 0
        if tokens_seen > 0:
            partial = (1 - (len(types_seen) / tokens_seen)) / (1 - threshold)
            factors += partial
        return len(seq) / factors if factors else len(seq)

    mtld = (mtld_pass(word_lower) + mtld_pass(list(reversed(word_lower)))) / 2

    hapax_count = sum(1 for c in word_counts.values() if c == 1)
    hapax_ratio = hapax_count / n_words

    word_lengths = [len(w) for w in word_lower]
    avg_word_length = sum(word_lengths) / n_words
    word_length_dist = [0] * 15
    for wl in word_lengths:
        idx = min(wl - 1, 14)
        if idx >= 0:
            word_length_dist[idx] += 1
    word_length_dist = [c / n_words for c in word_length_dist]

    # Syntaktische Features
    avg_sentence_length = sum(sentence_lengths) / len(sentences)
    sentence_length_stddev = math.sqrt(variance(sentence_lengths))
    sentence_length_variance = variance(sentence_lengths)

    punctuation_chars = [t for t in tokens if t.is_punct]
    punctuation_per_sentence = len(punctuation_chars) / len(sentences)

    # Sub-sentence approximation: Konjunktionen + Kommas pro Hauptsatz
    sub_conj = SUB_CONJUNCTIONS_DE if language == "de" else SUB_CONJUNCTIONS_EN
    sub_count = sum(1 for w in word_lower if w in sub_conj)
    sub_sentence_ratio = sub_count / len(sentences)

    # Funktionswort-Verteilung (Top-50)
    function_words = TOP_FUNCTION_WORDS_DE if language == "de" else TOP_FUNCTION_WORDS_EN
    func_word_freqs = {fw: word_counts.get(fw, 0) / n_words for fw in function_words}

    # Lexikalisch-semantisch via POS
    pos_counter = Counter(t.pos_ for t in words)
    adj_ratio = pos_counter.get("ADJ", 0) / n_words
    adv_ratio = pos_counter.get("ADV", 0) / n_words
    verb_count = pos_counter.get("VERB", 0) + pos_counter.get("AUX", 0)
    adj_verb_ratio = pos_counter.get("ADJ", 0) / verb_count if verb_count else 0

    # Verb-Tempus (vereinfacht via Morphologie)
    tense_counter: Counter[str] = Counter()
    for t in words:
        if t.pos_ in ("VERB", "AUX"):
            tense = t.morph.get("Tense")
            if tense:
                tense_counter[tense[0]] += 1
    tense_total = sum(tense_counter.values())
    tense_distribution = {
        "past": tense_counter.get("Past", 0) / tense_total if tense_total else 0,
        "pres": tense_counter.get("Pres", 0) / tense_total if tense_total else 0,
        "fut": tense_counter.get("Fut", 0) / tense_total if tense_total else 0,
    }

    # Substantiv-Komposita-Heuristik (typisch deutsch): Wörter länger als 12 Zeichen
    # und mit Großbuchstaben am Anfang werden als wahrscheinliche Komposita gewertet
    if language == "de":
        compound_candidates = sum(
            1 for w in words if w.pos_ == "NOUN" and len(w.text) > 12
        )
        compound_ratio = compound_candidates / n_words
    else:
        compound_ratio = 0.0

    # Stilmittel
    direct_speech_chars = len(re.findall(r'[„"][^„""]*[""]', text))
    direct_speech_ratio = direct_speech_chars / len(sentences) if sentences else 0

    # Sentence-opening POS-Distribution
    sentence_openings: Counter[str] = Counter()
    for s in sentences:
        first_token = next((t for t in s if t.is_alpha), None)
        if first_token:
            sentence_openings[first_token.pos_] += 1
    n_sentences = len(sentences)
    sentence_opening_dist = {
        pos: count / n_sentences for pos, count in sentence_openings.items()
    }

    # Dependency Distance — mittlere Distanz Token zu seinem syntaktischen Kopf
    dep_distances = [
        abs(t.i - t.head.i) for t in tokens if t.head is not t
    ]
    dependency_distance = sum(dep_distances) / len(dep_distances) if dep_distances else 0

    return {
        # Lexikalisch
        "ttr": ttr,
        "mtld": mtld,
        "hapax_ratio": hapax_ratio,
        "avg_word_length": avg_word_length,
        "word_length_distribution": word_length_dist,
        # Syntaktisch
        "avg_sentence_length": avg_sentence_length,
        "sentence_length_stddev": sentence_length_stddev,
        "sentence_length_variance": sentence_length_variance,
        "punctuation_per_sentence": punctuation_per_sentence,
        "sub_sentence_ratio": sub_sentence_ratio,
        # Funktionswörter
        "function_word_frequencies": func_word_freqs,
        # Lexikalisch-Semantisch
        "adj_ratio": adj_ratio,
        "adv_ratio": adv_ratio,
        "adj_verb_ratio": adj_verb_ratio,
        "tense_distribution": tense_distribution,
        "compound_ratio": compound_ratio,
        # Stilmittel
        "direct_speech_ratio": direct_speech_ratio,
        "sentence_opening_distribution": sentence_opening_dist,
        "dependency_distance": dependency_distance,
        # Meta
        "n_words": n_words,
        "n_sentences": len(sentences),
    }


@app.route("/health")
def health() -> Any:
    return jsonify({
        "ok": True,
        "models_loaded": list(NLP_MODELS.keys()),
    })


@app.route("/parse", methods=["POST"])
def parse() -> Any:
    secret_required = os.environ.get("NLP_SHARED_SECRET")
    if secret_required:
        provided = request.headers.get("X-NLP-Secret") or (
            request.json.get("secret") if request.is_json else None
        )
        if provided != secret_required:
            return jsonify({"error": "Unauthorized"}), 401

    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    data = request.json
    text = data.get("text")
    language = data.get("language", "de")

    if not text or not isinstance(text, str):
        return jsonify({"error": "Missing 'text' field"}), 400
    if language not in NLP_MODELS:
        return jsonify({"error": f"Unsupported language '{language}'"}), 400
    if len(text) > 50_000:
        return jsonify({"error": "Text too long (max 50000 chars)"}), 413

    try:
        features = compute_features(text, language)
        return jsonify({"features": features, "language": language})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
