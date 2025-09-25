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
    window['env']['googleMapsApiKey'] = 'AIzaSyAP1JuiYWi0A_Zf8BK0YIfl4nCKoxHnPHU';
    window['env']['tokenForPublicLogRoute'] = '';
    window['env']['mapboxAccessToken'] = 'pk.eyJ1IjoiYWx2YXJvZ2VvdmFuaSIsImEiOiJjbWN5bDFkbG0wcGt4Mm5xNngydnZ0cTUxIn0.e15Wl5VmuU4S2QIiO5242A';

    // Environment variables for Beyco integration
    window['env']['beycoAuthURL'] = '';
    window['env']['beycoClientId'] = '';

})(this);
