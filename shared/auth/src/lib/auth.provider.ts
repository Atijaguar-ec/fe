import { 
  provideKeycloak, 
  withAutoRefreshToken, 
  createInterceptorCondition, 
  IncludeBearerTokenCondition,
  AutoRefreshTokenService,
  UserActivityService,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG
} from 'keycloak-angular';

export interface InatraceAuthConfig {
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  apiBaseUrl: string;
}

/**
 * Configure Keycloak Providers dynamically per environment.
 * Wires Keycloak init + Bearer token interceptor for API requests.
 */
export function provideInatraceAuth(config: InatraceAuthConfig) {
  const escapedBaseUrl = config.apiBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const apiCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: new RegExp(`^(${escapedBaseUrl})(\\/.*)?$`, 'i'),
    bearerPrefix: 'Bearer'
  });

  return [
    provideKeycloak({
      config: {
        url: config.keycloakUrl,
        realm: config.keycloakRealm,
        clientId: config.keycloakClientId
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false
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
    }),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [apiCondition]
    }
  ];
}
