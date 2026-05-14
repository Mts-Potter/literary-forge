"""
Literary Forge — Reprocess all source_texts chunks with full spaCy pipeline

Läuft EINMALIG lokal auf deinem Mac, NICHT auf Vercel/Render. Berechnet
die 20 Stilfeatures für alle ~12.540 bestehenden Chunks neu und schreibt
sie in `source_texts.metrics`. Anschließend `recompute_all_author_profiles()`.

Voraussetzungen:
  pip install spacy supabase python-dotenv
  python -m spacy download de_core_news_md
  python -m spacy download en_core_web_md

Run:
  cd literary-forge
  python scripts/reprocess_chunks.py [--dry-run] [--limit N] [--batch 50]

Liest Service-Role-Key aus literary-forge/.env.local.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Any

# Local repo import shim
_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT / "nlp-service"))

try:
    from parse import compute_features  # type: ignore
except ImportError as e:
    print("ERROR: nlp-service/parse.py muss importierbar sein.")
    print(f"Details: {e}")
    sys.exit(1)

from dotenv import load_dotenv
from supabase import create_client, Client  # type: ignore


load_dotenv(_REPO_ROOT / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SECRET = os.environ.get("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET:
    print("ERROR: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SECRET_KEY müssen in .env.local stehen.")
    sys.exit(1)


def make_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SECRET)


def process_chunk(chunk: dict[str, Any]) -> dict[str, Any] | None:
    """Berechnet Features für einen Chunk. None wenn Sprache nicht supportet."""
    text = chunk.get("content")
    language = chunk.get("language", "de")
    if not text or len(text) < 20:
        return None
    if language not in ("de", "en"):
        return None
    try:
        return compute_features(text, language)
    except Exception as e:
        print(f"  [WARN] chunk {chunk['id']}: {e}")
        return None


def fetch_chunks(supabase: Client, offset: int, batch: int) -> list[dict[str, Any]]:
    resp = (
        supabase.table("source_texts")
        .select("id, content, language")
        .order("id")
        .range(offset, offset + batch - 1)
        .execute()
    )
    return resp.data or []


def update_metrics(supabase: Client, chunk_id: str, metrics: dict[str, Any]) -> None:
    supabase.table("source_texts").update({"metrics": metrics}).eq("id", chunk_id).execute()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Compute but do not write")
    parser.add_argument("--limit", type=int, default=0, help="Stop after N chunks (0 = all)")
    parser.add_argument("--batch", type=int, default=50, help="Batch size for DB fetches")
    args = parser.parse_args()

    print("Connecting to Supabase ...")
    supabase = make_client()

    total = (
        supabase.table("source_texts")
        .select("id", count="exact", head=True)
        .execute()
        .count
        or 0
    )
    print(f"Total chunks in DB: {total}")
    target = total if args.limit == 0 else min(total, args.limit)
    print(f"Reprocessing {'(DRY-RUN) ' if args.dry_run else ''}{target} chunks ...")

    offset = 0
    success = 0
    skipped = 0
    failed = 0
    started = time.time()

    while offset < target:
        batch = fetch_chunks(supabase, offset, args.batch)
        if not batch:
            break
        for chunk in batch:
            if offset + batch.index(chunk) >= target:
                break
            features = process_chunk(chunk)
            if features is None:
                skipped += 1
                continue
            if args.dry_run:
                success += 1
            else:
                try:
                    update_metrics(supabase, chunk["id"], features)
                    success += 1
                except Exception as e:
                    print(f"  [FAIL] chunk {chunk['id']}: {e}")
                    failed += 1

        offset += len(batch)
        elapsed = time.time() - started
        rate = success / elapsed if elapsed > 0 else 0
        eta = (target - offset) / rate if rate > 0 else 0
        print(
            f"  Progress: {offset}/{target} chunks "
            f"(ok={success}, skip={skipped}, fail={failed}) "
            f"rate={rate:.1f}/s ETA={eta/60:.1f}min"
        )

    print("\nReprocessing complete.")
    print(f"  Success: {success}")
    print(f"  Skipped: {skipped}")
    print(f"  Failed:  {failed}")

    if not args.dry_run:
        print("\nRecomputing all author profiles ...")
        result = supabase.rpc("recompute_all_author_profiles").execute()
        print(f"  RPC result: {result.data}")
    else:
        print("\nDry-run — author profiles not recomputed.")


if __name__ == "__main__":
    main()
