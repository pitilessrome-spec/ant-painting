# ANT CANVAS iOS V0.1 — independent development branch

Uses the existing puzzle, art, four maps, colony and industry assets locally with Capacitor 8. Native iOS AdMob uses the existing eight reward flows and rejects skipped/error playback; test ads by default. Telegram web production is untouched.

## Build (Mac with supported Xcode, Node 22+)
1. In this directory run `npm install`.
2. Run `npm test` and `npm run ios:add` (first time only).
3. Run `npm run ios:sync`, then `npm run ios:open`.
4. In Xcode choose your organization's signing team and a unique Bundle ID (the proposed `com.antcanvas.game` is provisional and must be registered/available). Select a connected iPhone or simulator and Run. No credentials are stored in this repo.
5. For TestFlight, create the app in App Store Connect, archive the signed Release build and upload through Xcode. A public App Store organization membership is required; Enterprise in-house distribution alone is not sufficient.

## AdMob
Development defaults to Google's official iOS sample App ID and rewarded unit. Do not click or request your own live ads for testing.
Production build requires ANT_ADS_MODE=production, ANT_ADMOB_APP_ID and ANT_ADMOB_REWARDED_ID (same publisher, non-test IDs). Keep the same variables through ios:sync and configure. Use explicit user initiation, consent, earned callback and dismissal; no automatic interstitials. No tracking authorization request in V0.1. Audit UMP configuration, SDK privacy manifests, SKAdNetwork IDs, app-ads.txt, age and content rating before release.

## Scope / release gates
Local guest play, original economy, native share/haptics, native reward bridge, settings and bundled assets. Apple login, Game Center, cloud sync, production icon/screenshots, support/privacy disclosures and App Store submission are separate next steps. Native build, real-device performance, offline play and actual test ad playback must pass before TestFlight. The existing Telegram account and AdsGram 61573 are not reused on native iOS.
