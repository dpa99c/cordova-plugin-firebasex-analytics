#!/usr/bin/env node

const PLUGIN_NAME = "FirebasexAnalytics plugin";
const PLUGIN_ID = "cordova-plugin-firebasex-analytics";

const VARIABLE_NAMES = [
    "FIREBASE_ANALYTICS_WITHOUT_ADS",
    "IOS_ON_DEVICE_CONVERSION_ANALYTICS"
];

const variableApplicators = {};
let path, cwd, fs, parser;
let pluginXmlPath, pluginXmlText, pluginXmlData;
let projectPath, modulesPath, pluginNodePath;
let projectPackageJsonPath, projectPackageJsonData;
let configXmlPath, configXmlData;
let pluginVariables;
let pluginXmlModified = false;

variableApplicators.FIREBASE_ANALYTICS_WITHOUT_ADS = function() {
    // iOS: Remove IdentitySupport pod to exclude IDFA support
    const identitySupportPodRegExp = /\s*<pod name="FirebaseAnalytics\/IdentitySupport" spec="\d+\.\d+\.\d+"\/>/;
    const identitySupportMatch = pluginXmlText.match(identitySupportPodRegExp);

    if (identitySupportMatch) {
        pluginXmlText = pluginXmlText.replace(identitySupportPodRegExp, '');
        pluginXmlModified = true;
        console.log(`Removed FirebaseAnalytics/IdentitySupport pod from ${PLUGIN_ID}/plugin.xml`);
    }

    // Android: Disable AD_ID collection
    const googleAnalyticsAdIdPluginVariable = `<meta-data android:name="google_analytics_adid_collection_enabled" android:value="$GOOGLE_ANALYTICS_ADID_COLLECTION_ENABLED" />`;
    const googleAnalyticsAdIdEnabled = `<meta-data android:name="google_analytics_adid_collection_enabled" android:value="true" />`;
    const googleAnalyticsAdIdDisabled = `<meta-data android:name="google_analytics_adid_collection_enabled" android:value="false" />`;

    if (pluginXmlText.includes(googleAnalyticsAdIdPluginVariable)) {
        pluginXmlText = pluginXmlText.replace(googleAnalyticsAdIdPluginVariable, googleAnalyticsAdIdDisabled);
        pluginXmlModified = true;
    } else if (pluginXmlText.includes(googleAnalyticsAdIdEnabled)) {
        pluginXmlText = pluginXmlText.replace(googleAnalyticsAdIdEnabled, googleAnalyticsAdIdDisabled);
        pluginXmlModified = true;
    }

    const commentedOutAdIdRemoval = `<!--<uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove"/>-->`;
    const commentedInAdIdRemoval = `<uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove"/>`;

    if (pluginXmlText.includes(commentedOutAdIdRemoval)) {
        pluginXmlText = pluginXmlText.replace(commentedOutAdIdRemoval, commentedInAdIdRemoval);
        pluginXmlModified = true;
        console.log(`Enabled removal of AD_ID permission in ${PLUGIN_ID}/plugin.xml`);
    }
};

variableApplicators.IOS_ON_DEVICE_CONVERSION_ANALYTICS = function() {
    const withoutAds = resolveBoolean(pluginVariables['FIREBASE_ANALYTICS_WITHOUT_ADS']);

    if (withoutAds) {
        const commentedOutPodRegExp = /<!--<pod name="GoogleAdsOnDeviceConversion" spec="(\d+\.\d+\.\d+)"\/>-->/;
        const match = pluginXmlText.match(commentedOutPodRegExp);
        if (match) {
            const replacement = `<pod name="GoogleAdsOnDeviceConversion" spec="${match[1]}"/>`;
            pluginXmlText = pluginXmlText.replace(commentedOutPodRegExp, replacement);
            pluginXmlModified = true;
            console.log(`Enabled GoogleAdsOnDeviceConversion pod in ${PLUGIN_ID}/plugin.xml`);
        }
    } else {
        const coreAndIdentitySupportRegExp = /<pod name="FirebaseAnalytics\/Core" spec="(\d+\.\d+\.\d+)"\/>\n\s*<pod name="FirebaseAnalytics\/IdentitySupport" spec="\d+\.\d+\.\d+"\/>/;
        const match = pluginXmlText.match(coreAndIdentitySupportRegExp);
        if (match) {
            const replacement = `<pod name="FirebaseAnalytics" spec="${match[1]}"/>`;
            pluginXmlText = pluginXmlText.replace(coreAndIdentitySupportRegExp, replacement);
            pluginXmlModified = true;
            console.log(`Replaced Analytics/Core and IdentitySupport with FirebaseAnalytics pod in ${PLUGIN_ID}/plugin.xml`);
        }
    }
};

