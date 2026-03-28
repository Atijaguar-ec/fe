import { InjectionToken } from '@angular/core';
import { 
  provideKeycloak, 
  withAutoRefreshToken, 
  createInterceptorCondition, 
  IncludeBearerTokenCondition,
  AutoRefreshTokenService,
  UserActivityService,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG
} from 'keycloak-angular';

/**
 * DI token that exposes the configured API base URL to any service in the
 * Nx workspace (host or MFE). Provided automatically by `provideInatraceAuth()`.
 *
 * Usage:
 * ```ts
 * constructor(@Inject(INATRACE_API_BASE_URL) private apiUrl: string) {}
 * ```
 */
export const INATRACE_API_BASE_URL = new InjectionToken<string>(
  'INATRACE_API_BASE_URL'
);

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
    },
    {
      provide: INATRACE_API_BASE_URL,
      useValue: config.apiBaseUrl
    }
  ];
}
