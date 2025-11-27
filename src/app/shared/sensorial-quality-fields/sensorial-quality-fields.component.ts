import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { ShrimpFlavorDefectControllerService } from '../../../api/api/shrimpFlavorDefectController.service';
import { ShrimpColorGradeControllerService } from '../../../api/api/shrimpColorGradeController.service';
import { take } from 'rxjs/operators';

declare const $localize: (messageParts: TemplateStringsArray, ...placeholders: any[]) => string;

/**
 * Shared component for sensorial analysis and quality fields.
 * Used in both processing orders (laboratory) and deliveries (collection facility for shrimp).
 * 
 * Fields included:
 * - Sample number
 * - Sensorial analysis (raw/cooked: odor, taste, color)
 * - Metabisulfite level acceptable
 * - Approved for purchase
 * - Quality document (PDF)
 * - Quality notes
 */
@Component({
  selector: 'app-sensorial-quality-fields',
  templateUrl: './sensorial-quality-fields.component.html',
  styleUrls: ['./sensorial-quality-fields.component.scss']
})
export class SensorialQualityFieldsComponent implements OnInit {

  @Input() formGroup!: FormGroup;
  @Input() submitted: boolean = false;
  @Input() fieldIndex: number = 0;
  
  /** Whether to show sample number field */
  @Input() showSampleNumber: boolean = true;
  
  /** Whether sample number is required */
  @Input() sampleNumberRequired: boolean = false;

  // Codebook para Olor y Sabor: Okay + Defectos (Arena, Palo, etc.)
  flavorOptionsCodebook: EnumSifrant = EnumSifrant.fromObject({});
  
  // Codebook para Color: A1, A2, A3, A4
  colorOptionsCodebook: EnumSifrant = EnumSifrant.fromObject({});
  
  // Codebook para Intensidad: Leve, Fuerte, Moderado
  intensityCodebook: EnumSifrant = EnumSifrant.fromObject({
    LEVE: $localize`:@@sensorialQualityFields.intensity.leve:Leve`,
    MODERADO: $localize`:@@sensorialQualityFields.intensity.moderado:Moderado`,
    FUERTE: $localize`:@@sensorialQualityFields.intensity.fuerte:Fuerte`
  });

  constructor(
    private shrimpFlavorDefectService: ShrimpFlavorDefectControllerService,
    private shrimpColorGradeService: ShrimpColorGradeControllerService
  ) {}

  ngOnInit(): void {
    this.ensureFormControls();
    this.loadSensorialOptions();
  }

  /**
   * Carga las opciones para los campos de análisis sensorial.
   * - Olor/Sabor: "Okay" + defectos del catálogo ShrimpFlavorDefect
   * - Color: del catálogo ShrimpColorGrade (A1, A2, A3, A4)
   */
  private async loadSensorialOptions(): Promise<void> {
    // Cargar defectos de sabor para Olor y Sabor
    try {
      const res = await this.shrimpFlavorDefectService
        .getActiveShrimpFlavorDefects('ES')
        .pipe(take(1))
        .toPromise();
      
      const items = res?.data || [];
      
      // Construir codebook: primero "Normal", luego todos los defectos
      const map: Record<string, string> = {
        NORMAL: this.normalLabel
      };
      
      items.forEach(defect => {
        if (defect && defect.id != null) {
          map[String(defect.id)] = defect.label || defect.code;
        }
      });
      
      this.flavorOptionsCodebook = EnumSifrant.fromObject(map);
    } catch (_) {
      this.flavorOptionsCodebook = EnumSifrant.fromObject({
        NORMAL: this.normalLabel
      });
    }

    // Cargar grados de color
    try {
      const res = await this.shrimpColorGradeService
        .getActiveShrimpColorGrades()
        .pipe(take(1))
        .toPromise();
      
      const items = res?.data || [];
      const map: Record<string, string> = {};
      
      items.forEach(grade => {
        if (grade && grade.id != null) {
          map[String(grade.id)] = grade.label || grade.code;
        }
      });
      
      this.colorOptionsCodebook = EnumSifrant.fromObject(map);
    } catch (_) {
      this.colorOptionsCodebook = EnumSifrant.fromObject({});
    }
  }

  /**
   * Verifica si un campo de Olor/Sabor necesita mostrar intensidad.
   * Se muestra intensidad cuando NO es "NORMAL".
   */
  needsIntensity(controlName: string): boolean {
    const value = this.formGroup?.get(controlName)?.value;
    return value && value !== 'NORMAL';
  }

