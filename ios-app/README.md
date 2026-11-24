# ANT CANVAS iOS V0.1 — independent development branch

Uses the existing puzzle, art, four maps, colony and industry assets locally with Capacitor 8. Native iOS AdMob uses the existing eight reward flows and rejects skipped/error playback; test ads by default. Telegram web production is untouched.

## Build (Mac with Xcode 26+ (iOS 26 SDK or later), Node 22+)
1. In this directory run `npm install`.
2. Run `npm test` and `npm run ios:add` (first time only).
3. Run `npm run ios:sync`, then `npm run ios:open`.
4. In Xcode choose your organization's signing team and a unique Bundle ID (the proposed `com.antcanvas.game` is provisional and must be registered/available). Select a connected iPhone or simulator and Run. No credentials are stored in this repo.
5. For TestFlight, create the app in App Store Connect, archive the signed Release build and upload through Xcode. A public App Store organization membership is required; Enterprise in-house distribution alone is not sufficient.

## AdMob
Development defaults to Google's official iOS sample App ID and rewarded unit. Do not click or request your own live ads for testing.
The publisher's iOS App ID and rewarded unit are configured in scripts/config.mjs. Development and CI always use the official sample IDs by default. After App Store linking, AdMob account approval and real-device QA, explicitly run `ANT_ADS_MODE=production npm run ios:sync` for a production archive. Optional environment overrides ANT_ADMOB_APP_ID and ANT_ADMOB_REWARDED_ID must be non-test IDs belonging to the same publisher. Keep the same variables through build and configure. Do not use production builds to test live ads. Use explicit user initiation, consent, earned callback and dismissal; no automatic interstitials. No tracking authorization request in V0.1. Audit UMP configuration, SDK privacy manifests, SKAdNetwork IDs, app-ads.txt, age and content rating before release.

## Scope / release gates
Local guest play, original economy, native share/haptics, native reward bridge, settings and bundled assets. Apple login, Game Center, cloud sync, production icon/screenshots, support/privacy disclosures and App Store submission are separate next steps. Native build, real-device performance, offline play and actual test ad playback must pass before TestFlight. The existing Telegram account and AdsGram 61573 are not reused on native iOS.

## Q-AdRouter V1 candidate
StoreKit storefront country code (not physical location): CHN routes exclusively to Baidu, other known storefronts to AdMob, unknown disables ads. No GPS or automatic cross-region fallback. Trusted coarse network country may be added after privacy review. Baidu test IDs are configured. The native bridge source and pinned CocoaPods integration are included. Use a fresh generated iOS project and ANT_BAIDU_NATIVE=1 npm run ios:sync to build the dual-SDK device candidate; simulator builds intentionally omit Baidu. Native build and actual device playback remain gates. See native/BAIDU-INTEGRATION.md. Production requires approved non-test Baidu IDs.
For Baidu-enabled device builds open ios/App/App.xcworkspace in Xcode, not the xcodeproj. Use a fresh generated ios directory when switching build flavors. The default simulator flavor remains AdMob-only. Test IDs cannot be used for a production Baidu build.
