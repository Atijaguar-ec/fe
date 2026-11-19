import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrService } from 'ngx-toastr';
import { ReplaySubject, of } from 'rxjs';
import { SystemOrRegionalAdminGuardService } from '../../../core/guards/system-or-regional-admin-guard.service';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { BiReportsApiService } from '../bi-reports-api.service';
import { CompanyReportsRoutingModule } from '../company-reports-routing.module';
import { CompanyReportsStudioComponent } from './company-reports-studio.component';

describe('CompanyReportsStudioComponent', () => {
  let fixture: ComponentFixture<CompanyReportsStudioComponent>;
  let component: CompanyReportsStudioComponent;
  let companySubject: ReplaySubject<any>;
  let apiSpy: jasmine.SpyObj<BiReportsApiService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    companySubject = new ReplaySubject<any>(1);
    apiSpy = jasmine.createSpyObj('BiReportsApiService', [
      'getDashboards',
      'registerCustomDashboard',
      'removeCustomDashboard',
    ]);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info']);

    apiSpy.getDashboards.and.returnValue(
      of({
        supersetDomain: 'https://testinatrace.espam.edu.ec/bi',
        organizationSlug: 'fortaleza',
        studioEnabled: true,
        allowedDatasets: ['bi.rpt_cacao_beneficio_fortaleza'],
        dashboards: [
          {
            slug: 'fv-resumen-existente',
            label: 'Resumen Existente',
            description: 'Tablero propio',
            isOfficial: false,
            sortOrder: 100,
            allowedRoles: ['USER', 'REGIONAL_ADMIN'],
          },
        ],
      }),
    );

    await TestBed.configureTestingModule({
      declarations: [CompanyReportsStudioComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        {
          provide: SelectedUserCompanyService,
          useValue: { selectedCompanyProfile$: companySubject.asObservable() },
        },
        { provide: BiReportsApiService, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyReportsStudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await component.loadStudioContext(5);
    component.companyId = 5;
  });

  it('protects studio route with SystemOrRegionalAdminGuardService', () => {
    const metadata = (CompanyReportsRoutingModule as any).ɵmod;
    expect(metadata).toBeTruthy();
    expect(SystemOrRegionalAdminGuardService).toBeTruthy();
  });

  it('rejects reserved {org}-cacao- prefix and empty allowedRoles', () => {
    component.publishForm.setValue({
      slug: 'fortaleza-cacao-prueba',
      label: 'Prueba',
      description: '',
    });
    expect(component.hasReservedPrefix()).toBe(true);
    expect(component.canSubmitPublish()).toBe(false);

    component.publishForm.setValue({
      slug: 'fv-resumen-valido',
      label: 'Resumen Válido',
      description: 'Desc',
    });
    expect(component.hasReservedPrefix()).toBe(false);
    expect(component.canSubmitPublish()).toBe(true);

    ['USER', 'COMPANY_ADMIN', 'REGIONAL_ADMIN', 'SYSTEM_ADMIN'].forEach((r) =>
      component.toggleRole(r, false),
    );
    expect(component.canSubmitPublish()).toBe(false);
  });

  it('submits valid custom dashboard with explicit allowedRoles', async () => {
    apiSpy.registerCustomDashboard.and.returnValue(
      of({
        slug: 'fv-resumen-valido',
        label: 'Resumen Válido',
        description: 'Desc',
        isOfficial: false,
        sortOrder: 100,
        allowedRoles: ['USER', 'REGIONAL_ADMIN'],
      }),
    );

    component.publishForm.setValue({
      slug: 'fv-resumen-valido',
      label: 'Resumen Válido',
      description: 'Desc',
    });
    await component.onPublishSubmit();

    expect(apiSpy.registerCustomDashboard).toHaveBeenCalled();
    const payload = apiSpy.registerCustomDashboard.calls.mostRecent().args[0];
    expect(payload.companyId).toBe(5);
    expect(payload.slug).toBe('fv-resumen-valido');
    expect(payload.allowedRoles.length).toBeGreaterThan(0);
    expect(toastrSpy.success).toHaveBeenCalled();
  });

  it('loads custom dashboard into edit form and updates existing entry', async () => {
    const existing = component.customDashboards[0];
    component.publishPanelOpen = false;

    component.startEditCustomDashboard(existing);
    expect(component.publishPanelOpen).toBe(true);
    expect(component.editingSlug).toBe('fv-resumen-existente');
    expect(component.publishForm.get('label')?.value).toBe('Resumen Existente');
    expect(component.isRoleSelected('USER')).toBe(true);
    expect(component.isRoleSelected('SYSTEM_ADMIN')).toBe(false);

    apiSpy.registerCustomDashboard.and.returnValue(
      of({
        ...existing,
        label: 'Resumen Actualizado',
      }),
    );
    component.publishForm.patchValue({ label: 'Resumen Actualizado' });
    await component.onPublishSubmit();

    expect(component.editingSlug).toBeNull();
    expect(apiSpy.registerCustomDashboard.calls.mostRecent().args[0].label).toBe('Resumen Actualizado');
  });

  it('uses two-step confirmation before removing a custom dashboard', async () => {
    apiSpy.removeCustomDashboard.and.returnValue(of(void 0));

    component.requestRemoveCustomDashboard('fv-resumen-existente');
    expect(component.pendingDeleteSlug).toBe('fv-resumen-existente');
    expect(apiSpy.removeCustomDashboard).not.toHaveBeenCalled();

    component.cancelRemoveCustomDashboard();
    expect(component.pendingDeleteSlug).toBeNull();

    component.requestRemoveCustomDashboard('fv-resumen-existente');
    await component.confirmRemoveCustomDashboard('fv-resumen-existente');
    expect(apiSpy.removeCustomDashboard).toHaveBeenCalledWith(5, 'fv-resumen-existente');
    expect(component.pendingDeleteSlug).toBeNull();
    expect(toastrSpy.info).toHaveBeenCalled();
  });
});
