#!/usr/bin/env node

/**
 * @file post_install.js
 * @brief npm post-install script for the cordova-plugin-firebasex-analytics plugin.
 *
 * Runs automatically after `npm install` to modify the plugin's `plugin.xml` based on
 * plugin variable settings. This script handles build-time customisation that must be
 * applied before Cordova processes the plugin XML.
 *
 * **Supported plugin variables:**
 * - `FIREBASE_ANALYTICS_WITHOUT_ADS` — When `true`:
 *   - Removes the `FirebaseAnalytics/IdentitySupport` pod (excludes IDFA support on iOS).
 *   - Disables `google_analytics_adid_collection_enabled` on Android.
 *   - Enables removal of the `AD_ID` permission on Android.
 * - `IOS_ON_DEVICE_CONVERSION_ANALYTICS` — When `true`:
 *   - If ads are disabled: enables the `GoogleAdsOnDeviceConversion` pod.
 *   - If ads are enabled: replaces separate Core/IdentitySupport pods with unified `FirebaseAnalytics` pod.
 *
 * Plugin variables are resolved using a 3-layer override strategy:
 * 1. Defaults from `plugin.xml` `<preference>` elements.
 * 2. Overrides from `config.xml` `<plugin><variable>` elements.
 * 3. Overrides from `package.json` `cordova.plugins` entries (highest priority).
 *
 * @module scripts/post_install
 */
const PLUGIN_NAME = "FirebasexAnalytics plugin";
const PLUGIN_ID = "cordova-plugin-firebasex-analytics";

/** @constant {string[]} Plugin variable names processed by this script. */
const VARIABLE_NAMES = [
    "FIREBASE_ANALYTICS_WITHOUT_ADS",
    "IOS_ON_DEVICE_CONVERSION_ANALYTICS"
];

/**
 * @type {Object.<string, Function>} Maps each variable name to its applicator function.
 * Each applicator modifies `pluginXmlText` in place when its variable is `true`.
 */
const variableApplicators = {};
/** @type {module:path} Node.js path module (loaded in main). */
let path, cwd, fs, parser;
/** @type {string} Absolute path to this plugin's plugin.xml file. */
let pluginXmlPath, pluginXmlText, pluginXmlData;
let projectPath, modulesPath, pluginNodePath;
let projectPackageJsonPath, projectPackageJsonData;
let configXmlPath, configXmlData;
/** @type {Object} Resolved plugin variable key/value pairs. */
let pluginVariables;
/** @type {boolean} Whether plugin.xml has been modified and needs writing. */
let pluginXmlModified = false;

/**
 * Applicator for `FIREBASE_ANALYTICS_WITHOUT_ADS`.
 *
 * When enabled:
 * - **iOS:** Removes the `FirebaseAnalytics/IdentitySupport` pod entry from plugin.xml
 *   to exclude IDFA (Identifier for Advertisers) support.
 * - **Android:** Sets `google_analytics_adid_collection_enabled` to `false` and
 *   uncomments the `<uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove"/>`
 *   directive to strip the AD_ID permission at build time.
 */
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

/**
 * Applicator for `IOS_ON_DEVICE_CONVERSION_ANALYTICS`.
 *
 * Behaviour depends on the `FIREBASE_ANALYTICS_WITHOUT_ADS` setting:
 * - **Without ads:** Uncomments the `GoogleAdsOnDeviceConversion` pod entry in plugin.xml.
 * - **With ads:** Replaces the separate `FirebaseAnalytics/Core` and
 *   `FirebaseAnalytics/IdentitySupport` pod entries with a single unified
 *   `FirebaseAnalytics` pod (which includes on-device conversion support).
 */
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

/**
 * Resolves plugin variables and applies each enabled variable's applicator function.
 * Writes the modified plugin.xml to disk if any changes were made.
 */
