/**
 * @file FirebasexAnalyticsPlugin.h
 * @brief Cordova plugin for Firebase Analytics on iOS.
 *
 * Provides event logging, user properties, screen tracking, consent mode,
 * analytics collection control, and on-device conversion measurement.
 */

#import <Cordova/CDV.h>

/**
 * Cordova plugin class for Firebase Analytics on iOS.
 */
@interface FirebasexAnalyticsPlugin : CDVPlugin

/** Logs a custom analytics event. args[0] = name, args[1] = parameters dict. */
- (void)logEvent:(CDVInvokedUrlCommand*)command;
/** Sets the current screen name. args[0] = screen name. */
- (void)setScreenName:(CDVInvokedUrlCommand*)command;
/** Sets the analytics user ID. args[0] = user ID string. */
- (void)setUserId:(CDVInvokedUrlCommand*)command;
/** Sets a custom user property. args[0] = property name, args[1] = value. */
- (void)setUserProperty:(CDVInvokedUrlCommand*)command;
/** Enables or disables analytics data collection. args[0] = boolean. */
- (void)setAnalyticsCollectionEnabled:(CDVInvokedUrlCommand*)command;
/** Returns the analytics collection enabled state as a boolean. */
- (void)isAnalyticsCollectionEnabled:(CDVInvokedUrlCommand*)command;
/** Updates consent mode settings. args[0] = consent settings dict. */
- (void)setAnalyticsConsentMode:(CDVInvokedUrlCommand*)command;
/** Initiates on-device conversion measurement. args[0] = {emailAddress|phoneNumber}. */
- (void)initiateOnDeviceConversionMeasurement:(CDVInvokedUrlCommand*)command;

@end
