---
"@shrinivas-sn/verify-claims": patch
---

README: fix the stale "not built yet" banner (it was true when written, then
quietly went false — exactly the problem this tool exists to catch) and add
a self-checking Status section using the tool's own claim syntax. CI now
also checks this repo's own docs with the built CLI.
