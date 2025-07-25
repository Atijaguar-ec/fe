(function(window) {

    window['env'] = window['env'] || {};

    // Environment variables for DEVELOPMENT
    window['env']['environmentName'] = 'development';
    window['env']['appBaseUrl'] = 'http://localhost:8080';  // Apuntar directamente al backend en desarrollo
    window['env']['qrCodeBasePath'] = '/api/stock-order'; // Endpoint público para QR (ver PublicController)
    window['env']['relativeFileUploadUrl'] = '/api/document'; // Endpoint para subir archivos (CommonController)
    window['env']['relativeFileUploadUrlManualType'] = '/api/document?type=MANUAL'; // Upload manual (ajustar si aplica)
    window['env']['relativeImageUploadUrl'] = '/api/image'; // Endpoint para subir imágenes (CommonController)
    window['env']['relativeImageUploadUrlAllSizes'] = '/api/image'; // El backend maneja variantes por parámetro, usar mismo endpoint
    window['env']['googleMapsApiKey'] = '';
    window['env']['tokenForPublicLogRoute'] = '';
    window['env']['mapboxAccessToken'] = '';

    // Environment variables for Beyco integration
    window['env']['beycoAuthURL'] = '';
    window['env']['beycoClientId'] = '';

})(this);
