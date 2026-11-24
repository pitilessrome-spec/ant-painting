# ANT CANVAS 微信小游戏 V0.1 候选
独立原生 Canvas 适配，不是网页 WebView。共享 js/art.js + js/game.js，生成 core.js 后用微信开发者工具导入本目录（游戏项目），touristappid 仅用于本地体验，正式 AppID 必须替换。
- 在仓库根运行 node wechat-game/build.mjs，随后导入 wechat-game。
- 已移植主线消除、技能砖块与实际搬回到账、七技能、护盾 BOSS、预演、本地最高关卡、失败重试。2D 界面是移植初版，不是 Telegram 3D 美术完整复刻。领地、云端、排行榜、每日挑战、八种广告场景的其余六种尚待移植。
- config.js 的 rewardedAdUnitId 默认空，未配置就禁用广告；开通流量主后填真实 adunit-...。仅 isEnded===true 的关闭回调发奖励，跳过/失败/超时不发。没有伪造测试广告。
- 官方平台 https://mp.weixin.qq.com/ ，按游戏类目、主体、IAA 广告变现要求完成备案和资质审核，再开通流量主。AppSecret 不进入客户端代码。
- 真机画面、帧率、SDK 广告回调和平台审核未验收。正式后端需大陆可访问 HTTPS 域名、微信登录服务端校验、合规隐私和数据存储。
