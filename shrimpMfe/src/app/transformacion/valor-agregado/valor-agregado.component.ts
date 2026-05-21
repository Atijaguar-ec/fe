import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, TransformWorkItem, CommercialPresentation, ShrimpSize } from '../../services/shrimp-ms.service';
import { PresentationSelectorModalComponent } from '../../shared/components/presentation-selector-modal/presentation-selector-modal.component';
import { ShrimpDataService } from '../../services/shrimp-data.service';

const VA_SUBTYPES = ['PPV', 'PUD', 'P&D', 'EZ-PEEL'] as const;
type VaSubtype = typeof VA_SUBTYPES[number];

interface FormatOption {
  label: string;
  unidadesPorMaster: number;
  lbsPorUnidad: number;
  pesoPerMaster: number;
}

interface WorkItemState {
  item: TransformWorkItem;
  librasRestantes: number;
  librasOriginales: number;
}

interface VaLeftoverEntry {
  id: number;
  sourceSubLotId: string;
  lote: string;
  brandName: string;
  talla: string;
  qualityClass: string;
  subtype: VaSubtype;
  hidratacion: boolean;
  unidades: number;
  librasEstimadas: number;
  timestamp: Date;
}

interface VaLeftoverGroup {
  key: string;
  brandName: string;
  talla: string;
  qualityClass: string;
  subtype: VaSubtype;
  hidratacion: boolean;
  entries: VaLeftoverEntry[];
  totalUnidades: number;
  totalLibras: number;
}

let _nextId = Date.now();
function nextId(): number { return _nextId++; }

@Component({
  selector: 'app-valor-agregado',
  standalone: true,
  imports: [CommonModule, FormsModule, PresentationSelectorModalComponent],
  styleUrls: ['../shared/transform.styles.css'],
  templateUrl: './valor-agregado.component.html'
})
export class ValorAgregadoComponent implements OnInit {

  // ─── Work Queue ──────────────────────────────────────────────
  workItems: TransformWorkItem[] = [];
  workStates: Map<string, WorkItemState> = new Map();
  selectedState: WorkItemState | null = null;
  
  // ─── Presentations Catalog ───────────────────────────────────
  COMPANY_ID: number | null = null;
  allPresentations: CommercialPresentation[] = [];
  availableFormats: FormatOption[] = [];
  selectedPresentation: CommercialPresentation | null = null;
  selectedFormat: FormatOption | null = null;
  isPresentationModalOpen = false;

  // ─── VA Form ─────────────────────────────────────────────────
  selectedSubtype: VaSubtype | null = null;
  hidratacion = false;
  vaSubtypes = VA_SUBTYPES;
  
  tallasClaseC: ShrimpSize[] = [];
  tallaBloque: ShrimpSize | null = null;
  reportarBloque = false;
  librasBloque = 0;

  reportarMerma = false;
  librasMerma = 0;

  // Input del operario
  librasAProcesar = 0; // Cuánta materia prima va a consumir
  mastersCount = 0;
  unidadesSobrantes = 0;
  
  // Calculado automáticamente
  pesoTotalMasters = 0;
  pesoSobrantes = 0;
  totalProducidoLbs = 0;
  areaYieldCalculated = 0;

  // ─── Registered Masters ──────────────────────────────────────
  masters: { count: number; lbs: number; subtype: string; talla: string; hidratacion: boolean; lote: string; destino: string }[] = [];
  bloquesEnviados: { lbs: number; talla: string; timestamp: Date }[] = [];
  desperdiciosRegistrados: { lbs: number; timestamp: Date }[] = [];

  // ─── Leftovers ───────────────────────────────────────────────
  leftoverBasket: VaLeftoverEntry[] = [];
  leftoverGroups: VaLeftoverGroup[] = [];
  showLeftoverConfirmModal = false;

