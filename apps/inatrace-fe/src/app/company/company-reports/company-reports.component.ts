import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { EmbeddedDashboard } from '@superset-ui/embedded-sdk';
import { Subscription, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SelectedUserCompanyService } from '../../core/selected-user-company.service';
import {
  BiDashboardDto,
  BiReportsApiService,
  SupersetEmbedSdkService,
  extractBiErrorMessage,
} from './bi-reports-api.service';

/**
 * Reports & BI — Renders Superset dashboards authorized for the active company
 * using @superset-ui/embedded-sdk and short-lived guest tokens issued by backend/.
 */
@Component({
  selector: 'app-company-reports',
  templateUrl: './company-reports.component.html',
  styleUrls: ['./company-reports.component.scss'],
  standalone: false,
})
export class CompanyReportsComponent implements OnInit, OnDestroy {
  @ViewChild('supersetMountPoint', { static: false })
  supersetMountPoint?: ElementRef<HTMLDivElement>;

  companyId: number | null = null;
  reportTabs: BiDashboardDto[] = [];
  activeSlug = '';
  studioEnabled = false;
  loadingCatalog = false;
  loadingDashboard = false;
  errorMessage: string | null = null;

  private mountedDashboard: EmbeddedDashboard | null = null;
  private companySub: Subscription | null = null;
  private activeMountGeneration = 0;

  constructor(
    private selectedCompanyService: SelectedUserCompanyService,
    private biReportsApi: BiReportsApiService,
    private embedSdk: SupersetEmbedSdkService,
  ) {}

  ngOnInit(): void {
    this.companySub = this.selectedCompanyService.selectedCompanyProfile$
      .pipe(filter((company) => !!company && typeof company.id === 'number'))
      .subscribe((company) => {
        if (this.companyId !== company.id) {
          this.companyId = company.id;
          void this.loadCatalog(company.id);
        }
      });
  }

  ngOnDestroy(): void {
    this.companySub?.unsubscribe();
    this.unmountCurrentDashboard();
  }

  async loadCatalog(companyId: number): Promise<void> {
    this.companyId = companyId;
    this.loadingCatalog = true;
    this.errorMessage = null;
    this.unmountCurrentDashboard();

    try {
      const catalog = await firstValueFrom(this.biReportsApi.getDashboards(companyId));
      this.studioEnabled = Boolean(catalog.studioEnabled);
      this.reportTabs = catalog.dashboards || [];
      if (this.reportTabs.length === 0) {
        this.activeSlug = '';
        this.errorMessage = 'No existen tableros habilitados para su rol en esta empresa.';
        return;
      }
      await this.selectTab(this.reportTabs[0].slug);
    } catch (err) {
      this.reportTabs = [];
      this.activeSlug = '';
      this.errorMessage = extractBiErrorMessage(
        err,
        'No se pudo cargar el catálogo de reportes BI.',
      );
    } finally {
      this.loadingCatalog = false;
    }
  }

  async selectTab(slug: string): Promise<void> {
    if (!this.companyId || !slug) {
      return;
    }
    this.activeSlug = slug;
    this.errorMessage = null;
    this.loadingDashboard = true;
    const generation = ++this.activeMountGeneration;
    this.unmountCurrentDashboard();

    try {
      const tokenResp = await firstValueFrom(
        this.biReportsApi.createGuestToken({
          companyId: this.companyId,
          slug,
        }),
      );
      if (generation !== this.activeMountGeneration) {
        return;
      }
      const mountPoint = this.supersetMountPoint?.nativeElement;
      if (!mountPoint) {
        this.errorMessage = 'No se encontró el contenedor para montar el tablero.';
        return;
      }
      const companyId = this.companyId;
      let initialTokenUsed = false;
      this.mountedDashboard = await this.embedSdk.embed({
        id: tokenResp.embeddedUuid,
        supersetDomain: tokenResp.supersetDomain,
        mountPoint,
        referrerPolicy: 'strict-origin-when-cross-origin',
        fetchGuestToken: async () => {
          if (!initialTokenUsed) {
            initialTokenUsed = true;
            return tokenResp.guestToken;
          }
          const refreshed = await firstValueFrom(
            this.biReportsApi.createGuestToken({ companyId, slug }),
          );
          return refreshed.guestToken;
        },
        dashboardUiConfig: {
          hideTitle: true,
          filters: {
            visible: true,
            expanded: false,
          },
        },
      });
    } catch (err) {
      if (generation === this.activeMountGeneration) {
        this.unmountCurrentDashboard();
        this.errorMessage = extractBiErrorMessage(
          err,
          'No se pudo cargar el tablero seleccionado.',
        );
      }
    } finally {
      if (generation === this.activeMountGeneration) {
        this.loadingDashboard = false;
      }
    }
  }

  private unmountCurrentDashboard(): void {
    if (this.mountedDashboard) {
      try {
        this.mountedDashboard.unmount();
      } catch {
        // Ignore teardown errors when switching views rapidly
      }
      this.mountedDashboard = null;
    }
    const mountPoint = this.supersetMountPoint?.nativeElement;
    if (mountPoint) {
      mountPoint.innerHTML = '';
    }
  }
}
