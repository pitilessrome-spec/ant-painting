# AdsGram fifth slot — release r2

Production block: 61573. SDK debug=false. Reward only on successful AdsGram show result and only for the current level attempt. Standard gameplay stays free. Slot is not persisted after reload/retry. Client-side checks prevent ordinary duplicate grants, not malicious browser modification. No cash or transferable reward.

Run `node tools/check_ads.js` for deterministic SDK-stub tests. No ad requests or impressions are generated. In a private test build only, set AdsGram debug=true (never publish as production). Test in real Telegram: open https://t.me/AntCanvasArtBot/antcanvas; choose the fifth slot; finish test ad, verify exactly five slots; retry and skip, verify four slots; test no inventory/network failure and ordinary web browser. Revert debug=false before deployment. Test ads are not reported as impressions or earnings. Do not repeatedly play production ads to generate statistics.

After moderation, verify a genuine user-initiated production ad and reward in Telegram, then compare block 61573 dashboard impressions and earnings (and CSV) by date. Session-only Ads.slotStats counts requested/completed/granted/failed/stale, not verified impressions or payable revenue. Revenue is authoritative only in AdsGram publisher reporting. Reward URL is optional for this ephemeral nonfinancial bonus.

Official docs: https://docs.adsgram.ai/publisher/api-reference and https://docs.adsgram.ai/publisher/get-block-id.
