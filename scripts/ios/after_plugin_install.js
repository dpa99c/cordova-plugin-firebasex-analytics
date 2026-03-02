/**
 * @file after_plugin_install.js
 * @brief Hook script that runs after the analytics plugin is installed on iOS.
 *
 * If a Google Tag Manager (GTM) container directory exists at `resources/ios/container`
 * in the Cordova project root, this script copies it into the iOS platform's app directory
 * and registers it as a resource reference in the Xcode project.
 */
var fs = require("fs");
var path = require("path");
var xcode = require("xcode");

/**
 * Cordova hook entry point.
 * Resolves the app name from `config.xml`, then delegates to
 * {@link addGoogleTagManagerContainer} to copy and register the GTM container.
 *
 * @param {object} context - The Cordova hook context.
 */
module.exports = function(context) {
    var iosPlatformPath = path.join(context.opts.projectRoot, "platforms", "ios");

    // Get app name from config.xml
    var appName;
    try {
        var configXmlPath = path.join(context.opts.projectRoot, "config.xml");
        var configXml = fs.readFileSync(configXmlPath, "utf-8");
        var nameMatch = configXml.match(/<name>([^<]+)<\/name>/);
        appName = nameMatch ? nameMatch[1] : null;
    } catch(e) {
        console.warn("[FirebasexAnalytics] Could not read config.xml to get app name");
        return;
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
        var appPBXGroup = xcodeProject.findPBXGroupKey({name: appName});
        xcodeProject.addResourceFile("container", {
            lastKnownFileType: "folder",
            fileEncoding: 9
        }, appPBXGroup);
        fs.writeFileSync(path.resolve(xcodeProjectPath), xcodeProject.writeSync());
    } catch (error) {
        console.error("[FirebasexAnalytics] Error adding GTM container: " + error.message);
    }
}