  // ─── Accumulators for Yield ──────────────────────────────────
  accumulatedProcessedLbs = 0;
  accumulatedCommercialLbs = 0;
  accumulatedBloqueLbs = 0;
  accumulatedDesperdicioLbs = 0;

  constructor(private shrimpMs: ShrimpMsService, private dataService: ShrimpDataService) {}

  ngOnInit(): void {
    this.dataService.getActiveCompany().subscribe(company => {
      const companyIds = company?.data?.companyIds || company?.companyIds || [];
      this.COMPANY_ID = companyIds.length > 0 ? companyIds[0] : null;
      if (this.COMPANY_ID) {
        this.loadPresentations();
      }
    });
    this.loadWorkItems();
    this.loadLeftoversFromStorage();
    this.shrimpMs.listSizes('COLA', 'BROKEN').subscribe(sizes => this.tallasClaseC = sizes);
  }

  loadPresentations(): void {
    if (!this.COMPANY_ID) return;
    this.shrimpMs.listPresentations(this.COMPANY_ID, 'VALOR_AGREGADO').subscribe(list => {
      this.allPresentations = list.filter(p => p.isActive !== false);
    });
  }

  loadWorkItems(): void {
    this.shrimpMs.listPendingSubLots('VALOR_AGREGADO').subscribe(items => {
      this.workItems = items;
      // Initialize or update states
      for (const item of items) {
        if (!this.workStates.has(item.subLotId)) {
          this.workStates.set(item.subLotId, {
            item,
            librasOriginales: item.libras || 0,
            librasRestantes: item.libras || 0
          });
        }
      }
    });
  }

  selectItem(item: TransformWorkItem): void {
    if (!this.workStates.has(item.subLotId)) {
      this.workStates.set(item.subLotId, {
        item,
        librasOriginales: item.libras || 0,
        librasRestantes: item.libras || 0
      });
    }
    this.selectedState = this.workStates.get(item.subLotId) || null;
    this.resetForm();
  }

  getLibrasRestantes(item: TransformWorkItem): number {
    return this.workStates.get(item.subLotId)?.librasRestantes ?? (item.libras || 0);
  }

  get currentSubtypes(): VaSubtype[] {
    return [...this.vaSubtypes];
  }

  resetForm(): void {
    this.selectedPresentation = null;
    this.selectedFormat = null;
    this.availableFormats = [];
    this.selectedSubtype = null;
    this.tallaBloque = null;
    this.reportarBloque = false;
    this.librasBloque = 0;
    this.reportarMerma = false;
    this.librasMerma = 0;
    this.hidratacion = false;
    this.librasAProcesar = 0;
    this.mastersCount = 0;
    this.unidadesSobrantes = 0;
    this.pesoTotalMasters = 0;
    this.pesoSobrantes = 0;
    this.totalProducidoLbs = 0;
    this.areaYieldCalculated = 0;
  }

  usarTodasLibras(): void {
    if (this.selectedState) {
      this.librasAProcesar = this.selectedState.librasRestantes;
      this.recalcular();
    }
  }

  openPresentationModal(): void {
    this.isPresentationModalOpen = true;
  }

  onPresentationSelected(p: CommercialPresentation): void {
    this.selectedPresentation = p;
    this.selectedFormat = null;
    this.isPresentationModalOpen = false;

    const brandName = p.brandName || '';
    const style = p.style || '';
    const name = p.name || '';

    const matches = this.allPresentations.filter(pres => 
      (pres.brandName || '') === brandName && (pres.style || '') === style && (pres.name || '') === name
    );

    this.availableFormats = [];
    for (const pres of matches) {
      const formats = this.parseFormatsList(pres.presentationFormat, pres.weightPerUnit);
      this.availableFormats.push(...formats);
    }
    const seen = new Set<string>();
    this.availableFormats = this.availableFormats.filter(f => {
      if (seen.has(f.label)) return false;
      seen.add(f.label);
      return true;
    });

    if (this.availableFormats.length === 1) {
      this.onFormatSelected(this.availableFormats[0]);
    } else {
      this.recalcular();
    }
  }

