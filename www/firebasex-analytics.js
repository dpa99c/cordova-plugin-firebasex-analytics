/**
 * @fileoverview Cordova JavaScript interface for the FirebaseX Analytics plugin.
 *
 * Provides methods for logging events, setting user properties, managing analytics
 * consent mode, and controlling analytics data collection.
 *
 * @module firebasex-analytics
 * @see https://firebase.google.com/docs/analytics
 */

var exec = require('cordova/exec');

/** @private Cordova service name registered in plugin.xml. */
var SERVICE = 'FirebasexAnalyticsPlugin';

/**
 * Constants for analytics consent types, used with
 * {@link module:firebasex-analytics.setAnalyticsConsentMode|setAnalyticsConsentMode}.
 *
 * @enum {string}
 * @see https://firebase.google.com/docs/analytics/configure-data-collection#consent-mode
 */
exports.AnalyticsConsentMode = {
    /** Controls storage of analytics-related cookies and data. */
    ANALYTICS_STORAGE: "ANALYTICS_STORAGE",
    /** Controls storage of advertising-related cookies and data. */
    AD_STORAGE: "AD_STORAGE",
    /** Controls whether user data can be sent for advertising purposes. */
    AD_USER_DATA: "AD_USER_DATA",
    /** Controls whether personalised advertising (remarketing) is enabled. */
    AD_PERSONALIZATION: "AD_PERSONALIZATION"
};

/**
 * Constants for analytics consent statuses, used with
 * {@link module:firebasex-analytics.setAnalyticsConsentMode|setAnalyticsConsentMode}.
 *
 * @enum {string}
 */
exports.AnalyticsConsentStatus = {
    /** User has granted consent for this type. */
    GRANTED: "GRANTED",
    /** User has denied consent for this type. */
    DENIED: "DENIED"
};

/**
 * Enables or disables Firebase Analytics data collection.
 *
 * When disabled, no analytics data is collected or sent.
 * The setting is persisted across app restarts.
 *
 * @param {boolean} enabled - {@code true} to enable, {@code false} to disable.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
exports.setAnalyticsCollectionEnabled = function (enabled, success, error) {
    exec(success, error, SERVICE, "setAnalyticsCollectionEnabled", [!!enabled]);
};

/**
 * Returns the current analytics data collection enabled state.
 *
 * @param {function} success - Called with a boolean: {@code true} if enabled.
 * @param {function} error - Called with an error message on failure.
 */
exports.isAnalyticsCollectionEnabled = function (success, error) {
    exec(success, error, SERVICE, "isAnalyticsCollectionEnabled", []);
};

/**
 * Updates the analytics consent mode settings.
 *
 * Pass an object mapping {@link module:firebasex-analytics.AnalyticsConsentMode|AnalyticsConsentMode}
 * values to {@link module:firebasex-analytics.AnalyticsConsentStatus|AnalyticsConsentStatus} values.
 *
 * @param {Object.<string, string>} consent - Consent settings object,
 *   e.g. {@code {ANALYTICS_STORAGE: 'GRANTED', AD_STORAGE: 'DENIED'}}.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 * @see https://firebase.google.com/docs/analytics/configure-data-collection#consent-mode
 */
exports.setAnalyticsConsentMode = function (consent, success, error) {
    exec(success, error, SERVICE, "setAnalyticsConsentMode", [consent]);
};

/**
 * Logs a custom analytics event.
 *
 * @param {string} name - Event name (max 40 characters, alphanumeric + underscores).
 * @param {Object} params - Event parameters as key-value pairs.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 * @see https://firebase.google.com/docs/analytics/events
 */
exports.logEvent = function (name, params, success, error) {
    exec(success, error, SERVICE, "logEvent", [name, params]);
};

/**
 * Sets the current screen name for analytics reporting.
 *
 * Logs a {@code screen_view} event with the given screen name.
 *
 * @param {string} name - The screen name.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
exports.setScreenName = function (name, success, error) {
    exec(success, error, SERVICE, "setScreenName", [name]);
};

/**
 * Sets the user ID for analytics.
 *
 * @param {string} id - The user ID string, or {@code null} to clear.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
exports.setUserId = function (id, success, error) {
    exec(success, error, SERVICE, "setUserId", [id]);
};

/**
 * Sets a user property for analytics.
 *
 * @param {string} name - The property name (max 24 characters).
 * @param {string} value - The property value (max 36 characters), or {@code null} to clear.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
exports.setUserProperty = function (name, value, success, error) {
    exec(success, error, SERVICE, "setUserProperty", [name, value]);
};

/**
 * Initiates on-device conversion measurement using an email address or phone number.
 *
 * Only one identifier type may be provided per call.
 *
 * @param {Object} userIdentifier - An object containing EITHER {@code emailAddress}
 *   OR {@code phoneNumber} (but not both).
 * @param {string} [userIdentifier.emailAddress] - The user's email address.
 * @param {string} [userIdentifier.phoneNumber] - The user's phone number in E.164 format.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 * @throws {string} If the userIdentifier is invalid (missing both, or has both).
 * @see https://firebase.google.com/docs/analytics/on-device-conversion-measurement
 */
exports.initiateOnDeviceConversionMeasurement = function (userIdentifier, success, error) {
    if (typeof userIdentifier !== "object"
        || (!userIdentifier.emailAddress && !userIdentifier.phoneNumber)
        || (userIdentifier.emailAddress && userIdentifier.phoneNumber)
    ) throw "The 'userIdentifier' argument must be an object containing EITHER an 'emailAddress' OR 'phoneNumber' key";

    exec(success, error, SERVICE, "initiateOnDeviceConversionMeasurement", [userIdentifier]);
};
