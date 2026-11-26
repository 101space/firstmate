# Live validation: Calm selectable spaceship presentation

All checks drove the real `pi` 1.6.1 TUI (the product), not a fixture double:

- A disposable project copy of `.pi/` + `.claude/` from this worktree was used as the Pi project.
- Disposable `FM_HOME` held `config/calm` and `config/calm-ship`; disposable `PI_CODING_AGENT_DIR` kept real user config untouched; `PI_OFFLINE=1`.
- Pi ran inside a real pty (Python `openpty` + `TIOCSWINSZ 120x40`) so the TUI had a non-zero grid; the exit status and byte stream were captured, and frames were reconstructed from the ANSI stream at synchronized-update boundaries.
- Agent runs used a local faux provider extension (`createFauxCore` from the installed `@earendil-works/pi-ai`) whose response resolves after 12 s of thinking, so the working state is long enough to observe. No real login, no network, no model calls.
- Whole lab removed after the run; nothing was written outside the lab and this evidence directory.

Artifacts:
- `spaceship-banner-timeline.log`, `pi-tui-warp-*.txt`: config/calm=on, config/calm-ship=spaceship; ambient two-row `(|)` / `|^|` banner drifting while idle, single-row `=( * )` warp during the run, back to the two-row drift after settle.
- `boat-default-run-scoped.log`, `pi-tui-boat-13.0s.txt`: no `config/calm-ship`; no banner while idle, the default `◿` boat only during the run, gone after settle.
- `calm-off-spaceship-selected-no-banner.log`, `pi-tui-calm-off-6.0s.txt`: config/calm=off with the file selecting spaceship; no banner at any time.
- `spaceship-selection-reread-and-session-teardown.log`, `pi-tui-newsession-*.txt`: `yacht` keeps the boat default (no banner), whitespace-padded `  spaceship  ` takes effect at the next session (`/new`), and Calm off + `/new` leaves no orphan banner.
