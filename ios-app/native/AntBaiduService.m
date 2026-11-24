#import "AntBaiduService.h"
#import <BaiduMobAdSDK/BaiduMobAdRewardVideo.h>
#import <BaiduMobAdSDK/BaiduMobAdManager.h>
#import <BaiduMobAdSDK/BaiduMobAdSetting.h>

@interface AntBaiduService () <BaiduMobAdRewardVideoDelegate>
@property(nonatomic,strong) BaiduMobAdRewardVideo *ad;
@property(nonatomic,weak) UIViewController *presenter;
@property(nonatomic,copy) AntBaiduCompletion completion;
@property(nonatomic,copy) NSString *initializedApp;
@property(nonatomic,assign) BOOL played, verified, showing, blocked;
@property(nonatomic,assign) NSUInteger generation;
@end
@implementation AntBaiduService
- (void)finishClosed:(BOOL)closed {
    if (!self.completion) return;
    AntBaiduCompletion completion=self.completion;
    BOOL earned=closed && self.played && self.verified;
    BOOL played=self.played;
    self.completion=nil;
    self.generation++;
    self.ad.delegate=nil;
    self.ad=nil;
    self.presenter=nil;
    self.showing=NO;
    completion(earned,closed,played);
}
- (void)showWithAppId:(NSString *)appId placementId:(NSString *)placementId presenter:(UIViewController *)presenter completion:(AntBaiduCompletion)completion {
    NSAssert(NSThread.isMainThread, @"Ad must run on main thread");
    if (self.blocked || self.completion || !appId.length || !placementId.length || !presenter.viewIfLoaded.window || presenter.presentedViewController) { completion(NO,NO,NO); return; }
    self.completion=completion; self.presenter=presenter; self.played=NO; self.verified=NO; self.showing=NO;
    NSUInteger token=++self.generation;
    __weak typeof(self) weakSelf=self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 15*NSEC_PER_SEC),dispatch_get_main_queue(),^{
        typeof(self) s=weakSelf;
        if(s && s.generation==token && s.completion && !s.showing){ s.blocked=YES; [s finishClosed:NO]; }
    });
    void (^load)(void)=^{
        typeof(self) s=weakSelf;
        if(!s || s.generation!=token || !s.completion)return;
        s.ad=[[BaiduMobAdRewardVideo alloc] init];
        s.ad.delegate=s;
        s.ad.publisherId=appId;
        s.ad.adUnitTag=placementId;
        s.ad.enableLocation=NO;
        [s.ad load];
    };
    if([self.initializedApp isEqualToString:appId]) { load(); return; }
    if(self.initializedApp){[self finishClosed:NO];return;}
    [[BaiduMobAdSetting sharedInstance] setLimitBaiduPersonalAds:YES];
    [BaiduMobAdManager setAppsid:appId];
    [BaiduMobAdManager startWithCompletionHandler:^(BOOL success,NSError *error){
        dispatch_async(dispatch_get_main_queue(),^{
            typeof(self) s=weakSelf;if(!s || s.generation!=token || !s.completion)return;
            if(!success){[s finishClosed:NO];return;}s.initializedApp=appId;load();
        });
    }];
}
- (void)rewardedVideoAdLoaded:(BaiduMobAdRewardVideo *)video {
    dispatch_async(dispatch_get_main_queue(),^{
        if(video!=self.ad || !self.completion || self.showing)return;
        UIViewController *p=self.presenter;
        if(![video isReady] || !p.viewIfLoaded.window || p.presentedViewController){[self finishClosed:NO];return;}
        self.showing=YES;
        [video showFromViewController:p];
        NSUInteger token=self.generation;
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 275*NSEC_PER_SEC),dispatch_get_main_queue(),^{
            if(self.generation==token && self.completion){self.blocked=YES;[self finishClosed:NO];}
        });
    });
}
- (void)rewardedAdLoadFail:(BaiduMobAdRewardVideo *)video {dispatch_async(dispatch_get_main_queue(),^{if(video==self.ad)[self finishClosed:NO];});}
- (void)rewardedVideoAdLoadFailed:(BaiduMobAdRewardVideo *)video withError:(BaiduMobFailReason)reason {[self rewardedAdLoadFail:video];}
- (void)rewardedVideoAdShowFailed:(BaiduMobAdRewardVideo *)video withError:(BaiduMobFailReason)reason {[self rewardedAdLoadFail:video];}
- (void)rewardedVideoAdDidPlayFinish:(BaiduMobAdRewardVideo *)video {dispatch_async(dispatch_get_main_queue(),^{if(video==self.ad && self.showing)self.played=YES;});}
- (void)rewardedVideoAdRewardDidSuccess:(BaiduMobAdRewardVideo *)video verify:(BOOL)verify rewardInfo:(NSDictionary *)info {dispatch_async(dispatch_get_main_queue(),^{if(video==self.ad && self.showing && verify)self.verified=YES;});}
- (void)rewardedVideoAdDidClose:(BaiduMobAdRewardVideo *)video withPlayingProgress:(CGFloat)progress {dispatch_async(dispatch_get_main_queue(),^{if(video==self.ad)[self finishClosed:YES];});}
@end
