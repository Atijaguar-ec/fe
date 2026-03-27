import { 
  provideKeycloak, 
  withAutoRefreshToken, 
  createInterceptorCondition, 
  IncludeBearerTokenCondition,
  AutoRefreshTokenService,
  UserActivityService
} from 'keycloak-angular';

/**
 * Condición para inyectar automáticamente el Bearer Token en llamadas a la API
 */
const apiCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: /^(http:\/\/localhost:8082\/api)(\/.*)?$/i,
  bearerPrefix: 'Bearer'
});

/**
 * Proveedores de autenticación Keycloak.
 * Configurados para el servidor staging https://auth-staging.ixo-agro.com
 * Para usar SSO silencioso, requiere que exista '/assets/silent-check-sso.html' en la app Host.
 */
export const keycloakProviders = [
  provideKeycloak({
    config: {
      url: 'https://auth-staging.ixo-agro.com',
      realm: 'inatrace',
      clientId: 'inatrace-frontend'
    },
    initOptions: {
      onLoad: 'login-required',
      checkLoginIframe: false
      // silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html'
    },
    features: [
      withAutoRefreshToken({
        sessionTimeout: 60000
      })
    ],
    providers: [
      AutoRefreshTokenService, 
      UserActivityService
    ]
  })
];
