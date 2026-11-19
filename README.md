[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/xenopatijaya/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/xenopatijaya/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Atlas — GTA VI Trophy Guide & Tracker (Every Step Cited)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PSN; 0 online), built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01). This is the v2 entry: where the first version cited sources per trophy, this atlas cites **every individual guide step** and audits itself in public.

## What makes it different

- **Audit strip** — under the header, always visible: 55 official · 1P 2G 6S 46B · 28 hidden · 55/55 guides cite a source · 161/161 steps cited · 10 sources read 20 Nov 2026 · 1 possibly missable · 8 watch · 8 unconfirmed · 1 source disagreement. Every number is computed from the data file at load, not typed in.
- **Every step cited** — each trophy's guide is written in our own words, broken into numbered steps, and every step ends with bracketed source numbers (e.g. [1][8]) that resolve in the numbered source list.
- **10 sources, cross-checked** — PowerPyx, Exophase, PSNProfiles (list and guide), OutputLag, KeenGamer, eGamers, GTABase, GTA-Zone and the official PSN list, all read 20 Nov 2026. A **source matrix** tab shows which source backs which of the 55 trophies.
- **The disagreement, shown** — trophy guides count 18 meditations across 10 spots; the 100% checklist needs only 15 of 18. Both numbers appear wherever meditations do, with a SOURCES DISAGREE callout on Positive Mental Attitude — the game's one possibly missable trophy, whose Chapter 1 balcony meditation at Jason's house can be lost for a whole playthrough.
- **Honest flags** — 1 POSSIBLY MISSABLE, 8 WATCH (specific setups that are easy to fumble) and 8 UNCONFIRMED (vague hidden trophies whose trigger launch sources have not verified). Unconfirmed entries say so instead of inventing a method.
- **Full per-trophy metadata** — grade, PSN points (platinum 300 / gold 90 / silver 30 / bronze 15), roadmap stage, kind, difficulty (1–10), time estimate and region/character scope, plus progress counters for the countable trophies (meditations x/18, stunts x/250, WAiNK x/100, vehicles x/100, challenges x/50, races x/20, card sets x/3, and more).
- **Session planner** — pick the hours you have (1/2/4/6/10) and the planner fills the session from the earliest-ungated queue: missable first, then roadmap order. The right rail always shows NEXT UP, a TIME TO PLATINUM estimate that shrinks as you earn, and the numbered SOURCES list with a "cited by X of 55 guides" count per source.
- **Roadmap with stage bars** — six stages (Story 45 h · Side stories 25 h · Activities 55 h · Collectibles & money 40 h · Robberies & open world 20 h · 100% & platinum 15 h = ≈200 h), each with an earned/total progress bar.
- **Tracker essentials** — checklist saved in localStorage, export/import as JSON, search, filters by kind/grade/stage, earned-only filter, and a spoiler-safe mode that hides story trophy names and descriptions until they are earned.

## Run it

```sh
# serve app/ and open http://localhost:8080
node serve.ts
# or any static server:
python3 -m http.server 8080 --directory app
```

Open with `?seed=demo` for a mid-run demo state (13 of 55 earned, counters part-way) — that is the state the screenshots were taken in. Add `&view=roadmap`, `&view=missables`, `&view=planner`, `&view=matrix` or `&view=sources` to open on a specific tab. The app works fully offline and makes no network requests at run time.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts` (the kit's copy, unchanged).

## License

MIT — see [LICENSE](LICENSE).
