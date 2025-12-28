#!/usr/bin/env python3
"""Hafiportrait Photo Upload Script

Supports:
1) Batch upload all photos in a directory (existing behavior)
2) Stress test mode: upload N photos every M seconds

Examples:
  # Stress test: upload 2 photos every 60 seconds (default)
  python3 test-upload.py --stress --event-id <EVENT_ID> --api-key <API_KEY> --photos-dir /path/to/photos

  # Stress test: run 30 minutes, 2 photos per minute
  python3 test-upload.py --stress --duration-minutes 30 --batch-size 2 --interval-seconds 60 \
    --event-id <EVENT_ID> --api-key <API_KEY> --photos-dir /path/to/photos

  # Batch upload all photos (legacy)
  python3 test-upload.py --event-id <EVENT_ID> --api-key <API_KEY> --photos-dir /path/to/photos
"""

import argparse
import os
import random
import time
from pathlib import Path
from typing import List, Optional

import requests

DEFAULT_API_BASE_URL = "https://hafiportrait.photography/api"
DEFAULT_PHOTOS_DIR = "/home/eouser/foto"


def upload_photo(
    session: requests.Session,
    api_base_url: str,
    file_path: str,
    event_id: str,
    api_key: str,
    timeout_seconds: int = 120,
) -> dict:
    """Upload a single photo to the event."""
    url = f"{api_base_url}/admin/events/{event_id}/photos/upload"
    headers = {"x-api-key": api_key}

    with open(file_path, "rb") as f:
        files = {"files": (os.path.basename(file_path), f, "image/jpeg")}
        try:
            response = session.post(url, headers=headers, files=files, timeout=timeout_seconds)

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    return {"success": True, "data": result}
                return {"success": False, "error": result.get("message", "Unknown error")}

            # Non-200
            try:
                error_data = response.json()
                return {"success": False, "error": error_data.get("error", f"HTTP {response.status_code}")}
            except Exception:
                return {"success": False, "error": f"HTTP {response.status_code}: {response.text[:200]}"}

        except requests.exceptions.Timeout:
            return {"success": False, "error": f"Timeout (> {timeout_seconds}s)"}
        except Exception as e:
            return {"success": False, "error": str(e)}


def list_photo_files(photos_dir: str) -> List[Path]:
    p = Path(photos_dir)
    if not p.exists():
        raise FileNotFoundError(f"Directory not found: {photos_dir}")

    files = (
        sorted(p.glob("*.jpg"))
        + sorted(p.glob("*.JPG"))
        + sorted(p.glob("*.jpeg"))
        + sorted(p.glob("*.JPEG"))
    )
    return files


def batch_upload_all(
    api_base_url: str,
    api_key: str,
    event_id: str,
    photos_dir: str,
    delay_seconds: float = 0.5,
) -> None:
    photo_files = list_photo_files(photos_dir)
    if not photo_files:
        print(f"❌ No photos found in: {photos_dir}")
        return

    print("=" * 60)
    print("🚀 Hafiportrait Batch Upload")
    print("=" * 60)
    print(f"📁 Found {len(photo_files)} photos in: {photos_dir}")
    print(f"🎯 Event ID: {event_id}")
    print(f"🔑 API Key: {api_key[:10]}...")
    print("-" * 60)

    session = requests.Session()
    results = []

    for i, photo_path in enumerate(photo_files, 1):
        print(f"[{i}/{len(photo_files)}] Uploading: {photo_path.name}... ", end="")
        r = upload_photo(session, api_base_url, str(photo_path), event_id, api_key)
        results.append((photo_path, r))
        if r["success"]:
            print("✅ SUCCESS")
        else:
            print(f"❌ FAIL ({r.get('error')})")
        time.sleep(delay_seconds)

    success_count = sum(1 for _, r in results if r["success"])
    failed = [(p, r) for p, r in results if not r["success"]]

    print("-" * 60)
    print("📊 SUMMARY")
    print(f"✅ Successful: {success_count}/{len(results)}")
    print(f"❌ Failed: {len(failed)}/{len(results)}")
    if failed:
        print("Failed uploads:")
        for p, r in failed:
            print(f"  - {p.name}: {r.get('error')}")


