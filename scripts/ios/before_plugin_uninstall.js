var fs = require("fs");
var path = require("path");
var xcode = require("xcode");

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
