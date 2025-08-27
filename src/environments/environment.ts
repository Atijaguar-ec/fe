// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    environmentName: (window['env'] && window['env']['environmentName']) || 'development',
    basePath: '',
    appBaseUrl: (window['env'] && window['env']['appBaseUrl']) || '',
    qrCodeBasePath: (window['env'] && window['env']['qrCodeBasePath']) || 'q-cd',
    chainRelativeFileUploadUrl: '',
    chainRelativeFileDownloadUrl: '',
    relativeFileUploadUrl: (window['env'] && window['env']['relativeFileUploadUrl']) || '/api/common/document',
    relativeFileUploadUrlManualType: (window['env'] && window['env']['relativeFileUploadUrlManualType']) || '/api/common/document?type=',
    relativeImageUploadUrl: (window['env'] && window['env']['relativeImageUploadUrl']) || '/api/common/image',
    relativeImageUploadUrlAllSizes: (window['env'] && window['env']['relativeImageUploadUrlAllSizes']) || '/api/common/image',
    version: '2.40.0-SNAPSHOT',

    googleMapsApiKey: (window['env'] && window['env']['googleMapsApiKey']) || 'AIzaSyAP1JuiYWi0A_Zf8BK0YIfl4nCKoxHnPHU',
    googleAnalyticsId: '',
    mapboxAccessToken: (window['env'] && window['env']['mapboxAccessToken']) || 'pk.eyJ1IjoiYWx2YXJvZ2VvdmFuaSIsImEiOiJjbWN5bDFkbG0wcGt4Mm5xNngydnZ0cTUxIn0.e15Wl5VmuU4S2QIiO5242A',
    facebookPixelId: null,
    intercomAppId: null,
    chatApp: null,
    rocketChatServer: null,
    tokenForPublicLogRoute: (window['env'] && window['env']['tokenForPublicLogRoute']) || '',
    appName: 'INATrace',
    reloadDelay: 500,
    harcodedLabelForPrivacyOnRegisterPage: '',
    beycoAuthURL: (window['env'] && window['env']['beycoAuthURL']) || '',
    beycoClientId: (window['env'] && window['env']['beycoClientId']) || ''
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
