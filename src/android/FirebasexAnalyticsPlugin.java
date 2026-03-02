package org.apache.cordova.firebasex;

import android.os.Bundle;
import android.util.Log;

import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.analytics.FirebaseAnalytics.ConsentType;
import com.google.firebase.analytics.FirebaseAnalytics.ConsentStatus;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Cordova plugin for Firebase Analytics on Android.
 *
 * <p>Provides event logging, user identification, screen tracking, consent mode
 * management, and analytics collection control. The analytics collection enabled
 * state is persisted via {@link FirebasexCorePlugin} shared preferences.
 *
 * @see <a href="https://firebase.google.com/docs/analytics">Firebase Analytics</a>
 */
public class FirebasexAnalyticsPlugin extends CordovaPlugin {
    /** Log tag for all messages from this plugin. */
    private static final String TAG = "FirebasexAnalytics";

    /** SharedPreferences key for the analytics collection enabled state. */
    private static final String ANALYTICS_COLLECTION_ENABLED = "firebase_analytics_collection_enabled";

    /** Firebase Analytics instance obtained during initialisation. */
    private FirebaseAnalytics mFirebaseAnalytics;

    /** Initialises the plugin by obtaining the Firebase Analytics instance. */
    @Override
    protected void pluginInitialize() {
        mFirebaseAnalytics = FirebaseAnalytics.getInstance(cordova.getContext());
    }

