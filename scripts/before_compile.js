/**
 * @file before_compile.js
 * @brief Applies the analytics collection and consent plugin variables on iOS.
 *
 * These variables are declared in plugin.xml as Android manifest meta-data entries, so on Android
 * they take effect and on iOS they reached nothing at all. The iOS SDK reads them from
 * GoogleService-Info.plist, which is what the monolithic cordova-plugin-firebasex wrote them into,
 * and what cordova-plugin-firebasex-performance still does for its own variable. This mirrors that.
 *
 * The consent defaults are the reason this is worth fixing rather than documenting: with the keys
 * absent, iOS applies Firebase's defaults, so an app that has opted out of ad-id collection or ad
 * storage on Android stays opted in on iOS, and nothing reports the difference.
 *
 * It runs on before_compile rather than after_prepare because cordova does not define the order of
 * plugin after_prepare hooks: they are collected in whatever order fast-glob returns for the
 * plugins directory, and cordova-plugin-firebasex-core's after_prepare copies the project's
 * GoogleService-Info.plist over the platform copy. So an after_prepare write here is discarded or
 * kept depending on the filesystem, which is not something to build on. before_compile runs after
 * every prepare hook has finished. Reported at apache/cordova-lib#1010.
 */
var fs = require("fs");
var path = require("path");

/** @constant {string} The plugin identifier. */
var PLUGIN_ID = "cordova-plugin-firebasex-analytics";
/** @constant {string} The wrapper meta-plugin identifier, a fallback source for plugin variables. */
var WRAPPER_PLUGIN_ID = "cordova-plugin-firebasex";
/** @constant {string} The app sub-directory name used by cordova-ios 8+. */
var appNameCordova8Plus = "App";
/** @constant {string} Path to the iOS platform directory, set in the hook entry point. */
var iosPlatformPath;

/**
 * Plugin variable -> the key the iOS SDK reads. Every one of these is applied on Android through a
 * manifest meta-data entry in plugin.xml.
 */
var PLIST_KEYS = {
    FIREBASE_ANALYTICS_COLLECTION_ENABLED: "FIREBASE_ANALYTICS_COLLECTION_ENABLED",
    GOOGLE_ANALYTICS_ADID_COLLECTION_ENABLED: "GOOGLE_ANALYTICS_ADID_COLLECTION_ENABLED",
    GOOGLE_ANALYTICS_DEFAULT_ALLOW_ANALYTICS_STORAGE: "GOOGLE_ANALYTICS_DEFAULT_ALLOW_ANALYTICS_STORAGE",
    GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_STORAGE: "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_STORAGE",
    GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_USER_DATA: "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_USER_DATA",
    GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_PERSONALIZATION_SIGNALS: "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_PERSONALIZATION_SIGNALS"
};

/***************************
 * Internal helper functions
 ****************************/

/**
 * Supports both the legacy cordova-ios layout (where the Xcode project is under `platforms/ios/<AppName>.xcodeproj`)
 * and the new cordova-ios 8+ layout (where the Xcode project is under `platforms/ios/App/App.xcodeproj`)
 * by checking for the existence of the new layout first, then falling back to the old layout if not found.
 */
function getAppSubDirPath(appName) {
    var newPath = path.join(iosPlatformPath, appNameCordova8Plus);
    if (fs.existsSync(newPath)) {
        return newPath;
    }
    return path.join(iosPlatformPath, appName);
}

/**
 * Determines whether the project is using cordova-ios 8+ by checking for the existence of the `platforms/ios/App` directory.
 *
 * @param {string} iosPlatformPath - Absolute path to the `platforms/ios` directory.
 * @returns {boolean} True if cordova-ios 8+ layout is detected, false otherwise.
 */
function isCordovaIOS8Plus () {
    var appSubDirPath = path.join(iosPlatformPath, appNameCordova8Plus);
    return fs.existsSync(appSubDirPath) && fs.statSync(appSubDirPath).isDirectory();
};

/**
 * Resolves plugin variables using a 3-layer override strategy:
 * 1. Default values from `plugin.xml` `<preference>` elements.
 * 2. Overrides from `config.xml` `<plugin><variable>` elements.
 * 3. Overrides from `package.json` `cordova.plugins` entries (highest priority).
 *
 * @returns {Object} Resolved plugin variable key/value pairs.
 */
