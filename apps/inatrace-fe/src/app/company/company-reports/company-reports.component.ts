import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

/**
 * Reports & BI — Directly embeds the Superset dashboard for the active organization.
 *
 * All redundant headers and tabs are removed so the operator immediately accesses
 * the official cacao dashboard and can navigate Superset natively without login prompts.
 */
@Component({
  selector: 'app-company-reports',
  templateUrl: './company-reports.component.html',
  styleUrls: ['./company-reports.component.scss'],
  standalone: false,
})
export class CompanyReportsComponent implements OnInit {
  orgSlug = '';
  supersetBaseUrl = '';
  biEnvironment = '';
  iframeSrc: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.supersetBaseUrl = this.resolveSupersetBaseUrl();
    this.biEnvironment = this.resolveBiEnvironment();
    this.orgSlug = this.resolveOrgSlug();

    // Directly load the official Agrocalidad dashboard (standard for Cacao cooperatives)
    const slug = `${this.orgSlug}-cacao-agrocalidad-guia-${this.biEnvironment}`;
    const url = `${this.supersetBaseUrl}/superset/dashboard/${slug}/`;
    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Resolves the Superset base URL.
   * Priority:
   * 1. Explicitly configured supersetBaseUrl in environment/env.js
   * 2. Default reverse-proxy path `/bi` under current origin (standard in UNOCACE & FV)
   */
  private resolveSupersetBaseUrl(): string {
    const configured = (environment as any).supersetBaseUrl;
    if (configured && typeof configured === 'string' && configured.trim().length > 0) {
      return configured.trim().replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/bi`;
    }
    return '/bi';
  }

  /**
   * Resolves the target BI environment ('staging' or 'production').
   * Detects staging/test environments from hostname first to prevent wrong dashboard slug routing.
   */
  private resolveBiEnvironment(): string {
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname.toLowerCase();
      if (host.includes('test') || host.includes('staging') || host.includes('localhost')) {
        return 'staging';
      }
    }
    const envBi = (window as any)['env']?.biEnvironment || (environment as any).biEnvironment;
    if (envBi && typeof envBi === 'string' && envBi.trim().length > 0) {
      return envBi.trim().toLowerCase();
    }
    return environment.production ? 'production' : 'staging';
  }

  /**
   * Resolves the tenant organization slug ('unocace' or 'fortaleza').
   */
  private resolveOrgSlug(): string {
    const realm =
      ((window as any)['env'] || {})['keycloakRealm'] ||
      environment.keycloakRealm ||
      '';
    const normalizedRealm = realm.toLowerCase().trim();
    if (normalizedRealm.includes('unocace')) {
      return 'unocace';
    }
    if (normalizedRealm.includes('fortaleza')) {
      return 'fortaleza';
    }

    const host = typeof window !== 'undefined' && window.location ? window.location.hostname.toLowerCase() : '';
    if (host.includes('unocace')) {
      return 'unocace';
    }
    if (host.includes('fortaleza') || host.includes('espam')) {
      return 'fortaleza';
    }

    return 'unocace';
  }
}