  /**
   * Ensure all required form controls exist in the formGroup.
   * This is called on init to make sure controls are available for the template.
   */
  private ensureFormControls(): void {
    if (!this.formGroup) {
      return;
    }

    const controlNames = [
      'sampleNumber',
      // Olor (tipo + intensidad)
      'sensorialRawOdor',
      'sensorialRawOdorIntensity',
      'sensorialCookedOdor',
      'sensorialCookedOdorIntensity',
      // Sabor (tipo + intensidad)
      'sensorialRawTaste',
      'sensorialRawTasteIntensity',
      'sensorialCookedTaste',
      'sensorialCookedTasteIntensity',
      // Color (solo tipo, sin intensidad)
      'sensorialRawColor',
      'sensorialCookedColor',
      // Otros campos
      'metabisulfiteLevelAcceptable',
      'approvedForPurchase',
      'internalLotNumber',
      'qualityDocument',
      'qualityNotes'
    ];

    controlNames.forEach(name => {
      if (!this.formGroup.get(name)) {
        this.formGroup.addControl(name, new FormControl(null));
      }
    });
  }

  // Labels
  sampleNumberLabel = $localize`:@@sensorialQualityFields.sampleNumber.label:N° de Muestra`;
  sampleNumberPlaceholder = $localize`:@@sensorialQualityFields.sampleNumber.placeholder:Ingrese el número de muestra`;
  sampleNumberError = $localize`:@@sensorialQualityFields.sampleNumber.error:El número de muestra es requerido`;

  sensorialAnalysisTitle = $localize`:@@sensorialQualityFields.sensorialAnalysis.title:ANÁLISIS SENSORIAL`;
  rawTitle = $localize`:@@sensorialQualityFields.sensorialAnalysis.raw.title:CRUDO`;
  cookedTitle = $localize`:@@sensorialQualityFields.sensorialAnalysis.cooked.title:COCIDO`;

  odorLabel = $localize`:@@sensorialQualityFields.odor.label:Olor`;
  tasteLabel = $localize`:@@sensorialQualityFields.taste.label:Sabor`;
  colorLabel = $localize`:@@sensorialQualityFields.color.label:Color`;

  // Label para opción "Normal" en el codebook de Olor/Sabor
  normalLabel = $localize`:@@sensorialQualityFields.sensorialOption.normal:Normal`;
  
  // Label para intensidad
  intensityLabel = $localize`:@@sensorialQualityFields.intensity.label:Intensidad`;

  metabisulfiteLabel = $localize`:@@sensorialQualityFields.metabisulfite.label:Nivel de Metabisulfito aceptable?`;
  
  approvedForPurchaseLabel = $localize`:@@sensorialQualityFields.approvedForPurchase.label:Análisis aprobado para compra`;
  approvedForPurchaseError = $localize`:@@sensorialQualityFields.approvedForPurchase.error:Análisis aprobado para compra es obligatorio`;

  lotNumberLabel = $localize`:@@sensorialQualityFields.lotNumber.label:Número de Lote`;
  lotNumberPlaceholder = $localize`:@@sensorialQualityFields.lotNumber.placeholder:Ingrese el número de lote`;

  qualityTitle = $localize`:@@sensorialQualityFields.quality.title:CALIDAD`;
  qualityDocumentLabel = $localize`:@@sensorialQualityFields.qualityDocument.label:Documento de Calidad (PDF)`;
  qualityDocumentContent = $localize`:@@sensorialQualityFields.qualityDocument.content:Subir documento de calidad`;
  qualityDocumentError = $localize`:@@sensorialQualityFields.qualityDocument.error:Documento de calidad es requerido`;
  qualityDocumentMimeError = $localize`:@@sensorialQualityFields.qualityDocument.mimeError:Solo se permiten archivos PDF.`;

  qualityNotesLabel = $localize`:@@sensorialQualityFields.qualityNotes.label:Observaciones`;
  qualityNotesPlaceholder = $localize`:@@sensorialQualityFields.qualityNotes.placeholder:Ingrese observaciones sobre la calidad`;

  // Yes/No codebook for analysis approval
  approvalCodebook: EnumSifrant = EnumSifrant.fromObject({
    true: $localize`:@@sensorialQualityFields.approvedForPurchase.yes:Sí`,
    false: $localize`:@@sensorialQualityFields.approvedForPurchase.no:No`
  });
}
