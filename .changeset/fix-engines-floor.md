---
"@shrinivas-sn/verify-claims": patch
---

Fix `engines.node` floor: was `>=22.12`, based on a mistaken read of Node's
*latest* docs page instead of the version-pinned Node 22.x docs. On Node
22.x, `require(esm)` is documented as "Stability: 1.2 - Release candidate,"
not "2 - Stable" (that only landed in 24.15.0/25.4.0). Corrected the floor
to `>=22.13` — the unflagged minimum — so the `engines` field doesn't claim
stability the underlying Node feature doesn't have on that line.