function getPluginVariables() {
    var variables = {};

    // Try reading from plugin.xml
    try {
        var pluginXmlPath = path.join("plugins", PLUGIN_ID, "plugin.xml");
        if (fs.existsSync(pluginXmlPath)) {
            var pluginXml = fs.readFileSync(pluginXmlPath, "utf-8");
            var prefRegex = /<preference\s+name="([^"]+)"\s+default="([^"]+)"\s*\/>/g;
            var match;
            while ((match = prefRegex.exec(pluginXml)) !== null) {
                variables[match[1]] = match[2];
            }
        }
    } catch (e) {
        console.warn("Could not read plugin.xml: " + e.message);
    }

    // Override with values from config.xml (check both wrapper and own plugin ID)
    try {
        var configXmlPath = path.join("config.xml");
        if (fs.existsSync(configXmlPath)) {
            var configXml = fs.readFileSync(configXmlPath, "utf-8");
            [WRAPPER_PLUGIN_ID, PLUGIN_ID].forEach(function(pluginId) {
                var pluginRegex = new RegExp('<plugin[^>]+name="' + pluginId + '"[^>]*>(.*?)</plugin>', "s");
                var pluginMatch = configXml.match(pluginRegex);
                if (pluginMatch) {
                    var varRegex = /<variable\s+name="([^"]+)"\s+value="([^"]+)"\s*\/>/g;
                    var varMatch;
                    while ((varMatch = varRegex.exec(pluginMatch[1])) !== null) {
                        variables[varMatch[1]] = varMatch[2];
                    }
                }
            });
        }
    } catch (e) {
        console.warn("Could not read config.xml: " + e.message);
    }

    // Override with values from package.json (check wrapper first as base, then own plugin)
    try {
        var packageJsonPath = path.join("package.json");
        if (fs.existsSync(packageJsonPath)) {
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            if (packageJson.cordova && packageJson.cordova.plugins) {
                [WRAPPER_PLUGIN_ID, PLUGIN_ID].forEach(function(pluginId) {
                    if (packageJson.cordova.plugins[pluginId]) {
                        var pluginVars = packageJson.cordova.plugins[pluginId];
                        for (var key in pluginVars) {
                            variables[key] = pluginVars[key];
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.warn("Could not read package.json: " + e.message);
    }

    return variables;
}

/**
 * Cordova hook entry point. iOS only; the Android side is handled by plugin.xml meta-data.
 *
 * @param {object} context - The Cordova hook context.
 */
module.exports = function (context) {
    if (!context.opts.platforms || context.opts.platforms.indexOf("ios") === -1) return;

    iosPlatformPath = path.join("platforms", "ios");
    if (!fs.existsSync(iosPlatformPath)) return;

    var pluginVariables = getPluginVariables();

    var appName;
    if (isCordovaIOS8Plus()) {
        appName = appNameCordova8Plus;
    } else {
        var configXml = fs.readFileSync(path.join("config.xml"), "utf-8");
        var appNameMatch = configXml.match(/<name>([^<]+)<\/name>/);
        if (!appNameMatch) return;
        appName = appNameMatch[1];
    }

    try {
        var plist = require("plist");
        var googlePlistPath = path.join(getAppSubDirPath(appName), "Resources", "GoogleService-Info.plist");
        if (!fs.existsSync(googlePlistPath)) {
            console.warn("GoogleService-Info.plist not found at expected path: " + googlePlistPath);
            return;
        }

        var googlePlist = plist.parse(fs.readFileSync(googlePlistPath, "utf-8"));
        var applied = [];
        for (var variable in PLIST_KEYS) {
            if (typeof pluginVariables[variable] === "undefined") continue;
            // Anything but the literal "false" is true, matching how the Android side reads them.
            var value = pluginVariables[variable] !== "false" ? "true" : "false";
            var key = PLIST_KEYS[variable];
            if (googlePlist[key] === value) continue;
            googlePlist[key] = value;
            applied.push(key + "=" + value);
        }

        if (!applied.length) return;
        fs.writeFileSync(googlePlistPath, plist.build(googlePlist), "utf-8");
        console.log("Set " + applied.join(" ") + " in GoogleService-Info.plist");
    } catch (e) {
        console.warn("Could not update GoogleService-Info.plist for analytics: " + e.message);
    }
};
