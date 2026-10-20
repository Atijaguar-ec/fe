import { Component, OnInit } from '@angular/core';
import { finalize, take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { faFileImport } from '@fortawesome/free-solid-svg-icons';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { ApiPlotGeoJsonImportResponse } from '../../../../api/model/apiPlotGeoJsonImportResponse';
import { ApiPlotGeoJsonImportIssue } from '../../../../api/model/apiPlotGeoJsonImportIssue';
import { ApiResponseApiPlotGeoJsonImportResponse } from '../../../../api/model/apiResponseApiPlotGeoJsonImportResponse';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import ScopeEnum = ApiPlotGeoJsonImportResponse.ScopeEnum;
import IssueTypeEnum = ApiPlotGeoJsonImportIssue.TypeEnum;

/**
 * Replaces farmer plots with the polygons of a validated GIS survey (GeoJSON).
 *
 * Always two steps: the preview shows what would be deleted and created, and applying
 * sends the preview's numbers back; the backend refuses if the data changed meanwhile.
 * Backend rules: backend/agent-context.md §19.
 */
@Component({
  selector: 'app-company-farmers-plots-import',
  templateUrl: './company-farmers-plots-import.component.html',
  styleUrls: ['./company-farmers-plots-import.component.scss'],
  standalone: false,
})
export class CompanyFarmersPlotsImportComponent implements OnInit {
  readonly scopes = ScopeEnum;
  readonly faFileImport = faFileImport;

  companyId: number;
  companyName: string;

  file: File | null = null;
  scope: ScopeEnum = ScopeEnum.MATCHEDCOMPANIES;
  skipInvalidFeatures = false;

  preview: ApiPlotGeoJsonImportResponse | null = null;
  result: ApiPlotGeoJsonImportResponse | null = null;
  inProgress = false;

  constructor(
    private companyControllerService: CompanyControllerService,
    private toastService: ToastrService,
    private globalEventsManager: GlobalEventManagerService,
    private selUserCompanyService: SelectedUserCompanyService,
  ) {}

  ngOnInit(): void {
    this.selUserCompanyService.selectedCompanyProfile$
      .pipe(take(1))
      .subscribe((cp) => {
        if (cp) {
          this.companyId = cp.id;
          this.companyName = cp.name;
        }
      });
  }

  get canApply(): boolean {
    return (
      !!this.preview &&
      this.preview.plotsToCreate > 0 &&
      (this.preview.issues.length === 0 || this.skipInvalidFeatures)
    );
  }

  get replacedCompanies() {
    return (this.preview?.companies ?? []).filter(
      (c) => c.replaced || c.newPlots > 0,
    );
  }

  fileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.length ? input.files[0] : null;
    this.optionsChanged();
  }

  /** A preview only describes the file and options it was made with. */
  optionsChanged() {
    this.preview = null;
    this.result = null;
  }

  previewImport() {
    this.send(false).then((response) => {
      if (response) {
        this.preview = response;
      }
    });
  }

  async applyImport() {
    if (!this.canApply) {
      return;
    }

    const confirmation = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@companyDetail.farmers.importPlots.confirm.message:${this.preview.plotsToDelete}:deleted: existing plots will be permanently deleted and ${this.preview.plotsToCreate}:created: plots will be created. This cannot be undone. Continue?`,
      options: { centered: true },
      dismissable: false,
    });
    if (confirmation !== 'ok') {
      return;
    }

    const response = await this.send(true);
    // Whatever happened, the preview no longer describes the data: on failure (for
    // example, the plots changed since the preview) the user has to preview again.
    this.preview = null;
    if (response) {
      this.result = response;
      this.toastService.success(
        $localize`:@@companyDetail.farmers.importPlots.success:Plots imported`,
      );
    }
  }

  issueLabel(type: IssueTypeEnum): string {
    switch (type) {
      case IssueTypeEnum.MISSINGFARMERID:
        return $localize`:@@companyDetail.farmers.importPlots.issue.missingFarmerId:The feature has no farmer ID`;
      case IssueTypeEnum.FARMERNOTFOUND:
        return $localize`:@@companyDetail.farmers.importPlots.issue.farmerNotFound:No farmer has this ID`;
      case IssueTypeEnum.FARMERAMBIGUOUS:
        return $localize`:@@companyDetail.farmers.importPlots.issue.farmerAmbiguous:Several farmers have this ID`;
      case IssueTypeEnum.MISSINGPLOTNAME:
        return $localize`:@@companyDetail.farmers.importPlots.issue.missingPlotName:The feature has no plot code`;
      case IssueTypeEnum.DUPLICATEPLOTNAME:
        return $localize`:@@companyDetail.farmers.importPlots.issue.duplicatePlotName:The farmer has this plot code more than once`;
      case IssueTypeEnum.UNSUPPORTEDGEOMETRY:
        return $localize`:@@companyDetail.farmers.importPlots.issue.unsupportedGeometry:The geometry is not a polygon`;
      case IssueTypeEnum.MULTIPARTGEOMETRY:
        return $localize`:@@companyDetail.farmers.importPlots.issue.multipartGeometry:The polygon has several parts`;
      case IssueTypeEnum.POLYGONWITHHOLES:
        return $localize`:@@companyDetail.farmers.importPlots.issue.polygonWithHoles:The polygon has holes`;
      case IssueTypeEnum.INVALIDCOORDINATES:
        return $localize`:@@companyDetail.farmers.importPlots.issue.invalidCoordinates:Invalid coordinates`;
      case IssueTypeEnum.CROPNOTFOUND:
        return $localize`:@@companyDetail.farmers.importPlots.issue.cropNotFound:Unknown crop and the farmer has no product type`;
      default:
        return type;
    }
  }

  /**
   * Resolves to the import result, or to null when the request failed: the token
   * interceptor already showed the backend message and turns the error into a value.
   */
  private send(apply: boolean): Promise<ApiPlotGeoJsonImportResponse | null> {
    if (this.inProgress || !this.file || !this.companyId) {
      return Promise.resolve(null);
    }

    this.inProgress = true;
    this.globalEventsManager.showLoading(true);

    return this.companyControllerService
      .importPlotsGeoJson(
        this.companyId,
        this.scope,
        this.file,
        apply,
        this.skipInvalidFeatures,
        apply ? this.preview.plotsToDelete : undefined,
        apply ? this.preview.plotsToCreate : undefined,
      )
      .pipe(
        take(1),
        finalize(() => {
          this.inProgress = false;
          this.globalEventsManager.showLoading(false);
        }),
      )
      .toPromise()
      .then((response: ApiResponseApiPlotGeoJsonImportResponse) =>
        response?.status === ApiResponseApiPlotGeoJsonImportResponse.StatusEnum.OK
          ? response.data
          : null,
      );
  }
}
