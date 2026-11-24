import Capacitor
import StoreKit
@objc(AntRegionPlugin)
public class AntRegionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AntRegionPlugin"
    public let jsName = "AntRegion"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "getRegion", returnType: CAPPluginReturnPromise)]
    @objc func getRegion(_ call: CAPPluginCall) {
        Task { @MainActor in
            let storefront = await Storefront.current
            call.resolve(["storefront": storefront?.countryCode ?? ""])
        }
    }
}
@objc(AntViewController)
class AntViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AntRegionPlugin())
    }
}
