import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, TransformWorkItem, CommercialPresentation } from '../../services/shrimp-ms.service';
import { ShrimpDataService } from '../../services/shrimp-data.service';

// ─── Domain Models ──────────────────────────────────────────────

/** A format option parsed from the JSON stored in CommercialPresentation.presentationFormat */
interface FormatOption {
  label: string;             // e.g. "10×5"
  cajetasPorMaster: number;  // N: estuches por cartón master, e.g. 10
  lbsPorEstuche: number;     // M: libras por estuche, e.g. 5
  pesoPerMaster: number;     // N × M = peso total, e.g. 50 lbs
}

/** A registered master carton batch */
interface BloqueCreado {
  id: number;
  lote: string;
  talla: string;
  qualityClass: string;
  brandName: string;
  formato: string;           // e.g. "10×4"
  mastersCount: number;
  cajetasUsadas: number;     // How many cajetas were consumed
  librasTotal: number;
  sourceSubLotId: string;
  isMultiLote: boolean;
  timestamp: Date;
}

/** A leftover entry in the basket */
interface LeftoverEntry {
  id: number;
  sourceSubLotId: string;
  lote: string;
  brandName: string;
  talla: string;             // displayName
  qualityClass: string;
  cajetas: number;
  librasEstimadas: number;
  timestamp: Date;
}

/** Grouped leftovers by brand+talla+class */
interface LeftoverGroup {
  key: string;               // "SeaFresh|SH-ON 36/40|A"
  brandName: string;
  talla: string;
  qualityClass: string;
  entries: LeftoverEntry[];
  totalCajetas: number;
  totalLibras: number;
}

/** Extended work item with remaining cajetas tracking */
interface WorkItemState {
  item: TransformWorkItem;
  cajetasRestantes: number;
  librasRestantes: number;
  pesoPerCajeta: number;
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Parse presentation format JSON to FormatOption[].
 * Accepts JSON array ["10x4", "5x4"] or plain string "10x4".
 */
function parseFormats(formatStr: string | undefined, weightPerUnit: number): FormatOption[] {
  if (!formatStr) return [];

  let rawFormats: string[];
  if (formatStr.startsWith('[')) {
    try {
      rawFormats = JSON.parse(formatStr);
    } catch {
      rawFormats = [formatStr];
    }
  } else {
    rawFormats = [formatStr];
  }

  return rawFormats
    .filter(f => f && f.trim())
    .map(f => {
      const label = f.trim();
      // Format: "10x5" → 10 estuches × 5 lbs/estuche = 50 lbs per master
      // match[1] = número de estuches por cartón master (N)
      // match[2] = peso en lbs de cada estuche (M)
      const match = label.match(/^(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
      const estuchesPorMaster = match ? parseInt(match[1], 10) : 10;
      const lbsPorEstuche    = match ? parseFloat(match[2]) : (weightPerUnit || 5);
      return {
        label,
        cajetasPorMaster: estuchesPorMaster,           // N: cuántos estuches en un cartón master
        lbsPorEstuche,                                  // M: libras por estuche
        pesoPerMaster: estuchesPorMaster * lbsPorEstuche // N × M = peso total del cartón master
      };
    });
}

let _nextId = Date.now();
function nextId(): number { return _nextId++; }

// ═══════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-bloque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../shared/transform.styles.css'],
  templateUrl: './bloque.component.html'
})
export class BloqueComponent implements OnInit {

  // ─── Work Queue ──────────────────────────────────────────────
  workItems: TransformWorkItem[] = [];
  /** Tracks remaining cajetas per sub-lot (allows partial processing) */
  workStates: Map<string, WorkItemState> = new Map();
  selectedState: WorkItemState | null = null;
  isLoading = false;

  // ─── Presentations Catalog ───────────────────────────────────
  allPresentations: CommercialPresentation[] = [];
  availableFormats: FormatOption[] = [];
  selectedFormat: FormatOption | null = null;

