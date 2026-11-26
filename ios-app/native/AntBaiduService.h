#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
NS_ASSUME_NONNULL_BEGIN
typedef void (^AntBaiduCompletion)(BOOL earned, BOOL closed, BOOL playbackComplete);
@interface AntBaiduService : NSObject
- (void)showWithAppId:(NSString *)appId placementId:(NSString *)placementId presenter:(UIViewController *)presenter completion:(AntBaiduCompletion)completion NS_SWIFT_NAME(show(appId:placementId:presenter:completion:));
@end
NS_ASSUME_NONNULL_END
