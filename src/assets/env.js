(function(window) {

    window['env'] = window['env'] || {};

    // Environment variables
    // NOTA: En CI este archivo se puede regenerar desde env.template.js usando envsubst.
    // Estos valores sirven como fallback seguro en producción cuando no hay variables inyectadas.
    window['env']['environmentName'] = 'production';
    window['env']['appBaseUrl'] = '';  // Rutas relativas para pasar por Nginx (location /api/)
    window['env']['qrCodeBasePath'] = '/api/stock-order'; // Endpoint público para QR (PublicController)
    window['env']['relativeFileUploadUrl'] = '/api/documents'; // Subida de archivos (CommonController)
    window['env']['relativeFileUploadUrlManualType'] = '/api/documents?type='; // Upload manual (ajustar si aplica)
    window['env']['relativeImageUploadUrl'] = '/api/common/image'; // Subida de imágenes (corrige /api/image -> /api/common/image)
    window['env']['relativeImageUploadUrlAllSizes'] = '/api/common/image'; // Mismo endpoint; tamaño vía params en backend
    window['env']['googleMapsApiKey'] = 'AIzaSyAP1JuiYWi0A_Zf8BK0YIfl4nCKoxHnPHU';
    window['env']['tokenForPublicLogRoute'] = '';
    window['env']['mapboxAccessToken'] = 'pk.eyJ1IjoiYWx2YXJvZ2VvdmFuaSIsImEiOiJjbWN5bDFkbG0wcGt4Mm5xNngydnZ0cTUxIn0.e15Wl5VmuU4S2QIiO5242A';

    // Environment variables for Beyco integration
    window['env']['beycoAuthURL'] = '';
    window['env']['beycoClientId'] = '';

})(this);
