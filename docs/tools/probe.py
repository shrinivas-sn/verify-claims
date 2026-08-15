#!/usr/bin/env python3
"""Measure how crowded / how stale a given npm niche is.

Method: for a search term, pull the top N results and report
  - total packages matching (crowdedness)
  - for the top hits: weekly downloads, dependents, last update, maintenance score
A niche with high downloads but low maintenance scores and old `updated` dates
is a niche where incumbents are decaying -- the only kind of gap a newcomer can
realistically enter.
"""
import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

API = "https://registry.npmjs.org/-/v1/search?text={}&size={}"


def fetch(term, size=10):
    url = API.format(urllib.parse.quote(term), size)
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def age_days(iso):
    if not iso:
        return None
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - d).days
    except Exception:
        return None


def probe(term, size=8):
    d = fetch(term, size)
    print(f"\n### {term}")
    print(f"    total matching packages: {d.get('total')}")
    rows = []
    for o in d.get("objects", []):
        p = o["package"]
        det = o.get("score", {}).get("detail", {})
        dl = o.get("downloads", {}) or {}
        rows.append(
            (
                p.get("name", "?")[:34],
                dl.get("weekly", 0),
                o.get("dependents", 0),
                age_days(o.get("updated")),
                det.get("maintenance", 0),
                det.get("quality", 0),
            )
        )
    print(f"    {'package':34} {'weekly':>10} {'deps':>7} {'age_d':>6} {'maint':>6} {'qual':>6}")
    for n, dl, dep, age, m, q in rows:
        print(f"    {n:34} {dl:>10,} {dep:>7} {str(age):>6} {m:>6.2f} {q:>6.2f}")
    return rows


if __name__ == "__main__":
    for term in sys.argv[1:]:
        try:
            probe(term)
        except Exception as e:
            print(f"\n### {term}\n    ERROR: {e}")
