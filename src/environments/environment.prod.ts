// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const env: any = (window as any).env || {};

const parseBoolean = (value: any, defaultValue: boolean): boolean => {
    if (value === true || value === 'true') {
        return true;
    }
    if (value === false || value === 'false') {
        return false;
    }
    return defaultValue;
};

export const environment = {
    production: true,
    environmentName: env.environmentName || 'production',
    basePath: '',
    appBaseUrl: env.appBaseUrl || '',
    qrCodeBasePath: env.qrCodeBasePath || 'q-cd',
    chainRelativeFileUploadUrl: '',
    chainRelativeFileDownloadUrl: '',
    relativeFileUploadUrl: env.relativeFileUploadUrl || '/api/common/document',
    relativeFileUploadUrlManualType: env.relativeFileUploadUrlManualType || '/api/common/document?type=',
    relativeImageUploadUrl: env.relativeImageUploadUrl || '/api/common/image',
    relativeImageUploadUrlAllSizes: env.relativeImageUploadUrlAllSizes || '/api/common/image',
    version: '2.40.0-SNAPSHOT',

    useMapsGoogle: parseBoolean(env.useMapsGoogle, false),
    googleMapsApiKey: env.googleMapsApiKey || '',
    googleAnalyticsId: '',
    mapboxAccessToken: env.mapboxAccessToken || '',
    maptilerApiKey: env.maptilerApiKey || '',
    facebookPixelId: env.facebookPixelId || null,
    intercomAppId: null,
    chatApp: null,
    rocketChatServer: null,
    tokenForPublicLogRoute: env.tokenForPublicLogRoute || '',
    appName: 'INATrace',
    reloadDelay: 500,
    harcodedLabelForPrivacyOnRegisterPage: '',
    beycoAuthURL: env.beycoAuthURL || '',
    beycoClientId: env.beycoClientId || ''
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
