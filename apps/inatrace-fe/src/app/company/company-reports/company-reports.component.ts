import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

export interface ReportTab {
  id: string;
  label: string;
  slugSuffix: string;
  description: string;
}

/**
 * Reports & BI — Directly embeds Superset dashboards for the active organization.
 *
 * Provides responsive multi-dashboard navigation tabs so the operator can seamlessly
 * switch between Agrocalidad, Certified Purchases, Weekly Collection, Processing Yields,
 * Plot Georeferencing, and Payment Settlement dashboards.
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
  activeTabId = 'agrocalidad';

  reportTabs: ReportTab[] = [
    {
      id: 'agrocalidad',
      label: 'Agrocalidad (Sistema GUIA)',
      slugSuffix: 'cacao-agrocalidad-guia',
      description: 'Reporte regulatorio oficial de 20 variables para exportación al Sistema GUIA.',
    },
    {
      id: 'compras',
      label: 'Compras Certificadas',
      slugSuffix: 'cacao-compras-certificadas',
      description: 'Desglose por certificación (Orgánico, Transición, Convencional Fairtrade).',
    },
    {
      id: 'acopio',
      label: 'Acopio Semanal & Calidad',
      slugSuffix: 'cacao-acopio-calidad',
      description: 'Evolución semanal de compras por variedad (Nacional vs CCN-51).',
    },
    {
      id: 'procesos',
      label: 'Rendimientos & Procesamiento',
      slugSuffix: 'cacao-procesos-rendimientos',
      description: 'Rendimientos de transformación y trazabilidad de lotes procesados.',
    },
    {
      id: 'parcelas',
      label: 'Productores & Parcelas',
      slugSuffix: 'cacao-productores-parcelas',
      description: 'Georreferenciación y distribución de parcelas de productores.',
    },
    {
      id: 'pagos',
      label: 'Liquidación & Pagos',
      slugSuffix: 'cacao-pagos-conciliacion',
      description: 'Conciliación de pagos frente a costos de compra registrados.',
    },
  ];

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.supersetBaseUrl = this.resolveSupersetBaseUrl();
    this.biEnvironment = this.resolveBiEnvironment();
    this.orgSlug = this.resolveOrgSlug();

    this.selectTab(this.activeTabId);
  }

  selectTab(tabId: string): void {
    this.activeTabId = tabId;
    const tab = this.reportTabs.find((t) => t.id === tabId);
    if (!tab) {
      return;
    }
    const slug = `${this.orgSlug}-${tab.slugSuffix}-${this.biEnvironment}`;
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
