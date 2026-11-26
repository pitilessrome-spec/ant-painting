import Capacitor
import UIKit
@objc(AntBaiduAdsPlugin)
public class AntBaiduAdsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AntBaiduAdsPlugin"
    public let jsName = "AntBaiduAds"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "showReward", returnType: CAPPluginReturnPromise)]
    private let service = AntBaiduService()
    @objc func showReward(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let appId=call.getString("appId"), let placementId=call.getString("placementId"),
                  let config=Bundle.main.object(forInfoDictionaryKey:"AntBaiduConfig") as? [String:Any],
                  config["appId"] as? String == appId, config["placementId"] as? String == placementId,
                  let test=call.getBool("test"), config["test"] as? Bool == test,
                  let presenter=self.bridge?.viewController else {
                call.resolve(["earned":false,"closed":false,"playbackComplete":false]); return
            }
            self.service.show(appId:appId,placementId:placementId,presenter:presenter){ earned,closed,played in
                call.resolve(["earned":earned,"closed":closed,"playbackComplete":played])
            }
        }
    }
}
