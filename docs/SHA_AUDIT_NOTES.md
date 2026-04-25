# SHA Audit Notes

**Prepared:** 2026-04-25
**Branch:** `claude/audit-sha-references-OpiT1`
**Purpose:** Pre-launch audit of SHA references across operational docs. No product code was changed.

---

## SHAs found

### SHA 1 — `8c1cd98d320077525c797d90d0b9dd48d12bc2c8` (short: `8c1cd98d`)

| Field | Value |
|-------|-------|
| Full SHA | `8c1cd98d320077525c797d90d0b9dd48d12bc2c8` |
| Short SHA | `8c1cd98d` |
| Committed | 2026-04-25 03:49:43 UTC |
| Commit message | `feat(dashboard): honest fallback states for federal/brief/forecast` |
| Commit type | **Application code** — last feature/fix commit before the documentation phase |

**Where it appears:**

| File | Location | Label used |
|------|----------|------------|
| `docs/RELEASE_CANDIDATE_REPORT.md` | "Current SHA" table (top of file, lines 5–13) | "Current SHA" |
| `docs/RELEASE_CANDIDATE_REPORT.md` | Phase 5 gate summary (line 1216) | "SHA `8c1cd98d`" |
| `docs/RELEASE_CANDIDATE_REPORT.md` | Rollback Procedure § step 4 (line 1505) | cross-reference anchor |
| `docs/RELEASE_CANDIDATE_NOTES.md` | HEAD SHA at validation (lines 8–9) | "HEAD SHA" |

---

### SHA 2 — `b392c3759fb5051197203c3e050584b37d0b90e1` (short: `b392c37`)

| Field | Value |
|-------|-------|
| Full SHA | `b392c3759fb5051197203c3e050584b37d0b90e1` |
| Short SHA | `b392c37` |
| Committed | 2026-04-25 18:18:46 UTC |
| Commit message | `docs(release): Phase 6 full launch gate — Gate 5 green, Gate 4 smoke fails` |
| Commit type | **Docs-only** — no application code changed |

**Where it appears:**

| File | Location | Label used |
|------|----------|------------|
| `docs/RELEASE_CANDIDATE_REPORT.md` | Final Launch Sign-Off header (line 1565) | "SHA" (sign-off capture point) |
| `docs/RELEASE_CANDIDATE_REPORT.md` | Phase 6 gate summary (line 1896) | "SHA `b392c37`" |
| `docs/RELEASE_CANDIDATE_REPORT.md` | Final go/no-go summary table (line 2188) | "SHA `b392c37`" |
| `docs/RELEASE_CANDIDATE_REPORT.md` | Rollback reminder section (lines 1744–1745) | "Last known-good code SHA" |
| `docs/OPERATOR_HANDOFF.md` | Rollback SHA section (lines 137–138) | "last known-good code SHA" |
| `docs/POST_LAUNCH_WATCH.md` | Rollback steps (lines 304–307) | "Last known-good code SHA" |
| `.github/ISSUE_TEMPLATE/post_launch_check.md` | Rollback section (line 209) | "Last known-good code SHA" |

---

## Relationship between the two SHAs

`8c1cd98d` is the **ancestor**. `b392c37` is a **descendant**, 25 commits later in the
same linear history. All 25 commits between them carry `docs:` or `docs(release):`
prefixes and touch only documentation files — no application code was modified.

```
8c1cd98d  feat(dashboard): honest fallback states …   ← last code change
  |
  |  [25 docs-only commits — RELEASE_CANDIDATE_REPORT.md, VERCEL_DOMAIN_FIX.md,
  |   POST_LAUNCH_WATCH.md, RC notes, etc.]
  |
b392c37   docs(release): Phase 6 full launch gate …  ← HEAD when OPERATOR_HANDOFF was written
  |
  |  [more docs commits — OPERATOR_HANDOFF.md, post_launch_check.md, SHA consistency fixes]
  |
HEAD      Merge pull request #77 …
```

**The deployed application is byte-for-byte identical at both SHAs.** Rolling
back to either commit would produce the same running application.

