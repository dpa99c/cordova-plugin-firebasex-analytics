/**
 * @file before_plugin_uninstall.js
 * @brief Hook script that runs before the analytics plugin is uninstalled from iOS.
 *
 * Removes the Google Tag Manager (GTM) container directory from the iOS platform's
 * app directory and de-registers it from the Xcode project, reversing the changes
 * made by {@link module:scripts/ios/after_plugin_install}.
 */
var fs = require("fs");
var path = require("path");
var xcode = require("xcode");

/**
 * Cordova hook entry point.
 * Resolves the app name from `config.xml`, then delegates to
 * {@link removeGoogleTagManagerContainer} to remove and de-register the GTM container.
 *
 * @param {object} context - The Cordova hook context.
 */
module.exports = function(context) {
    var iosPlatformPath = path.join(context.opts.projectRoot, "platforms", "ios");

    var appName;
    try {
        var configXmlPath = path.join(context.opts.projectRoot, "config.xml");
        var configXml = fs.readFileSync(configXmlPath, "utf-8");
        var nameMatch = configXml.match(/<name>([^<]+)<\/name>/);
        appName = nameMatch ? nameMatch[1] : null;
    } catch(e) {
        return;
    }

    if (!appName) return;

    removeGoogleTagManagerContainer(iosPlatformPath, appName);
};

/**
 * Removes the GTM container folder resource reference from the Xcode project
 * and deletes the container directory from the iOS app bundle.
 *
 * @param {string} iosPlatformPath - Absolute path to `platforms/ios`.
 * @param {string} appName - The application name from `config.xml`.
 */
function removeGoogleTagManagerContainer(iosPlatformPath, appName) {
    var appContainerDirectory = path.join(iosPlatformPath, appName, "container");
    var xcodeProjectPath = path.join(iosPlatformPath, appName + ".xcodeproj", "project.pbxproj");

    if (!fs.existsSync(appContainerDirectory)) return;

    try {
        var xcodeProject = xcode.project(xcodeProjectPath);
        xcodeProject.parseSync();

        console.log("[FirebasexAnalytics] Removing GoogleTagManager container");
        var appPBXGroup = xcodeProject.findPBXGroupKey({name: appName});
        xcodeProject.removeResourceFile("container", {
            lastKnownFileType: "folder",
            fileEncoding: 9
        }, appPBXGroup);
        fs.writeFileSync(path.resolve(xcodeProjectPath), xcodeProject.writeSync());
        fs.rmSync(appContainerDirectory, {recursive: true});
    } catch (error) {
        console.error("[FirebasexAnalytics] Error removing GTM container: " + error.message);
    }
}