  // ─── Partial Processing Form ─────────────────────────────────
  /** Operator can choose how many cajetas to process (partial lot) */
  cajetasAProcesar = 0;
  mastersCalculados = 0;
  cajetasSobrantes = 0;
  pesoTotalMasters = 0;
  pesoSobrantes = 0;

  // ─── Registered Masters ──────────────────────────────────────
  bloquesCreados: BloqueCreado[] = [];

  // ─── Leftover Basket ─────────────────────────────────────────
  leftoverBasket: LeftoverEntry[] = [];
  leftoverGroups: LeftoverGroup[] = [];

  // Leftover master creation
  selectedLeftoverGroup: LeftoverGroup | null = null;
  leftoverFormats: FormatOption[] = [];
  selectedLeftoverFormat: FormatOption | null = null;
  leftoverMasters = 0;
  leftoverSobrantes = 0;
  leftoverPesoMasters = 0;

  // ─── Company ─────────────────────────────────────────────────
  COMPANY_ID: number | null = null;

  constructor(
    private shrimpMs: ShrimpMsService,
    private dataService: ShrimpDataService
  ) {}

  getLote(entry: LeftoverEntry): string {
    return entry.lote;
  }

  ngOnInit(): void {
    this.dataService.getActiveCompany().subscribe(company => {
      const companyIds = company?.data?.companyIds || company?.companyIds || [];
      this.COMPANY_ID = companyIds.length > 0 ? companyIds[0] : null;
      if (this.COMPANY_ID) {
        this.loadWorkItems();
        this.loadPresentations();
        this.loadLeftoversFromStorage();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════════════

  loadWorkItems(): void {
    this.isLoading = true;
    this.shrimpMs.listPendingSubLots('BLOQUE').subscribe({
      next: items => {
        this.workItems = items;
        // Initialize state for each item
        this.workStates.clear();
        for (const item of items) {
          const pesoPerCajeta = item.libras && item.cantidad > 0
            ? item.libras / item.cantidad
            : 0;
          this.workStates.set(item.subLotId, {
            item,
            cajetasRestantes: item.cantidad,
            librasRestantes: item.libras ?? 0,
            pesoPerCajeta
          });
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadPresentations(): void {
    if (!this.COMPANY_ID) return;
    this.shrimpMs.listPresentations(this.COMPANY_ID, 'BLOQUE').subscribe(list => {
      this.allPresentations = list.filter(p => p.isActive !== false);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Work Item Selection
  // ═══════════════════════════════════════════════════════════════

  get activeWorkItems(): WorkItemState[] {
    return Array.from(this.workStates.values()).filter(s => s.cajetasRestantes > 0);
  }

  selectItem(state: WorkItemState): void {
    this.selectedState = state;
    this.selectedFormat = null;
    this.cajetasAProcesar = state.cajetasRestantes; // Default: all remaining
    this.mastersCalculados = 0;
    this.cajetasSobrantes = 0;
    this.pesoTotalMasters = 0;
    this.pesoSobrantes = 0;

    // Find presentations for this brand.
    // Priority: item.brandName (pure brand, set since the revert) → first word of presentationName (legacy fallback)
    const rawBrand = state.item.brandName
      || (state.item.presentationName ? state.item.presentationName.split(' ')[0] : '');
    const brandName = rawBrand.toLowerCase();
    const brandPresentations = this.allPresentations.filter(
      p => p.brandName.toLowerCase() === brandName
    );

    // Parse available formats
    this.availableFormats = [];
    for (const pres of brandPresentations) {
      const formats = parseFormats(pres.presentationFormat, pres.weightPerUnit);
      this.availableFormats.push(...formats);
    }

    // Deduplicate
    const seen = new Set<string>();
    this.availableFormats = this.availableFormats.filter(f => {
      if (seen.has(f.label)) return false;
      seen.add(f.label);
      return true;
    });

    if (this.availableFormats.length === 1) {
      this.onFormatSelected(this.availableFormats[0]);
    }
  }

  onFormatSelected(format: FormatOption): void {
    this.selectedFormat = format;
    this.recalcular();
  }

  onCajetasChange(): void {
    this.recalcular();
  }

  recalcular(): void {
    if (!this.selectedState || !this.selectedFormat) return;

    // Clamp to remaining cajetas
    if (this.cajetasAProcesar > this.selectedState.cajetasRestantes) {
      this.cajetasAProcesar = this.selectedState.cajetasRestantes;
    }
    if (this.cajetasAProcesar < 0) this.cajetasAProcesar = 0;

    const cajPorMaster = this.selectedFormat.cajetasPorMaster;

    this.mastersCalculados = Math.floor(this.cajetasAProcesar / cajPorMaster);
    this.cajetasSobrantes  = this.cajetasAProcesar % cajPorMaster;

    // ─── Peso COMERCIAL del producto terminado ─────────────────────
    // Usa el peso del formato NxM (producto congelado), NO el peso de materia prima cruda.
    // Ej: formato 10x5 → pesoPerMaster = 50 lbs. 3 masters = 150 lbs comerciales.
    // El peso crudo de entrada (pesoPerCajeta) se refleja en el balance de área (merma).
    this.pesoTotalMasters = this.mastersCalculados * this.selectedFormat.pesoPerMaster;
    this.pesoSobrantes    = this.cajetasSobrantes  * this.selectedFormat.lbsPorEstuche;
  }

  // ═══════════════════════════════════════════════════════════════
  // Master Registration (supports PARTIAL processing)
  // ═══════════════════════════════════════════════════════════════

  showLeftoverConfirmModal = false;

  confirmarLeftover(): void {
    this.showLeftoverConfirmModal = true;
  }

  cancelarLeftover(): void {
    this.showLeftoverConfirmModal = false;
  }

  ejecutarLeftover(): void {
    this.showLeftoverConfirmModal = false;
    this.registrarMasterizado();
  }

  registrarMasterizado(): void {
    if (!this.selectedState || !this.selectedFormat) return;
    if (this.mastersCalculados <= 0 && this.cajetasSobrantes <= 0) return;

    const state = this.selectedState;
    const brandName = state.item.brandName
      || (state.item.presentationName ? state.item.presentationName.split(' ')[0] : 'N/A');
    const cajetasConsumidas = this.mastersCalculados * this.selectedFormat.cajetasPorMaster;

    // Register the masters (if any)
    if (this.mastersCalculados > 0) {
      this.bloquesCreados.push({
        id: nextId(),
        lote: state.item.loteSuffix,
        talla: state.item.talla.displayName,
        qualityClass: state.item.qualityClass,
        brandName,
        formato: this.selectedFormat.label,
        mastersCount: this.mastersCalculados,
        cajetasUsadas: cajetasConsumidas,
        librasTotal: this.pesoTotalMasters,
        sourceSubLotId: state.item.subLotId,
        isMultiLote: false,
        timestamp: new Date()
      });
    }

    // Send leftovers to basket if any
    if (this.cajetasSobrantes > 0) {
      this.leftoverBasket.push({
        id: nextId(),
        sourceSubLotId: state.item.subLotId,
        lote: state.item.loteSuffix,
        brandName,
        talla: state.item.talla.displayName,
        qualityClass: state.item.qualityClass,
        cajetas: this.cajetasSobrantes,
        librasEstimadas: this.pesoSobrantes,
        timestamp: new Date()
      });
      this.saveLeftoversToStorage();
      this.rebuildLeftoverGroups();
    }

    // Update remaining cajetas on this sub-lot
    const totalUsed = cajetasConsumidas + this.cajetasSobrantes;
    state.cajetasRestantes -= totalUsed;
    state.librasRestantes -= (totalUsed * state.pesoPerCajeta);

    // If fully consumed, remove from queue
    if (state.cajetasRestantes <= 0) {
      this.workStates.delete(state.item.subLotId);
    }

    // Reset form
    this.selectedState = null;
    this.selectedFormat = null;
    this.availableFormats = [];
    this.cajetasAProcesar = 0;
    this.mastersCalculados = 0;
    this.cajetasSobrantes = 0;
    this.pesoTotalMasters = 0;
    this.pesoSobrantes = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // Leftover Basket
  // ═══════════════════════════════════════════════════════════════

  private rebuildLeftoverGroups(): void {
    const map = new Map<string, LeftoverEntry[]>();

    for (const entry of this.leftoverBasket) {
      // Key: STRICT same brand + talla + class (no cross-class mixing)
      const key = `${entry.brandName}|${entry.talla}|${entry.qualityClass}`;
      const existing = map.get(key) || [];
      existing.push(entry);
      map.set(key, existing);
    }

    this.leftoverGroups = Array.from(map.entries()).map(([key, entries]) => ({
      key,
      brandName: entries[0].brandName,
      talla: entries[0].talla,
      qualityClass: entries[0].qualityClass,
      entries,
      totalCajetas: entries.reduce((s, e) => s + e.cajetas, 0),
      totalLibras: entries.reduce((s, e) => s + e.librasEstimadas, 0)
    }));
  }

  selectLeftoverGroup(group: LeftoverGroup): void {
    // Toggle: if already selected, deselect
    if (this.selectedLeftoverGroup?.key === group.key) {
      this.selectedLeftoverGroup = null;
      return;
    }

    this.selectedLeftoverGroup = group;
    this.selectedLeftoverFormat = null;
    this.leftoverMasters = 0;
    this.leftoverSobrantes = 0;
    this.leftoverPesoMasters = 0;

    // Find formats for this brand
    const brandPresentations = this.allPresentations.filter(
      p => p.brandName.toLowerCase() === group.brandName.toLowerCase()
    );

    this.leftoverFormats = [];
    for (const pres of brandPresentations) {
      const formats = parseFormats(pres.presentationFormat, pres.weightPerUnit);
      this.leftoverFormats.push(...formats);
    }

    const seen = new Set<string>();
    this.leftoverFormats = this.leftoverFormats.filter(f => {
      if (seen.has(f.label)) return false;
      seen.add(f.label);
      return true;
    });
  }

  onLeftoverFormatSelected(format: FormatOption): void {
    this.selectedLeftoverFormat = format;
    this.calcularLeftoverMasters();
  }

  calcularLeftoverMasters(): void {
    if (!this.selectedLeftoverGroup || !this.selectedLeftoverFormat) return;

    const totalCajetas = this.selectedLeftoverGroup.totalCajetas;
    const cajPorMaster = this.selectedLeftoverFormat.cajetasPorMaster;

    this.leftoverMasters    = Math.floor(totalCajetas / cajPorMaster);
    this.leftoverSobrantes  = totalCajetas % cajPorMaster;
    // Peso COMERCIAL: usa pesoPerMaster del formato (N × M), no el peso crudo de entrada
    this.leftoverPesoMasters = this.leftoverMasters * this.selectedLeftoverFormat.pesoPerMaster;
  }

  registrarLeftoverMaster(): void {
    if (!this.selectedLeftoverGroup || !this.selectedLeftoverFormat || this.leftoverMasters <= 0) return;

    const group = this.selectedLeftoverGroup;
    const lotes = group.entries.map(e => e.lote).join('+');

    // Register the masters as MULTI-LOTE
    this.bloquesCreados.push({
      id: nextId(),
      lote: `MULTI: ${lotes}`,
      talla: group.talla,
      qualityClass: group.qualityClass,
      brandName: group.brandName,
      formato: this.selectedLeftoverFormat.label,
      mastersCount: this.leftoverMasters,
      cajetasUsadas: this.leftoverMasters * this.selectedLeftoverFormat.cajetasPorMaster,
      librasTotal: this.leftoverPesoMasters,
      sourceSubLotId: group.entries.map(e => e.sourceSubLotId).join(','),
      isMultiLote: true,
      timestamp: new Date()
    });

    // Consume cajetas from entries (FIFO order)
    let remaining = this.leftoverMasters * this.selectedLeftoverFormat.cajetasPorMaster;
    const newBasket: LeftoverEntry[] = [];

    for (const entry of this.leftoverBasket) {
      const entryKey = `${entry.brandName}|${entry.talla}|${entry.qualityClass}`;
      if (entryKey === group.key && remaining > 0) {
        if (remaining >= entry.cajetas) {
          remaining -= entry.cajetas;
          // Fully consumed — skip (don't add to newBasket)
        } else {
          // Partially consumed
          const pesoPerCajeta = entry.cajetas > 0 ? entry.librasEstimadas / entry.cajetas : 0;
          entry.cajetas -= remaining;
          entry.librasEstimadas = entry.cajetas * pesoPerCajeta;
          remaining = 0;
          newBasket.push(entry);
        }
      } else {
        newBasket.push(entry);
      }
    }

    this.leftoverBasket = newBasket;
    this.saveLeftoversToStorage();
    this.rebuildLeftoverGroups();

    // Reset
    this.selectedLeftoverGroup = null;
    this.selectedLeftoverFormat = null;
    this.leftoverFormats = [];
    this.leftoverMasters = 0;
    this.leftoverSobrantes = 0;
    this.leftoverPesoMasters = 0;
  }

  removeLeftoverEntry(entry: LeftoverEntry): void {
    this.leftoverBasket = this.leftoverBasket.filter(e => e.id !== entry.id);
    this.saveLeftoversToStorage();
    this.rebuildLeftoverGroups();
    if (this.selectedLeftoverGroup) {
      const stillExists = this.leftoverGroups.find(g => g.key === this.selectedLeftoverGroup!.key);
      if (!stillExists) {
        this.selectedLeftoverGroup = null;
      }
    }
  }

  // ─── LocalStorage Persistence (TODO: migrate to backend table) ──

  private readonly STORAGE_KEY = 'bloque_leftovers_v2';

  private saveLeftoversToStorage(): void {
    try {
      const data = {
        entries: this.leftoverBasket,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded or private mode */ }
  }

  private loadLeftoversFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.leftoverBasket = data.entries || [];
        this.rebuildLeftoverGroups();
      }
    } catch { /* corrupted data */ }
  }

  // ═══════════════════════════════════════════════════════════════
  // Computed Properties (Area Balance)
  // ═══════════════════════════════════════════════════════════════

  get totalReceivedLbs(): number {
    // All received lbs: items still in queue + items already processed
    const queueLbs = this.workItems.filter(w => w.libras).reduce((s, w) => s + (w.libras ?? 0), 0);
    return queueLbs;
  }

  get totalBloqueWt(): number {
    return this.bloquesCreados.reduce((s, b) => s + b.librasTotal, 0);
  }

  get totalLeftoverWt(): number {
    return this.leftoverBasket.reduce((s, e) => s + e.librasEstimadas, 0);
  }

  get pendingInQueueWt(): number {
    return Array.from(this.workStates.values())
      .filter(s => s.cajetasRestantes > 0)
      .reduce((s, st) => s + st.librasRestantes, 0);
  }

  get areaShrinkage(): number {
    return this.totalReceivedLbs - this.totalBloqueWt - this.totalLeftoverWt - this.pendingInQueueWt;
  }

  get areaYield(): number {
    const processed = this.totalBloqueWt + this.totalLeftoverWt;
    if (this.totalReceivedLbs <= 0 || processed <= 0) return 0;
    return (processed / this.totalReceivedLbs) * 100;
  }
}
