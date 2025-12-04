import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ApiFacility } from '../../../../../../api/model/apiFacility';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ProcessingOrderControllerService } from '../../../../../../api/api/processingOrderController.service';
import { take } from 'rxjs/operators';
import { faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { ApiSemiProduct } from '../../../../../../api/model/apiSemiProduct';
import { CompanyFacilitiesForStockUnitProductService } from '../../../../../shared-services/company-facilities-for-stock-unit-product.service';
import { StaticSemiProductsService } from '../static-semi-products.service';

declare const $localize: any;

/**
 * Component for handling shrimp classification processing output.
 * Displays specialized form for classification batch with size-based details.
 */
@Component({
  selector: 'app-processing-order-output-classification',
  templateUrl: './processing-order-output-classification.component.html',
  styleUrls: ['./processing-order-output-classification.component.scss', '../stock-processing-order-details-common.scss']
})
export class ProcessingOrderOutputClassificationComponent implements OnInit, OnDestroy {

  readonly faTrashAlt = faTrashAlt;
  readonly faPlus = faPlus;

  private subscriptions: Subscription[] = [];
  private readonly KG_TO_LB_FACTOR = 2.20462;
  
  // 🦐 Catálogos para camarón basados en documentación DUFER
  // Referencia: docs/requerimientos/catalogos-camaron.md
  
  // Tipos de proceso (determina qué tallas y presentaciones mostrar)
  readonly processTypeCatalog = [
    { code: 'HEAD_ON', label: 'Con Cabeza (Entero)', sizeType: 'WHOLE' },
    { code: 'SHELL_ON', label: 'Cola (Shell-On)', sizeType: 'TAIL' },
    { code: 'VALUE_ADDED', label: 'Valor Agregado', sizeType: 'TAIL' }
  ];

  // Tallas para ENTERO (HEAD_ON) - Camarón con cabeza
  readonly wholeSizeCatalog = [
    { code: 'WHOLE_20_30', label: '20-30', order: 1 },
    { code: 'WHOLE_30_40', label: '30-40', order: 2 },
    { code: 'WHOLE_40_50', label: '40-50', order: 3 },
    { code: 'WHOLE_50_60', label: '50-60', order: 4 },
    { code: 'WHOLE_60_70', label: '60-70', order: 5 },
    { code: 'WHOLE_70_80', label: '70-80', order: 6 },
    { code: 'WHOLE_80_100', label: '80-100', order: 7 },
    { code: 'WHOLE_100_120', label: '100-120', order: 8 },
    { code: 'WHOLE_120_150', label: '120-150', order: 9 },
    { code: 'WHOLE_POMADA', label: 'Pomada', order: 10 },
    { code: 'WHOLE_BASURA', label: 'Basura', order: 99 }
  ];

  // Tallas para COLA (SHELL_ON) - Formato DUFER exacto
  readonly tailSizeCatalog = [
    { code: 'TAIL_U_7', label: 'U-7', order: 1 },
    { code: 'TAIL_U_10', label: 'U-10', order: 2 },
    { code: 'TAIL_U_12', label: 'U-12', order: 3 },
    { code: 'TAIL_U_15', label: 'U-15', order: 4 },
    { code: 'TAIL_21_25', label: '21-25', order: 5 },
    { code: 'TAIL_26_30', label: '26-30', order: 6 },
    { code: 'TAIL_31_35', label: '31-35', order: 7 },
    { code: 'TAIL_41_50', label: '41-50', order: 8 },
    { code: 'TAIL_61_70', label: '61-70', order: 9 },
    { code: 'TAIL_91_110', label: '91-110', order: 10 },
    { code: 'TAIL_110_130', label: '110-130', order: 11 },
    { code: 'TAIL_130', label: '130', order: 12 },
    { code: 'TAIL_150', label: '150', order: 13 }
  ];

  // Categorías de Broken (B VS, B SMALL, B MEDIUM, B LARGE)
  readonly brokenCatalog = [
    { code: 'B_VS', label: 'B VS', order: 1 },
    { code: 'B_SMALL', label: 'B Small', order: 2 },
    { code: 'B_MEDIUM', label: 'B Medium', order: 3 },
    { code: 'B_LARGE', label: 'B Large', order: 4 }
  ];
  
  // Grados de calidad (A, B, C)
  readonly qualityGradeCatalog = [
    { code: 'A', label: 'Clase A (Primera)' },
    { code: 'B', label: 'Clase B (Segunda)' },
    { code: 'C', label: 'Clase C (Otros)' }
  ];
  
  // Tipos de presentación (solo para COLA - SHELL_ON)
  readonly presentationTypeCatalog = [
    { code: 'SHELL_ON_A', label: 'Shell-On A', category: 'SHELL_ON' },
    { code: 'SHELL_ON_B', label: 'Shell-On B', category: 'SHELL_ON' },
    { code: 'BROKEN_VS', label: 'Broken VS', category: 'BROKEN' },
    { code: 'BROKEN_SMALL', label: 'Broken Small', category: 'BROKEN' },
    { code: 'BROKEN_MEDIUM', label: 'Broken Medium', category: 'BROKEN' },
    { code: 'BROKEN_LARGE', label: 'Broken Large', category: 'BROKEN' },
    { code: 'TITI', label: 'TITI', category: 'OTHER' },
    { code: 'ROJO', label: 'ROJO', category: 'OTHER' },
    { code: 'BVS', label: 'BVS', category: 'OTHER' }
  ];

  // 🦐 Catálogos para campos de clasificación por fila
  // Tipo de congelación
  readonly freezingTypeCatalog = [
    { code: 'IQF', label: 'IQF (Individual)' },
    { code: 'BLOCK', label: 'Bloque' },
    { code: 'SEMI_IQF', label: 'Semi-IQF' }
  ];

  // Máquinas de procesamiento
  readonly machineCatalog = [
    { code: 'MACH_01', label: 'Máquina 1' },
    { code: 'MACH_02', label: 'Máquina 2' },
    { code: 'MACH_03', label: 'Máquina 3' },
    { code: 'GLAZER_01', label: 'Glaseadora 1' },
    { code: 'FREEZER_01', label: 'Túnel 1' },
    { code: 'FREEZER_02', label: 'Túnel 2' }
  ];

  // Marcas con peso por caja y unidad de medida
  readonly brandCatalog = [
    { code: 'DUFER_2KG', label: 'Dufer 2 Kg', weightPerBox: 2.00, measureUnit: 'KG' },
    { code: 'DUFER_4LB', label: 'Dufer 4 Lb', weightPerBox: 4.00, measureUnit: 'LB' },
    { code: 'DUFER_5LB', label: 'Dufer 5 Lb', weightPerBox: 5.00, measureUnit: 'LB' },
    { code: 'OCEAN_GOLD_2KG', label: 'Ocean Gold 2 Kg', weightPerBox: 2.00, measureUnit: 'KG' },
    { code: 'OCEAN_GOLD_5LB', label: 'Ocean Gold 5 Lb', weightPerBox: 5.00, measureUnit: 'LB' },
    { code: 'CUSTOM', label: 'Personalizado', weightPerBox: null, measureUnit: null }
  ];

  // 🦐 Tipo de proceso determinado automáticamente por el semi-producto seleccionado
  // HEAD_ON = Camarón Entero, SHELL_ON = Camarón Cola
  currentProcessType: string = 'SHELL_ON';
  
  // Mantener para compatibilidad (deprecated)
  activeProcessTypes: Set<string> = new Set(['SHELL_ON']);

  exportingLiquidacion = false;
  exportingHeadOn = false;
  exportingShellOn = false;

  // 🦐 Instalaciones de descabezado disponibles para enviar rechazado
  deheadingFacilities: ApiFacility[] = [];

  @Input()
  tsoGroup!: FormGroup;

  @Input()
  tsoGroupIndex!: number;

  @Input()
  outputQuantityLabel!: string;

  @Input()
  submitted!: boolean;

  @Input()
  rightSideEnabled!: boolean;

  @Input()
  procActionLotPrefixControl!: FormControl;

  @Input()
  outputSemiProductsCodebook!: StaticSemiProductsService;

  @Input()
  semiProductOutputFacilitiesCodebooks!: Map<number, CompanyFacilitiesForStockUnitProductService>;

  @Output()
  removeOutputEvent = new EventEmitter<number>();

  constructor(private processingOrderController: ProcessingOrderControllerService) { }

  ngOnInit(): void {
    this.ensureClassificationControls();
    this.setupReceivedWeightListener();
    this.setupValidators();
    this.setupSemiProductListener();
    this.setupTotalsListener();
    this.loadDeheadingFacilities();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Ensure all classification-specific form controls exist
   */
  private ensureClassificationControls(): void {
    // Header fields
    const headerFields = [
      'classificationStartTime',
      'classificationEndTime',
      'productionOrder',
      'freezingType',
      'machine',
      'brandHeader',
      // 🦐 Campos adicionales formato DUFER
      'providerName',
      'receivedWeight',
      'wasteWeight',
      'rejectedWeight',      // 🦐 Peso rechazado que va al área de descabezado
      'deheadingFacility',   // 🦐 Área de descabezado destino para el rechazado
      'totalWeight',
      'processedWeight'
    ];

    headerFields.forEach(fieldName => {
      if (!this.tsoGroup.get(fieldName)) {
        this.tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });

    // Ensure classification details array exists
    if (!this.tsoGroup.get('classificationDetails')) {
      this.tsoGroup.addControl('classificationDetails', new FormArray([]));
    }
  }

  /**
   * 🦐 Detectar tipo de proceso según el semi-producto seleccionado
   */
  private setupSemiProductListener(): void {
    const semiProductControl = this.tsoGroup.get('semiProduct');
    if (semiProductControl) {
      // Detectar tipo inicial
      this.detectProcessTypeFromSemiProduct(semiProductControl.value);
      
      // Cargar áreas de descabezado si ya hay semi-producto seleccionado
      if (semiProductControl.value) {
        this.loadDeheadingFacilities();
      }
      
      // Escuchar cambios
      const sub = semiProductControl.valueChanges.subscribe(semiProduct => {
        this.detectProcessTypeFromSemiProduct(semiProduct);
        // Recargar áreas de descabezado cuando cambia el semi-producto
        if (semiProduct) {
          this.loadDeheadingFacilities();
        }
      });
      this.subscriptions.push(sub);
    }
  }

  /**
   * 🦐 Detectar tipo de proceso desde el semi-producto
   * Busca palabras clave: "entero", "cabeza" = HEAD_ON; "cola", "shell" = SHELL_ON
   */
  private detectProcessTypeFromSemiProduct(semiProduct: ApiSemiProduct | null): void {
    if (!semiProduct || !semiProduct.name) {
      this.currentProcessType = 'SHELL_ON'; // Default
      return;
    }
    
    const name = semiProduct.name.toLowerCase();
    
    if (name.includes('entero') || name.includes('cabeza') || name.includes('head')) {
      this.currentProcessType = 'HEAD_ON';
    } else if (name.includes('cola') || name.includes('shell') || name.includes('tail')) {
      this.currentProcessType = 'SHELL_ON';
    } else {
      // Default basado en si el nombre contiene indicadores
      this.currentProcessType = 'SHELL_ON';
    }
    
    // Actualizar activeProcessTypes para compatibilidad
    this.activeProcessTypes.clear();
    this.activeProcessTypes.add(this.currentProcessType);
    
    // Limpiar detalles del tipo anterior y agregar uno nuevo del tipo correcto
    this.clearAndAddDetailForCurrentType();
  }

  /**
   * 🦐 Limpiar detalles existentes y agregar uno del tipo de proceso actual
   */
  private clearAndAddDetailForCurrentType(): void {
    // Solo limpiar si hay detalles del tipo incorrecto
    const currentDetails = this.classificationDetailsArray.controls;
    const hasWrongType = currentDetails.some(
      ctrl => ctrl.get('processType')?.value !== this.currentProcessType
    );
    
    if (hasWrongType || currentDetails.length === 0) {
      // Limpiar todos los detalles
      while (this.classificationDetailsArray.length > 0) {
        this.classificationDetailsArray.removeAt(0);
      }
      // Agregar uno nuevo del tipo correcto
      this.addClassificationDetailForType(this.currentProcessType);
    }
  }

  /**
   * Setup validators for classification fields
   * 🦐 Solo campos mínimos requeridos para guardar
   */
  private setupValidators(): void {
    // Solo los campos esenciales son requeridos
    // Los demás son opcionales para permitir guardado parcial
    const requiredFields = [
      'classificationStartTime',
      'classificationEndTime'
    ];

    requiredFields.forEach(fieldName => {
      const control = this.tsoGroup.get(fieldName);
      if (control) {
        control.setValidators([Validators.required]);
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  /**
   * Get classification details FormArray
   */
  get classificationDetailsArray(): FormArray {
    return this.tsoGroup.get('classificationDetails') as FormArray;
  }

  /**
   * 🦐 Configura escucha para autollenar Peso Recibido (lb) a partir de la cantidad de salida
   */
  private setupReceivedWeightListener(): void {
    if (!this.tsoGroup) {
      return;
    }

    const totalQuantityControl = this.tsoGroup.get('totalQuantity');
    const measureUnitTypeControl = this.tsoGroup.get('measureUnitType');

    if (!totalQuantityControl) {
      return;
    }

    // Calcular inicialmente (modo edición)
    this.updateReceivedWeightFromOutputQuantity();

    const sub1 = totalQuantityControl.valueChanges.subscribe(() => {
      this.updateReceivedWeightFromOutputQuantity();
    });
    this.subscriptions.push(sub1);

    if (measureUnitTypeControl) {
      const sub2 = measureUnitTypeControl.valueChanges.subscribe(() => {
        this.updateReceivedWeightFromOutputQuantity();
      });
      this.subscriptions.push(sub2);
    }
  }

  /**
   * 🦐 Configura escucha para recalcular totales y autollenar Peso Procesado (lb)
   */
  private setupTotalsListener(): void {
    const detailsArray = this.classificationDetailsArray;
    if (!detailsArray) {
      return;
    }

    // Recalcular inmediatamente por si estamos en modo edición
    this.updateProcessedWeightFromDetails();

    const sub = detailsArray.valueChanges.subscribe(() => {
      this.updateProcessedWeightFromDetails();
    });
    this.subscriptions.push(sub);
  }

  /**
   * 🦐 Get filtered size catalog for a specific process type
   */
  getSizeCatalogForType(processType: string): Array<{code: string, label: string, order: number}> {
    if (processType === 'HEAD_ON') {
      return this.wholeSizeCatalog;
    }
    return this.tailSizeCatalog;
  }

  /**
   * 🦐 Get details filtered by process type
   */
  getDetailsByProcessType(processType: string): AbstractControl[] {
    return this.classificationDetailsArray.controls.filter(
      control => control.get('processType')?.value === processType
    );
  }

  /**
   * 🦐 Check if a process type section has any details
   */
  hasDetailsForType(processType: string): boolean {
    return this.getDetailsByProcessType(processType).length > 0;
  }

  /**
   * @deprecated El tipo de proceso ahora se determina automáticamente por el semi-producto.
   * Este método se mantiene solo por compatibilidad.
   */
  toggleProcessType(processType: string): void {
    // Ya no se usa - el tipo se determina por el semi-producto
    console.warn('toggleProcessType is deprecated. Process type is now auto-detected from semi-product.');
  }

  /**
   * Get output facility codebook based on selected semi-product
   */
  getOutputFacilityCodebook(): CompanyFacilitiesForStockUnitProductService | null {
    const semiProduct = this.tsoGroup.get('semiProduct')?.value as ApiSemiProduct;
    if (semiProduct && semiProduct.id) {
      return this.semiProductOutputFacilitiesCodebooks?.get(semiProduct.id) || null;
    }
    return null;
  }

  /**
   * 🦐 Cargar instalaciones de descabezado para enviar material rechazado
   * Busca en TODOS los codebooks disponibles las instalaciones con isDeheadingProcess === true
   */
  private loadDeheadingFacilities(): void {
    if (!this.semiProductOutputFacilitiesCodebooks || this.semiProductOutputFacilitiesCodebooks.size === 0) {
      console.log('[loadDeheadingFacilities] No codebooks available yet');
      return;
    }

    // Usar un Set para evitar duplicados por ID
    const foundFacilities = new Map<number, ApiFacility>();

    // Buscar en todos los codebooks disponibles
    this.semiProductOutputFacilitiesCodebooks.forEach((codebook, semiProductId) => {
      const sub = codebook.getAllCandidates().pipe(take(1)).subscribe(
        (facilities: ApiFacility[]) => {
          // Filtrar y agregar las instalaciones de descabezado
          facilities.filter(f => f.isDeheadingProcess === true).forEach(f => {
            if (f.id && !foundFacilities.has(f.id)) {
              foundFacilities.set(f.id, f);
            }
          });
          // Actualizar la lista
          this.deheadingFacilities = Array.from(foundFacilities.values());
          console.log('[loadDeheadingFacilities] Found deheading facilities:', this.deheadingFacilities.length, this.deheadingFacilities.map(f => f.name));
        }
      );
      this.subscriptions.push(sub);
    });
  }

  /**
   * 🦐 Add a new classification detail row for a specific process type
   */
  addClassificationDetailForType(processType: string): void {
    const isHeadOn = processType === 'HEAD_ON';
    
    const detailGroup = new FormGroup({
      processType: new FormControl(processType), // 🦐 HEAD_ON o SHELL_ON
      // 🦐 Nuevos campos por fila (antes estaban en el header)
      productionOrder: new FormControl(null), // Orden de producción
      freezingTypeCode: new FormControl(null), // Tipo de congelación (catálogo)
      machineCode: new FormControl(null), // Máquina (catálogo)
      brandCode: new FormControl(null), // Marca (catálogo con peso por caja)
      brandDetail: new FormControl(null),
      size: new FormControl(null), // 🦐 Talla (filtrada por tipo de proceso)
      presentationType: new FormControl(isHeadOn ? null : 'SHELL_ON_A'), // 🦐 Solo para COLA
      qualityGrade: new FormControl(isHeadOn ? null : 'A'), // 🦐 Clase A/B/C (solo para COLA)
      boxes: new FormControl(null, [Validators.min(0)]),
      weightPerBox: new FormControl(null, [Validators.min(0)]),
      weightFormat: new FormControl('LB'), // 🦐 Por defecto LB para camarón
      pricePerPound: new FormControl(null), // 🦐 Precio por libra (para liquidación de compra)
      lineTotal: new FormControl({ value: null, disabled: true }) // 🦐 Total calculado
    });

    this.classificationDetailsArray.push(detailGroup);
  }

  /**
   * 🦐 Cuando se selecciona una marca, actualizar weightPerBox y weightFormat
   * El código de marca se pasa explícitamente desde el (change) del select para
   * evitar problemas de sincronización con el FormControl.
   */
  onBrandChange(detailGroup: AbstractControl, brandCode: string): void {
    if (!brandCode) {
      return;
    }

    const selectedBrand = this.brandCatalog.find(b => b.code === brandCode);
    if (selectedBrand) {
      if (selectedBrand.weightPerBox != null) {
        detailGroup.get('weightPerBox')?.setValue(selectedBrand.weightPerBox);
      }
      if (selectedBrand.measureUnit) {
        detailGroup.get('weightFormat')?.setValue(selectedBrand.measureUnit);
      }
    }
  }

  /**
   * Legacy method - adds detail for current process type
   */
  addClassificationDetail(): void {
    this.addClassificationDetailForType(this.currentProcessType);
  }

  /**
   * Remove a classification detail row
   */
  removeClassificationDetail(index: number): void {
    if (this.classificationDetailsArray.length > 1) {
      this.classificationDetailsArray.removeAt(index);
    }
  }

  /**
   * Calculate total weight for a detail row (boxes * weightPerBox)
   */
  calculateTotalWeight(detailGroup: AbstractControl): number {
    const boxes = detailGroup.get('boxes')?.value || 0;
    const weightPerBox = detailGroup.get('weightPerBox')?.value || 0;
    return boxes * weightPerBox;
  }

  /**
   * 🦐 Calculate pounds per size (total weight converted to LB)
   * Si el formato es KG, convierte a LB. Si ya es LB, retorna el peso total.
   */
  calculatePoundsPerSize(detailGroup: AbstractControl): number {
    const totalWeight = this.calculateTotalWeight(detailGroup);
    const format = (detailGroup.get('weightFormat')?.value || 'LB').toString().toUpperCase();
    
    if (format === 'KG') {
      return totalWeight * this.KG_TO_LB_FACTOR;
    }
    return totalWeight; // Ya está en LB
  }

  /**
   * Calculate grand total weight across all details
   */
  calculateGrandTotalWeight(): number {
    let total = 0;
    this.classificationDetailsArray.controls.forEach(control => {
      total += this.calculateTotalWeight(control);
    });
    return total;
  }

  /**
   * 🦐 Calculate grand total pounds (all weights converted to LB)
   */
  calculateGrandTotalPounds(): number {
    let total = 0;
    this.classificationDetailsArray.controls.forEach(control => {
      total += this.calculatePoundsPerSize(control);
    });
    return total;
  }

  /**
   * 🦐 Actualiza el campo de encabezado "Peso Procesado (lb)" con la suma de la lista
   * Usa siempre las libras calculadas (conversión desde KG cuando aplique).
   */
  private updateProcessedWeightFromDetails(): void {
    if (!this.tsoGroup) {
      return;
    }

    const processedWeightControl = this.tsoGroup.get('processedWeight');
    if (!processedWeightControl) {
      return;
    }

    const totalPounds = this.calculateGrandTotalPounds();
    const rounded = Math.round((totalPounds + Number.EPSILON) * 100) / 100;

    // No emitir eventos para evitar ciclos innecesarios
    processedWeightControl.setValue(rounded, { emitEvent: false });
  }

  /**
   * 🦐 Actualiza el campo de encabezado "Peso Recibido (lb)" con la cantidad de salida en libras
   * Usa measureUnitType.weight para convertir cualquier unidad a KG y luego a LB.
   */
  private updateReceivedWeightFromOutputQuantity(): void {
    if (!this.tsoGroup) {
      return;
    }

    const receivedWeightControl = this.tsoGroup.get('receivedWeight');
    const totalQuantityControl = this.tsoGroup.get('totalQuantity');
    const measureUnitTypeControl = this.tsoGroup.get('measureUnitType');

    if (!receivedWeightControl || !totalQuantityControl) {
      return;
    }

    const rawQuantity = totalQuantityControl.value;
    const quantity = rawQuantity != null ? Number(rawQuantity) : null;

    if (quantity == null || isNaN(quantity)) {
      receivedWeightControl.setValue(null, { emitEvent: false });
      return;
    }

    const mu = measureUnitTypeControl?.value as { code?: string; label?: string; weight?: number } | null;

    let pounds: number;

    const code = mu?.code?.toString().toUpperCase() || '';
    const label = mu?.label?.toString().toUpperCase() || '';

    if (code === 'LB' || label.includes('LB')) {
      // Ya está en libras
      pounds = quantity;
    } else if (mu?.weight != null) {
      // quantity * weight(kg por unidad) -> KG; luego convertir a LB
      const quantityInKg = quantity * mu.weight;
      pounds = quantityInKg * this.KG_TO_LB_FACTOR;
    } else {
      // Fallback: asumir que la unidad ya está en libras
      pounds = quantity;
    }

    const rounded = Math.round((pounds + Number.EPSILON) * 100) / 100;
    receivedWeightControl.setValue(rounded, { emitEvent: false });
  }

  /**
   * Calculate grand total boxes across all details
   */
  calculateGrandTotalBoxes(): number {
    let total = 0;
    this.classificationDetailsArray.controls.forEach(control => {
      const rawValue = control.get('boxes')?.value;
      const boxes = Number(rawValue) || 0; // garantizar suma numérica (evitar '03' + '4' = '034')
      total += boxes;
    });
    return total;
  }

  /**
   * 🦐 Calculate total boxes for a specific process type
   */
  calculateTotalBoxesForType(processType: string): number {
    let total = 0;
    this.classificationDetailsArray.controls.forEach(control => {
      if (control.get('processType')?.value === processType) {
        const rawValue = control.get('boxes')?.value;
        total += Number(rawValue) || 0;
      }
    });
    return total;
  }

  /**
   * 🦐 Calculate total weight for a specific process type
   */
  calculateTotalWeightForType(processType: string): number {
    let total = 0;
    this.classificationDetailsArray.controls.forEach(control => {
      if (control.get('processType')?.value === processType) {
        total += this.calculateTotalWeight(control);
      }
    });
    return total;
  }

  /**
   * 🦐 Calculate total pounds for a specific process type
   */
  calculateTotalPoundsForType(processType: string): number {
    let total = 0;
    this.classificationDetailsArray.controls.forEach(control => {
      if (control.get('processType')?.value === processType) {
        total += this.calculatePoundsPerSize(control);
      }
    });
    return total;
  }

  /**
   * Handle remove output button click
   */
  onRemoveOutput(): void {
    this.removeOutputEvent.emit(this.tsoGroupIndex);
  }

  /**
   * Check if the form can be deleted (at least 2 outputs must exist)
   */
  get canDelete(): boolean {
    // This will be controlled by parent component
    return true;
  }

  /**
   * 🦐 Calcular total de línea (libras × precio por libra)
   */
  calculateLineTotal(detailGroup: AbstractControl): number {
    const poundsPerSize = this.calculatePoundsPerSize(detailGroup);
    const pricePerPound = detailGroup.get('pricePerPound')?.value || 0;
    return poundsPerSize * pricePerPound;
  }

  /**
   * 🦐 Calcular gran total monetario
   */
  calculateGrandTotalAmount(): number {
    let total = 0;
    this.classificationDetailsArray?.controls?.forEach(control => {
      total += this.calculateLineTotal(control);
    });
    return total;
  }

  /**
   * 🦐 Exportar Liquidación de Pesca a Excel
   */
  exportLiquidacionPesca(): void {
    const stockOrderId = this.tsoGroup.get('id')?.value;
    if (!stockOrderId) {
      console.error('No stock order ID available for export');
      return;
    }

    this.exportingLiquidacion = true;
    const lotNumber = this.tsoGroup.get('internalLotNumber')?.value || stockOrderId;
    
    this.processingOrderController.downloadClassificationLiquidacion(stockOrderId)
      .pipe(take(1))
      .subscribe({
        next: (blob: Blob) => {
          this.downloadFile(blob, `Liquidacion_Pesca_${lotNumber}.xlsx`);
          this.exportingLiquidacion = false;
        },
        error: (error) => {
          console.error('Error exporting liquidacion:', error);
          this.exportingLiquidacion = false;
        }
      });
  }

  /**
   * 🦐 Exportar Liquidación de Compra a Excel
   */
  exportLiquidacionCompra(): void {
    const stockOrderId = this.tsoGroup.get('id')?.value;
    if (!stockOrderId) {
      console.error('No stock order ID available for export');
      return;
    }

    this.exportingLiquidacion = true;
    const lotNumber = this.tsoGroup.get('internalLotNumber')?.value || stockOrderId;
    
    this.processingOrderController.downloadLiquidacionCompra(stockOrderId)
      .pipe(take(1))
      .subscribe({
        next: (blob: Blob) => {
          this.downloadFile(blob, `Liquidacion_Compra_${lotNumber}.xlsx`);
          this.exportingLiquidacion = false;
        },
        error: (error) => {
          console.error('Error exporting liquidacion compra:', error);
          this.exportingLiquidacion = false;
        }
      });
  }

  /**
   * Helper to download a blob as a file
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private calculateGrandTotalWeightInKilograms(): number {
    let total = 0;

    this.classificationDetailsArray?.controls?.forEach(control => {
      const weight = this.calculateTotalWeight(control);
      const format = (control.get('weightFormat')?.value || 'KG').toString().toUpperCase();

      if (format === 'LB') {
        total += weight / this.KG_TO_LB_FACTOR;
      } else {
        total += weight;
      }
    });

    return total;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
}
