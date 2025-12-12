(function(window) {

    window['env'] = window['env'] || {};

    // Environment variables
    // NOTA: En CI este archivo se puede regenerar desde env.template.js usando envsubst.
    // Estos valores sirven como fallback seguro en producción cuando no hay variables inyectadas.
    window['env']['environmentName'] = 'development';
    window['env']['appBaseUrl'] = '';  // Rutas relativas para pasar por Nginx (location /api/)
    window['env']['qrCodeBasePath'] = 'q-cd'; // Endpoint público para QR (PublicController)
    window['env']['relativeFileUploadUrl'] = '/api/common/document'; // Subida de archivos (CommonController)
    window['env']['relativeFileUploadUrlManualType'] = '/api/common/document?type='; // Upload manual (ajustar si aplica)
    window['env']['relativeImageUploadUrl'] = '/api/common/image'; // Subida de imágenes (corrige /api/image -> /api/common/image)
    window['env']['relativeImageUploadUrlAllSizes'] = '/api/common/image'; // Mismo endpoint; tamaño vía params en backend
    window['env']['tokenForPublicLogRoute'] = '';

    // Environment variables for Beyco integration
    window['env']['beycoAuthURL'] = '';
    window['env']['beycoClientId'] = '';

    // Product Configuration
    window['env']['PRIMARY_PRODUCT_TYPE'] = 'COCOA'; // COFFEE, COCOA, or SHRIMP

})(this);
