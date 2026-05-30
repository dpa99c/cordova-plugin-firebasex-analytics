// swift-tools-version:5.9
import PackageDescription

let firebaseSDKVersion: Version = "12.9.0"
let googleTagManagerVersion: Version = "9.0.0"
let googleAdsOnDeviceConversionVersion: Version = "3.6.0"
let analyticsSPMVariant = "full"

let package = Package(
    name: "cordova-plugin-firebasex-analytics",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "cordova-plugin-firebasex-analytics",
            targets: ["FirebasexAnalyticsPlugin"]
        )
    ],
    dependencies: packageDependencies(),
    targets: [
        .target(
            name: "FirebasexAnalyticsPlugin",
            dependencies: analyticsTargetDependencies(),
            path: "src/ios",
            publicHeadersPath: "."
        )
    ]
)

func packageDependencies() -> [Package.Dependency] {
    var dependencies: [Package.Dependency] = [
        .package(path: "../cordova-plugin-firebasex-core"),
        .package(url: "https://github.com/apache/cordova-ios.git", branch: "master"),
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", exact: firebaseSDKVersion),
        .package(url: "https://github.com/googleanalytics/google-tag-manager-ios-sdk.git", exact: googleTagManagerVersion),
    ]

    if analyticsSPMVariant == "core-with-on-device-conversion" {
        dependencies.append(
            .package(
                url: "https://github.com/googleads/google-ads-on-device-conversion-ios-sdk.git",
                exact: googleAdsOnDeviceConversionVersion
            )
        )
    }

    return dependencies
}

func analyticsTargetDependencies() -> [Target.Dependency] {
    var dependencies: [Target.Dependency] = [
        .product(name: "cordova-plugin-firebasex-core", package: "cordova-plugin-firebasex-core"),
        .product(name: "Cordova", package: "cordova-ios"),
        .product(name: "GoogleTagManager", package: "google-tag-manager-ios-sdk"),
    ]

    switch analyticsSPMVariant {
    case "full":
        dependencies.append(.product(name: "FirebaseAnalytics", package: "firebase-ios-sdk"))
    case "core":
        dependencies.append(.product(name: "FirebaseAnalyticsCore", package: "firebase-ios-sdk"))
    case "core-with-on-device-conversion":
        dependencies.append(.product(name: "FirebaseAnalyticsCore", package: "firebase-ios-sdk"))
        dependencies.append(
            .product(
                name: "GoogleAdsOnDeviceConversion",
                package: "google-ads-on-device-conversion-ios-sdk"
            )
        )
    default:
        dependencies.append(.product(name: "FirebaseAnalyticsIdentitySupport", package: "firebase-ios-sdk"))
    }

    return dependencies
}