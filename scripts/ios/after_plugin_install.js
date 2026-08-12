/**
 * @file after_plugin_install.js
 * @brief Hook script that runs after the analytics plugin is installed on iOS.
 *
 * 1. Updates Firebase Analytics and GoogleTagManager pod versions in the Podfile
 *    based on IOS_FIREBASE_SDK_VERSION and IOS_GOOGLE_TAG_MANAGER_VERSION plugin
 *    variables, allowing users to override the default versions.
 *
 * 2. If a Google Tag Manager (GTM) container directory exists at `resources/ios/container`
 *    in the Cordova project root, this script copies it into the iOS platform's app directory
 *    and registers it as a resource reference in the Xcode project.
 *
 * Plugin variables are resolved using a 4-layer override strategy:
 * 1. Defaults from plugin.xml preferences (via hook context).
 * 2. Overrides from `config.xml` `<plugin><variable>` elements (wrapper and own plugin ID).
 * 3. Overrides from `package.json` `cordova.plugins` entries (wrapper and own plugin ID).
 * 4. CLI variables passed at install time (highest priority).
 */
var fs = require("fs");
var path = require("path");
var xcode = require("xcode");

/** @constant {string} The plugin identifier. */
var PLUGIN_ID = "cordova-plugin-firebasex-analytics";
/** @constant {string} The wrapper meta-plugin identifier used as a fallback source for plugin variables. */
var WRAPPER_PLUGIN_ID = "cordova-plugin-firebasex";

/** @constant {string} The expected app's Xcode name under `platforms/ios`. Since cordova-ios 8, this is `App`; in cordova <= 7 this was the project name. */
var appNameCordova8Plus = "App";

function isSwiftPackageManagerEnabled(projectRoot) {
    var iosPlatformPath = path.join(projectRoot, "platforms", "ios");
    var appSubDirPath = path.join(iosPlatformPath, appNameCordova8Plus);
    return fs.existsSync(appSubDirPath) && fs.statSync(appSubDirPath).isDirectory();
}

/***************************
 * Internal helper functions
 ****************************/


/**
 * Resolves plugin variables using the 4-layer override strategy.
 *
 * @param {object} context - The Cordova hook context.
 * @returns {Object} Resolved plugin variable key/value pairs.
 */
function resolvePluginVariables(context) {
    var pluginVariables = {};

    // 1. Defaults from plugin.xml preferences
    var plugin = context.opts.plugin;
    if (plugin && plugin.pluginInfo && plugin.pluginInfo._et && plugin.pluginInfo._et._root && plugin.pluginInfo._et._root._children) {
        plugin.pluginInfo._et._root._children.forEach(function(child) {
            if (child.tag === "preference") {
                pluginVariables[child.attrib.name] = child.attrib.default;
            }
        });
    }

    // 2. Overrides from config.xml
    try {
        var configXmlPath = path.join(context.opts.projectRoot, "config.xml");
        if (fs.existsSync(configXmlPath)) {
            var configXml = fs.readFileSync(configXmlPath, "utf-8");
            [WRAPPER_PLUGIN_ID, PLUGIN_ID].forEach(function(pluginId) {
                var pluginRegex = new RegExp('<plugin[^>]+name="' + pluginId + '"[^>]*>(.*?)</plugin>', "s");
                var pluginMatch = configXml.match(pluginRegex);
                if (pluginMatch) {
                    var varRegex = /<variable\s+name="([^"]+)"\s+value="([^"]+)"\s*\/>/g;
                    var varMatch;
                    while ((varMatch = varRegex.exec(pluginMatch[1])) !== null) {
                        pluginVariables[varMatch[1]] = varMatch[2];
                    }
                }
            });
        } else {
            console.warn("[FirebasexAnalytics] config.xml not found at " + configXmlPath + ". Cannot read plugin variables from config.xml.");
        }
    } catch (e) {
        console.warn("[FirebasexAnalytics] Could not read config.xml for plugin variables: " + e.message);
    }

    // 3. Overrides from package.json
    try {
        var packageJsonPath = path.join(context.opts.projectRoot, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            if (packageJson.cordova && packageJson.cordova.plugins) {
                [WRAPPER_PLUGIN_ID, PLUGIN_ID].forEach(function(pluginId) {
                    if (packageJson.cordova.plugins[pluginId]) {
                        var pluginVars = packageJson.cordova.plugins[pluginId];
                        for (var key in pluginVars) {
                            pluginVariables[key] = pluginVars[key];
                        }
                    }
                });
            }
        } else {
            console.warn("[FirebasexAnalytics] package.json not found at " + packageJsonPath + ". Cannot read plugin variables from package.json.");
        }
    } catch (e) {
        console.warn("[FirebasexAnalytics] Could not read package.json for plugin variables: " + e.message);
    }

    // 4. CLI variable overrides (highest priority)
    if (context.opts && context.opts.cli_variables) {
        Object.keys(context.opts.cli_variables).forEach(function(key) {
            pluginVariables[key] = context.opts.cli_variables[key];
        });
    }

    return pluginVariables;
}