    /**
     * Dispatches Cordova actions to plugin methods.
     *
     * <p>Supported actions: logEvent, setScreenName, setUserId, setUserProperty,
     * setAnalyticsCollectionEnabled, isAnalyticsCollectionEnabled, setAnalyticsConsentMode.
     */
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        switch (action) {
            case "logEvent":
                this.logEvent(callbackContext, args.getString(0), args.getJSONObject(1));
                return true;
            case "setScreenName":
                this.setScreenName(callbackContext, args.getString(0));
                return true;
            case "setUserId":
                this.setUserId(callbackContext, args.getString(0));
                return true;
            case "setUserProperty":
                this.setUserProperty(callbackContext, args.getString(0), args.getString(1));
                return true;
            case "setAnalyticsCollectionEnabled":
                this.setAnalyticsCollectionEnabled(callbackContext, args.getBoolean(0));
                return true;
            case "isAnalyticsCollectionEnabled":
                this.isAnalyticsCollectionEnabled(callbackContext);
                return true;
            case "setAnalyticsConsentMode":
                this.setAnalyticsConsentMode(callbackContext, args.getJSONObject(0));
                return true;
            default:
                return false;
        }
    }

    /**
     * Recursively converts a {@link JSONObject} to an Android {@link Bundle}.
     *
     * <p>Supports Integer, Double, Float, nested JSONObject, JSONArray of JSONObjects
     * (converted to ArrayList of Bundles), and String values.
     *
     * @param params the JSON object to convert
     * @return the equivalent Bundle
     * @throws JSONException if JSON parsing fails
     */
    private Bundle createBundleFromJSONObject(final JSONObject params) throws JSONException {
        final Bundle bundle = new Bundle();
        Iterator<String> iter = params.keys();
        while (iter.hasNext()) {
            String key = iter.next();
            Object obj = params.get(key);
            if (obj instanceof Integer) {
                bundle.putInt(key, (Integer) obj);
            } else if (obj instanceof Double) {
                bundle.putDouble(key, (Double) obj);
            } else if (obj instanceof Float) {
                bundle.putFloat(key, (Float) obj);
            } else if (obj instanceof JSONObject) {
                Bundle item = this.createBundleFromJSONObject((JSONObject) obj);
                bundle.putBundle(key, item);
            } else if (obj instanceof JSONArray) {
                JSONArray objArr = (JSONArray) obj;
                ArrayList<Bundle> bundleArray = new ArrayList<>(objArr.length());
                for (int idx = 0; idx < objArr.length(); idx++) {
                    Object tmp = objArr.get(idx);
                    if (tmp instanceof JSONObject) {
                        Bundle item = createBundleFromJSONObject(objArr.getJSONObject(idx));
                        bundleArray.add(item);
                    }
                }
                bundle.putParcelableArrayList(key, bundleArray);
            } else {
                bundle.putString(key, obj.toString());
            }
        }
        return bundle;
    }

    /**
     * Logs a custom analytics event with the given name and parameters.
     *
     * @param callbackContext the Cordova callback
     * @param name            the event name
     * @param params          the event parameters as a JSON object
     * @throws JSONException if parameter conversion fails
     */
    private void logEvent(final CallbackContext callbackContext, final String name, final JSONObject params) throws JSONException {
        final Bundle bundle = this.createBundleFromJSONObject(params);
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    mFirebaseAnalytics.logEvent(name, bundle);
                    callbackContext.success();
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /**
     * Sets the current screen name by logging a {@code screen_view} event.
     *
     * Runs on the UI thread as required by Firebase Analytics.
     *
     * @param callbackContext the Cordova callback
     * @param name            the screen name
     */
    private void setScreenName(final CallbackContext callbackContext, final String name) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                try {
                    Bundle bundle = new Bundle();
                    bundle.putString(FirebaseAnalytics.Param.SCREEN_NAME, name);
                    mFirebaseAnalytics.logEvent(FirebaseAnalytics.Event.SCREEN_VIEW, bundle);
                    callbackContext.success();
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /**
     * Sets the user ID for analytics reporting.
     *
     * @param callbackContext the Cordova callback
     * @param id              the user ID string
     */
    private void setUserId(final CallbackContext callbackContext, final String id) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    mFirebaseAnalytics.setUserId(id);
                    callbackContext.success();
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /**
     * Sets a custom user property for analytics.
     *
     * @param callbackContext the Cordova callback
     * @param name            the property name
     * @param value           the property value
     */
    private void setUserProperty(final CallbackContext callbackContext, final String name, final String value) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    mFirebaseAnalytics.setUserProperty(name, value);
                    callbackContext.success();
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /**
     * Enables or disables analytics data collection.
     *
     * Persists the setting via the core plugin's shared preferences.
     *
     * @param callbackContext the Cordova callback
     * @param enabled         {@code true} to enable, {@code false} to disable
     */
    private void setAnalyticsCollectionEnabled(final CallbackContext callbackContext, final boolean enabled) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    mFirebaseAnalytics.setAnalyticsCollectionEnabled(enabled);
                    FirebasexCorePlugin.getInstance().setPreference(ANALYTICS_COLLECTION_ENABLED, enabled);
                    callbackContext.success();
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /**
     * Queries the analytics data collection enabled state from shared preferences.
     *
     * Returns 1 (enabled) or 0 (disabled) to the callback.
     *
     * @param callbackContext the Cordova callback
     */
    private void isAnalyticsCollectionEnabled(final CallbackContext callbackContext) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    boolean enabled = FirebasexCorePlugin.getInstance().getPreference(ANALYTICS_COLLECTION_ENABLED);
                    callbackContext.success(enabled ? 1 : 0);
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    /**
     * Updates the analytics consent mode settings.
     *
     * <p>Parses the consent JSON object, mapping string keys to {@link ConsentType} enum values
     * and string values to {@link ConsentStatus} enum values, then applies them via
     * {@link FirebaseAnalytics#setConsent(Map)}.
     *
     * @param callbackContext the Cordova callback
     * @param consent         JSON object mapping consent type strings to status strings
     */
    private void setAnalyticsConsentMode(final CallbackContext callbackContext, final JSONObject consent) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    Map<ConsentType, ConsentStatus> consentMap = new EnumMap<>(ConsentType.class);
                    Iterator<String> keys = consent.keys();

                    while (keys.hasNext()) {
                        String key = keys.next();
                        ConsentType consentType = ConsentType.valueOf(key);
                        ConsentStatus consentStatus = ConsentStatus.valueOf(consent.getString(key));
                        consentMap.put(consentType, consentStatus);
                    }

                    mFirebaseAnalytics.setConsent(consentMap);
                    callbackContext.success();
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }
}
