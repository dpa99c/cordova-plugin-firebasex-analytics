# cordova-plugin-firebasex-analytics [![Latest Stable Version](https://img.shields.io/npm/v/cordova-plugin-firebasex-analytics.svg)](https://www.npmjs.com/package/cordova-plugin-firebasex-analytics) [![Total Downloads](https://img.shields.io/npm/dt/cordova-plugin-firebasex-analytics.svg)](https://npm-stat.com/charts.html?package=cordova-plugin-firebasex-analytics)

Firebase Analytics plugin for the modular FirebaseX Cordova plugin suite. Enables you to log events, set user properties, and track app usage and behaviour.

This is part of the [modular FirebaseX Cordova plugin suite](https://github.com/dpa99c/cordova-plugin-firebasex#modular-plugins).
Install only the modules you need for smaller app size and better build performance.

Supported platforms: Android and iOS

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
  - [Plugin variables](#plugin-variables)
- [Disable data collection on startup](#disable-data-collection-on-startup)
- [Google Tag Manager](#google-tag-manager)
  - [Android](#android)
  - [iOS](#ios)
- [API](#api)
  - [setAnalyticsCollectionEnabled](#setanalyticscollectionenabled)
  - [isAnalyticsCollectionEnabled](#isanalyticscollectionenabled)
  - [AnalyticsConsentMode](#analyticsconsentmode)
  - [AnalyticsConsentStatus](#analyticsconsentstatus)
  - [setAnalyticsConsentMode](#setanalyticsconsentmode)
  - [logEvent](#logevent)
  - [setScreenName](#setscreenname)
  - [setUserId](#setuserid)
  - [setUserProperty](#setuserproperty)
  - [initiateOnDeviceConversionMeasurement](#initiateondeviceconversionmeasurement)
- [Reporting issues](#reporting-issues)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation

    cordova plugin add cordova-plugin-firebasex-analytics

**Dependency:** Requires `cordova-plugin-firebasex-core` to be installed.

## Plugin variables

The following plugin variables can be set at installation time using the `--variable` flag:

| Variable | Default | Description |
|---|---|---|
| `FIREBASE_ANALYTICS_COLLECTION_ENABLED` | `true` | Whether to enable analytics data collection on app startup. Set to `false` to disable until user consent is given - see [Disable data collection on startup](#disable-data-collection-on-startup). |
| `FIREBASE_ANALYTICS_WITHOUT_ADS` | `false` | If `true`, removes IDFA/AdID tracking support for a smaller binary. |
| `GOOGLE_ANALYTICS_ADID_COLLECTION_ENABLED` | `true` | Whether to enable collection of the Advertising ID. |
| `GOOGLE_ANALYTICS_DEFAULT_ALLOW_ANALYTICS_STORAGE` | `true` | Default consent for analytics data storage. |
| `GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_STORAGE` | `true` | Default consent for ad-related data storage. |
| `GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_USER_DATA` | `true` | Default consent for ad user data collection. |
| `GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_PERSONALIZATION_SIGNALS` | `true` | Default consent for ad personalization signals. |
| `IOS_ON_DEVICE_CONVERSION_ANALYTICS` | `false` | Whether to enable on-device conversion analytics on iOS. |

For example, to disable analytics collection on startup and remove ad tracking:

    cordova plugin add cordova-plugin-firebasex-analytics --variable FIREBASE_ANALYTICS_COLLECTION_ENABLED=false --variable FIREBASE_ANALYTICS_WITHOUT_ADS=true

# Disable data collection on startup

By default, analytics data will begin being collected as soon as the app starts up.
However, for data protection or privacy reasons, you may wish to disable data collection until such time as the user has granted their permission.

To do this, set the following plugin variables to `false` at plugin install time:

-   `FIREBASE_ANALYTICS_COLLECTION_ENABLED`
-   `GOOGLE_ANALYTICS_ADID_COLLECTION_ENABLED`
-   `GOOGLE_ANALYTICS_DEFAULT_ALLOW_ANALYTICS_STORAGE`
-   `GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_STORAGE`
-   `GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_USER_DATA`
-   `GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_PERSONALIZATION_SIGNALS`

For example:

    cordova plugin add cordova-plugin-firebasex-analytics \
     --variable FIREBASE_ANALYTICS_COLLECTION_ENABLED=false \
     --variable GOOGLE_ANALYTICS_ADID_COLLECTION_ENABLED=false \
     --variable GOOGLE_ANALYTICS_DEFAULT_ALLOW_ANALYTICS_STORAGE=false \
     --variable GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_STORAGE=false \
     --variable GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_USER_DATA=false \
     --variable GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_PERSONALIZATION_SIGNALS=false

This will disable analytics data collection (on both Android & iOS) until you call [setAnalyticsCollectionEnabled](#setanalyticscollectionenabled) and [setAnalyticsConsentMode](#setanalyticsconsentmode):

```javascript
FirebasexAnalytics.setAnalyticsCollectionEnabled(true);
FirebasexAnalytics.setAnalyticsConsentMode({
    [FirebasexAnalytics.AnalyticsConsentMode.ANALYTICS_STORAGE]: FirebasexAnalytics.AnalyticsConsentStatus.GRANTED,
    [FirebasexAnalytics.AnalyticsConsentMode.AD_STORAGE]: FirebasexAnalytics.AnalyticsConsentStatus.GRANTED,
    [FirebasexAnalytics.AnalyticsConsentMode.AD_USER_DATA]: FirebasexAnalytics.AnalyticsConsentStatus.GRANTED,
    [FirebasexAnalytics.AnalyticsConsentMode.AD_PERSONALIZATION]: FirebasexAnalytics.AnalyticsConsentStatus.GRANTED,
});
```

Notes:

-   Calling `setAnalyticsCollectionEnabled()` will have no effect if the `FIREBASE_ANALYTICS_COLLECTION_ENABLED` variable is set to `true`.
-   Calling `setAnalyticsCollectionEnabled(true|false)` will enable/disable data collection during the current app session and across subsequent app sessions until such time as the same method is called again with a different value.

# Google Tag Manager

https://developers.google.com/tag-platform/tag-manager/mobile

## Android

1. Create directory `resources/android/containers`

1. Download your container-config json file from Tag Manager and add a `<resource-file>` node in your `config.xml`.

```xml
<platform name="android">
    <resource-file src="resources/android/containers/GTM-XXXXXXX.json" target="app/src/main/assets/containers/GTM-XXXXXXX.json" />
    ...
```

### Preview mode (optional)
[More info](https://developers.google.com/tag-platform/tag-manager/android/v5#preview_container)

```xml
<platform name="android">
  <config-file parent="/manifest/application" target="AndroidManifest.xml">
    <activity android:exported="true" android:name="com.google.android.gms.tagmanager.TagManagerPreviewActivity" android:noHistory="true" tools:replace="android:noHistory">
      <intent-filter>
        <data android:scheme="tagmanager.c.{{BUNDLE_ID}}" />
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
      </intent-filter>
    </activity>
  </config-file>
    ...
```

## iOS

The application name should not contain spaces

```xml
<name short="Cordova App">CordovaApp</name>
```

1. Create directory `resources/ios/container`

1. Download your container-config json file from Tag Manager and to directory.

### Preview mode (optional)
[More info](https://developers.google.com/tag-platform/tag-manager/ios/v5#preview_container)

1. Add `xmlns:tools="http://schemas.android.com/tools"` to  `<widget>` tag

1. Add to config.xml

```xml
<platform name="ios">
  <edit-config file="*-Info.plist" mode="merge" target="CFBundleURLTypes">
    <array>
      <dict>
        <key>CFBundleURLName</key>
        <string>{{BUNDLE_ID}}</string>
        <key>CFBundleURLSchemes</key>
        <array>
          <string>tagmanager.c.{{BUNDLE_ID}}</string>
        </array>
      </dict>
    </array>
  </edit-config>
    ...
</platform>
```

# API

The list of available methods for this plugin is described below.

Firebase Analytics enables you to log events in order to track use and behaviour of your apps.

By default, Firebase does not store fine-grain analytics data - only a sample is taken and detailed event data is then discarded.
The Firebase Analytics console is designed to give you a coarse overview of analytics data.

If you want to analyse detailed, event-level analytics you should consider [exporting Firebase Analytics data to BigQuery](https://firebase.google.com/docs/projects/bigquery-export).
The easiest way to set this up is by [streaming Firebase Analytics data into BigQuery](https://cloud.google.com/bigquery/streaming-data-into-bigquery).
Note that until you set this up, all fine-grain event-level data is discarded by Firebase.

## setAnalyticsCollectionEnabled

Manually enable/disable analytics data collection, e.g. if [disabled on app startup](#disable-data-collection-on-startup).

**Parameters**:

-   {boolean} setEnabled - whether to enable or disable analytics data collection

```javascript
FirebasexAnalytics.setAnalyticsCollectionEnabled(true); // Enables analytics data collection

FirebasexAnalytics.setAnalyticsCollectionEnabled(false); // Disables analytics data collection
```

## isAnalyticsCollectionEnabled

Indicates whether analytics data collection is enabled.

Notes:

-   This value applies both to the current app session and subsequent app sessions until such time as it is changed.
-   It returns the value set by [setAnalyticsCollectionEnabled()](#setanalyticscollectionenabled).
-   If automatic data collection was not [disabled on app startup](#disable-data-collection-on-startup), this will always return `true`.

**Parameters**:

-   {function} success - callback function which will be invoked on success.
    Will be passed a {boolean} indicating if the setting is enabled.
-   {function} error - (optional) callback function which will be passed a {string} error message as an argument

```javascript
FirebasexAnalytics.isAnalyticsCollectionEnabled(
    function (enabled) {
        console.log(
            "Analytics data collection is " + (enabled ? "enabled" : "disabled")
        );
    },
    function (error) {
        console.error(
            "Error getting Analytics data collection setting: " + error
        );
    }
);
```

## AnalyticsConsentMode

Constants defining the mode of consent to set:
- {string} `AnalyticsConsentMode.ANALYTICS_STORAGE` - consent for analytics data storage
- {string} `AnalyticsConsentMode.AD_STORAGE` - consent for ad storage
- {string} `AnalyticsConsentMode.AD_USER_DATA` - consent for ad user data
- {string} `AnalyticsConsentMode.AD_PERSONALIZATION` - consent for ad personalization

## AnalyticsConsentStatus

Constants defining the status of consent to set:
- {string} `AnalyticsConsentStatus.GRANTED` - consent granted
- {string} `AnalyticsConsentStatus.DENIED` - consent denied

## setAnalyticsConsentMode

Sets the user's consent mode status for various types of data collection in the application. This includes consent for analytics data storage, ad storage, ad personalization, and ad user data. The consent status can be set to 'GRANTED' or 'DENIED'.
[Read more here](https://developers.google.com/tag-platform/security/guides/app-consent?consentmode=advanced&platform=android)

**Parameters**:

-   {object} consent - map of the consent modes as `AnalyticsConsentMode` and their status as `AnalyticsConsentStatus`

```javascript
var consents = {};
consents[FirebasexAnalytics.AnalyticsConsentMode.ANALYTICS_STORAGE] = FirebasexAnalytics.AnalyticsConsentStatus.GRANTED;
consents[FirebasexAnalytics.AnalyticsConsentMode.AD_STORAGE] = FirebasexAnalytics.AnalyticsConsentStatus.GRANTED;
consents[FirebasexAnalytics.AnalyticsConsentMode.AD_USER_DATA] = FirebasexAnalytics.AnalyticsConsentStatus.GRANTED;
consents[FirebasexAnalytics.AnalyticsConsentMode.AD_PERSONALIZATION] = FirebasexAnalytics.AnalyticsConsentStatus.DENIED;

FirebasexAnalytics.setAnalyticsConsentMode(consents, function() {
    console.log("Consent mode set");
}, function(error) {
    console.error("Error setting consent mode: " + error);
});
```

## logEvent

Log an event using Analytics:

**Parameters**:

-   {string} eventName - name of event to log to Firebase Analytics
    -   [Limit](https://support.google.com/firebase/answer/9237506?hl=en) of 40 characters.
    -   Dots are not allowed in eventName.
-   {object} eventProperties - key/value object of custom event properties.
    -   This must be a flat (non-nested) object.
    -   The value must be a primitive type such as string/number/etc. (not a complex object such as array or nested object).
    -   [Limit](https://support.google.com/firebase/answer/9237506?hl=en) of 40 characters for parameter name and 100 characters for parameter value.

```javascript
FirebasexAnalytics.logEvent("select_content", {
    content_type: "page_view",
    item_id: "home",
});
```

## setScreenName

Set the name of the current screen in Analytics:

**Parameters**:

-   {string} screenName - name of screen to log to Firebase Analytics

```javascript
FirebasexAnalytics.setScreenName("Home");
```

## setUserId

Set a user id for use in Analytics:

**Parameters**:

-   {string} userName - name of user to set in Firebase Analytics

```javascript
FirebasexAnalytics.setUserId("user_id");
```

## setUserProperty

Set a user property for use in Analytics:

**Parameters**:

-   {string} name - name of user property to set in Firebase Analytics
-   {string} value - value of user property to set in Firebase Analytics

```javascript
FirebasexAnalytics.setUserProperty("name", "value");
```

## initiateOnDeviceConversionMeasurement

Initiates [on-device conversion measurement](https://firebase.google.com/docs/tutorials/ads-ios-on-device-measurement) using either user's email address or phone number.
iOS only.

**Parameters**:

-   {object} userIdentifier - user identifier as either `emailAddress` or `phoneNumber` key
-   {function} success - callback function which will be invoked on success.
-   {function} error - (optional) callback function which will be passed a {string} error message as an argument

```javascript
FirebasexAnalytics.initiateOnDeviceConversionMeasurement(
    { emailAddress: "me@here.com" },
    function () {
        console.log("On device conversion measurement initiated");
    },
    function (error) {
        console.error(
            "Error initiating on device conversion measurement: " + error
        );
    }
);
```

# Reporting issues

Before reporting an issue with this plugin, please do the following:
- Check the existing [issues](https://github.com/dpa99c/cordova-plugin-firebasex-analytics/issues) and [pull requests](https://github.com/dpa99c/cordova-plugin-firebasex-analytics/pulls) for duplicates
- Ensure you are using the latest version of the plugin and its dependencies
- Include full details of the error including relevant logs and device/platform information
