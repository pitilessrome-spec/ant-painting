# ANT CANVAS (web source)

A puzzle game built with three.js and procedurally generated pictures. Levels are unlimited, and every level's picture is generated from code, so no two levels share the same picture.

## Run it

Easiest: double-click `index.html` to open it in a browser.

If the browser blocks local scripts, start a local server in this folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000

## Files

| File | What it does |
| --- | --- |
| `index.html` | Game page (UI, 3D tray, popups) |
| `js/art.js` | **Level picture generator**: colors, shapes, 8 backgrounds, 14 object kinds, decorations. Each level number seeds its own random combination |
| `js/game.js` | Game logic: box order, eating rules, stall and lose detection, revive and reshuffle. `makeGame` checks that following the hint clears each level, and retries with another seed if not |
| `js/ui.js` | Page logic: clicks, hint, ad placeholders, popups, drawing |
| `js/ads.js` | Ad integration layer (placeholder, AdsGram, CrazyGames) |
| `vendor/three.min.js` | three.js r128, bundled locally |
| `gallery.html` | Picture preview: browse the pictures of any range of levels |
| `tools/check_levels.js` | Check script: duplicate check, hint clear check, generation time |

## How pictures are generated (js/art.js)

Each level's picture depends only on its level number:

1. Level number -> random seed (`mix32`). The same level always gives the same picture, and different levels get different seeds.
2. Pick one background (stripes, dots, gradient, radial, foliage, waves, night sky, meadow).
3. Maybe add grass at the bottom.
4. Place 2 to 4 objects, chosen from 14 kinds: animal face, tree, flower, mushroom, house, heart, star, sun, cloud, fish, sailboat, gem, rainbow, butterfly. Position, size, color family, face and decorations are random.
5. If the objects cover less than 25% of the picture, add one more, larger object.
6. Scatter clouds and stars, then outline the object edges in black.

Colors use 22 materials (`MATS`), and the hue shifts slightly per level.

To add an object or background, write a new function (arguments `(C, R, sc)`, call `C.add(shape, colorFamily)` for each part), then add it to the `KINDS` or `BGS` array.

## Game rules (js/game.js)

- Boxes come from the top of 4 columns and go into slots below. You start with 4 slots; each watched ad adds one more, up to 7.
- A box loaded into a slot immediately eats the nearest matching cells in order. Ants walk out one by one as an animation only.
- Cells are eaten from the bottom up. A cell covered by other cells cannot be eaten yet.
- You can load any box, even one that cannot move yet. It waits in its slot.
- If every slot is full of stuck boxes, the game is over. You can watch an ad to revive: one more slot, and the remaining boxes are reshuffled so you can continue.
- Hint: highlights the next box in order. Following that order always clears the level (checked for every generated level).
- Speed: x2 is free from level 10. x3 needs an ad, for the current level only.
- Reshuffle: free once per level from level 10; after that, each reshuffle needs an ad.

## Box sizes and difficulty

Set in `levelParams` in `js/game.js`:

- Levels 1 to 10: 8 to 20 ants per box
- Levels 11 to 300: 12 to 30 ants per box
- Level 301 and up: 30 to 50 ants per box

Starting slots: `cap` in `levelParams`. Grid size: `gridN` in `js/art.js` (up to 56 x 56).

## Checking

```
node tools/check_levels.js 3000
```

Checks 3000 levels for duplicates, clears 20 random levels by following the hint, and reports generation time. Generating one level takes about half a second, including its check.

## Ads and publishing (Telegram + AdsGram)

Ad placements:

| Where | Type | Notes |
| --- | --- | --- |
| Revive | Rewarded | Reward only after the ad is fully watched |
| Hint | Rewarded | |
| Add slot | Rewarded | Up to 3 per level |
| Speed x3 | Rewarded | Current level only |
| Reshuffle (after the first free one) | Rewarded | |
| Next level | Interstitial | Shown between levels |

### 1. Local testing (default)

`provider: 'mock'` in `js/ads.js` shows a placeholder ad that counts as watched after 1.5 seconds.

### 2. Telegram mini app with AdsGram

1. Host the files on HTTPS (GitHub Pages, Netlify, or Vercel are free).
2. In Telegram, use @BotFather: `/newbot` to create a bot, then `/newapp` to create the mini app with your HTTPS URL. `/myapps` gives you the direct link.
3. Register at https://partner.adsgram.ai and add the mini app (use the direct link and Web App URL from step 2).
4. Create a rewarded ad unit (numeric ID) and an interstitial ad unit (ID starts with `int-`).
5. Set `provider: 'adsgram'` and the two IDs in `AD_CONFIG` in `js/ads.js`. Keep `debug: true` while testing; set it to `false` before launch.

Without ad unit IDs, the ad buttons show "No ad available right now" and give no reward.

### 3. CrazyGames

Uncomment the CrazyGames SDK line in `index.html`, then set `provider: 'crazygames'` in `js/ads.js`.

## Notes

- Game logic and pictures were tested in headless Chromium and with Node scripts. They were not tested on real phones.
- Use your own name for the game and your own artwork before publishing. Do not copy another game's name or look.
- Before publishing, write a short privacy policy that says whether the game shows ads and what data it collects.

## Telegram release status (23 November 2026)

The published browser game includes a Telegram Mini App dashboard (Scores, Share), Telegram SDK integration, local progress, and a secure client for verified online progress. The Telegram backend is deployed at https://ant-canvas-telegram-api.vercel.app/api/health (currently returns `botConfigured=false` and `storageConfigured=false`).

The existing Telegram account received BotFather's message "You have currently no bots" and its `/newbot` request was refused. **Do not describe the game as a registered Telegram game until that restriction has been removed**. The Mini App and native `/newgame` bot cannot be activated without a BotFather-created bot, server-only token, and Postgres storage.

Backend source, PostgreSQL schema, HMAC initialization validation, native game callback code, setup scripts and tests are documented in [telegram-backend/README.md](telegram-backend/README.md).

Advertisements: while no AdsGram publisher account and real unit IDs are approved, boosts are free (the production config uses `provider: 'free'`, never a simulated paid impression). To monetize later, follow AdsGram's official publisher flow at https://partner.adsgram.ai/ and then configure `provider: 'adsgram'` with actual ad block IDs. The privacy notice is [privacy.html](privacy.html).

**Browser game:** https://pitilessrome-spec.github.io/ant-painting/
