import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  EmbedDashboardParams,
  EmbeddedDashboard,
  embedDashboard,
} from '@superset-ui/embedded-sdk';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BiApiResponse<T> {
  status: string;
  errorMessage?: string;
  data?: T;
}

export interface BiDashboardDto {
  slug: string;
  label: string;
  description: string;
  isOfficial: boolean;
  sortOrder: number;
  allowedRoles: string[];
}

export interface BiDashboardCatalogResponse {
  supersetDomain: string;
  organizationSlug: string;
  studioEnabled: boolean;
  allowedDatasets: string[];
  dashboards: BiDashboardDto[];
}

export interface BiGuestTokenRequest {
  companyId: number;
  slug: string;
}

export interface BiGuestTokenResponse {
  supersetDomain: string;
  embeddedUuid: string;
  guestToken: string;
  expiresInSeconds: number;
}

export interface CustomBiDashboardRequest {
  companyId: number;
  slug: string;
  label: string;
  description?: string;
  sortOrder?: number;
  allowedRoles: string[];
}

export function extractBiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.error && typeof err.error === 'object' && err.error.errorMessage) {
      return String(err.error.errorMessage);
    }
    if (err.status === 401 || err.status === 403) {
      return 'No tiene permisos para acceder a este reporte.';
    }
    if (err.status === 404) {
      return 'El tablero solicitado no existe o no tiene embebido activado.';
    }
    if (err.status === 503) {
      return 'El servicio de reportes BI no está disponible en este momento.';
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

@Injectable({
  providedIn: 'root',
})
export class SupersetEmbedSdkService {
  embed(params: EmbedDashboardParams): Promise<EmbeddedDashboard> {
    return embedDashboard(params);
  }
}

@Injectable({
  providedIn: 'root',
})
export class BiReportsApiService {
  constructor(private http: HttpClient) {}

  getDashboards(companyId: number): Observable<BiDashboardCatalogResponse> {
    const params = new HttpParams().set('companyId', String(companyId));
    return this.unwrapResponse(
      this.http.get<BiApiResponse<BiDashboardCatalogResponse>>(
        `${this.resolveBiApiRoot()}/dashboards`,
        { params },
      ),
    );
  }

  createGuestToken(request: BiGuestTokenRequest): Observable<BiGuestTokenResponse> {
    return this.unwrapResponse(
      this.http.post<BiApiResponse<BiGuestTokenResponse>>(
        `${this.resolveBiApiRoot()}/guest-token`,
        request,
      ),
    );
  }

  registerCustomDashboard(request: CustomBiDashboardRequest): Observable<BiDashboardDto> {
    return this.unwrapResponse(
      this.http.post<BiApiResponse<BiDashboardDto>>(
        `${this.resolveBiApiRoot()}/custom-dashboards`,
        request,
      ),
    );
  }

  removeCustomDashboard(companyId: number, slug: string): Observable<void> {
    const params = new HttpParams().set('companyId', String(companyId));
    return this.http
      .delete<BiApiResponse<unknown>>(
        `${this.resolveBiApiRoot()}/custom-dashboards/${encodeURIComponent(slug)}`,
        { params },
      )
      .pipe(
        map((res) => {
          if (res instanceof HttpErrorResponse) {
            throw res;
          }
          if (res && res.status && res.status !== 'OK') {
            throw new Error(res.errorMessage || 'No se pudo eliminar el tablero personalizado.');
          }
          return undefined;
        }),
        catchError((err) => throwError(() => err)),
      );
  }

  private unwrapResponse<T>(obs$: Observable<BiApiResponse<T>>): Observable<T> {
    return obs$.pipe(
      map((res) => {
        if (res instanceof HttpErrorResponse) {
          throw res;
        }
        if (!res || res.status !== 'OK' || res.data == null) {
          throw new Error(res?.errorMessage || 'Respuesta inválida del servicio BI.');
        }
        return res.data;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  private resolveBiApiRoot(): string {
    const apiBase = (environment.apiBaseUrl || '').trim().replace(/\/+$/, '');
    if (apiBase) {
      return apiBase.endsWith('/api') ? `${apiBase}/bi` : `${apiBase}/api/bi`;
    }
    const basePath = (environment.basePath || '').trim().replace(/\/+$/, '');
    return basePath ? `${basePath}/api/bi` : '/api/bi';
  }
}
