// ═══════════════════════════════════════════════════════════════
// 🌍 INATRACE FRONTEND - DYNAMIC ENVIRONMENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════
// This file is processed by envsubst during container startup

window.env = {
  // API Configuration
  API_BASE_URL: '${API_BASE_URL}',
  API_TIMEOUT: '${API_TIMEOUT:-30000}',
  
  // Company Configuration
  COMPANY_NAME: '${COMPANY_NAME}',
  COMPANY_THEME: '${COMPANY_THEME}',
  COMPANY_LOGO: '${COMPANY_LOGO:-/assets/logo.png}',
  
  // Feature Flags
  ENABLE_ANALYTICS: '${ENABLE_ANALYTICS:-true}',
  ENABLE_BLOCKCHAIN: '${ENABLE_BLOCKCHAIN:-true}',
  ENABLE_MOBILE_APP: '${ENABLE_MOBILE_APP:-true}',
  
  // Environment Info
  NODE_ENV: '${NODE_ENV}',
  VERSION: '${VERSION:-1.0.0}',
  BUILD_DATE: '${BUILD_DATE}',
  
  // External Services
  GOOGLE_MAPS_API_KEY: '${GOOGLE_MAPS_API_KEY}',
  ANALYTICS_ID: '${ANALYTICS_ID}',
  
  // Security
  ENABLE_CSP: '${ENABLE_CSP:-true}',
  ALLOWED_ORIGINS: '${ALLOWED_ORIGINS:-*}',
  
  // UI Configuration
  DEFAULT_LANGUAGE: '${DEFAULT_LANGUAGE:-es}',
  SUPPORTED_LANGUAGES: '${SUPPORTED_LANGUAGES:-es,en}',
  THEME_PRIMARY_COLOR: '${THEME_PRIMARY_COLOR:-#2E7D32}',
  THEME_SECONDARY_COLOR: '${THEME_SECONDARY_COLOR:-#4CAF50}'
};