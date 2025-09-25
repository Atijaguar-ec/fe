// ═══════════════════════════════════════════════════════════════
// 🌍 INATRACE FRONTEND - DYNAMIC ENVIRONMENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════
// This file is processed by envsubst during container startup

window.env = {
  // API Configuration
  API_BASE_URL: '${API_BASE_URL:-}',
  API_TIMEOUT: '${API_TIMEOUT:-30000}',
  
  // Company Configuration
  COMPANY_NAME: '${COMPANY_NAME:-INATrace}',
  COMPANY_THEME: '${COMPANY_THEME:-default}',
  COMPANY_LOGO: '${COMPANY_LOGO:-/assets/logo.png}',
  
  // Feature Flags
  ENABLE_ANALYTICS: '${ENABLE_ANALYTICS:-true}',
  ENABLE_BLOCKCHAIN: '${ENABLE_BLOCKCHAIN:-true}',
  ENABLE_MOBILE_APP: '${ENABLE_MOBILE_APP:-true}',
  
  // Environment Info
  NODE_ENV: '${NODE_ENV:-production}',
  VERSION: '${VERSION:-1.0.0}',
  BUILD_DATE: '${BUILD_DATE:-}',
  
  // External Services
  GOOGLE_MAPS_API_KEY: '${GOOGLE_MAPS_API_KEY:-AIzaSyAP1JuiYWi0A_Zf8BK0YIfl4nCKoxHnPHU}',
  ANALYTICS_ID: '${ANALYTICS_ID:-}',
  
  // Security
  ENABLE_CSP: '${ENABLE_CSP:-true}',
  ALLOWED_ORIGINS: '${ALLOWED_ORIGINS:-*}',
  
  // UI Configuration
  DEFAULT_LANGUAGE: '${DEFAULT_LANGUAGE:-es}',
  SUPPORTED_LANGUAGES: '${SUPPORTED_LANGUAGES:-es,en}',
  THEME_PRIMARY_COLOR: '${THEME_PRIMARY_COLOR:-#2E7D32}',
  THEME_SECONDARY_COLOR: '${THEME_SECONDARY_COLOR:-#4CAF50}',
  
  // Product Configuration
  PRIMARY_PRODUCT_TYPE: '${PRIMARY_PRODUCT_TYPE:-COFFEE}',
  PRODUCT_TYPE: '${PRODUCT_TYPE:-MIXED}',

  // Legacy compatibility - mapped to new structure
  environmentName: '${NODE_ENV:-production}',
  appBaseUrl: '${APP_BASE_URL:-}',  // Empty for Nginx proxy
  qrCodeBasePath: '${QR_CODE_BASE_PATH:-q-cd}',
  relativeFileUploadUrl: '${RELATIVE_FILE_UPLOAD_URL:-/api/common/document}',
  relativeFileUploadUrlManualType: '${RELATIVE_FILE_UPLOAD_URL_MANUAL_TYPE:-/api/common/document?type=}',
  relativeImageUploadUrl: '${RELATIVE_IMAGE_UPLOAD_URL:-/api/common/image}',
  relativeImageUploadUrlAllSizes: '${RELATIVE_IMAGE_UPLOAD_URL_ALL_SIZES:-/api/common/image}',
  googleMapsApiKey: '${GOOGLE_MAPS_API_KEY:-AIzaSyAP1JuiYWi0A_Zf8BK0YIfl4nCKoxHnPHU}',
  tokenForPublicLogRoute: '${TOKEN_FOR_PUBLIC_LOG_ROUTE:-}',
  mapboxAccessToken: '${MAPBOX_ACCESS_TOKEN:-pk.eyJ1IjoiYWx2YXJvZ2VvdmFuaSIsImEiOiJjbWN5bDFkbG0wcGt4Mm5xNngydnZ0cTUxIn0.e15Wl5VmuU4S2QIiO5242A}',
  beycoAuthURL: '${BEYCO_AUTH_URL:-}',
  beycoClientId: '${BEYCO_CLIENT_ID:-}',
  primaryProductType: '${PRIMARY_PRODUCT_TYPE:-COFFEE}'
};