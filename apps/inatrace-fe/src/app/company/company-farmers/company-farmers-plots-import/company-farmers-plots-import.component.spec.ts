import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CompanyFarmersPlotsImportComponent } from './company-farmers-plots-import.component';
import { ApiPlotGeoJsonImportResponse } from '../../../../api/model/apiPlotGeoJsonImportResponse';
import { ApiPlotGeoJsonImportIssue } from '../../../../api/model/apiPlotGeoJsonImportIssue';

describe('CompanyFarmersPlotsImportComponent', () => {
  const preview: ApiPlotGeoJsonImportResponse = {
    applied: false,
    scope: ApiPlotGeoJsonImportResponse.ScopeEnum.COMPANYANDCONNECTED,
    featuresRead: 104,
    plotsToCreate: 95,
    plotsToDelete: 728,
    farmersWithNewPlots: 54,
    geoIdsPending: 0,
    companies: [],
    issues: [
      {
        featureNumber: 37,
        type: ApiPlotGeoJsonImportIssue.TypeEnum.FARMERAMBIGUOUS,
      },
    ],
    farmersWithoutPlots: [],
  };

  let api: jasmine.SpyObj<any>;
  let events: jasmine.SpyObj<any>;
  let component: CompanyFarmersPlotsImportComponent;

  beforeEach(() => {
    api = jasmine.createSpyObj('CompanyControllerService', ['importPlotsGeoJson']);
    events = jasmine.createSpyObj('GlobalEventManagerService', ['showLoading', 'openMessageModal']);
    const toast = jasmine.createSpyObj('ToastrService', ['success']);
    const company = { selectedCompanyProfile$: of({ id: 1, name: 'UNOCACE' }) };

    component = new CompanyFarmersPlotsImportComponent(api, toast, events, company as any);
    component.ngOnInit();
    component.file = new File(['{}'], 'poligonos.geojson');
    component.scope = ApiPlotGeoJsonImportResponse.ScopeEnum.COMPANYANDCONNECTED;
  });

  it('solo permite aplicar con incidencias si se eligió omitirlas', () => {
    component.preview = preview;
    expect(component.canApply).toBe(false);

    component.skipInvalidFeatures = true;
    expect(component.canApply).toBe(true);

    component.preview = { ...preview, plotsToCreate: 0 };
    expect(component.canApply).toBe(false);
  });

  it('descarta la vista previa al cambiar el archivo o el alcance', () => {
    component.preview = preview;
    component.optionsChanged();
    expect(component.preview).toBeNull();
  });

  it('aplica con los números de la vista previa y la descarta', async () => {
    api.importPlotsGeoJson.and.returnValue(
      of({ status: 'OK', data: { ...preview, applied: true } }),
    );
    events.openMessageModal.and.resolveTo('ok');
    component.preview = preview;
    component.skipInvalidFeatures = true;

    await component.applyImport();

    expect(api.importPlotsGeoJson).toHaveBeenCalledWith(
      1, 'COMPANY_AND_CONNECTED', component.file, true, true, 728, 95,
    );
    expect(component.preview).toBeNull();
    expect(component.result.applied).toBe(true);
  });

  it('no envía nada si el usuario no confirma', async () => {
    events.openMessageModal.and.resolveTo('cancel');
    component.preview = preview;
    component.skipInvalidFeatures = true;

    await component.applyImport();

    expect(api.importPlotsGeoJson).not.toHaveBeenCalled();
    expect(component.preview).toBe(preview);
  });

  it('obliga a previsualizar de nuevo si el backend rechaza la importación', async () => {
    // The token interceptor turns HTTP errors into values after showing the toast.
    api.importPlotsGeoJson.and.returnValue(of(new HttpErrorResponse({ status: 400 })));
    events.openMessageModal.and.resolveTo('ok');
    component.preview = preview;
    component.skipInvalidFeatures = true;

    await component.applyImport();

    expect(component.preview).toBeNull();
    expect(component.result).toBeNull();
    expect(component.inProgress).toBe(false);
  });

  it('tiene un texto para cada tipo de incidencia', () => {
    for (const type of Object.values(ApiPlotGeoJsonImportIssue.TypeEnum)) {
      expect(component.issueLabel(type)).not.toEqual(type);
    }
  });
});