def stress_test(
    api_base_url: str,
    api_key: str,
    event_id: str,
    photos_dir: str,
    batch_size: int = 2,
    interval_seconds: int = 60,
    duration_minutes: Optional[int] = None,
    iterations: Optional[int] = None,
    randomize: bool = False,
) -> None:
    photo_files = list_photo_files(photos_dir)
    if not photo_files:
        print(f"❌ No photos found in: {photos_dir}")
        return

    if iterations is None and duration_minutes is None:
        # default to 60 minutes if user doesn't specify a stop condition
        duration_minutes = 60

    total_iterations = iterations if iterations is not None else int(duration_minutes * 60 / interval_seconds)
    total_iterations = max(1, total_iterations)

    print("=" * 60)
    print("🧪 Hafiportrait Stress Test")
    print("=" * 60)
    print(f"📁 Source dir      : {photos_dir}")
    print(f"📸 Total files     : {len(photo_files)}")
    print(f"🎯 Event ID        : {event_id}")
    print(f"🔑 API Key         : {api_key[:10]}...")
    print(f"📦 Batch size      : {batch_size} file(s) per interval")
    print(f"⏱️  Interval        : {interval_seconds} seconds")
    print(f"🔁 Iterations      : {total_iterations}")
    print(f"🎲 Randomize order : {randomize}")
    print("-" * 60)

    session = requests.Session()

    idx = 0
    successes = 0
    failures = 0

    for it in range(1, total_iterations + 1):
        start = time.time()
        print(f"\n[Iteration {it}/{total_iterations}] {time.strftime('%Y-%m-%d %H:%M:%S')}")

        # select batch
        if randomize:
            batch = random.sample(photo_files, k=min(batch_size, len(photo_files)))
        else:
            batch = []
            for _ in range(batch_size):
                batch.append(photo_files[idx % len(photo_files)])
                idx += 1

        for p in batch:
            print(f"- Uploading: {p.name}... ", end="")
            r = upload_photo(session, api_base_url, str(p), event_id, api_key)
            if r["success"]:
                successes += 1
                print("✅")
            else:
                failures += 1
                print(f"❌ ({r.get('error')})")

        elapsed = time.time() - start
        sleep_for = max(0, interval_seconds - elapsed)
        print(f"Iteration done. Elapsed={elapsed:.1f}s, sleeping={sleep_for:.1f}s")
        if it != total_iterations:
            time.sleep(sleep_for)

    print("\n" + "-" * 60)
    print("📊 STRESS TEST SUMMARY")
    print(f"✅ Upload success: {successes}")
    print(f"❌ Upload failed : {failures}")
    print("-" * 60)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Hafiportrait upload helper")

    parser.add_argument("--api-base-url", default=DEFAULT_API_BASE_URL)
    parser.add_argument("--api-key", default=os.environ.get("HAFI_API_KEY", ""))
    parser.add_argument("--event-id", default=os.environ.get("HAFI_EVENT_ID", ""))
    parser.add_argument("--photos-dir", default=os.environ.get("HAFI_PHOTOS_DIR", DEFAULT_PHOTOS_DIR))

    parser.add_argument("--stress", action="store_true", help="Enable stress test mode")
    parser.add_argument("--batch-size", type=int, default=2, help="Photos per interval")
    parser.add_argument("--interval-seconds", type=int, default=60, help="Interval between batches")
    parser.add_argument("--duration-minutes", type=int, default=None, help="Total duration in minutes")
    parser.add_argument("--iterations", type=int, default=None, help="Number of iterations")
    parser.add_argument("--random", action="store_true", help="Pick random photos instead of sequential")

    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if not args.api_key:
        raise SystemExit("❌ Missing API key. Provide --api-key or set HAFI_API_KEY")
    if not args.event_id:
        raise SystemExit("❌ Missing event id. Provide --event-id or set HAFI_EVENT_ID")

    if args.stress:
        stress_test(
            api_base_url=args.api_base_url,
            api_key=args.api_key,
            event_id=args.event_id,
            photos_dir=args.photos_dir,
            batch_size=args.batch_size,
            interval_seconds=args.interval_seconds,
            duration_minutes=args.duration_minutes,
            iterations=args.iterations,
            randomize=args.random,
        )
    else:
        batch_upload_all(
            api_base_url=args.api_base_url,
            api_key=args.api_key,
            event_id=args.event_id,
            photos_dir=args.photos_dir,
        )


if __name__ == "__main__":
    main()
