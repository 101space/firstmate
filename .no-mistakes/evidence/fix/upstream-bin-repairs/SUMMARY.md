# Live validation: two upstream repairs (fix/upstream-bin-repairs)

Base commit `4ffd3495`, change `702e8a5f`. Two self-contained repairs:

1. `bin/fm-pending-reply-lib.sh` — `fm_pending_reply_new_id` initializes `raw`/`hex` and falls back to `openssl` → `shasum` → `sha256sum`.
2. `bin/fm-dod-lib.sh` + `bin/fm-pr-check.sh` + `bin/fm-pr-merge.sh` — new `control-locked` pin mode, selected only for the gate a merge runs while it already holds the task's control lock.

## Environment

This host has **no `openssl`** on PATH (`shasum`/`sha256sum` present), i.e. it is the exact host class repair 1 targets. Every run used a throwaway `bin/fm-lab-home.sh` lab home under `/tmp` (removed in the same step) plus disposable git project/worktree fixtures, and a pristine base tree extracted with `git archive 4ffd3495` for before/after comparison. No operator fleet home, default tmux/Herdr session, or credential store was touched.

## Scenarios

| # | Scenario (what a user does) | Result | Evidence |
|---|---|---|---|
| S1 | A marked send (`bin/fm-send.sh` to a `kind=secondmate` task) on the openssl-less host | passes: `rc=0`, 16-hex corr `4888978e8be38a98`, pending-reply record written, inbox record delivered | `s1-send-fixed.log` |
| S2 | Same marked send against the **unfixed** base tree | reproduces the report: `line 180: raw: unbound variable` → `failed to create parent pending-reply expectation` | `s1-send-base.log` |
| S3 | Adversarial tool matrix (no `openssl`, no `shasum`, `sha256sum` only; then no hashing tool at all) | passes: `sha256sum` path mints a 16-hex id and creates the record; with no hashing tool the id is empty and creation refuses with rc=1 (no unbound-variable crash) | `s3-hashing-matrix.log` |
| S4 | A real `bin/fm-pr-merge.sh` run for a `mode=local-only` task (its readiness gate pins the local done head while the merge holds the control lock) | passes: gate succeeds, `local_done_head=` recorded exactly once, run continues to the forge read; **base tree refuses** with `local-only done head could not be recorded` and records nothing | `s4-merge-fixed.log`, `s4-merge-base.log` |
| S5 | Adversarial lock guards through `bin/fm-pr-check.sh` merge mode | passes: (a) control lock held by another process, no merge marker → still refuses; (b) merge marker set but metadata lock held → still refuses; (c) free locks + marker → pins once with the worker HEAD | `s5-lock-guards.log` |
| S6/S7 | The change's targeted suites: `tests/fm-merge-local.test.sh` (incl. new `control-locked` case) and `tests/fm-pending-reply.test.sh` | pass (9/9 and all pending-reply tests) | `s6-fm-merge-local.test.log`, `s7-fm-pending-reply.test.log` |

Repair scope (two repairs, nothing else): `git diff --stat 4ffd3495..702e8a5f` touches only `bin/fm-dod-lib.sh`, `bin/fm-pending-reply-lib.sh`, `bin/fm-pr-check.sh`, `bin/fm-pr-merge.sh`, and the two test files/lint disables.