const run = function() {
    pluginVariables = parsePluginVariables();
    for (const variableName of VARIABLE_NAMES) {
        applyPluginVariable(variableName);
    }
    if (pluginXmlModified) writePluginXmlText();
};

/**
 * Invokes the applicator for a single plugin variable if its resolved value is truthy.
 *
 * @param {string} variableName - The plugin variable name to apply.
 */
const applyPluginVariable = function(variableName) {
    const shouldEnable = resolveBoolean(pluginVariables[variableName]);
    if (!shouldEnable) {
        console.log(`Skipping application of ${variableName} as not set to true.`);
        return;
    }
    console.log(`Applying ${variableName}=true to ${PLUGIN_ID}/plugin.xml`);
    variableApplicators[variableName]();
};

/**
 * Coerces a value to a boolean.
 * Handles `undefined`, `null`, booleans, numeric strings, and `"true"`/`"false"` string literals.
 *
 * @param {*} value - The value to resolve.
 * @returns {boolean} The resolved boolean value.
 */
const resolveBoolean = function(value) {
    if (typeof value === 'undefined' || value === null) return false;
    if (value === true || value === false) return value;
    return !isNaN(value) ? parseFloat(value) : /^\s*(true|false)\s*$/i.exec(value) ? RegExp.$1.toLowerCase() === "true" : value;
};

/**
 * Resolves plugin variables using a 3-layer override strategy:
 * 1. Default values from `plugin.xml` `<preference>` elements.
 * 2. Overrides from `config.xml` `<plugin><variable>` elements.
 * 3. Overrides from `package.json` `cordova.plugins` entries (highest priority).
 *
 * @returns {Object} Resolved plugin variable key/value pairs.
 */
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

/**
 * Parses the project's `package.json` file. Result is cached for subsequent calls.
 *
 * @returns {Object|undefined} Parsed package.json content, or undefined on parse failure.
 */
const parsePackageJson = function() {
    if (projectPackageJsonData) return projectPackageJsonData;
    try {
        projectPackageJsonData = JSON.parse(fs.readFileSync(projectPackageJsonPath));
        return projectPackageJsonData;
    } catch(e) {
        console.warn("Failed to parse package.json: " + e.message);
    }
};

/**
 * Parses the project's `config.xml` file to JSON. Result is cached for subsequent calls.
 *
 * @returns {Object|undefined} Parsed config.xml as JSON, or undefined on parse failure.
 */
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

/**
 * Parses the plugin's `plugin.xml` file to JSON. Also stores the raw XML text
 * in `pluginXmlText` for regex-based modifications. Result is cached.
 *
 * @returns {Object} Parsed plugin.xml as JSON.
 */
const parsePluginXml = function() {
    if (pluginXmlData) return pluginXmlData;
    const data = parseXmlFileToJson(pluginXmlPath);
    pluginXmlText = data.text;
    pluginXmlData = data.xml;
    return pluginXmlData;
};

/**
 * Parses an XML file to JSON using the `xml-js` library.
 *
 * @param {string} filepath - Path to the XML file.
 * @param {Object} [parseOpts={compact: true}] - Options passed to `xml-js` parser.
 * @returns {{text: string, xml: Object}} The raw XML text and parsed JSON representation.
 */
const parseXmlFileToJson = function(filepath, parseOpts) {
    parseOpts = parseOpts || {compact: true};
    const text = fs.readFileSync(path.resolve(filepath), 'utf-8');
    const xml = JSON.parse(parser.xml2json(text, parseOpts));
    return {text, xml};
};

/**
 * Writes the modified `pluginXmlText` back to the plugin.xml file on disk.
 */
const writePluginXmlText = function() {
    fs.writeFileSync(pluginXmlPath, pluginXmlText, 'utf-8');
    console.log(`Wrote modified ${PLUGIN_ID}/plugin.xml`);
};

/**
 * Script entry point. Loads dependencies, resolves project paths, and invokes {@link run}.
 * All errors are caught and logged to stderr to avoid breaking `npm install`.
 */
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
