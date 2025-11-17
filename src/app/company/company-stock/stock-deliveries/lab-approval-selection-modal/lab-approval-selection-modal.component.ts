import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LaboratoryAnalysisService } from '../../../../core/api/laboratory-analysis.service';
import { ApiLaboratoryAnalysis } from '../../../../core/api/laboratory-analysis.service';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { FileSaverService } from 'ngx-filesaver';

declare const $localize: (messageParts: TemplateStringsArray, ...placeholders: any[]) => string;

@Component({
  selector: 'app-lab-approval-selection-modal',
  templateUrl: './lab-approval-selection-modal.component.html',
  styleUrls: ['./lab-approval-selection-modal.component.scss']
})
export class LabApprovalSelectionModalComponent implements OnInit {

  @Input() companyId!: number;

  loading = false;
  analyses: ApiLaboratoryAnalysis[] = [];
  selectedId: number | null = null;
  loadError: string | null = null;

  titleLabel = $localize`:@@labApprovalSelectionModal.title:Seleccionar análisis de laboratorio aprobado`;
  emptyMessage = $localize`:@@labApprovalSelectionModal.empty:No hay análisis aprobados y disponibles para esta compañía.`;
  sampleNumberLabel = $localize`:@@labApprovalSelectionModal.sampleNumber:No. de muestra`;
  analysisDateLabel = $localize`:@@labApprovalSelectionModal.analysisDate:Fecha de análisis`;
  metabisulfiteLabel = $localize`:@@labApprovalSelectionModal.metabisulfite:Metabisulfito aceptable`;
  metabisulfiteYesLabel = $localize`:@@labApprovalSelectionModal.metabisulfite.yes:Sí`;
  metabisulfiteNoLabel = $localize`:@@labApprovalSelectionModal.metabisulfite.no:No`;
  metabisulfiteUnknownLabel = $localize`:@@labApprovalSelectionModal.metabisulfite.unknown:Sin datos`;
  loadingLabel = $localize`:@@labApprovalSelectionModal.loading:Cargando análisis de laboratorio...`;
  cancelLabel = $localize`:@@labApprovalSelectionModal.button.cancel:Cancelar`;
  continueLabel = $localize`:@@labApprovalSelectionModal.button.continue:Continuar`;

  detailsTitleLabel = $localize`:@@labApprovalSelectionModal.detailsTitle:Detalles sensoriales`;
  sensorialParameterLabel = $localize`:@@labApprovalSelectionModal.sensorial.parameter:Parámetro`;
  sensorialRawLabel = $localize`:@@labApprovalSelectionModal.sensorial.raw:Crudo`;
  sensorialCookedLabel = $localize`:@@labApprovalSelectionModal.sensorial.cooked:Cocido`;
  sensorialOdorLabel = $localize`:@@labApprovalSelectionModal.sensorial.odor:Olor`;
  sensorialTasteLabel = $localize`:@@labApprovalSelectionModal.sensorial.taste:Sabor`;
  sensorialColorLabel = $localize`:@@labApprovalSelectionModal.sensorial.color:Color`;
  qualityNotesLabel = $localize`:@@labApprovalSelectionModal.qualityNotes:Notas de calidad`;
  qualityNotesEmptyLabel = $localize`:@@labApprovalSelectionModal.qualityNotes.empty:Sin notas registradas`;
  qualityDocumentLinkLabel = $localize`:@@productLabelStockProcessingOrderDetail.attachment-uploader.qualityDocument.label:Documento de Calidad (PDF)`;

  constructor(
    public activeModal: NgbActiveModal,
    private laboratoryAnalysisService: LaboratoryAnalysisService,
    private commonController: CommonControllerService,
    private fileSaverService: FileSaverService
  ) {}

  ngOnInit(): void {
    if (!this.companyId) {
      this.loadError = $localize`:@@labApprovalSelectionModal.error.noCompany:No se pudo determinar la compañía.`;
      return;
    }

    this.loading = true;
    this.laboratoryAnalysisService
      .getApprovedAvailable(this.companyId, 'ES')
      .subscribe({
        next: res => {
          this.analyses = res?.data || [];
          this.loading = false;
        },
        error: () => {
          this.loadError = $localize`:@@labApprovalSelectionModal.error.loadFailed:No se pudieron cargar los análisis de laboratorio.`;
          this.loading = false;
        }
      });
  }

  select(analysis: ApiLaboratoryAnalysis) {
    this.selectedId = analysis?.id ?? null;
  }

  isSelected(analysis: ApiLaboratoryAnalysis): boolean {
    return !!analysis && this.selectedId === analysis.id;
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }

  continue() {
    const selected = this.analyses.find(a => a.id === this.selectedId) || null;
    if (!selected) {
      return;
    }
    this.activeModal.close(selected);
  }

  get selectedAnalysis(): ApiLaboratoryAnalysis | null {
    return this.analyses.find(a => a.id === this.selectedId) || null;
  }

  downloadQualityDocument() {
    const analysis = this.selectedAnalysis;
    const doc = analysis && analysis.qualityDocument;
    if (!doc || !doc.storageKey) {
      return;
    }

    const sub = this.commonController.getDocument(doc.storageKey).subscribe(res => {
      this.fileSaverService.save(res, doc.name || 'documento-calidad.pdf');
      sub.unsubscribe();
    });
  }
}
