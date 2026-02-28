#import "FirebasexAnalyticsPlugin.h"
#import "FirebasexCorePlugin.h"

@import FirebaseAnalytics;

static NSString* const FIREBASE_ANALYTICS_COLLECTION_ENABLED = @"FIREBASE_ANALYTICS_COLLECTION_ENABLED";

@implementation FirebasexAnalyticsPlugin

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

- (NSString*)consentTypeFromString:(NSString*)consentTypeString {
    if ([consentTypeString isEqualToString:@"ANALYTICS_STORAGE"]) return FIRConsentTypeAnalyticsStorage;
    else if ([consentTypeString isEqualToString:@"AD_STORAGE"]) return FIRConsentTypeAdStorage;
    else if ([consentTypeString isEqualToString:@"AD_PERSONALIZATION"]) return FIRConsentTypeAdPersonalization;
    else if ([consentTypeString isEqualToString:@"AD_USER_DATA"]) return FIRConsentTypeAdUserData;
    else return nil;
}

- (NSString*)consentStatusFromString:(NSString*)consentStatusString {
    if ([consentStatusString isEqualToString:@"GRANTED"]) return FIRConsentStatusGranted;
    else if ([consentStatusString isEqualToString:@"DENIED"]) return FIRConsentStatusDenied;
    else return nil;
}

#pragma mark - Utility

- (void)handleException:(NSException*)exception command:(CDVInvokedUrlCommand*)command {
    NSLog(@"[FirebasexAnalytics] Exception: %@", exception);
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:exception.reason];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end
