export const environment = {
  production: false,
  environmentName: (window['env'] || {})['environmentName'] || 'DEV',
  basePath: ((window['env'] || {})['apiBaseUrl'] || 'http://localhost:8082/api').replace(/\/api$/, ''),
  appBaseUrl: (window['env'] || {})['appBaseUrl'] || 'http://localhost:4200',
  qrCodeBasePath: (window['env'] || {})['qrCodeBasePath'] || 'q-cd',
  chainRelativeFileUploadUrl: '',
  chainRelativeFileDownloadUrl: '',
  relativeFileUploadUrl: (window['env'] || {})['relativeFileUploadUrl'] || '/api/common/document',
  relativeFileUploadUrlManualType:
    (window['env'] || {})['relativeFileUploadUrlManualType'] || '/api/common/document',
  relativeImageUploadUrl: (window['env'] || {})['relativeImageUploadUrl'] || '/api/common/image',
  relativeImageUploadUrlAllSizes:
    (window['env'] || {})['relativeImageUploadUrlAllSizes'] || '/api/common/image',
  version: '2.41.0-SNAPSHOT',

  googleMapsApiKey: (window['env'] || {})['googleMapsApiKey'] || '',
  googleAnalyticsId: '',
  mapboxAccessToken: (window['env'] || {})['mapboxAccessToken'] || '',
  facebookPixelId: null,
  intercomAppId: null,
  chatApp: null,
  rocketChatServer: null,
  tokenForPublicLogRoute: (window['env'] || {})['tokenForPublicLogRoute'] || '',
  appName: 'INATrace',
  reloadDelay: 500,
  harcodedLabelForPrivacyOnRegisterPage: '',
  beycoAuthURL: (window['env'] || {})['beycoAuthURL'] || '',
  beycoClientId: (window['env'] || {})['beycoClientId'] || '',
  apiBaseUrl: (window['env'] || {})['apiBaseUrl'] || 'http://localhost:8082/api',
  keycloakUrl: (window['env'] || {})['keycloakUrl'] || 'http://localhost:8080/',
  keycloakRealm: (window['env'] || {})['keycloakRealm'] || 'inatrace',
  keycloakClientId: (window['env'] || {})['keycloakClientId'] || 'inatrace-frontend'
};
