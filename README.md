# ANT CANVAS — V5.0 Release Candidate

A free browser and Telegram mini-game combining color puzzles, art collection, colony management, four regional industries, local NPC trade, exploration and optional social play.

- [Player guide (English / 中文)](guide.html)
- [Release checklist](RELEASE_V50.md)
- [Privacy](privacy.html) · [Terms](terms.html)

Run locally with `python3 -m http.server 8000` and open http://localhost:8000. Tests: `node --test tools/v38-economy.test.cjs tools/v39-colony.test.cjs tools/v50-industry.test.cjs`.

## Systems
- Puzzles: choose colored boxes; ants clear available matching blocks bottom-up. Four default slots, optional rewarded fifth slot, revive and 3× speed. Free retry and ordinary play.
- Village: `js/village.js` retains a local save; `js/village-storybook.js` renders marked paths; `js/village-page.js` and `js/industry.js` render controls. Production settles complete 60-second trips, independent of frames; offline catch-up is capped by warehouse level.
- Industry: regional activities produce cargo; a caravan reserves cargo and delivers it after a timer; workshops consume local and imported goods; the local NPC market exchanges processed goods for non-transferable building materials.
- Weekly goals are based on actual local gameplay operations; the social backend has separate verified puzzle scores and opt-in village sharing / festival voting. Private backups are explicitly user-supplied, not authoritative economy data.
- Ads: AdsGram block 61573, production mode, no fake impressions; eight optional reward scenarios. Local reward tickets are not server-side ad verification.

Do not advertise real cash earnings, cross-device automatic economy sync, or verified ad revenue. V5.0 RC is a testable build, not evidence that release gates are complete.
