(function (window) {
  window['env'] = window['env'] || {};

  // Environment variables
  window['env']['environmentName'] = '';
  window['env']['appBaseUrl'] = '';
  window['env']['qrCodeBasePath'] = '';
  window['env']['relativeFileUploadUrl'] = '/api/common/document';
  window['env']['relativeFileUploadUrlManualType'] = '/api/common/document?type=';
  window['env']['relativeImageUploadUrl'] = '/api/common/image';
  window['env']['relativeImageUploadUrlAllSizes'] = '/api/common/image';
  window['env']['googleMapsApiKey'] = '';
  window['env']['tokenForPublicLogRoute'] = '';
  window['env']['mapboxAccessToken'] = '';

  // Environment variables for Beyco integration
  window['env']['beycoAuthURL'] = '';
  window['env']['beycoClientId'] = '';

  // Feature flags
  window['env']['enableShrimpModule'] = 'true';
})(this);
