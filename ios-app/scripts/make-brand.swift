import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Original vector candidate artwork; opaque 1024px iOS icon. Generated on the Mac build runner.
let s = 1024
guard let ctx = CGContext(data: nil, width: s, height: s, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { fatalError("Unable to create icon context") }
func color(_ hex: UInt32) -> CGColor {
    CGColor(red: CGFloat((hex >> 16) & 255)/255, green: CGFloat((hex >> 8) & 255)/255, blue: CGFloat(hex & 255)/255, alpha: 1)
}
func roundRect(_ x: CGFloat,_ y: CGFloat,_ w: CGFloat,_ h: CGFloat,_ radius: CGFloat,_ hex: UInt32) {
    ctx.setFillColor(color(hex)); ctx.addPath(CGPath(roundedRect:CGRect(x:x,y:y,width:w,height:h),cornerWidth:radius,cornerHeight:radius,transform:nil));ctx.fillPath()
}
func ellipse(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat,_ hex:UInt32) {
    ctx.setFillColor(color(hex));ctx.fillEllipse(in:CGRect(x:x,y:y,width:w,height:h))
}
func line(_ points:[CGPoint],_ width:CGFloat,_ hex:UInt32) {
    guard let first = points.first else { return }
    ctx.setStrokeColor(color(hex));ctx.setLineWidth(width);ctx.setLineCap(.round);ctx.setLineJoin(.round);ctx.beginPath();ctx.move(to:first);for p in points.dropFirst(){ctx.addLine(to:p)};ctx.strokePath()
}
func pt(_ x:CGFloat,_ y:CGFloat)->CGPoint{CGPoint(x:x,y:y)}
let cs=CGColorSpaceCreateDeviceRGB()
let gradient=CGGradient(colorsSpace:cs,colors:[color(0xeaf5d8),color(0x86bc8f)] as CFArray,locations:[0,1])!
ctx.drawLinearGradient(gradient,start:pt(100,950),end:pt(900,0),options:[.drawsBeforeStartLocation,.drawsAfterEndLocation])
// Soft decorative tile mosaic, with safe margins for Apple's rounded mask.
let tileColors:[UInt32]=[0xf0ab8e,0xf6cf75,0x98c8d9,0xb6a4db,0x9cd1aa]
for row in 0..<3 { for col in 0..<5 {
    let x=CGFloat(166+col*142),y=CGFloat(610+row*100)
    roundRect(x,y,118,78,20,0x527c64);roundRect(x,y+8,118,78,20,tileColors[(col+row*2)%tileColors.count])
    roundRect(x+10,y+70,98,6,3,0xfff0d5)
}}
// Friendly ant, original geometric character, carrying one coral tile.
ctx.saveGState();ctx.translateBy(x:510,y:385);ctx.rotate(by:0.18)
ellipse(-306,-181,612,96,0x699572)
let ink:UInt32=0x473a36
for (x,y) in [(-145.0,-25.0),(-15.0,-22.0),(105.0,-5.0)] {
    let a=CGFloat(x),b=CGFloat(y)
    line([pt(a,b),pt(a-42,b-66),pt(a-95,b-103)],23,ink)
    line([pt(a,b+22),pt(a-34,b+72),pt(a-78,b+112)],19,ink)
}
ellipse(-267,-83,239,183,ink);ellipse(-250,-64,204,145,0x98664b)
ellipse(-76,-48,139,121,ink);ellipse(-61,-33,109,91,0xb77e51)
ellipse(30,-72,220,192,ink);ellipse(47,-53,188,156,0xcf955d)
ellipse(151,24,44,50,0xfff8dc);ellipse(170,27,20,27,ink);ellipse(175,44,7,8,0xffffff)
line([pt(100,98),pt(78,153),pt(43,170)],17,ink)
line([pt(164,107),pt(202,160),pt(245,170)],17,ink)
ellipse(31,158,25,25,ink);ellipse(232,158,25,25,ink)
line([pt(183,-13),pt(198,-17),pt(211,-8)],8,ink)
roundRect(-126,109,152,122,27,0x86555b);roundRect(-126,119,152,122,27,0xf5a3b3);roundRect(-112,218,124,9,4,0xffe5d2)
ctx.restoreGState()
guard let image=ctx.makeImage() else {fatalError("No generated icon")}
let fm=FileManager.default
let base=URL(fileURLWithPath:"ios/App/App/Assets.xcassets",isDirectory:true)
guard fm.fileExists(atPath:base.path) else {fatalError("Missing generated asset catalog")}
func writePNG(_ url:URL) {
    guard let dest=CGImageDestinationCreateWithURL(url as CFURL,UTType.png.identifier as CFString,1,nil) else {fatalError("PNG destination failed")}
    CGImageDestinationAddImage(dest,image,nil);guard CGImageDestinationFinalize(dest) else {fatalError("PNG write failed")}
}
let icon=base.appendingPathComponent("AppIcon.appiconset",isDirectory:true)
try fm.createDirectory(at:icon,withIntermediateDirectories:true)
writePNG(icon.appendingPathComponent("AntCanvas.png"))
try Data(#"{"images":[{"filename":"AntCanvas.png","idiom":"universal","platform":"ios","size":"1024x1024"}],"info":{"author":"xcode","version":1}}"#.utf8).write(to:icon.appendingPathComponent("Contents.json"))
let mark=base.appendingPathComponent("AntLaunchMark.imageset",isDirectory:true)
try fm.createDirectory(at:mark,withIntermediateDirectories:true)
writePNG(mark.appendingPathComponent("AntLaunchMark.png"))
try Data(#"{"images":[{"filename":"AntLaunchMark.png","idiom":"universal"}],"info":{"author":"xcode","version":1}}"#.utf8).write(to:mark.appendingPathComponent("Contents.json"))
let launch=URL(fileURLWithPath:"ios/App/App/Base.lproj/LaunchScreen.storyboard")
let storyboard = """
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" targetRuntime="iOS.CocoaTouch" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" initialViewController="ant-vc">
 <device id="retina6_12" orientation="portrait" appearance="light"/>
 <dependencies><deployment identifier="iOS"/><plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="23000"/><capability name="Safe area layout guides" minToolsVersion="9.0"/></dependencies>
 <scenes><scene sceneID="ant-scene"><objects><viewController id="ant-vc" sceneMemberID="viewController"><view key="view" contentMode="scaleToFill" id="ant-root"><rect key="frame" x="0.0" y="0.0" width="393" height="852"/><autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/><subviews><imageView userInteractionEnabled="NO" contentMode="scaleAspectFit" image="AntLaunchMark" translatesAutoresizingMaskIntoConstraints="NO" id="ant-mark"><rect key="frame" x="80" y="310" width="233" height="233"/></imageView></subviews><viewLayoutGuide key="safeArea" id="ant-safe"/><color key="backgroundColor" red="0.918" green="0.961" blue="0.847" alpha="1" colorSpace="custom" customColorSpace="sRGB"/><constraints><constraint firstItem="ant-mark" firstAttribute="centerX" secondItem="ant-root" secondAttribute="centerX" id="ant-cx"/><constraint firstItem="ant-mark" firstAttribute="centerY" secondItem="ant-root" secondAttribute="centerY" id="ant-cy"/><constraint firstItem="ant-mark" firstAttribute="width" constant="230" id="ant-w"/><constraint firstItem="ant-mark" firstAttribute="height" constant="230" id="ant-h"/></constraints></view></viewController><placeholder placeholderIdentifier="IBFirstResponder" id="ant-first" sceneMemberID="firstResponder"/></objects></scene></scenes>
 <resources><image name="AntLaunchMark" width="1024" height="1024"/></resources>
</document>
"""
try Data(storyboard.utf8).write(to:launch)
print("Generated opaque ANT CANVAS icon and static launch artwork.")
