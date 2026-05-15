import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LotNumberUtil } from '../utils/lot-number.util';
import { ShrimpDataService } from '../services/shrimp-data.service';
import { ShrimpMsService, ShrimpSize, CommercialPresentation } from '../services/shrimp-ms.service';

// ─── Domain Models ───────────────────────────────────────────────
/**
 * A single classification record per talla+destino+máquina.
 * DUFER doc point 7.1:
 *   - BLOQUE  → cantidad en CAJETAS (conteo manual), libras opcionales
 *   - IQF/SAL/VA → cantidad en GAVETAS, libras obligatorias (pesaje)
 * qualityClass added based on real DUFER docs 5-6 (Lot 1662): same size
 * can appear in Class A, B or C with different prices.
 */
export interface ClassificationRecord {
  id: number;
  talla: ShrimpSize;
  qualityClass: 'A' | 'B' | 'C';
  cantidad: number;                   // cajetas or gavetas count
  unidad: 'CAJETAS' | 'GAVETAS';
  libras?: number;                    // optional weight
  destino: string;                    // label: "Bloque", "IQF", etc.
  destinoKey: string;                 // key: "BLOQUE", "IQF", etc.
  presentationName?: string;          // Extracted from CommercialPresentation for BLOQUE
  loteSuffix: string;
  maquina: string;
  timestamp: Date;
}

export interface Destino {
  key: string;
  label: string;
  icon: string;
  suffix: number;
}

// ─── Constants ───────────────────────────────────────────────────
const DESTINOS: Destino[] = [
  { key: 'BLOQUE',         label: 'Bloque',         icon: '🧊', suffix: 1 },
  { key: 'IQF',            label: 'IQF',             icon: '❄️', suffix: 2 },
  { key: 'VALOR_AGREGADO', label: 'Valor Agregado',  icon: '⭐', suffix: 3 },
  { key: 'SALMUERA',       label: 'Salmuera',        icon: '🧂', suffix: 4 },
];

// Quantity alert threshold — G3 guard
const CANTIDAD_MAX_ALERT = 500;
// Yield warning thresholds — G6 guard
const YIELD_WARNING_PCT = 60;
const YIELD_CONFIRM_PCT = 50;

@Component({
  selector: 'app-clasificacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clasificacion.component.html',
  styleUrls: ['./clasificacion.component.css']
})
export class ClassificationComponent implements OnInit {
  // ─── Company Identity ────────────────────────────────────────
  COMPANY_ID: number | null = null;

  // ─── Domain Masters (loaded from Core API) ───────────────────
  openReceptions: any[] = [];
  classificationActions: any[] = [];
  colaSemiProduct: any = null;
  allSemiProducts: any[] = [];

  // ─── UI Constants ────────────────────────────────────────────
  destinos = DESTINOS;

  /** Dynamic quality classes: Entero is strictly A. Cola can be A, B, or C. */
  get availableQualityClasses(): Array<'A' | 'B' | 'C'> {
    if (this.detectProductType() === 'ENTERO') {
      return ['A'];
    }
    return ['A', 'B', 'C'];
  }

  // ─── Form State ──────────────────────────────────────────────
  selectedReception: any = null;
  selectedTalla: ShrimpSize | null = null;
  selectedDestino: Destino | null = null;
  selectedPresentation: CommercialPresentation | null = null;
  presentacionesBloque: CommercialPresentation[] = [];
  selectedQualityClass: 'A' | 'B' | 'C' = 'A';
  maquina = '1';
  mermaLibras = 0;

  // ─── Talla Catalog (from ShrimpSize API) ────────────────────
  /** Standard sizes for the selected product type (HEAD-ON or SHELL-ON) */
  tallasStandard: ShrimpSize[] = [];
  /** BROKEN + OTHERS for the selected product type — hidden by default */
  tallasExtended: ShrimpSize[] = [];
  showExtendedSizes = false;

  // ─── Quantity inputs (replaces keypad) ──────────────────────
  /** Cajetas (BLOQUE) or Gavetas (others) — mandatory */
  cantidad = '';
  /** Weight in lbs — optional (G1: BLOQUE = cajetas count only may suffice) */
  librasOpcional = '';

