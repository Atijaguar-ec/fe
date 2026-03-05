import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FieldInspectionService, ApiFieldInspection } from '../../../../core/api/field-inspection.service';

declare const $localize: (messageParts: TemplateStringsArray, ...placeholders: any[]) => string;

/**
 * Modal component for selecting a field inspection to link to a delivery.
 * Similar to LabApprovalSelectionModalComponent but for field inspections.
 */
@Component({
  selector: 'app-field-inspection-selection-modal',
  templateUrl: './field-inspection-selection-modal.component.html',
  styleUrls: ['./field-inspection-selection-modal.component.scss']
})
export class FieldInspectionSelectionModalComponent implements OnInit {

  @Input() companyId!: number;
  @Input() onlyRecommended: boolean = false;

  loading = false;
  inspections: ApiFieldInspection[] = [];
  selectedId: number | null = null;
  loadError: string | null = null;

  // Labels
  titleLabel = $localize`:@@fieldInspectionSelectionModal.title:Seleccionar inspección de campo`;
  emptyMessage = $localize`:@@fieldInspectionSelectionModal.empty:No hay inspecciones de campo disponibles para vincular.`;
  skipLabel = $localize`:@@fieldInspectionSelectionModal.skip:Continuar sin inspección`;
  
  dateLabel = $localize`:@@fieldInspectionSelectionModal.date:Fecha`;
  timeLabel = $localize`:@@fieldInspectionSelectionModal.time:Hora`;
  producerLabel = $localize`:@@fieldInspectionSelectionModal.producer:Proveedor`;
  quantityLabel = $localize`:@@fieldInspectionSelectionModal.quantity:Cantidad`;
  flavorLabel = $localize`:@@fieldInspectionSelectionModal.flavor:Sabor`;
  recommendedLabel = $localize`:@@fieldInspectionSelectionModal.recommended:Recomendación`;
  
  detailsTitleLabel = $localize`:@@fieldInspectionSelectionModal.detailsTitle:Detalles de la inspección`;
  receptionDataLabel = $localize`:@@fieldInspectionSelectionModal.receptionData:Datos de recepción`;
  gavetasLabel = $localize`:@@fieldInspectionSelectionModal.gavetas:Gavetas`;
  binesLabel = $localize`:@@fieldInspectionSelectionModal.bines:Bines`;
  piscinasLabel = $localize`:@@fieldInspectionSelectionModal.piscinas:Piscinas`;
  guiaRemisionLabel = $localize`:@@fieldInspectionSelectionModal.guiaRemision:Guía de Remisión`;
  notesLabel = $localize`:@@fieldInspectionSelectionModal.notes:Notas de inspección`;
  notesEmptyLabel = $localize`:@@fieldInspectionSelectionModal.notesEmpty:Sin notas registradas`;
  
  loadingLabel = $localize`:@@fieldInspectionSelectionModal.loading:Cargando inspecciones...`;
  cancelLabel = $localize`:@@fieldInspectionSelectionModal.button.cancel:Cancelar`;
  continueLabel = $localize`:@@fieldInspectionSelectionModal.button.continue:Vincular y continuar`;

  constructor(
    public activeModal: NgbActiveModal,
    private fieldInspectionService: FieldInspectionService
  ) {}

  ngOnInit(): void {
    if (!this.companyId) {
      this.loadError = $localize`:@@fieldInspectionSelectionModal.error.noCompany:No se pudo determinar la compañía.`;
      return;
    }

    this.loading = true;
    this.fieldInspectionService
      .getAvailable(this.companyId, this.onlyRecommended)
      .subscribe({
        next: res => {
          this.inspections = res?.data || [];
          this.loading = false;
        },
        error: () => {
          this.loadError = $localize`:@@fieldInspectionSelectionModal.error.loadFailed:No se pudieron cargar las inspecciones de campo.`;
          this.loading = false;
        }
      });
  }

  select(inspection: ApiFieldInspection) {
    this.selectedId = inspection?.id ?? null;
  }

  isSelected(inspection: ApiFieldInspection): boolean {
    return !!inspection && this.selectedId === inspection.id;
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }

  skip() {
    // Continue without selecting an inspection
    this.activeModal.close(null);
  }

  continue() {
    const selected = this.inspections.find(i => i.id === this.selectedId) || null;
    if (!selected) {
      return;
    }
    this.activeModal.close(selected);
  }

  get selectedInspection(): ApiFieldInspection | null {
    return this.inspections.find(i => i.id === this.selectedId) || null;
  }

  getFlavorResultLabel(result: string | null | undefined): string {
    return this.fieldInspectionService.getFlavorTestResultLabel(result);
  }

  getRecommendedLabel(recommended: boolean | null | undefined): string {
    return this.fieldInspectionService.getPurchaseRecommendedLabel(recommended);
  }

  getFlavorResultClass(result: string | null | undefined): string {
    if (!result) {
      return '';
    }
    return result === 'NORMAL' ? 'text-success' : 'text-danger';
  }

  getRecommendedClass(recommended: boolean | null | undefined): string {
    if (recommended === null || recommended === undefined) {
      return '';
    }
    return recommended ? 'text-success' : 'text-danger';
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return '-';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-EC', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }

  hasReceptionData(inspection: ApiFieldInspection | null): boolean {
    if (!inspection) {
      return false;
    }
    return !!(
      inspection.numberOfGavetas ||
      inspection.numberOfBines ||
      inspection.numberOfPiscinas ||
      inspection.guiaRemisionNumber
    );
  }
}
