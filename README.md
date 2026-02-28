# cordova-plugin-firebasex-analytics

Firebase Analytics module for the modular FirebaseX Cordova plugin suite.

## Dependencies

- `cordova-plugin-firebasex-core` (automatically installed)

## Installation

```bash
cordova plugin add cordova-plugin-firebasex-analytics
```

### Plugin Variables

| Variable | Default | Description |
|---|---|---|
| `FIREBASE_ANALYTICS_COLLECTION_ENABLED` | `true` | Enable/disable analytics collection |
| `FIREBASE_ANALYTICS_WITHOUT_ADS` | `false` | Remove IDFA/AdID tracking support |
| `GOOGLE_ANALYTICS_ADID_COLLECTION_ENABLED` | `true` | Enable/disable AdID collection |
| `GOOGLE_ANALYTICS_DEFAULT_ALLOW_ANALYTICS_STORAGE` | `true` | Default analytics storage consent |
| `GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_STORAGE` | `true` | Default ad storage consent |
| `GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_USER_DATA` | `true` | Default ad user data consent |
| `GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_PERSONALIZATION_SIGNALS` | `true` | Default ad personalization consent |
| `IOS_ON_DEVICE_CONVERSION_ANALYTICS` | `false` | Enable on-device conversion analytics (iOS) |

## API

Access via `FirebasexAnalytics` global or `require('cordova-plugin-firebasex-analytics.FirebasexAnalytics')`.

- `logEvent(name, params, success, error)` - Log an analytics event
- `setScreenName(name, success, error)` - Set the current screen name
- `setUserId(id, success, error)` - Set the user ID
- `setUserProperty(name, value, success, error)` - Set a user property
- `setAnalyticsCollectionEnabled(enabled, success, error)` - Enable/disable analytics collection
- `isAnalyticsCollectionEnabled(success, error)` - Check if analytics collection is enabled
- `setAnalyticsConsentMode(consent, success, error)` - Set analytics consent mode
- `initiateOnDeviceConversionMeasurement(userIdentifier, success, error)` - Initiate on-device conversion measurement (iOS only)

### Consent Mode

```javascript
FirebasexAnalytics.setAnalyticsConsentMode({
    [FirebasexAnalytics.AnalyticsConsentMode.ANALYTICS_STORAGE]: FirebasexAnalytics.AnalyticsConsentStatus.GRANTED,
    [FirebasexAnalytics.AnalyticsConsentMode.AD_STORAGE]: FirebasexAnalytics.AnalyticsConsentStatus.DENIED
});
```
