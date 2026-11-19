import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { Subscription, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import {
  BiDashboardDto,
  BiReportsApiService,
  extractBiErrorMessage,
} from '../bi-reports-api.service';

export interface RoleOption {
  value: string;
  label: string;
}

/**
 * Administrative Superset Design Studio (/company-reports/studio).
 * Embeds the native Superset UI over same-origin /bi/ (authenticated via Keycloak OIDC)
 * and manages custom published dashboards stored in company.configuration.customBiDashboards.
 */
@Component({
  selector: 'app-company-reports-studio',
  templateUrl: './company-reports-studio.component.html',
  styleUrls: ['./company-reports-studio.component.scss'],
  standalone: false,
})
export class CompanyReportsStudioComponent implements OnInit, OnDestroy {
  readonly roleOptions: RoleOption[] = [
    { value: 'USER', label: 'Operador (USER)' },
    { value: 'COMPANY_ADMIN', label: 'Administrador de Empresa' },
    { value: 'REGIONAL_ADMIN', label: 'Administrador Regional' },
    { value: 'SYSTEM_ADMIN', label: 'Administrador del Sistema' },
  ];

  companyId: number | null = null;
  organizationSlug = 'fortaleza';
  supersetDomain = '';
  allowedDatasets: string[] = [];
  customDashboards: BiDashboardDto[] = [];
  activeSection: 'dashboards' | 'charts' | 'sqllab' = 'dashboards';
  studioIframeSrc: SafeResourceUrl | null = null;
  studioExternalUrl = '';

  publishPanelOpen = true;
  iframeLoading = false;
  submitting = false;
  editingSlug: string | null = null;
  pendingDeleteSlug: string | null = null;
  errorMessage: string | null = null;
  selectedRoles: Set<string> = new Set([
    'USER',
    'COMPANY_ADMIN',
    'REGIONAL_ADMIN',
    'SYSTEM_ADMIN',
  ]);

  publishForm: FormGroup;
  private companySub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private toastr: ToastrService,
    private selectedCompanyService: SelectedUserCompanyService,
    private biReportsApi: BiReportsApiService,
  ) {
    this.publishForm = this.fb.group({
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9][a-z0-9-]{2,120}$/)]],
      label: ['', [Validators.required, Validators.maxLength(120)]],
      description: ['', [Validators.maxLength(300)]],
    });
  }

  ngOnInit(): void {
    this.companySub = this.selectedCompanyService.selectedCompanyProfile$
      .pipe(filter((company) => !!company && typeof company.id === 'number'))
      .subscribe((company) => {
        if (this.companyId !== company.id) {
          this.companyId = company.id;
          void this.loadStudioContext(company.id);
        }
      });
  }

  ngOnDestroy(): void {
    this.companySub?.unsubscribe();
  }

  async loadStudioContext(companyId: number): Promise<void> {
    this.companyId = companyId;
    this.errorMessage = null;
    try {
      const catalog = await firstValueFrom(this.biReportsApi.getDashboards(companyId));
      this.organizationSlug = catalog.organizationSlug || 'fortaleza';
      this.supersetDomain = (catalog.supersetDomain || '').replace(/\/+$/, '');
      this.allowedDatasets = catalog.allowedDatasets || [];
      this.customDashboards = (catalog.dashboards || []).filter((d) => !d.isOfficial);
      if (this.supersetDomain && !this.editingSlug) {
        this.publishPanelOpen = false;
      }
      this.navigateStudio(this.activeSection);
    } catch (err) {
      this.errorMessage = extractBiErrorMessage(
        err,
        'No se pudo inicializar el Estudio de Reportes.',
      );
    }
  }

  navigateStudio(section: 'dashboards' | 'charts' | 'sqllab'): void {
    this.activeSection = section;
    if (!this.supersetDomain) {
      this.studioIframeSrc = null;
      this.studioExternalUrl = '';
      this.iframeLoading = false;
      return;
    }
    const pathMap: Record<'dashboards' | 'charts' | 'sqllab', string> = {
      dashboards: '/dashboard/list/',
      charts: '/chart/add',
      sqllab: '/sqllab/',
    };
    const targetUrl = `${this.supersetDomain}${pathMap[section]}`;
    this.iframeLoading = true;
    this.studioExternalUrl = targetUrl;
    this.studioIframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl);
  }

  onIframeLoad(): void {
    this.iframeLoading = false;
  }

  toggleRole(roleValue: string, checked: boolean): void {
    if (checked) {
      this.selectedRoles.add(roleValue);
    } else {
      this.selectedRoles.delete(roleValue);
    }
  }

  isRoleSelected(roleValue: string): boolean {
    return this.selectedRoles.has(roleValue);
  }

  hasReservedPrefix(): boolean {
    const slug = String(this.publishForm.get('slug')?.value || '')
      .trim()
      .toLowerCase();
    return Boolean(this.organizationSlug && slug.startsWith(`${this.organizationSlug}-cacao-`));
  }

  canSubmitPublish(): boolean {
    return (
      !this.submitting &&
      this.companyId != null &&
      this.publishForm.valid &&
      !this.hasReservedPrefix() &&
      this.selectedRoles.size > 0
    );
  }

  startEditCustomDashboard(item: BiDashboardDto): void {
    this.editingSlug = item.slug;
    this.pendingDeleteSlug = null;
    this.publishPanelOpen = true;
    this.publishForm.setValue({
      slug: item.slug,
      label: item.label || '',
      description: item.description || '',
    });
    const roles = item.allowedRoles && item.allowedRoles.length > 0
      ? item.allowedRoles
      : ['USER', 'COMPANY_ADMIN', 'REGIONAL_ADMIN', 'SYSTEM_ADMIN'];
    this.selectedRoles = new Set(roles);
  }

  cancelEdit(): void {
    this.editingSlug = null;
    this.publishForm.reset({ slug: '', label: '', description: '' });
    this.selectedRoles = new Set([
      'USER',
      'COMPANY_ADMIN',
      'REGIONAL_ADMIN',
      'SYSTEM_ADMIN',
    ]);
  }

  async copyDatasetName(dataset: string): Promise<void> {
    if (!dataset) {
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(dataset);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = dataset;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.toastr.info(`Vista '${dataset}' copiada al portapapeles.`, 'Estudio BI');
    } catch {
      this.toastr.info(`Vista disponible: ${dataset}`, 'Estudio BI');
    }
  }

  async onPublishSubmit(): Promise<void> {
    if (!this.canSubmitPublish() || this.companyId == null) {
      return;
    }
    this.submitting = true;
    this.errorMessage = null;

    const raw = this.publishForm.value;
    const wasEditing = this.editingSlug !== null;
    try {
      await firstValueFrom(
        this.biReportsApi.registerCustomDashboard({
          companyId: this.companyId,
          slug: String(raw.slug || '').trim().toLowerCase(),
          label: String(raw.label || '').trim(),
          description: String(raw.description || '').trim(),
          allowedRoles: Array.from(this.selectedRoles),
        }),
      );
      this.toastr.success(
        wasEditing
          ? 'Tablero actualizado en Reportes & BI.'
          : 'Tablero publicado en Reportes & BI.',
        'Estudio BI',
      );
      this.cancelEdit();
      await this.loadStudioContext(this.companyId);
    } catch (err) {
      const msg = extractBiErrorMessage(err, 'No se pudo publicar el tablero.');
      this.errorMessage = msg;
      this.toastr.error(msg, 'Error al publicar');
    } finally {
      this.submitting = false;
    }
  }

  requestRemoveCustomDashboard(slug: string): void {
    this.pendingDeleteSlug = slug;
  }

  cancelRemoveCustomDashboard(): void {
    this.pendingDeleteSlug = null;
  }

  async confirmRemoveCustomDashboard(slug: string): Promise<void> {
    if (this.companyId == null || this.submitting) {
      return;
    }
    this.submitting = true;
    this.errorMessage = null;
    try {
      await firstValueFrom(this.biReportsApi.removeCustomDashboard(this.companyId, slug));
      this.pendingDeleteSlug = null;
      if (this.editingSlug === slug) {
        this.cancelEdit();
      }
      this.toastr.info(`Tablero '${slug}' retirado de Reportes & BI.`, 'Estudio BI');
      await this.loadStudioContext(this.companyId);
    } catch (err) {
      const msg = extractBiErrorMessage(err, 'No se pudo retirar el tablero.');
      this.errorMessage = msg;
      this.toastr.error(msg, 'Error');
    } finally {
      this.submitting = false;
    }
  }
}
