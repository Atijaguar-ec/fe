import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { CompanyControllerService } from '../../../api/api/companyController.service';

/**
 * Reports & BI — Embeds Superset dashboards for the active company.
 *
 * Each organization (UNOCACE / Fortaleza del Valle) has its own dedicated
 * Superset instance. The dashboard slugs follow the naming convention defined
 * in `inatrace-bi/superset/setup_cacao_superset.py`:
 *
 *   {orgSlug}-cacao-{topic}-{environment}
 *
 * The component builds the slug dynamically from the company name and renders
 * the selected dashboard in standalone mode via a secure iframe.
 */
@Component({
  selector: 'app-company-reports',
  templateUrl: './company-reports.component.html',
  styleUrls: ['./company-reports.component.scss'],
  standalone: false,
})
export class CompanyReportsComponent implements OnInit {
  activeTab = 'agrocalidad';
  companyId: number;
  companyName = '';
  orgSlug = '';
  supersetBaseUrl = '';
  biEnvironment = '';
  focusMode = false;
  showAuthTip = true;
  currentTabDescription = '';

  iframeSrc: SafeResourceUrl | null = null;

  /** Dashboard tabs with their slug suffix and display metadata. */
  readonly tabs: ReadonlyArray<{
    id: string;
    label: string;
    slugSuffix: string;
    icon: string;
    description: string;
  }> = [
    {
      id: 'agrocalidad',
      label: $localize`:@@companyReports.tab.agrocalidad:Agrocalidad (Sistema GUIA)`,
      slugSuffix: 'cacao-agrocalidad-guia',
      icon: '📋',
      description: $localize`:@@companyReports.tab.agrocalidad.desc:Reporte oficial de 26 variables — Acuerdo Ministerial No. 023 del MAG`,
    },
    {
      id: 'certified-purchases',
      label: $localize`:@@companyReports.tab.certifiedPurchases:Compras Certificadas`,
      slugSuffix: 'cacao-compras-certificadas',
      icon: '📦',
      description: $localize`:@@companyReports.tab.certifiedPurchases.desc:Balance de masa y desglose por certificación`,
    },
    {
      id: 'collection',
      label: $localize`:@@companyReports.tab.collection:Acopio y Calidad`,
      slugSuffix: 'cacao-acopio-calidad',
      icon: '📈',
      description: $localize`:@@companyReports.tab.collection.desc:Acopio semanal y excepciones de calidad de recepción`,
    },
    {
      id: 'processing',
      label: $localize`:@@companyReports.tab.processing:Procesos y Rendimientos`,
      slugSuffix: 'cacao-procesos-rendimientos',
      icon: '⚙️',
      description: $localize`:@@companyReports.tab.processing.desc:Balance de procesos y rendimiento post-cosecha`,
    },
    {
      id: 'plots',
      label: $localize`:@@companyReports.tab.plots:Productores y Parcelas`,
      slugSuffix: 'cacao-productores-parcelas',
      icon: '🗺️',
      description: $localize`:@@companyReports.tab.plots.desc:Cobertura de parcelas y georreferenciación`,
    },
    {
      id: 'payments',
      label: $localize`:@@companyReports.tab.payments:Pagos y Conciliación`,
      slugSuffix: 'cacao-pagos-conciliacion',
      icon: '💰',
      description: $localize`:@@companyReports.tab.payments.desc:Conciliación de compras y pagos registrados`,
    },
  ];

  constructor(
    private sanitizer: DomSanitizer,
    private companyController: CompanyControllerService
  ) {}

  ngOnInit(): void {
    this.companyId = Number(localStorage.getItem('selectedUserCompany'));
    this.supersetBaseUrl = this.resolveSupersetBaseUrl();
    this.biEnvironment = this.resolveBiEnvironment();
    this.orgSlug = this.resolveOrgSlug();

    if (this.companyId) {
      this.companyController.getCompany(this.companyId).subscribe({
        next: (res) => {
          if (res?.data?.name) {
            this.companyName = res.data.name;
          }
        },
        error: () => {
          // Gracefully continue with resolved org slug
        },
      });
    }

    this.selectTab(this.activeTab);
  }

  selectTab(tabId: string): void {
    this.activeTab = tabId;
    const tab = this.tabs.find((t) => t.id === tabId);
    if (tab) {
      this.currentTabDescription = tab.description || '';
      if (this.supersetBaseUrl && this.orgSlug) {
        const slug = `${this.orgSlug}-${tab.slugSuffix}-${this.biEnvironment}`;
        const url = `${this.supersetBaseUrl}/superset/dashboard/${slug}/?standalone=true`;
        this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
    }
  }

  toggleFocusMode(): void {
    this.focusMode = !this.focusMode;
  }

  dismissAuthTip(): void {
    this.showAuthTip = false;
  }

  openInSuperset(): void {
    const tab = this.tabs.find((t) => t.id === this.activeTab);
    if (tab && this.supersetBaseUrl && this.orgSlug) {
      const slug = `${this.orgSlug}-${tab.slugSuffix}-${this.biEnvironment}`;
      const url = `${this.supersetBaseUrl}/superset/dashboard/${slug}/`;
      window.open(url, '_blank');
    }
  }

  /**
   * Resolves the Superset base URL.
   * Priority:
   * 1. Explicitly configured supersetBaseUrl in environment/env.js
   * 2. Default reverse-proxy path `/bi` under the current origin (standard in UNOCACE & FV)
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
   */
  private resolveBiEnvironment(): string {
    const configured = (environment as any).biEnvironment;
    if (configured && typeof configured === 'string' && configured.trim().length > 0) {
      return configured.trim().toLowerCase();
    }
    const host = typeof window !== 'undefined' && window.location ? window.location.hostname.toLowerCase() : '';
    if (host.includes('test') || host.includes('staging') || host.includes('localhost')) {
      return 'staging';
    }
    return environment.production ? 'production' : 'staging';
  }

  /**
   * Resolves the tenant organization slug ('unocace' or 'fortaleza').
   * In multi-tier organizations like UNOCACE, the logged-in company may be an affiliated
   * cooperative (e.g. "Cooperativa Muisne Es Vida"), so the authoritative tenant slug
   * is derived from the Keycloak realm or current hostname.
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
