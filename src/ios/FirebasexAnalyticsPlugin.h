#import <Cordova/CDV.h>

@interface FirebasexAnalyticsPlugin : CDVPlugin

- (void)logEvent:(CDVInvokedUrlCommand*)command;
- (void)setScreenName:(CDVInvokedUrlCommand*)command;
- (void)setUserId:(CDVInvokedUrlCommand*)command;
- (void)setUserProperty:(CDVInvokedUrlCommand*)command;
- (void)setAnalyticsCollectionEnabled:(CDVInvokedUrlCommand*)command;
- (void)isAnalyticsCollectionEnabled:(CDVInvokedUrlCommand*)command;
- (void)setAnalyticsConsentMode:(CDVInvokedUrlCommand*)command;
- (void)initiateOnDeviceConversionMeasurement:(CDVInvokedUrlCommand*)command;

@end