  // ─── Unit mode derived from destination ─────────────────────
  /** CAJETAS for BLOQUE, GAVETAS for IQF/SALMUERA/VALOR_AGREGADO */
  unidadActiva: 'CAJETAS' | 'GAVETAS' = 'CAJETAS';

  // ─── Accumulated Records ─────────────────────────────────────
  records: ClassificationRecord[] = [];

  // ─── UI Flags ────────────────────────────────────────────────
  showSuccess = false;
  isSubmitting = false;
  errorMsg = '';
  cantidadAlerta = false;   // G3: quantity out of normal range

  constructor(
    private dataService: ShrimpDataService,
    private shrimpMs: ShrimpMsService
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.dataService.getActiveCompany().subscribe(company => {
      const companyIds = company?.data?.companyIds || company?.companyIds || [];
      this.COMPANY_ID = companyIds.length > 0 ? companyIds[0] : null;

      if (!this.COMPANY_ID) {
        console.warn('[Clasificación] No se pudo obtener la compañía activa.');
        return;
      }

      this.loadMasters();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════════════

  loadMasters(): void {
    if (!this.COMPANY_ID) return;

    this.dataService.getAvailableForClassification(this.COMPANY_ID).subscribe(list => {
      this.openReceptions = list;
    });

    console.log('[Clasificación] Loading masters for COMPANY_ID:', this.COMPANY_ID);
    this.dataService.getClassificationActions(this.COMPANY_ID).subscribe(actions => {
      console.log('[Clasificación] classificationActions received:', JSON.stringify(actions, null, 2));
      this.classificationActions = actions;
    });

    this.dataService.getSemiProducts(this.COMPANY_ID).subscribe(sps => {
      // Keep Cola semi-product for rejection/descabezado conversion
      this.colaSemiProduct = sps.find((sp: any) => sp.name === 'Cola');
      this.allSemiProducts = sps;
    });

    this.shrimpMs.listPresentations(this.COMPANY_ID).subscribe(list => {
      this.presentacionesBloque = list.filter(p => p.destino === 'BLOQUE' && p.isActive !== false);
    });
  }

  /** Loads size catalog from ms-shrimp based on detected product type. */
  private loadTallasForReception(): void {
    const productType = this.detectProductType();
    if (!productType) return;

    this.shrimpMs.listSizes(productType, 'STANDARD').subscribe(sizes => {
      this.tallasStandard = sizes;
    });

    this.shrimpMs.listSizes(productType).subscribe(all => {
      this.tallasExtended = all.filter(s => s.sizeGroup !== 'STANDARD');
    });
  }

  /** Detects product type (ENTERO/COLA) from the selected reception. */
  private detectProductType(): 'ENTERO' | 'COLA' | null {
    if (!this.selectedReception) return null;
    const tipo = (this.selectedReception.tipo || '').toLowerCase();
    if (tipo === 'cola') return 'COLA';
    return 'ENTERO'; // default for Entero / Con Cabeza
  }

  // ═══════════════════════════════════════════════════════════════
  // Computed Properties — G2, G4, G6
  // ═══════════════════════════════════════════════════════════════

  /** Sum of all record weights (only records that have libras). */
  get totalLbs(): number {
    return this.records
      .filter(r => r.libras !== undefined)
      .reduce((sum, r) => sum + (r.libras ?? 0), 0);
  }

  /** Number of records without a weight value. */
  get recordsSinPeso(): number {
    return this.records.filter(r => r.libras === undefined).length;
  }

  /** Remaining weight balance from the reception lot. G4 guard. */
  get massBalance(): number {
    if (!this.selectedReception) return 0;
    return this.selectedReception.pesoBruto - this.totalLbs - (this.mermaLibras || 0);
  }

  /** Yield percentage in real time — G6 guard. */
  get yieldPercent(): number {
    if (!this.selectedReception || this.selectedReception.pesoBruto <= 0) return 0;
    return (this.totalLbs / this.selectedReception.pesoBruto) * 100;
  }

  /** Color class for yield indicator. */
  get yieldColorClass(): 'green' | 'yellow' | 'red' {
    if (this.yieldPercent >= 80) return 'green';
    if (this.yieldPercent >= YIELD_WARNING_PCT) return 'yellow';
    return 'red';
  }

  /** Whether current input would exceed remaining balance. */
  get isExceedingBalance(): boolean {
    const inputLbs = parseFloat(this.librasOpcional) || 0;
    if (inputLbs === 0) return false;
    return inputLbs > this.massBalance;
  }

  /** Suffixed lot number for the selected destination. */
  getSuffixedLot(): string {
    if (!this.selectedReception || !this.selectedDestino) return '';
    return LotNumberUtil.generateSuffix(
      this.selectedReception.lotNumber,
      this.selectedDestino.suffix
    );
  }

  /** All tallas currently visible based on selected quality class. */
  get tallasVisibles(): ShrimpSize[] {
    if (this.selectedQualityClass === 'C') {
      return this.tallasExtended; // Only BROKEN/OTROS
    }
    return this.tallasStandard; // A and B only show STANDARD sizes
  }

  /** Label for the quantity input — changes based on destination. */
  get cantidadLabel(): string {
    return this.unidadActiva === 'CAJETAS' ? 'Cajetas' : 'Gavetas';
  }

  /** Detected product type label for display. */
  get productoTipoLabel(): string {
    return this.detectProductType() === 'COLA' ? 'COLA (SHELL-ON)' : 'ENTERO (HEAD-ON)';
  }

  // ═══════════════════════════════════════════════════════════════
  // Form Interactions
  // ═══════════════════════════════════════════════════════════════

  onReceptionChanged(): void {
    this.records = [];
    this.mermaLibras = 0;
    this.selectedTalla = null;
    this.selectedDestino = null;
    this.cantidad = '';
    this.librasOpcional = '';
    this.errorMsg = '';
    this.tallasStandard = [];
    this.tallasExtended = [];
    this.showExtendedSizes = false;
    this.selectedQualityClass = 'A';
    this.cantidadAlerta = false;

    this.cantidadAlerta = false;

    if (this.selectedReception) {
      this.selectedQualityClass = 'A';
      this.loadTallasForReception();
    }
  }

  onQualityClassChanged(cls: 'A' | 'B' | 'C'): void {
    this.selectedQualityClass = cls;
    this.selectedTalla = null; // Tallas are logically tied to the selected quality class
  }

  /**
   * DUFER doc point 7.1:
   *   BLOQUE  → cajetas se cuentan manualmente
   *   IQF / Salmuera / VA → se pesa en gavetas
   */
  onDestinoChanged(): void {
    this.unidadActiva = this.selectedDestino?.key === 'BLOQUE' ? 'CAJETAS' : 'GAVETAS';
    if (this.selectedDestino?.key !== 'BLOQUE') {
      this.selectedPresentation = null;
    }
  }

  onPresentationChanged(): void {
    this.recalculateBloqueWeight();
  }

  /** G3 guard: alert if quantity exceeds normal range, and auto-calculate weight for BLOQUE */
  onCantidadChange(): void {
    const n = parseInt(this.cantidad) || 0;
    this.cantidadAlerta = n > CANTIDAD_MAX_ALERT;
    this.recalculateBloqueWeight();
  }

  private recalculateBloqueWeight(): void {
    if (this.selectedDestino?.key === 'BLOQUE' && this.selectedPresentation && this.selectedPresentation.weightPerUnit) {
      const n = parseInt(this.cantidad) || 0;
      this.librasOpcional = (n * this.selectedPresentation.weightPerUnit).toFixed(2);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Sub-Lot Management
  // ═══════════════════════════════════════════════════════════════

  adicionarSubLote(): void {
    if (!this.selectedTalla || !this.selectedDestino) return;

    const cantidad = parseInt(this.cantidad) || 0;
    if (cantidad <= 0) {
      this.errorMsg = `Ingrese la cantidad de ${this.cantidadLabel}.`;
      return;
    }

    if (this.selectedDestino.key === 'BLOQUE' && !this.selectedPresentation) {
      this.errorMsg = 'Debe seleccionar una presentación comercial para el bloque.';
      return;
    }

    const libras = parseFloat(this.librasOpcional) || undefined;

    // G3: confirm if exceeds balance
    if (libras !== undefined && libras > this.massBalance) {
      this.errorMsg = 'Las libras ingresadas superan el balance disponible.';
      return;
    }

    const record: ClassificationRecord = {
      id: Date.now(),
      talla: this.selectedTalla,
      qualityClass: this.selectedQualityClass,
      cantidad,
      unidad: this.unidadActiva,
      libras,
      destino: this.selectedDestino.label,
      destinoKey: this.selectedDestino.key,
      presentationName: this.selectedPresentation ? `${this.selectedPresentation.brandName} ${this.selectedPresentation.name}` : undefined,
      loteSuffix: this.getSuffixedLot(),
      maquina: this.maquina,
      timestamp: new Date()
    };

    this.records.unshift(record);
    this.errorMsg = '';

    // Reset lower form (keep reception, machine, and talla)
    this.cantidad = '';
    this.librasOpcional = '';
    this.selectedDestino = null;
    this.selectedPresentation = null;
    this.unidadActiva = 'CAJETAS';
    this.cantidadAlerta = false;
  }

  removerSubLote(index: number): void {
    this.records.splice(index, 1);
  }

  // ═══════════════════════════════════════════════════════════════
  // Core INATrace Submission + ms-shrimp Mirror
  // ═══════════════════════════════════════════════════════════════

  terminarYEnviarAlCore(): void {
    if (this.records.length === 0 || !this.selectedReception || this.classificationActions.length === 0) return;
    if (this.massBalance < 0) {
      this.errorMsg = 'El balance es negativo. Revise los pesos ingresados.';
      return;
    }

    // G6: Warn if yield is anomalously low
    if (this.yieldPercent > 0 && this.yieldPercent < YIELD_CONFIRM_PCT) {
      const ok = confirm(
        `⚠️ Rendimiento muy bajo: ${this.yieldPercent.toFixed(1)}%.\n` +
        `¿Está seguro de que los datos son correctos?`
      );
      if (!ok) return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    const pType = this.detectProductType(); // 'ENTERO' | 'COLA'
    const spNameRequired = pType === 'COLA' ? 'Cola' : 'Entero';

    const action = this.classificationActions.find(a => {
      const m1 = a.name && a.name.includes(spNameRequired);
      const m2 = a.inputSemiProduct && a.inputSemiProduct.name && a.inputSemiProduct.name.includes(spNameRequired);
      const m3 = a.translations && a.translations.some((t: any) => t.name && t.name.includes(spNameRequired));
      return m1 || m2 || m3;
    });

    if (!action) {
      const availableNames = this.classificationActions.map(a => 
        a.name || (a.translations && a.translations[0]?.name) || 'unknown'
      ).join(', ');
      this.errorMsg = `No hay acción de clasificación configurada para: ${spNameRequired}. Disponibles: ${availableNames}`;
      this.isSubmitting = false;
      return;
    }

    // 1. Build target stock orders from accumulated records
    const targetStockOrders = this.records.map(r => this.buildTargetStockOrder(r));

    // 2. If Entero rejection exists, add Cola output (descabezado conversion)
    if (this.mermaLibras > 0 && pType === 'ENTERO' && this.colaSemiProduct) {
      targetStockOrders.push(this.buildColaStockOrder());
    }

    // 3. Assemble final ApiProcessingOrder payload
    const payload = {
      processingAction: { id: action.id },
      processingDate: new Date().toISOString().split('T')[0],
      inputTransactions: [{
        company: { id: this.COMPANY_ID },
        status: 'EXECUTED',
        sourceStockOrder: {
          id: this.selectedReception.coreStockOrderId,
          orderType: 'PURCHASE_ORDER',
          totalQuantity: this.selectedReception.pesoBruto,
          fulfilledQuantity: this.selectedReception.pesoBruto
        },
        inputQuantity: this.selectedReception.pesoBruto,
        outputQuantity: this.selectedReception.pesoBruto
      }],
      targetStockOrders
    };

    // 4. Submit to Core, then mirror to ms-shrimp
    this.dataService.submitClassificationOrder(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccess = true;
        this.mirrorToMsShrimp();
      },
      error: (err) => {
        this.isSubmitting = false;
        const detail = err?.error?.errorMessage || err?.message || 'Error desconocido';
        this.errorMsg = `Error al guardar: ${detail}`;
        console.error('[Clasificación] Core error:', err);
      }
    });
  }

  cerrarSuccessModal(): void {
    this.showSuccess = false;
    this.onReceptionChanged();
    this.selectedReception = null;
    this.loadMasters();
  }

  // ═══════════════════════════════════════════════════════════════
  // Private Helpers — Payload Builders
  // ═══════════════════════════════════════════════════════════════

  private buildTargetStockOrder(r: ClassificationRecord): any {
    // Use libras if available, otherwise 0 (backend accepts pending weight)
    const weight = r.libras ?? 0;
    
    // Resolve INATrace semi-product ID (e.g. "Talla 21/25")
    const spName = 'Talla ' + r.talla.name;
    const sp = this.allSemiProducts.find(s => s.name === spName);
    const spId = sp ? sp.id : (r.talla.semiProductId || r.talla.id);

    return {
      semiProduct: { id: spId },
      facility: { id: this.selectedReception.facilityId },
      company: { id: this.COMPANY_ID },
      orderType: 'PROCESSING_ORDER',
      totalGrossQuantity: weight,
      totalQuantity: weight,
      fulfilledQuantity: weight,
      availableQuantity: weight,
      internalLotNumber: r.loteSuffix,
      preferredWayOfPayment: 'CASH',
      isPurchaseOrder: false,
      comments: JSON.stringify({
        dualUnit: true,
        cantidad: r.cantidad,
        unidad: r.unidad,
        qualityClass: r.qualityClass,
        maquina: r.maquina,
        destino: r.destinoKey,
        shrimpSizeName: r.talla.displayName
      })
    };
  }

  private buildColaStockOrder(): any {
    return {
      semiProduct: { id: this.colaSemiProduct.id },
      facility: { id: this.selectedReception.facilityId },
      company: { id: this.COMPANY_ID },
      orderType: 'PROCESSING_ORDER',
      totalGrossQuantity: this.mermaLibras,
      totalQuantity: this.mermaLibras,
      fulfilledQuantity: this.mermaLibras,
      availableQuantity: this.mermaLibras,
      internalLotNumber: this.selectedReception.lotNumber + '-COLA',
      preferredWayOfPayment: 'CASH',
      isPurchaseOrder: false,
      comments: JSON.stringify({ rechazoDeClasificacion: true })
    };
  }

  private mirrorToMsShrimp(): void {
    if (!this.selectedReception?.coreStockOrderId) return;

    this.shrimpMs.createClassification({
      stockOrderId: this.selectedReception.coreStockOrderId,
      rejectedWeightLbs: this.mermaLibras || undefined
    }).subscribe({
      next: (classification) => {
        this.records.forEach(r => {
          this.shrimpMs.createClassificationDetail({
            classificationId: classification.id,
            // Use catalog display name (e.g. "SHELL-ON 36/40") instead of "Talla X"
            shrimpSize: r.talla.displayName,
            weightLbs: r.libras ?? 0,
            cajetasCount: r.unidad === 'CAJETAS' ? r.cantidad : 0
          }).subscribe({
            next: (detail) => {
              // Create the Productive Destination so it appears in the Transformation Queue (Bloque/IQF/etc)
              this.shrimpMs.createDestination({
                classificationDetailId: detail.id,
                destinationType: r.destinoKey as any,
                lotSuffix: r.loteSuffix,
                allocatedWeightLbs: r.libras ?? 0,
                presentation: r.presentationName
              }).subscribe();
            }
          });
        });
        console.log('[Clasificación] Mirrored to ms-shrimp with qualityClass + ShrimpSize catalog + Destinations + Presentation');
      },
      error: (e) => console.warn('[Clasificación] ms-shrimp mirror failed:', e)
    });
  }
}