---

## Assessment

The two SHAs are **not an accidental inconsistency** — they represent two distinct
points in the release workflow. However, the labeling across docs is misleading.

| SHA | What it actually is | How docs currently label it |
|-----|---------------------|----------------------------|
| `8c1cd98d` | Last application code commit — validated with build ✓, lint ✓, 317/317 tests ✓ | "Current SHA" / "RC code SHA" (correct) |
| `b392c37` | Docs-only commit — HEAD at the moment the Final Launch Sign-Off was captured | "last known-good **code** SHA" (inaccurate — it is not a code commit) |

The phrase "last known-good **code** SHA" in `OPERATOR_HANDOFF.md`,
`POST_LAUNCH_WATCH.md`, and `post_launch_check.md` is technically wrong.
`b392c37` contains no code changes. The last-known-good code is at `8c1cd98d`.

Because the code is identical at both SHAs, no one rolling back to `b392c37` will
deploy different application code — the risk is confusion, not a broken rollback.
But the terminology should be corrected before launch to avoid an operator rolling
back to the wrong point thinking there is a code difference.

---

## Recommended doc edits

These are recommendations only — no files were changed as part of this audit.

### 1. `docs/RELEASE_CANDIDATE_REPORT.md` — Final Launch Sign-Off header

**Current (line 1565):**
```
**SHA: `b392c3759fb5051197203c3e050584b37d0b90e1` (short: `b392c37`)**
```

**Recommended:**
```
**Sign-off capture SHA: `b392c3759fb5051197203c3e050584b37d0b90e1` (short: `b392c37`)**
**RC code SHA: `8c1cd98d320077525c797d90d0b9dd48d12bc2c8` (short: `8c1cd98d`) — all commits between these two are docs-only**
```

### 2. `docs/RELEASE_CANDIDATE_REPORT.md` — Rollback reminder (lines 1744–1745)

**Current:**
```
Last known-good code SHA: **`b392c37`**
(`b392c3759fb5051197203c3e050584b37d0b90e1`)
```

**Recommended:**
```
Last known-good SHA: **`b392c37`** (`b392c3759fb5051197203c3e050584b37d0b90e1`)
(docs-only commit — last application code commit is `8c1cd98d`; code is identical at both)
```

### 3. `docs/OPERATOR_HANDOFF.md` — Rollback SHA section (lines 136–138)

**Current:**
```
If a regression appears after launch, the last known-good code SHA is:
**`b392c37`** (`b392c3759fb5051197203c3e050584b37d0b90e1`)
```

**Recommended:**
```
If a regression appears after launch, the last known-good SHA is:
**`b392c37`** (`b392c3759fb5051197203c3e050584b37d0b90e1`) — docs-only commit;
last application code commit is `8c1cd98d`. Application code is identical at both SHAs.
```

### 4. `docs/POST_LAUNCH_WATCH.md` — Rollback steps (lines 304–307)

**Current:**
```
Last known-good code SHA: **`b392c37`**
(`b392c3759fb5051197203c3e050584b37d0b90e1`). Confirm this SHA against …
```

**Recommended:**
```
Last known-good SHA: **`b392c37`** (`b392c3759fb5051197203c3e050584b37d0b90e1`).
Note: this is a docs-only commit. The last application code commit is `8c1cd98d`;
application code is identical at both. Confirm this SHA against …
```

### 5. `.github/ISSUE_TEMPLATE/post_launch_check.md` — Rollback section (line 209)

**Current:**
```
Last known-good code SHA: **`b392c37`** — see [Release Candidate Report § Rollback Procedure](…).
```

**Recommended:**
```
Last known-good SHA: **`b392c37`** (docs-only commit; RC code SHA is `8c1cd98d`, code identical at both) — see [Release Candidate Report § Rollback Procedure](…).
```

---

## Lint result

`npm run lint` was run on the current branch after this audit file was created.

```
✔ No ESLint warnings or errors
```

Exit code: **0**. No code was modified.
