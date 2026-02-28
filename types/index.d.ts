interface FirebasexAnalyticsPlugin {
    AnalyticsConsentMode: {
        ANALYTICS_STORAGE: string;
        AD_STORAGE: string;
        AD_USER_DATA: string;
        AD_PERSONALIZATION: string;
    };

    AnalyticsConsentStatus: {
        GRANTED: string;
        DENIED: string;
    };

    setAnalyticsCollectionEnabled(
        enabled: boolean,
        success?: () => void,
        error?: (err: string) => void
    ): void;

    isAnalyticsCollectionEnabled(
        success: (enabled: boolean) => void,
        error?: (err: string) => void
    ): void;

    setAnalyticsConsentMode(
        consent: { [key: string]: string },
        success?: () => void,
        error?: (err: string) => void
    ): void;

    logEvent(
        name: string,
        params: { [key: string]: any },
        success?: () => void,
        error?: (err: string) => void
    ): void;

    setScreenName(
        name: string,
        success?: () => void,
        error?: (err: string) => void
    ): void;

    setUserId(
        id: string,
        success?: () => void,
        error?: (err: string) => void
    ): void;

    setUserProperty(
        name: string,
        value: string,
        success?: () => void,
        error?: (err: string) => void
    ): void;

    initiateOnDeviceConversionMeasurement(
        userIdentifier: { emailAddress?: string; phoneNumber?: string },
        success?: () => void,
        error?: (err: string) => void
    ): void;
}

declare var FirebasexAnalytics: FirebasexAnalyticsPlugin;
