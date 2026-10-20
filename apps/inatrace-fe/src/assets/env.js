(function (window) {
  window['env'] = window['env'] || {};

  // Environment variables
  window['env']['environmentName'] = 'fortaleza';
  window['env']['appBaseUrl'] = 'http://localhost:4200';
  window['env']['apiBaseUrl'] = 'http://localhost:8082/api';
  window['env']['qrCodeBasePath'] = '';
  window['env']['relativeFileUploadUrl'] = '';
  window['env']['relativeFileUploadUrlManualType'] = '';
  window['env']['relativeImageUploadUrl'] = '';
  window['env']['relativeImageUploadUrlAllSizes'] = '';
  window['env']['googleMapsApiKey'] = '';
  window['env']['tokenForPublicLogRoute'] = '';
  window['env']['mapboxAccessToken'] = '';

  // Feature flags
  window['env']['enableShrimpModule'] = 'false';

  // Keycloak authentication
  window['env']['keycloakUrl'] = 'http://localhost:8080/';
  window['env']['keycloakRealm'] = 'fortaleza';
  window['env']['keycloakClientId'] = 'inatrace-frontend';
})(this);
