const fs = require('fs');
const path = require('path');

const tenant = (process.argv[2] || 'fortaleza').toLowerCase();

const configs = {
  fortaleza: {
    keycloakRealm: 'fortaleza',
    enableShrimpModule: 'false',
    apiBaseUrl: 'http://localhost:8082/api',
    appName: 'INATrace - Fortaleza del Valle'
  },
  unocace: {
    keycloakRealm: 'unocace',
    enableShrimpModule: 'false',
    apiBaseUrl: 'http://localhost:8082/api',
    appName: 'INATrace - UNOCACE'
  },
  dufer: {
    keycloakRealm: 'dufer',
    enableShrimpModule: 'true',
    apiBaseUrl: 'http://localhost:8082/api',
    appName: 'INATrace - Dufer Shrimp'
  }
};

const config = configs[tenant] || configs.fortaleza;

const envContent = `(function (window) {
  window['env'] = window['env'] || {};

  // Environment variables
  window['env']['environmentName'] = '${tenant}';
  window['env']['appBaseUrl'] = 'http://localhost:4200';
  window['env']['apiBaseUrl'] = '${config.apiBaseUrl}';
  window['env']['qrCodeBasePath'] = '';
  window['env']['relativeFileUploadUrl'] = '';
  window['env']['relativeFileUploadUrlManualType'] = '';
  window['env']['relativeImageUploadUrl'] = '';
  window['env']['relativeImageUploadUrlAllSizes'] = '';
  window['env']['googleMapsApiKey'] = '';
  window['env']['tokenForPublicLogRoute'] = '';
  window['env']['mapboxAccessToken'] = '';

  // Feature flags
  window['env']['enableShrimpModule'] = '${config.enableShrimpModule}';

  // Keycloak authentication
  window['env']['keycloakUrl'] = 'http://localhost:8080/';
  window['env']['keycloakRealm'] = '${config.keycloakRealm}';
  window['env']['keycloakClientId'] = 'inatrace-frontend';
})(this);
`;

const envPath = path.resolve(__dirname, '../apps/inatrace-fe/src/assets/env.js');
fs.writeFileSync(envPath, envContent, 'utf-8');
console.log(`✅ [Frontend] Configurado entorno local para: ${tenant.toUpperCase()} (Realm: ${config.keycloakRealm}, Shrimp: ${config.enableShrimpModule})`);
