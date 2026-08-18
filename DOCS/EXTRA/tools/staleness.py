#!/usr/bin/env python3
"""Second-pass probe: real staleness, since npm search scores are saturated.

npm's search API returns maintenance/quality ~1.00 for essentially everything and
an `updated` field that tracks metadata touches, not releases. Both are useless
for finding decaying incumbents. This pass ignores them and reads the actual
publish timeline from the registry document for each package.
"""
import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

SEARCH = "https://registry.npmjs.org/-/v1/search?text={}&size={}"
DOC = "https://registry.npmjs.org/{}"


def get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def days(iso):
    d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - d).days


def real_last_publish(name):
    """Actual last version publish, ignoring metadata-only modifications."""
    d = get(DOC.format(urllib.parse.quote(name, safe="@/")))
    t = d.get("time", {})
    rel = [(k, v) for k, v in t.items() if k not in ("created", "modified")]
    if not rel:
        return None, None, None
    rel.sort(key=lambda x: x[1])
    last_ver, last_at = rel[-1]
    dep = d.get("versions", {}).get(d.get("dist-tags", {}).get("latest", ""), {}).get("deprecated")
    return last_ver, days(last_at), dep


def probe(term, size=8):
    d = get(SEARCH.format(urllib.parse.quote(term), size))
    print(f"\n### {term}   (total matches: {d.get('total'):,})")
    print(f"    {'package':32} {'weekly':>11} {'deps':>6} {'last release':>13} {'dep?':>5}")
    for o in d.get("objects", []):
        p = o["package"]["name"]
        dl = (o.get("downloads") or {}).get("weekly", 0)
        deps = o.get("dependents", 0)
        try:
            ver, age, dep = real_last_publish(p)
            age_s = f"{age}d ago" if age is not None else "?"
            print(f"    {p[:32]:32} {dl:>11,} {deps:>6} {age_s:>13} {'YES' if dep else '':>5}")
        except Exception as e:
            print(f"    {p[:32]:32} {dl:>11,} {deps:>6} {'ERR':>13}  {e}")


if __name__ == "__main__":
    for term in sys.argv[1:]:
        try:
            probe(term)
        except Exception as e:
            print(f"\n### {term}\n    ERROR: {e}")
