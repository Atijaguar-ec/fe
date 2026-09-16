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
    this.supersetBaseUrl = (environment as any).supersetBaseUrl || '';
    this.biEnvironment = (environment as any).biEnvironment || 'staging';

    this.companyController.getCompany(this.companyId).subscribe((res) => {
      if (res?.data) {
        this.companyName = res.data.name || '';
        this.orgSlug = this.buildOrgSlug(this.companyName);
        this.selectTab(this.activeTab);
      }
    });
  }

  selectTab(tabId: string): void {
    this.activeTab = tabId;
    const tab = this.tabs.find((t) => t.id === tabId);
    if (tab && this.supersetBaseUrl && this.orgSlug) {
      const slug = `${this.orgSlug}-${tab.slugSuffix}-${this.biEnvironment}`;
      const url = `${this.supersetBaseUrl}/superset/dashboard/${slug}/?standalone=true`;
      this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
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
   * Derives the Superset organization slug from the company name.
   * Matches the convention used in `setup_cacao_superset.py`:
   * e.g. "UNOCACE" -> "unocace", "Fortaleza del Valle" -> "fortaleza"
   */
  private buildOrgSlug(name: string): string {
    const normalized = name.toLowerCase().trim();
    if (normalized.includes('unocace')) {
      return 'unocace';
    }
    if (normalized.includes('fortaleza')) {
      return 'fortaleza';
    }
    // Fallback: use the first word, lowercase, ASCII-safe
    return normalized
      .split(/\s+/)[0]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '');
  }
}
