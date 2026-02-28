var exec = require('cordova/exec');
var SERVICE = 'FirebasexAnalyticsPlugin';

exports.AnalyticsConsentMode = {
    ANALYTICS_STORAGE: "ANALYTICS_STORAGE",
    AD_STORAGE: "AD_STORAGE",
    AD_USER_DATA: "AD_USER_DATA",
    AD_PERSONALIZATION: "AD_PERSONALIZATION"
};

exports.AnalyticsConsentStatus = {
    GRANTED: "GRANTED",
    DENIED: "DENIED"
};

exports.setAnalyticsCollectionEnabled = function (enabled, success, error) {
    exec(success, error, SERVICE, "setAnalyticsCollectionEnabled", [!!enabled]);
};

exports.isAnalyticsCollectionEnabled = function (success, error) {
    exec(success, error, SERVICE, "isAnalyticsCollectionEnabled", []);
};

exports.setAnalyticsConsentMode = function (consent, success, error) {
    exec(success, error, SERVICE, "setAnalyticsConsentMode", [consent]);
};

exports.logEvent = function (name, params, success, error) {
    exec(success, error, SERVICE, "logEvent", [name, params]);
};

exports.setScreenName = function (name, success, error) {
    exec(success, error, SERVICE, "setScreenName", [name]);
};

exports.setUserId = function (id, success, error) {
    exec(success, error, SERVICE, "setUserId", [id]);
};

exports.setUserProperty = function (name, value, success, error) {
    exec(success, error, SERVICE, "setUserProperty", [name, value]);
};

exports.initiateOnDeviceConversionMeasurement = function (userIdentifier, success, error) {
    if (typeof userIdentifier !== "object"
        || (!userIdentifier.emailAddress && !userIdentifier.phoneNumber)
        || (userIdentifier.emailAddress && userIdentifier.phoneNumber)
    ) throw "The 'userIdentifier' argument must be an object containing EITHER an 'emailAddress' OR 'phoneNumber' key";

    exec(success, error, SERVICE, "initiateOnDeviceConversionMeasurement", [userIdentifier]);
};