function resolveBoolean(value) {
    if (typeof value === "undefined" || value === null) return false;
    if (value === true || value === false) return value;
    if (typeof value === "string") {
        var normalisedValue = value.trim().toLowerCase();
        if (normalisedValue === "true") return true;
        if (normalisedValue === "false") return false;
    }
    return Boolean(value);
}

function getPackageSwiftPaths(context) {
    var paths = [
        path.resolve(__dirname, "..", "..", "Package.swift"),
        path.join(context.opts.projectRoot, "plugins", PLUGIN_ID, "Package.swift")
    ];

    return paths.filter(function(packageSwiftPath, index) {
        return fs.existsSync(packageSwiftPath) && paths.indexOf(packageSwiftPath) === index;
    });
}

function rewritePackageSwiftValue(packageSwiftContents, key, value) {
    var packageValueRegex = new RegExp("let " + key + "(?:\\s*:\\s*Version)? = \\\"[^\\\"]+\\\"");
    if (!packageValueRegex.test(packageSwiftContents)) {
        return { contents: packageSwiftContents, modified: false };
    }

    var updatedContents = packageSwiftContents.replace(packageValueRegex, function(match) {
        return match.replace(/\"[^\"]+\"/, '"' + value + '"');
    });

    return { contents: updatedContents, modified: updatedContents !== packageSwiftContents };
}

function getAnalyticsSpmVariant(pluginVariables) {
    var withoutAds = resolveBoolean(pluginVariables["FIREBASE_ANALYTICS_WITHOUT_ADS"]);
    var onDeviceConversion = resolveBoolean(pluginVariables["IOS_ON_DEVICE_CONVERSION_ANALYTICS"]);

    if (withoutAds && onDeviceConversion) {
        return "core-with-on-device-conversion";
    }
    if (withoutAds) {
        return "core";
    }
    if (onDeviceConversion) {
        return "full";
    }
    return "identity-support";
}

function updatePackageSwift(context, pluginVariables) {
    getPackageSwiftPaths(context).forEach(function(packageSwiftPath) {
        var packageSwiftContents = fs.readFileSync(packageSwiftPath, "utf-8");
        var modified = false;

        var updates = [
            ["firebaseSDKVersion", pluginVariables["IOS_FIREBASE_SDK_VERSION"]],
            ["googleTagManagerVersion", pluginVariables["IOS_GOOGLE_TAG_MANAGER_VERSION"]],
            ["analyticsSPMVariant", getAnalyticsSpmVariant(pluginVariables)]
        ];

        updates.forEach(function(update) {
            if (!update[1]) return;
            var result = rewritePackageSwiftValue(packageSwiftContents, update[0], update[1]);
            packageSwiftContents = result.contents;
            modified = modified || result.modified;
        });

        if (modified) {
            fs.writeFileSync(packageSwiftPath, packageSwiftContents);
        }
    });
}

/**
 * Updates one or more pod versions in the Podfile.
 * Matches pod lines of the form: pod 'PodName', 'X.Y.Z'
 *
 * @param {string} podfileContents - Current contents of the Podfile.
 * @param {string} podName - The pod name to update (may contain / for subspecs).
 * @param {string} newVersion - The new version string to set.
 * @returns {{contents: string, modified: boolean}} Updated contents and whether a change was made.
 */
function updatePodVersion(podfileContents, podName, newVersion) {
    var versionRegex = /\d+\.\d+\.\d+[^'"]*/;
    var escapedName = podName.replace(/\//g, "\\/");
    var podRegex = new RegExp("pod '" + escapedName + "', '(\\d+\\.\\d+\\.\\d+[^'\"]*)'", "g");
    var matches = podfileContents.match(podRegex);
    var modified = false;
    if (matches) {
        matches.forEach(function(match) {
            var currentVersion = match.match(versionRegex)[0];
            if (currentVersion !== newVersion) {
                podfileContents = podfileContents.replace(match, match.replace(currentVersion, newVersion));
                modified = true;
            }
        });
    }
    return { contents: podfileContents, modified: modified };
}

/**
 * Cordova hook entry point.
 * Updates pod versions in the Podfile, then copies the GTM container if present.
 *
 * @param {object} context - The Cordova hook context.
 */
module.exports = function(context) {
    var iosPlatformPath = path.join(context.opts.projectRoot, "platforms", "ios");
    var podfilePath = path.join(iosPlatformPath, "Podfile");

    var pluginVariables = resolvePluginVariables(context);
    var useSwiftPackageManager = isSwiftPackageManagerEnabled(context.opts.projectRoot);
    if (useSwiftPackageManager) {
        updatePackageSwift(context, pluginVariables);
    }

    // Update Firebase Analytics pod versions
    if (!useSwiftPackageManager && fs.existsSync(podfilePath)) {
        try {
            var podfileContents = fs.readFileSync(podfilePath, "utf-8");
            var modified = false;

            if (pluginVariables["IOS_FIREBASE_SDK_VERSION"]) {
                var sdkVersion = pluginVariables["IOS_FIREBASE_SDK_VERSION"];
                ["FirebaseAnalytics/Core", "FirebaseAnalytics/IdentitySupport"].forEach(function(podName) {
                    var result = updatePodVersion(podfileContents, podName, sdkVersion);
                    podfileContents = result.contents;
                    if (result.modified) modified = true;
                });
                if (modified) {
                    console.log("[FirebasexAnalytics] Firebase SDK version set to v" + sdkVersion + " in Podfile");
                }
            }

            if (pluginVariables["IOS_GOOGLE_TAG_MANAGER_VERSION"]) {
                var gtmVersion = pluginVariables["IOS_GOOGLE_TAG_MANAGER_VERSION"];
                var result = updatePodVersion(podfileContents, "GoogleTagManager", gtmVersion);
                podfileContents = result.contents;
                if (result.modified) {
                    modified = true;
                    console.log("[FirebasexAnalytics] Google Tag Manager version set to v" + gtmVersion + " in Podfile");
                }
            }

            if (modified) {
                fs.writeFileSync(podfilePath, podfileContents);
            }
        } catch (e) {
            console.warn("[FirebasexAnalytics] Error updating pod versions: " + e.message);
        }
    }else if (!useSwiftPackageManager){
        console.warn("[FirebasexAnalytics] Podfile not found at expected path: " + podfilePath);
    }



    // First try to resolve app name for cordova-ios 8+ by checking for the existence of the new layout with "App" subdirectory
    var appName;
    var appSubDirPath = path.join(iosPlatformPath, appNameCordova8Plus);
    if (fs.existsSync(appSubDirPath)) {
        appName = appNameCordova8Plus;
    } else {
        // Try to resolve app name for cordova <= 7 from <name> in config.xml
        try {
            var configXmlPath = path.join(context.opts.projectRoot, "config.xml");
            var configXml = fs.readFileSync(configXmlPath, "utf-8");
            var nameMatch = configXml.match(/<name>([^<]+)<\/name>/);
            appName = nameMatch ? nameMatch[1] : null;
        } catch(e) {
            console.warn("[FirebasexAnalytics] Could not read config.xml to get app name");
            return;
        }
    }

    if (!appName) {
        console.warn("[FirebasexAnalytics] Could not determine app name from config.xml");
        return;
    }

    // Add GoogleTagManager container
    addGoogleTagManagerContainer(context, iosPlatformPath, appName);
};

/**
 * Copies the GTM container directory into the iOS app bundle and adds it
 * as a folder resource reference in the Xcode project.
 *
 * @param {object} context - The Cordova hook context.
 * @param {string} iosPlatformPath - Absolute path to `platforms/ios`.
 * @param {string} appName - The application name from `config.xml`.
 */
function addGoogleTagManagerContainer(context, iosPlatformPath, appName) {
    var containerDirectorySource = path.join(context.opts.projectRoot, "resources", "ios", "container");
    var containerDirectoryTarget = path.join(iosPlatformPath, appName, "container");
    var xcodeProjectPath = path.join(iosPlatformPath, appName + ".xcodeproj", "project.pbxproj");

    if (!fs.existsSync(containerDirectorySource)) {
        return;
    }

    try {
        var xcodeProject = xcode.project(xcodeProjectPath);
        xcodeProject.parseSync();

        console.log("[FirebasexAnalytics] Preparing GoogleTagManager on iOS");
        fs.cpSync(containerDirectorySource, containerDirectoryTarget, {recursive: true});
        // On cordova-ios 8+ the generated group carries only a path, not a matching name,
        // so look the app group up both ways rather than assuming either.
        var appPBXGroup = xcodeProject.findPBXGroupKey({name: appName}) || xcodeProject.findPBXGroupKey({path: appName});
        xcodeProject.addResourceFile("container", {
            lastKnownFileType: "folder",
            fileEncoding: 9
        }, appPBXGroup);
        fs.writeFileSync(path.resolve(xcodeProjectPath), xcodeProject.writeSync());
    } catch (error) {
        console.error("[FirebasexAnalytics] Error adding GTM container: " + error.message);
    }
}
