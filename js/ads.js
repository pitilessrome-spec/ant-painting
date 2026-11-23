/* ANT CANVAS · ad integration layer
 *
 * Pick the ad platform in AD_CONFIG. The game only calls Ads.rewarded / Ads.midgame / Ads.gameplay,
 * so the UI and game logic do not need to change.
 *
 *   'mock'        placeholder for local testing (simulates a 1.5 second ad)
 *   'adsgram'     Telegram mini app + AdsGram
 *   'crazygames'  CrazyGames web game portal (SDK v3)
 */
const AD_CONFIG = {
  provider: 'mock',
  adsgram: {
    // Get these after adding your mini app at https://partner.adsgram.ai
    rewardedBlockId: '',      // rewarded ad, digits only, e.g. "12345"
    interstitialBlockId: '',  // interstitial ad, format "int-12345"
    debug: true               // true while testing (shows test ads); set to false before launch
  }
};

const Ads = {
  provider: AD_CONFIG.provider,
  ready: false,   // ad SDK is ready
  busy: false,    // an ad is playing: the game is paused
  rwdCtrl: null,  // AdsGram rewarded ad controller
  intCtrl: null,  // AdsGram interstitial ad controller

  async init() {
    if (this.provider === 'adsgram') {
      const c = AD_CONFIG.adsgram;
      if (!window.Adsgram) { console.warn('AdsGram SDK not loaded, ads unavailable'); return; }
      if (c.rewardedBlockId) this.rwdCtrl = window.Adsgram.init({ blockId: c.rewardedBlockId, debug: c.debug });
      if (c.interstitialBlockId) this.intCtrl = window.Adsgram.init({ blockId: c.interstitialBlockId, debug: c.debug });
      this.ready = !!(this.rwdCtrl || this.intCtrl);
      return;
    }
    if (this.provider === 'crazygames') {
      if (!window.CrazyGames || !window.CrazyGames.SDK) {
        console.warn('CrazyGames SDK not loaded, ads unavailable');
        return;
      }
      try {
        await window.CrazyGames.SDK.init();
        this.ready = true;
      } catch (e) {
        console.warn('CrazyGames SDK init failed', e);
      }
    }
  },

  // Rewarded ad: reward only after the ad is fully watched; skipped, failed, or no ad = no reward
  rewarded(onReward, onFail) {
    if (this.provider === 'adsgram') {
      if (!this.rwdCtrl) { if (onFail) onFail(); return; }
      this.busy = true;
      this.rwdCtrl.show()
        .then(res => {
          this.busy = false;
          if (res && res.done) { if (onReward) onReward(); }
          else if (onFail) onFail();
        })
        .catch(() => { this.busy = false; if (onFail) onFail(); });
      return;
    }
    if (this.provider === 'crazygames' && this.ready) {
      const sdk = window.CrazyGames.SDK;
      this.busy = true;
      sdk.game.gameplayStop();
      sdk.ad.requestAd('rewarded', {
        adStarted: () => { this.busy = true; },
        adFinished: () => { this.busy = false; sdk.game.gameplayStart(); if (onReward) onReward(); },
        adError: () => { this.busy = false; sdk.game.gameplayStart(); if (onFail) onFail(); }
      });
      return;
    }
    if (this.provider === 'mock') { startMockAd(onReward); return; }
    // anything else (ads not configured): no reward
    if (onFail) onFail();
  },

  // Interstitial: shown between levels; the next level starts after it finishes or is closed. Never used for rewards
  midgame(done) {
    if (this.provider === 'adsgram') {
      if (!this.intCtrl) { done(); return; }
      this.busy = true;
      this.intCtrl.show()
        .then(() => { this.busy = false; done(); })
        .catch(() => { this.busy = false; done(); });
      return;
    }
    if (this.provider === 'crazygames' && this.ready) {
      const sdk = window.CrazyGames.SDK;
      this.busy = true;
      sdk.ad.requestAd('midgame', {
        adStarted: () => { this.busy = true; },
        adFinished: () => { this.busy = false; done(); },
        adError: () => { this.busy = false; done(); }
      });
      return;
    }
    done();
  },

  // Tell the platform: playing / paused (required by CrazyGames)
  gameplay(on) {
    if (this.provider === 'crazygames' && this.ready) {
      const g = window.CrazyGames.SDK.game;
      if (on) g.gameplayStart(); else g.gameplayStop();
    }
  }
};
