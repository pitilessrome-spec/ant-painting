/* ANT CANVAS · 广告接入层
 *
 * 在 AD_CONFIG 里选平台，游戏里只调用 Ads.rewarded / Ads.midgame / Ads.gameplay，
 * 界面和游戏逻辑不用改。
 *
 *   'mock'        占位（本地测试用，模拟 1.5 秒看完广告）
 *   'adsgram'     Telegram 小程序 + AdsGram（个人开发者可以用）
 *   'crazygames'  CrazyGames 网页游戏平台（SDK v3）
 */
const AD_CONFIG = {
  provider: 'mock',
  adsgram: {
    // 在 https://partner.adsgram.ai 添加小程序后获取
    rewardedBlockId: '',      // 激励广告，纯数字，例如 "12345"
    interstitialBlockId: '',  // 插页广告，格式 "int-12345"
    debug: true               // 测试时为 true（显示测试广告）；正式上线前改成 false
  }
};

const Ads = {
  provider: AD_CONFIG.provider,
  ready: false,   // 广告 SDK 已经准备好
  busy: false,    // 广告正在播放：游戏暂停
  rwdCtrl: null,  // AdsGram 激励广告控制器
  intCtrl: null,  // AdsGram 插页广告控制器

  async init() {
    if (this.provider === 'adsgram') {
      const c = AD_CONFIG.adsgram;
      if (!window.Adsgram) { console.warn('AdsGram SDK 没有加载，广告不可用'); return; }
      if (c.rewardedBlockId) this.rwdCtrl = window.Adsgram.init({ blockId: c.rewardedBlockId, debug: c.debug });
      if (c.interstitialBlockId) this.intCtrl = window.Adsgram.init({ blockId: c.interstitialBlockId, debug: c.debug });
      this.ready = !!(this.rwdCtrl || this.intCtrl);
      return;
    }
    if (this.provider === 'crazygames') {
      if (!window.CrazyGames || !window.CrazyGames.SDK) {
        console.warn('CrazyGames SDK 没有加载，广告不可用');
        return;
      }
      try {
        await window.CrazyGames.SDK.init();
        this.ready = true;
      } catch (e) {
        console.warn('CrazyGames SDK 初始化失败', e);
      }
    }
  },

  // 激励广告：只有看完才给奖励；跳过、出错、没有广告，都不给奖励
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
    // 其他情况（广告没有配置好）：不给奖励
    if (onFail) onFail();
  },

  // 插页广告：放在关卡之间，播完（或关掉）才进入下一关。不用来发奖励
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

  // 告诉平台：正在玩 / 暂停（CrazyGames 要求）
  gameplay(on) {
    if (this.provider === 'crazygames' && this.ready) {
      const g = window.CrazyGames.SDK.game;
      if (on) g.gameplayStart(); else g.gameplayStop();
    }
  }
};
