/**
 * @file FirebasexAnalyticsPlugin.m
 * @brief iOS implementation of the Firebase Analytics Cordova plugin.
 */

#import "FirebasexAnalyticsPlugin.h"
#import "FirebasexCorePlugin.h"

@import FirebaseAnalytics;

/** Preference key for the analytics collection enabled state. */
static NSString* const FIREBASE_ANALYTICS_COLLECTION_ENABLED = @"FIREBASE_ANALYTICS_COLLECTION_ENABLED";

@implementation FirebasexAnalyticsPlugin

/**
 * Logs a custom analytics event.
 *
 * @param command args[0] = event name, args[1] = parameters dictionary.
 */
- (void)logEvent:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString* name = [command.arguments objectAtIndex:0];
            NSDictionary* parameters = [command argumentAtIndex:1];
            [FIRAnalytics logEventWithName:name parameters:parameters];
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [self handleException:exception command:command];
        }
    }];
}

/**
 * Sets the current screen name by logging a @c screen_view event.
 *
 * @param command args[0] = screen name.
 */
- (void)setScreenName:(CDVInvokedUrlCommand*)command {
    @try {
        NSString* name = [command.arguments objectAtIndex:0];
        [FIRAnalytics logEventWithName:kFIREventScreenView
                            parameters:@{kFIRParameterScreenName: name}];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } @catch (NSException *exception) {
        [self handleException:exception command:command];
    }
}

/**
 * Sets the analytics user ID.
 *
 * @param command args[0] = user ID string.
 */
- (void)setUserId:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString* uid = [command.arguments objectAtIndex:0];
            [FIRAnalytics setUserID:uid];
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [self handleException:exception command:command];
        }
    }];
}

/**
 * Sets a custom user property for analytics.
 *
 * @param command args[0] = property name, args[1] = value.
 */
- (void)setUserProperty:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString* name = [command.arguments objectAtIndex:0];
            NSString* value = [command.arguments objectAtIndex:1];
            [FIRAnalytics setUserPropertyString:value forName:name];
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [self handleException:exception command:command];
        }
    }];
}

/**
 * Enables or disables analytics data collection.
 *
 * Persists the setting via the core plugin's preference flags.
 *
 * @param command args[0] = boolean.
 */
- (void)setAnalyticsCollectionEnabled:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        @try {
            BOOL enabled = [[command argumentAtIndex:0] boolValue];
            [FIRAnalytics setAnalyticsCollectionEnabled:enabled];
            [[FirebasexCorePlugin sharedInstance] setPreferenceFlag:FIREBASE_ANALYTICS_COLLECTION_ENABLED flag:enabled];
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [self handleException:exception command:command];
        }
    }];
}

/**
 * Returns the analytics collection enabled state as a boolean to the JS callback.
 */
- (void)isAnalyticsCollectionEnabled:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        @try {
            BOOL enabled = [[FirebasexCorePlugin sharedInstance] getPreferenceFlag:FIREBASE_ANALYTICS_COLLECTION_ENABLED];
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:enabled];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [self handleException:exception command:command];
        }
    }];
}

/**
 * Updates the analytics consent mode settings.
 *
 * Parses the consent dictionary, mapping string keys to @c FIRConsentType
 * and string values to @c FIRConsentStatus, then calls @c [FIRAnalytics setConsent:].
 *
 * @param command args[0] = consent settings dictionary.
 */
- (void)setAnalyticsConsentMode:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSDictionary* consentObject = [command.arguments objectAtIndex:0];
            NSMutableDictionary* consentSettings = [[NSMutableDictionary alloc] init];
            NSEnumerator* enumerator = [consentObject keyEnumerator];
            id key;
            while ((key = [enumerator nextObject])) {
                NSString* consentType = [self consentTypeFromString:key];
                NSString* consentStatus = [self consentStatusFromString:[consentObject objectForKey:key]];
                if (consentType && consentStatus) {
                    [consentSettings setObject:consentStatus forKey:consentType];
                }
            }
            [FIRAnalytics setConsent:consentSettings];
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [self handleException:exception command:command];
        }
    }];
}

/**
 * Initiates on-device conversion measurement using an email or phone number.
 *
 * @param command args[0] = dictionary containing either @c emailAddress or @c phoneNumber.
 */
- (void)initiateOnDeviceConversionMeasurement:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSDictionary* userIdentifier = [command.arguments objectAtIndex:0];
            if ([userIdentifier objectForKey:@"emailAddress"] != nil) {
                [FIRAnalytics initiateOnDeviceConversionMeasurementWithEmailAddress:[userIdentifier objectForKey:@"emailAddress"]];
            } else if ([userIdentifier objectForKey:@"phoneNumber"] != nil) {
                [FIRAnalytics initiateOnDeviceConversionMeasurementWithPhoneNumber:[userIdentifier objectForKey:@"phoneNumber"]];
            }
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [self handleException:exception command:command];
        }
    }];
}

#pragma mark - Consent Helpers

/**
 * Maps a consent type string to its @c FIRConsentType constant.
 *
 * @param consentTypeString One of: ANALYTICS_STORAGE, AD_STORAGE, AD_PERSONALIZATION, AD_USER_DATA.
 * @return The corresponding @c FIRConsentType, or @c nil if unrecognised.
 */
- (NSString*)consentTypeFromString:(NSString*)consentTypeString {
    if ([consentTypeString isEqualToString:@"ANALYTICS_STORAGE"]) return FIRConsentTypeAnalyticsStorage;
    else if ([consentTypeString isEqualToString:@"AD_STORAGE"]) return FIRConsentTypeAdStorage;
    else if ([consentTypeString isEqualToString:@"AD_PERSONALIZATION"]) return FIRConsentTypeAdPersonalization;
    else if ([consentTypeString isEqualToString:@"AD_USER_DATA"]) return FIRConsentTypeAdUserData;
    else return nil;
}

/**
 * Maps a consent status string to its @c FIRConsentStatus constant.
 *
 * @param consentStatusString One of: GRANTED, DENIED.
 * @return The corresponding @c FIRConsentStatus, or @c nil if unrecognised.
 */
- (NSString*)consentStatusFromString:(NSString*)consentStatusString {
    if ([consentStatusString isEqualToString:@"GRANTED"]) return FIRConsentStatusGranted;
    else if ([consentStatusString isEqualToString:@"DENIED"]) return FIRConsentStatusDenied;
    else return nil;
}

#pragma mark - Utility

/**
 * Handles an exception by logging it and sending an error result to the JS callback.
 *
 * @param exception The caught NSException.
 * @param command   The originating Cordova command.
 */
- (void)handleException:(NSException*)exception command:(CDVInvokedUrlCommand*)command {
    NSLog(@"[FirebasexAnalytics] Exception: %@", exception);
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:exception.reason];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end
