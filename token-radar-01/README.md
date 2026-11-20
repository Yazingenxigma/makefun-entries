# Token Radar — radar-2

Pre-token protocols ranked by an implied value that follows only from the
sealed snapshot: TVL, seven-day growth, how long a protocol has run with
no token recorded, and how many chains it runs on.

Formula (stated in the dashboard, and live in its model sandbox):
implied = TVL x 0.20 x growth x maturity x breadth
- growth: 1 + clamped 7d change x 0.6 up / 0.8 down (falls hurt more)
- maturity: 0.55 + age up to 730 days x 0.45; unknown age counts as 180 days
- breadth: 1 + extra chains x 0.03, max 7 chains

The board covers all 40 watchlist protocols plus the 260 largest
pre-token protocols below the floor, 300 rows in all. Live-token
protocols are set aside in a separate view, shown at market cap, never
ranked as if they were pre-token.

Each row carries seven farm steps, derived from the protocol's category,
chains, TVL and age, each with a cost and a time, plus a risk note.

`main.ts` (Node 22, standard library only) reads the snapshot, writes
`board.json`, `data.js`, copies `dashboard/` and `screenshots/`, and
writes `dossier.json` with the vendored make.fun library.