  onFormatSelected(fmt: FormatOption): void {
    this.selectedFormat = fmt;
    this.recalcular();
  }

  closePresentationModal(): void {
    this.isPresentationModalOpen = false;
  }

  parseFormatsList(formatStr: string | undefined, weightPerUnit: number): FormatOption[] {
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
        const match = label.match(/^(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
        const unidades = match ? parseInt(match[1], 10) : 1;
        const lbs = match ? parseFloat(match[2]) : weightPerUnit;
        return {
          label,
          unidadesPorMaster: unidades,
          lbsPorUnidad: lbs,
          pesoPerMaster: unidades * lbs
        };
      });
  }

  recalcular(): void {
    if (!this.selectedState || !this.selectedFormat) return;

    this.pesoTotalMasters = this.mastersCount * this.selectedFormat.pesoPerMaster;
    this.pesoSobrantes = this.unidadesSobrantes * this.selectedFormat.lbsPorUnidad;
    this.totalProducidoLbs = this.pesoTotalMasters + this.pesoSobrantes;
    this.areaYieldCalculated = this.librasAProcesar > 0 ? (this.totalProducidoLbs / this.librasAProcesar) * 100 : 0;
  }

  get expectedYield(): number {
    switch (this.selectedSubtype) {
      case 'EZ-PEEL': return 0.85; // Easy peel conserva más cáscara
      case 'PUD': return 0.72;     // Pelado sin desvenar pierde menos que P&D
      case 'PPV':
      case 'P&D': return 0.66;     // Pelado y desvenado (mayor merma)
      default: return 0.66;
    }
  }

  sugerirEmpaque(): void {
    if (!this.selectedFormat || !this.librasAProcesar) return;
    
    // 1. Calculamos las libras comerciales estimadas basadas en el rendimiento histórico del subtipo
    const librasEstimadas = this.librasAProcesar * this.expectedYield;
    
    // 2. Calculamos el total de estuches que se podrían llenar con esas libras
    const totalEstuches = Math.floor(librasEstimadas / this.selectedFormat.lbsPorUnidad);
    
    // 3. Lo dividimos en Masters Completos y Unidades Sueltas
    this.mastersCount = Math.floor(totalEstuches / this.selectedFormat.unidadesPorMaster);
    this.unidadesSobrantes = totalEstuches % this.selectedFormat.unidadesPorMaster;
    
    this.recalcular();
  }

  isValidForm(): boolean {
    if (!this.selectedState || this.librasAProcesar <= 0 || this.librasAProcesar > this.selectedState.librasRestantes) return false;
    if (!this.selectedPresentation || !this.selectedSubtype) return false;
    if (this.mastersCount <= 0 && this.unidadesSobrantes <= 0) return false;

    if (this.reportarBloque) {
      if (!this.tallaBloque || this.librasBloque <= 0) return false;
    }

    if (this.reportarMerma) {
      if (this.librasMerma <= 0) return false;
    }

    return true;
  }

  confirmarLeftover(): void {
    this.showLeftoverConfirmModal = true;
  }

  cancelarLeftover(): void {
    this.showLeftoverConfirmModal = false;
  }

  ejecutarLeftover(): void {
    this.showLeftoverConfirmModal = false;
    this.registrar();
  }