const run = function() {
    pluginVariables = parsePluginVariables();
    for (const variableName of VARIABLE_NAMES) {
        applyPluginVariable(variableName);
    }
    if (pluginXmlModified) writePluginXmlText();
};

const applyPluginVariable = function(variableName) {
    const shouldEnable = resolveBoolean(pluginVariables[variableName]);
    if (!shouldEnable) {
        console.log(`Skipping application of ${variableName} as not set to true.`);
        return;
    }
    console.log(`Applying ${variableName}=true to ${PLUGIN_ID}/plugin.xml`);
    variableApplicators[variableName]();
};

const resolveBoolean = function(value) {
    if (typeof value === 'undefined' || value === null) return false;
    if (value === true || value === false) return value;
    return !isNaN(value) ? parseFloat(value) : /^\s*(true|false)\s*$/i.exec(value) ? RegExp.$1.toLowerCase() === "true" : value;
};

const parsePluginVariables = function() {
    const vars = {};
    const plugin = parsePluginXml();
    let prefs = [];
    if (plugin.plugin.preference) prefs = prefs.concat(plugin.plugin.preference);
    if (typeof plugin.plugin.platform.length === 'undefined') plugin.plugin.platform = [plugin.plugin.platform];
    plugin.plugin.platform.forEach(function(platform) {
        if (platform.preference) prefs = prefs.concat(platform.preference);
    });
    prefs.forEach(function(pref) {
        if (pref._attributes) vars[pref._attributes.name] = pref._attributes.default;
    });

    const config = parseConfigXml();
    if (config) {
        (config.widget.plugin ? [].concat(config.widget.plugin) : []).forEach(function(plugin) {
            (plugin.variable ? [].concat(plugin.variable) : []).forEach(function(variable) {
                if ((plugin._attributes.name === PLUGIN_ID || plugin._attributes.id === PLUGIN_ID) && variable._attributes.name && variable._attributes.value) {
                    vars[variable._attributes.name] = variable._attributes.value;
                }
            });
        });
    }

    const packageJSON = parsePackageJson();
    if (packageJSON && packageJSON.cordova && packageJSON.cordova.plugins) {
        for (const pluginId in packageJSON.cordova.plugins) {
            if (pluginId === PLUGIN_ID) {
                for (const varName in packageJSON.cordova.plugins[pluginId]) {
                    vars[varName] = packageJSON.cordova.plugins[pluginId][varName];
                }
            }
        }
    }

    return vars;
};

const parsePackageJson = function() {
    if (projectPackageJsonData) return projectPackageJsonData;
    try {
        projectPackageJsonData = JSON.parse(fs.readFileSync(projectPackageJsonPath));
        return projectPackageJsonData;
    } catch(e) {
        console.warn("Failed to parse package.json: " + e.message);
    }
};

const parseConfigXml = function() {
    if (configXmlData) return configXmlData;
    try {
        const data = parseXmlFileToJson(configXmlPath);
        configXmlData = data.xml;
        return configXmlData;
    } catch(e) {
        console.warn("Failed to parse config.xml: " + e.message);
    }
};

const parsePluginXml = function() {
    if (pluginXmlData) return pluginXmlData;
    const data = parseXmlFileToJson(pluginXmlPath);
    pluginXmlText = data.text;
    pluginXmlData = data.xml;
    return pluginXmlData;
};

const parseXmlFileToJson = function(filepath, parseOpts) {
    parseOpts = parseOpts || {compact: true};
    const text = fs.readFileSync(path.resolve(filepath), 'utf-8');
    const xml = JSON.parse(parser.xml2json(text, parseOpts));
    return {text, xml};
};

const writePluginXmlText = function() {
    fs.writeFileSync(pluginXmlPath, pluginXmlText, 'utf-8');
    console.log(`Wrote modified ${PLUGIN_ID}/plugin.xml`);
};

const main = function() {
    try {
        fs = require('fs');
        path = require('path');

        cwd = path.resolve();
        pluginNodePath = cwd;
        modulesPath = path.resolve(pluginNodePath, "..");
        projectPath = path.resolve(modulesPath, "..");

        try {
            parser = require("xml-js");
        } catch(e) {
            try {
                parser = require(path.resolve(modulesPath, "xml-js"));
            } catch(e2) {
                throw new Error("Failed to load 'xml-js' module");
            }
        }
    } catch(e) {
        console.error(`${PLUGIN_NAME} - ERROR: Failed to load dependencies: ${e.message}`);
        return;
    }

    try {
        projectPackageJsonPath = path.join(projectPath, 'package.json');
        configXmlPath = path.join(projectPath, 'config.xml');
        pluginXmlPath = path.join(pluginNodePath, "plugin.xml");
        run();
    } catch(e) {
        console.error(`${PLUGIN_NAME} - ERROR: ${e.message}`);
    }
};

main();
