# ANT CANVAS — Telegram Mini App + HTML5 Game backend

**Status:** source is ready to deploy, but production linking is **blocked** until BotFather authorizes a new bot and you configure a database. Never place the BotFather token in GitHub Pages, JavaScript, or a public repository.

## Features
- `POST /api/webhook`: signed Telegram Bot webhook. `/start` opens the game as a Mini App; `/play` sends the native Telegram game card once `/newgame` has been configured. Native `Play` callbacks open the shared game URL.
- `GET /api/profile`: validates Telegram Mini App `initData` with HMAC SHA-256, enforces 1-hour expiry, gets verified level progress.
- `POST /api/start-level`: creates a random, per-user start ticket for the next level.
- `POST /api/progress`: consumes the ticket once, requires sequential completion and at least three seconds of play; writes Postgres leaderboard and attempts native Telegram `setGameScore` for game-chat launches.
- `GET /api/leaderboard`: 30 highest levels; anonymized user names.
- `GET /api/health`: configuration status, no secrets.

**Integrity caveat:** tickets and timing are baseline abuse controls, not proof of gameplay. Competitive cash-prize leaderboard needs server-replayed move logs and more controls. No crypto rewards or cash prizes should depend on this MVP leaderboard.

## Setup once BotFather is available
1. Create a new bot with `@BotFather /newbot`; register the **Main Mini App** (`/newapp`) at `https://pitilessrome-spec.github.io/ant-painting/`. Then use `/newgame` to register a native HTML5 game (short name like `antcanvas`).
2. Deploy this directory as an independent Vercel project with Root Directory `telegram-backend`. Attach a **PostgreSQL** database (e.g. Neon) to the project. Execute `sql/001_init.sql` once.
3. Set protected env vars using `.env.example`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_GAME_SHORT_NAME`, `DATABASE_URL`, `GAME_ORIGIN`. Do not commit values. `TELEGRAM_WEBHOOK_SECRET` should be generated randomly (A–Z, a–z, 0–9, underscore, or hyphen), 32+ characters. Some database providers require CA configuration; verify server-side TLS rather than blindly disabling certificate verification.
4. Edit `js/telegram.js` on the GitHub Pages side to set `botUsername`, `miniAppShortName`, and `apiBaseUrl` (HTTPS API origin only; no secrets).
5. In a secure terminal, run `TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... API_BASE_URL=https://<vercel-project> node scripts/configure-bot.mjs` with secrets from a protected environment, not shell history. This sets Telegram webhook and menu button. Confirm `getWebhookInfo` and play the game in Telegram on Android and iOS.
6. Add a bot avatar, game-card preview, privacy policy, `/start` description, and an owner support contact in BotFather.

## AdsGram monetization (not active until publisher approval)
1. Register a **publisher** account at https://partner.adsgram.ai/registration after the Telegram bot and Mini App are registered.
2. Add the Mini App with Telegram direct link, bot ID, and game HTTPS URL, wait for AdsGram moderation, create Rewarded and Interstitial ad blocks.
3. Edit only public placement IDs in `js/ads.js` (`provider: 'adsgram'`, `rewardedBlockId`, `interstitialBlockId`, `debug: false` after live approval). Keep any AdsGram payout credentials private.
4. Test on real Telegram clients; confirm that a rewarded boost is awarded only after AdsGram success, while an ad failure grants no paid-ad reward. If the ad provider is not configured, the published game uses visibly **free boosters**, not fake paid advertising.

`AdsGram` optional server callback is not currently used to grant persisted rewards, because an unsigned user-ID-only callback is insufficient to confirm payout-grade rewards. Do not treat the local client callback as server-verified revenue.

## Data, privacy, recovery
- Browser mode stores progress in `localStorage`. Telegram's `initData` is sent only to your configured HTTPS backend, never stored persistently.
- Server stores Telegram numeric ID, best cleared level, game card context and level sessions. Public leaderboard shows anonymized `Ant #NNNNNN` labels.
- The browser can continue playing if Telegram or the backend is unavailable; leaderboard progress does not sync until a valid Telegram session and database are available.
- Production requires backups, log hygiene, error monitoring, DB retention policies, and testing before monetization.

## Tests
`npm install && npm run check`. Uses Node >= 20. Verify PostgreSQL migration and webhook with an isolated test bot before production.

## V3 operator dashboard
- UI: https://pitilessrome-spec.github.io/ant-painting/admin.html
- Set ANT_ADMIN_KEY to a cryptographically random 32+ character secret in Vercel production settings. Do not commit it or paste it into chat. Set DATABASE_URL and TELEGRAM_BOT_TOKEN in Vercel; apply sql/001_init.sql once to the database. Restrict admin key distribution.
- GET /api/admin/stats requires Bearer key. No credentials in URL or local storage. Aggregate SQL counts verified players, new/active players, completed levels, recent level starts, and yesterday-active return rate in Singapore time. Last five minutes is NOT concurrent online. No raw player identity is returned. AdsGram reporting has not been integrated; revenue is null, not zero.
- Missing keys or database: report unavailable, not fake zero. Rotate admin key if exposed. For a public production rollout add IP-based throttling, owner identity auth, audit trails and monitoring.

## V3.1 cloud backup & friends
Apply sql/002_social.sql after 001_init.sql before enabling V3.1. Backups are explicit manual copies with compare-and-swap revisions, not authoritative scores or automatic sync. The server uses signed Telegram start_param for new-account referral attribution. A verified best level of five qualifies an invite; no material reward is emitted yet. Public village layouts are opt-in and limited to referral-linked players. Private data and material balances are not returned to visitors. The frontend displays errors rather than replacing local data on failed API calls. Configure production DATABASE_URL, TELEGRAM_BOT_TOKEN and ANT_ADMIN_KEY in Vercel; verify migrations and two real Telegram users before claiming operational readiness. AdsGram revenue remains unconnected.

## Leaderboard names
Migration sql/003_player_names.sql adds only two nullable fields. It is also applied idempotently at the first authenticated request if missing (requires schema owner role). Signed Telegram display names are synchronized; public display is opt-in and can be disabled. Existing scores are unchanged.