  registrar(): void {
    if (!this.isValidForm()) return;
    
    const state = this.selectedState!;
    const brandName = this.selectedPresentation?.brandName || state.item.brandName || 'N/A';
    const loteCompleto = state.item.lote + (state.item.loteSuffix || '-3');

    // Registrar Masters
    if (this.mastersCount > 0) {
      this.masters.push({ 
        count: this.mastersCount, 
        lbs: this.pesoTotalMasters, 
        subtype: this.selectedSubtype!, 
        talla: state.item.talla.displayName, 
        hidratacion: this.hidratacion,
        lote: loteCompleto,
        destino: 'TANQUES'
      });
    }

    // Registrar Sobrantes
    if (this.unidadesSobrantes > 0) {
      this.leftoverBasket.push({
        id: nextId(),
        sourceSubLotId: state.item.subLotId,
        lote: loteCompleto,
        brandName,
        talla: state.item.talla.displayName,
        qualityClass: state.item.qualityClass,
        subtype: this.selectedSubtype!,
        hidratacion: this.hidratacion,
        unidades: this.unidadesSobrantes,
        librasEstimadas: this.pesoSobrantes,
        timestamp: new Date()
      });
      this.saveLeftoversToStorage();
      this.rebuildLeftoverGroups();
    }

    // Registrar Bloque
    if (this.reportarBloque && this.librasBloque > 0) {
      this.bloquesEnviados.push({
        lbs: this.librasBloque,
        talla: this.tallaBloque!.displayName,
        timestamp: new Date()
      });
      this.accumulatedBloqueLbs += this.librasBloque;
    }

    // Registrar Merma
    if (this.reportarMerma && this.librasMerma > 0) {
      this.desperdiciosRegistrados.push({ lbs: this.librasMerma, timestamp: new Date() });
      this.accumulatedDesperdicioLbs += this.librasMerma;
    }

    this.accumulatedCommercialLbs += (this.pesoTotalMasters + this.pesoSobrantes);

    // Actualizar consumos y balance general
    this.accumulatedProcessedLbs += this.librasAProcesar;

    state.librasRestantes -= this.librasAProcesar;

    // Si el sub-lote se agota, removerlo
    if (state.librasRestantes <= 0) {
      this.workStates.delete(state.item.subLotId);
      this.workItems = this.workItems.filter(w => w.subLotId !== state.item.subLotId);
    }

    this.resetForm();
    this.selectedState = null;
  }

  // ─── Leftover Management ───
  
  rebuildLeftoverGroups(): void {
    const map = new Map<string, VaLeftoverGroup>();
    for (const entry of this.leftoverBasket) {
      const key = `${entry.brandName}|${entry.talla}|${entry.qualityClass}|${entry.subtype}|${entry.hidratacion}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          brandName: entry.brandName,
          talla: entry.talla,
          qualityClass: entry.qualityClass,
          subtype: entry.subtype,
          hidratacion: entry.hidratacion,
          entries: [],
          totalUnidades: 0,
          totalLibras: 0
        });
      }
      const g = map.get(key)!;
      g.entries.push(entry);
      g.totalUnidades += entry.unidades;
      g.totalLibras += entry.librasEstimadas;
    }
    this.leftoverGroups = Array.from(map.values());
  }

  removeLeftoverEntry(entry: VaLeftoverEntry): void {
    this.leftoverBasket = this.leftoverBasket.filter(e => e.id !== entry.id);
    this.saveLeftoversToStorage();
    this.rebuildLeftoverGroups();
  }

  private readonly STORAGE_KEY = 'va_leftovers_v1';

  private saveLeftoversToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ entries: this.leftoverBasket, savedAt: new Date().toISOString() }));
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

  // ─── Area Balance Metrics ───
  
  get totalReceivedLbs(): number { return this.accumulatedProcessedLbs; }
  get totalMasterWt(): number { return this.accumulatedCommercialLbs; }
  get areaShrinkage(): number { return this.totalReceivedLbs - this.totalMasterWt - this.accumulatedBloqueLbs - this.accumulatedDesperdicioLbs; }
  get areaYield(): number { return this.totalReceivedLbs <= 0 ? 0 : ((this.totalMasterWt + this.accumulatedBloqueLbs) / this.totalReceivedLbs) * 100; }
  
  getTotalMastersCount(): number {
    return this.masters.reduce((sum, m) => sum + m.count, 0);
  }
}
