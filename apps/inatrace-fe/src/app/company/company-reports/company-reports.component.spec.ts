import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReplaySubject, of, throwError } from 'rxjs';
import { SelectedUserCompanyService } from '../../core/selected-user-company.service';
import {
  BiDashboardCatalogResponse,
  BiReportsApiService,
  SupersetEmbedSdkService,
} from './bi-reports-api.service';
import { CompanyReportsComponent } from './company-reports.component';

describe('CompanyReportsComponent', () => {
  let fixture: ComponentFixture<CompanyReportsComponent>;
  let component: CompanyReportsComponent;
  let companySubject: ReplaySubject<any>;
  let apiSpy: jasmine.SpyObj<BiReportsApiService>;
  let sdkSpy: jasmine.SpyObj<SupersetEmbedSdkService>;
  let mountedMock: { unmount: jasmine.Spy };
  let router: Router;

  const sampleCatalog: BiDashboardCatalogResponse = {
    supersetDomain: 'https://testinatrace.espam.edu.ec/bi',
    organizationSlug: 'fortaleza',
    studioEnabled: false,
    allowedDatasets: ['bi.rpt_cacao_arqueo_bascula_fortaleza'],
    dashboards: [
      {
        slug: 'fortaleza-cacao-arqueo-bascula-staging',
        label: 'REGISTRO DE PESO POR PRODUCTOR',
        description: 'Arqueo',
        isOfficial: true,
        sortOrder: 10,
        allowedRoles: ['USER', 'REGIONAL_ADMIN'],
      },
      {
        slug: 'fv-custom',
        label: 'Personalizado',
        description: 'Custom',
        isOfficial: false,
        sortOrder: 100,
        allowedRoles: ['USER'],
      },
    ],
  };

  beforeEach(async () => {
    companySubject = new ReplaySubject<any>(1);
    mountedMock = { unmount: jasmine.createSpy('unmount') };
    apiSpy = jasmine.createSpyObj('BiReportsApiService', [
      'getDashboards',
      'createGuestToken',
    ]);
    sdkSpy = jasmine.createSpyObj('SupersetEmbedSdkService', ['embed']);
    sdkSpy.embed.and.returnValue(Promise.resolve(mountedMock as any));

    await TestBed.configureTestingModule({
      declarations: [CompanyReportsComponent],
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        {
          provide: SelectedUserCompanyService,
          useValue: { selectedCompanyProfile$: companySubject.asObservable() },
        },
        { provide: BiReportsApiService, useValue: apiSpy },
        { provide: SupersetEmbedSdkService, useValue: sdkSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(CompanyReportsComponent);
    component = fixture.componentInstance;
  });

  it('mounts authorized dashboard using @superset-ui/embedded-sdk', async () => {
    apiSpy.getDashboards.and.returnValue(of(sampleCatalog));
    apiSpy.createGuestToken.and.returnValue(
      of({
        supersetDomain: 'https://testinatrace.espam.edu.ec/bi',
        embeddedUuid: 'uuid-fv-1',
        guestToken: 'guest.jwt.token',
        expiresInSeconds: 300,
      }),
    );

    fixture.detectChanges();
    companySubject.next({ id: 5, name: 'Fortaleza del Valle' });
    await component.loadCatalog(5);
    fixture.detectChanges();

    expect(apiSpy.getDashboards).toHaveBeenCalledWith(5);
    expect(sdkSpy.embed).toHaveBeenCalled();
    const embedCall = sdkSpy.embed.calls.mostRecent().args[0];
    expect(embedCall.id).toBe('uuid-fv-1');
    expect(embedCall.supersetDomain).toBe('https://testinatrace.espam.edu.ec/bi');
    expect(component.errorMessage).toBeNull();
  });

  it('shows error banner and skips embedDashboard when backend returns 422', async () => {
    apiSpy.getDashboards.and.returnValue(of(sampleCatalog));
    apiSpy.createGuestToken.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              status: 'VALIDATION_ERROR',
              errorMessage: 'El tablero no autoriza el dominio del portal.',
            },
          }),
      ),
    );

    fixture.detectChanges();
    await component.loadCatalog(5);
    fixture.detectChanges();

    expect(sdkSpy.embed).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('El tablero no autoriza el dominio del portal.');
  });

  it('unmounts previous dashboard on tab change and destroy', async () => {
    apiSpy.getDashboards.and.returnValue(of(sampleCatalog));
    apiSpy.createGuestToken.and.returnValue(
      of({
        supersetDomain: 'https://testinatrace.espam.edu.ec/bi',
        embeddedUuid: 'uuid-fv-1',
        guestToken: 'guest.jwt.token',
        expiresInSeconds: 300,
      }),
    );

    fixture.detectChanges();
    await component.loadCatalog(5);
    await component.selectTab('fv-custom');
    component.ngOnDestroy();

    expect(mountedMock.unmount).toHaveBeenCalledTimes(2);
  });

  it('selects tab requested by ?report query parameter when authorized', async () => {
    apiSpy.getDashboards.and.returnValue(of(sampleCatalog));
    apiSpy.createGuestToken.and.returnValue(
      of({
        supersetDomain: 'https://testinatrace.espam.edu.ec/bi',
        embeddedUuid: 'uuid-custom-2',
        guestToken: 'guest.jwt.custom',
        expiresInSeconds: 300,
      }),
    );

    await router.navigate([], { queryParams: { report: 'fv-custom' } });
    fixture.detectChanges();
    await component.loadCatalog(5);

    expect(component.activeSlug).toBe('fv-custom');
    expect(component.activeDashboard?.isOfficial).toBe(false);
    expect(apiSpy.createGuestToken).toHaveBeenCalledWith({
      companyId: 5,
      slug: 'fv-custom',
    });
  });

  it('retries failed dashboard mount and toggles fullscreen cleanly with Escape', async () => {
    apiSpy.getDashboards.and.returnValue(of(sampleCatalog));
    apiSpy.createGuestToken.and.returnValues(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            error: { status: 'UPSTREAM_HTTP_ERROR', errorMessage: 'Superset temporalmente no disponible.' },
          }),
      ),
      of({
        supersetDomain: 'https://testinatrace.espam.edu.ec/bi',
        embeddedUuid: 'uuid-fv-1',
        guestToken: 'guest.jwt.recovered',
        expiresInSeconds: 300,
      }),
    );

    fixture.detectChanges();
    await component.loadCatalog(5);
    expect(component.errorMessage).toContain('Superset temporalmente no disponible.');

    await component.retryCurrent();
    expect(component.errorMessage).toBeNull();
    expect(sdkSpy.embed).toHaveBeenCalledTimes(1);

    component.toggleFullscreen();
    expect(component.isFullscreen).toBe(true);
    component.onEscapeKey();
    expect(component.isFullscreen).toBe(false);
  });
});
