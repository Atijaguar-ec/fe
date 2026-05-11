import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LotNumberUtil } from '../utils/lot-number.util';
import { ShrimpDataService } from '../services/shrimp-data.service';
import { ShrimpMsService, CommercialPresentation } from '../services/shrimp-ms.service';

// ─── Domain Models ───────────────────────────────────────────────
export interface ClassificationRecord {
  id: number;
  talla: { id: number; name: string };
  cajetas: number;
  libras: number;
  destino: string;
  loteSuffix: string;
  maquina: string;
  timestamp: Date;
  presentationId?: string;
  brandName?: string;
  presentationName?: string;
}

export interface Destino {
  key: string;
  label: string;
  icon: string;
  suffix: number;
}

// ─── Constants ───────────────────────────────────────────────────
const DESTINOS: Destino[] = [
  { key: 'BLOQUE',   label: 'Bloque',          icon: '🧊', suffix: 1 },
  { key: 'IQF',      label: 'IQF',             icon: '❄️', suffix: 2 },
  { key: 'VALOR_AGREGADO',       label: 'Valor Agregado',   icon: '⭐', suffix: 3 },
  { key: 'SALMUERA', label: 'Salmuera',         icon: '🧂', suffix: 4 },
];

const KEYPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.', '⌫'];

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
  tallasApi: any[] = [];
  classificationAction: any = null;
  colaSemiProduct: any = null;

  // ─── UI Constants ────────────────────────────────────────────
  destinos = DESTINOS;
  keypadKeys = KEYPAD_KEYS;

  // ─── Form State ──────────────────────────────────────────────
  selectedReception: any = null;
  selectedTalla: any = null;
  selectedDestino: Destino | null = null;

  activeInput: 'cajetas' | 'libras' | null = null;
  cajetas = '';
  libras = '';
  maquina = '1';
  mermaLibras = 0;

  // ─── Presentation Auto-Calc ────────────────────────────────
  presentations: CommercialPresentation[] = [];
  selectedPresentation: CommercialPresentation | null = null;
  calcMode: 'auto' | 'manual' = 'auto';
  librasEdited = false;

  // ─── Accumulated Records ─────────────────────────────────────
  records: ClassificationRecord[] = [];

  // ─── UI Flags ────────────────────────────────────────────────
  showSuccess = false;
  isSubmitting = false;
  errorMsg = '';

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

    this.dataService.getClassificationAction(this.COMPANY_ID).subscribe(action => {
      this.classificationAction = action;
    });

    this.dataService.getSemiProducts(this.COMPANY_ID).subscribe(sps => {
      this.tallasApi = sps.filter((sp: any) => sp.name.startsWith('Talla'));
      this.colaSemiProduct = sps.find((sp: any) => sp.name === 'Cola');
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Computed Properties
  // ═══════════════════════════════════════════════════════════════

  get totalLbs(): number {
    return this.records.reduce((sum, r) => sum + r.libras, 0);
  }

  get massBalance(): number {
    if (!this.selectedReception) return 0;
    return this.selectedReception.pesoBruto - this.totalLbs - (this.mermaLibras || 0);
  }

  get isExceedingBalance(): boolean {
    const inputLbs = parseFloat(this.libras) || 0;
    return inputLbs > this.massBalance;
  }

  getSuffixedLot(): string {
    if (!this.selectedReception || !this.selectedDestino) return '';
    return LotNumberUtil.generateSuffix(
      this.selectedReception.lotNumber,
      this.selectedDestino.suffix
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Form Interactions
  // ═══════════════════════════════════════════════════════════════

  onReceptionChanged(): void {
    this.records = [];
    this.mermaLibras = 0;
    this.selectedTalla = null;
    this.selectedDestino = null;
    this.activeInput = null;
    this.cajetas = '';
    this.libras = '';
    this.errorMsg = '';
    this.selectedPresentation = null;
    this.librasEdited = false;
  }

  onDestinoChanged(): void {
    this.selectedPresentation = null;
    this.librasEdited = false;
    this.loadPresentationsForDestino();
  }

  loadPresentationsForDestino(): void {
    if (!this.COMPANY_ID || !this.selectedDestino) {
      this.presentations = [];
      return;
    }
    this.shrimpMs.listPresentations(this.COMPANY_ID, this.selectedDestino.key).subscribe(list => {
      this.presentations = list;
      // Auto-select if only one presentation available
      if (list.length === 1) {
        this.selectedPresentation = list[0];
        this.recalcLibras();
      } else if (list.length === 0) {
        this.calcMode = 'manual';
      } else {
        this.calcMode = 'auto';
      }
    });
  }

  onPresentationChanged(): void {
    this.librasEdited = false;
    this.recalcLibras();
  }

  toggleCalcMode(): void {
    this.calcMode = this.calcMode === 'auto' ? 'manual' : 'auto';
    if (this.calcMode === 'auto') {
      this.librasEdited = false;
      this.recalcLibras();
    }
  }

  private recalcLibras(): void {
    if (this.calcMode !== 'auto' || !this.selectedPresentation || this.librasEdited) return;
    const qty = parseInt(this.cajetas) || 0;
    const result = qty * this.selectedPresentation.weightPerUnit;
    this.libras = result > 0 ? result.toFixed(2) : '';
  }

  onKey(key: string): void {
    if (!this.activeInput) return;
    let val = this.activeInput === 'cajetas' ? this.cajetas : this.libras;

    if (key === 'C') {
      val = '';
    } else if (key === '⌫') {
      val = val.slice(0, -1);
    } else {
      if (key === '.' && val.includes('.')) return;
      if (this.activeInput === 'cajetas' && key === '.') return; // No decimals for cajetas
      val += key;
    }

    if (this.activeInput === 'cajetas') {
      this.cajetas = val;
      this.recalcLibras();
    } else {
      this.libras = val;
      if (this.calcMode === 'auto') this.librasEdited = true;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Sub-Lot Management
  // ═══════════════════════════════════════════════════════════════

  adicionarSubLote(): void {
    if (!this.selectedTalla || !this.selectedDestino) return;
    const inputLbs = parseFloat(this.libras) || 0;
    if (inputLbs <= 0 || this.isExceedingBalance) return;

    const record: ClassificationRecord = {
      id: Date.now(),
      talla: this.selectedTalla,
      cajetas: parseInt(this.cajetas) || 0,
      libras: inputLbs,
      destino: this.selectedDestino.label,
      loteSuffix: this.getSuffixedLot(),
      maquina: this.maquina,
      timestamp: new Date(),
      presentationId: this.selectedPresentation?.id,
      brandName: this.selectedPresentation?.brandName,
      presentationName: this.selectedPresentation?.name
    };

    this.records.unshift(record);

    // Reset lower form (keep reception and machine)
    this.cajetas = '';
    this.libras = '';
    this.activeInput = null;
    this.selectedDestino = null;
    this.selectedTalla = null;
    this.selectedPresentation = null;
  }

  removerSubLote(index: number): void {
    this.records.splice(index, 1);
  }

  // ═══════════════════════════════════════════════════════════════
  // Core INATrace Submission + ms-shrimp Mirror
  // ═══════════════════════════════════════════════════════════════

  terminarYEnviarAlCore(): void {
    if (this.records.length === 0 || !this.selectedReception || !this.classificationAction) return;
    if (this.massBalance < 0) return;

    this.isSubmitting = true;
    this.errorMsg = '';

    // 1. Build target stock orders from accumulated records
    const targetStockOrders = this.records.map(r => this.buildTargetStockOrder(r));

    // 2. If Entero rejection exists, add Cola output (descabezado conversion)
    if (this.mermaLibras > 0 && this.selectedReception.tipo === 'Entero' && this.colaSemiProduct) {
      targetStockOrders.push(this.buildColaStockOrder());
    }

    // 3. Assemble final ApiProcessingOrder payload
    const payload = {
      processingAction: { id: this.classificationAction.id },
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
    return {
      semiProduct: { id: r.talla.id },
      facility: { id: this.selectedReception.facilityId },
      company: { id: this.COMPANY_ID },
      orderType: 'PROCESSING_ORDER',
      totalGrossQuantity: r.libras,
      totalQuantity: r.libras,
      fulfilledQuantity: r.libras,
      availableQuantity: r.libras,
      internalLotNumber: r.loteSuffix,
      preferredWayOfPayment: 'CASH',
      isPurchaseOrder: false,
      comments: JSON.stringify({
        dualUnit: true,
        cajetas: r.cajetas,
        maquina: r.maquina,
        destino: r.destino,
        presentationId: r.presentationId,
        brandName: r.brandName,
        presentationName: r.presentationName
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
            shrimpSize: r.talla?.name?.replace('Talla ', '') || 'UNKNOWN',
            weightLbs: r.libras,
            cajetasCount: r.cajetas
          }).subscribe();
        });
        console.log('[Clasificación] Mirrored to ms-shrimp');
      },
      error: (e) => console.warn('[Clasificación] ms-shrimp mirror failed:', e)
    });
  }
}
