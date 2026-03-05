(function(window) {

    window['env'] = window['env'] || {};

    // Environment variables for DEVELOPMENT
    window['env']['environmentName'] = 'development';
    window['env']['appBaseUrl'] = '';  // Apuntar directamente al backend en desarrollo
    window['env']['qrCodeBasePath'] = 'q-cd'; // Endpoint público para QR (ver PublicController)
    window['env']['relativeFileUploadUrl'] = '/api/common/document'; // Endpoint para subir archivos (CommonController)
    window['env']['relativeFileUploadUrlManualType'] = '/api/common/document?type=MANUAL'; // Upload manual (ajustar si aplica)
    window['env']['relativeImageUploadUrl'] = '/api/common/image'; // Endpoint para subir imágenes (CommonController)
    window['env']['relativeImageUploadUrlAllSizes'] = '/api/common/image'; // El backend maneja variantes por parámetro, usar mismo endpoint
    window['env']['useMapsGoogle'] = false;
    window['env']['googleMapsApiKey'] = '';
    window['env']['tokenForPublicLogRoute'] = '';
    window['env']['mapboxAccessToken'] = '';
    window['env']['maptilerApiKey'] = '';
    window['env']['facebookPixelId'] = null;

    // Environment variables for Beyco integration
    window['env']['beycoAuthURL'] = '';
    window['env']['beycoClientId'] = '';

    window['env']['COMPANY_NAME'] = 'UNOCACE';
    // Product Configuration
    window['env']['PRIMARY_PRODUCT_TYPE'] = 'COCOA'; // COFFEE, COCOA, or SHRIMP

})(this);
