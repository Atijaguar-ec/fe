import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ShrimpMsService, AreaSettlement } from '../services/shrimp-ms.service';

type ActiveTab = 'clasificacion' | 'areas' | 'consolidado';

/**
 * Liquidación — 3-tab professional settlement report.
 *
 * TAB 1 — Clasificación Desglose:
 *   Reproduces DUFER physical document Lote 1662 row by row.
 *   Shows each sub-lot: talla, clase, cajetas/gavetas, libras, destino, lote-suffix.
 *   KPI: rendimiento% real-time + mass balance equation.
 *
 * TAB 2 — Liquidación por Área:
 *   One card per destination (Bloque/IQF/VA/Salmuera).
 *   lbs_recibidas → masters_producidos → merma_área → rendimiento_área.
 *   Initially from mocks; connected to transformation APIs in Sprint 10.
 *
 * TAB 3 — Reporte Consolidado:
 *   Full balance: input → classification → transformation → output.
 *   Mimics official DUFER docs 5 & 6 layout.
 *   Auto mass-balance: Δ = entradas − salidas (must be 0 ± tolerance).
 */
@Component({
  selector: 'app-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liquidacion.component.html',
  styleUrls: ['./liquidacion.component.css']
})
export class LiquidacionComponent implements OnInit {
  // ─── Tab state ─────────────────────────────────────────────────
  activeTab: ActiveTab = 'clasificacion';

  // ─── Lot selection ─────────────────────────────────────────────
  receptions: any[] = [];
  selectedLotId: number | null = null;
  summary: any = null;
  classificationSubLots: any[] = [];

  // ─── Area settlements (Tab 2) ──────────────────────────────────
  areaSettlements: any[] = [];
  areaSettlementsLoading = false;

  // ─── Consolidated (Tab 3) ──────────────────────────────────────
  consolidated: any = null;
  consolidatedLoading = false;

  // ─── KPIs (computed) ──────────────────────────────────────────
  get inputLbs(): number {
    return this.summary?.inputLbs ?? 0;
  }

  get totalClassifiedLbs(): number {
    return this.enteroLbs + this.colaLbs;
  }

  get enteroLbs(): number {
    return this.enteroGroups.reduce((sum, g) => sum + (g.lbsA || 0), 0);
  }

  get colaLbs(): number {
    return this.colaGroups.reduce((sum, g) => sum + (g.lbsA || 0) + (g.lbsB || 0) + (g.lbsC || 0), 0);
  }

  get mermaClasificacionLbs(): number {
    return this.inputLbs - this.totalClassifiedLbs;
  }

  get pctEntero(): number {
    return this.inputLbs > 0 ? (this.enteroLbs / this.inputLbs) * 100 : 0;
  }

  get pctCola(): number {
    return this.inputLbs > 0 ? (this.colaLbs / this.inputLbs) * 100 : 0;
  }

  get pctMerma(): number {
    return this.inputLbs > 0 ? (this.mermaClasificacionLbs / this.inputLbs) * 100 : 0;
  }

  get rendimientoClasificacion(): number {
    if (this.inputLbs <= 0) return 0;
    return (this.totalClassifiedLbs / this.inputLbs) * 100;
  }

  get rendimientoColor(): string {
    if (this.rendimientoClasificacion >= 80) return 'green';
    if (this.rendimientoClasificacion >= 65) return 'yellow';
    return 'red';
  }

  get totalAreaOutput(): number {
    return this.areaSettlements.reduce((s, a) => s + a.masterWeightLbs, 0);
  }

  get totalMermaAreas(): number {
    return this.areaSettlements.reduce((s, a) => s + a.areaShrinkageLbs, 0);
  }

  get rendimientoFinal(): number {
    if (this.inputLbs <= 0) return 0;
    return (this.totalAreaOutput / this.inputLbs) * 100;
  }

  // ─── Desglose por Producto (Entero vs Cola) ──────────────────────
  get enteroGroups(): any[] {
    const enteros = this.classificationSubLots.filter(s => s.productType === 'ENTERO');
    const grouped = this.groupByTalla(enteros);
    return grouped.map(g => ({
      talla: g.talla,
      loteSuffix: g.items[0]?.loteSuffix || '—',
      lbsA: this.sumLbs(g.items, 'A'),
      cajetasA: this.sumCajetas(g.items, 'A')
    }));
  }

  get colaGroups(): any[] {
    const colas = this.classificationSubLots.filter(s => s.productType === 'COLA');
    const grouped = this.groupByTalla(colas);
    return grouped.map(g => ({
      talla: g.talla,
      loteSuffix: g.items[0]?.loteSuffix || '—',
      lbsA: this.sumLbs(g.items, 'A'),
      cajetasA: this.sumCajetas(g.items, 'A'),
      lbsB: this.sumLbs(g.items, 'B'),
      cajetasB: this.sumCajetas(g.items, 'B'),
      lbsC: this.sumLbs(g.items, 'C'),
      cajetasC: this.sumCajetas(g.items, 'C')
    }));
  }

  private groupByTalla(items: any[]): { talla: string; items: any[] }[] {
    const map = new Map<string, any[]>();
    items.forEach(item => {
      const t = item.talla?.displayName || item.talla?.name || item.shrimpSize || 'S/T';
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(item);
    });
    return Array.from(map.entries()).map(([talla, items]) => ({ talla, items }));
  }

  private sumLbs(items: any[], qClass: string): number {
    return items.filter(i => i.qualityClass === qClass).reduce((s, i) => s + (i.libras || 0), 0);
  }

  private sumCajetas(items: any[], qClass: string): number {
    return items.filter(i => i.qualityClass === qClass).reduce((s, i) => s + (i.cantidad || i.cajetasCount || 0), 0);
  }

  constructor(private shrimpMs: ShrimpMsService) {}

  ngOnInit(): void {
    this.shrimpMs.listReceptions().subscribe(list => {
      this.receptions = list;
    });
  }

  onLotChange(): void {
    this.summary = null;
    this.classificationSubLots = [];
    this.areaSettlements = [];
    this.consolidated = null;
    if (!this.selectedLotId) return;

    // Load classification summary
    this.shrimpMs.getClassificationSummary(this.selectedLotId).subscribe(s => {
      this.summary = s || { inputLbs: 5000, rejectedLbs: 200, lotBase: 'LOT-DEMO' };
      // Backend doesn't return subLots in summary yet, so we mock them for UI demonstration
      this.classificationSubLots = s?.subLots ?? this.buildMockClassificationSubLots();
    });
  }

  exportToExcel(): void {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Liquidación Entero
    const dataEntero = this.enteroGroups.map(g => ({
      LOTE: g.loteSuffix,
      TALLA: g.talla,
      'LIBRAS CLASE A': g.lbsA || 0,
      '# CAJETAS CLASE A': g.cajetasA || 0
    }));
    const wsEntero = XLSX.utils.json_to_sheet(dataEntero);
    XLSX.utils.book_append_sheet(wb, wsEntero, 'Liquidacion Entero');

    // Hoja 2: Liquidación Rechazo - Cola
    const dataCola = this.colaGroups.map(g => ({
      LOTE: g.loteSuffix,
      TALLA: g.talla,
      'LIBRAS CLASE A': g.lbsA || 0,
      '# CAJETAS CLASE A': g.cajetasA || 0,
      'LIBRAS CLASE B': g.lbsB || 0,
      '# CAJETAS CLASE B': g.cajetasB || 0,
      'LIBRAS CLASE C': g.lbsC || 0,
      '# CAJETAS CLASE C': g.cajetasC || 0
    }));
    const wsCola = XLSX.utils.json_to_sheet(dataCola);
    XLSX.utils.book_append_sheet(wb, wsCola, 'Liquidacion Rechazo - Cola');

    // Hoja 3: Liquidación por Áreas
    if (this.areaSettlements && this.areaSettlements.length > 0) {
      const dataAreas = this.areaSettlements.map(a => ({
        'ÁREA DE TRANSFORMACIÓN': a.destinationLabel,
        'LIBRAS RECIBIDAS (Gavetas)': a.receivedLbs || 0,
        'MASTERS PRODUCIDOS': a.mastersProduced || 0,
        'PESO EMPACADO FINAL (Lbs)': a.masterWeightLbs || 0,
        'MERMA DEL ÁREA (Lbs)': a.areaShrinkageLbs || 0,
        'RENDIMIENTO DE ÁREA (%)': (a.areaYieldPercent || 0).toFixed(2) + '%'
      }));
      const wsAreas = XLSX.utils.json_to_sheet(dataAreas);
      XLSX.utils.book_append_sheet(wb, wsAreas, 'Liquidación por Áreas');
    }

    // Hoja 4: Balance Consolidado (Masa)
    const dataBalance = [{
      'CONCEPTO': 'Libras Crudas Recibidas',
      'VALOR': this.inputLbs
    }, {
      'CONCEPTO': 'Total Libras Clasificadas',
      'VALOR': this.totalClassifiedLbs
    }, {
      'CONCEPTO': 'Merma de Clasificación',
      'VALOR': this.mermaClasificacionLbs
    }, {
      'CONCEPTO': 'Total Libras Empacadas (Todas las áreas)',
      'VALOR': this.totalAreaOutput
    }, {
      'CONCEPTO': 'Mermas de Transformación (Áreas)',
      'VALOR': this.totalMermaAreas
    }, {
      'CONCEPTO': 'RENDIMIENTO FINAL (%)',
      'VALOR': this.rendimientoFinal.toFixed(2) + '%'
    }];
    const wsBalance = XLSX.utils.json_to_sheet(dataBalance);
    XLSX.utils.book_append_sheet(wb, wsBalance, 'Balance Consolidado');

    // Generate Excel file
    const fileName = `Liquidacion_${this.summary?.lotBase || 'SinLote'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  private buildMockClassificationSubLots(): any[] {
    return [
      { productType: 'ENTERO', talla: { name: '20/30' }, qualityClass: 'A', libras: 1000, cantidad: 25, loteSuffix: '-1' },
      { productType: 'ENTERO', talla: { name: '30/40' }, qualityClass: 'A', libras: 1500, cantidad: 37, loteSuffix: '-2' },
      { productType: 'ENTERO', talla: { name: '40/50' }, qualityClass: 'A', libras: 800, cantidad: 20, loteSuffix: '-3' },
      // Rechazo Cola
      { productType: 'COLA', talla: { name: 'U/15' }, qualityClass: 'A', libras: 300, cantidad: 7, loteSuffix: '-C1' },
      { productType: 'COLA', talla: { name: 'U/15' }, qualityClass: 'B', libras: 150, cantidad: 3, loteSuffix: '-C1' },
      { productType: 'COLA', talla: { name: '16/20' }, qualityClass: 'A', libras: 400, cantidad: 10, loteSuffix: '-C2' },
      { productType: 'COLA', talla: { name: '16/20' }, qualityClass: 'B', libras: 200, cantidad: 5, loteSuffix: '-C2' },
      { productType: 'COLA', talla: { name: '16/20' }, qualityClass: 'C', libras: 50, cantidad: 1, loteSuffix: '-C2' },
    ];
  }

  setTab(tab: ActiveTab): void {
    this.activeTab = tab;
    if (tab === 'areas' && this.selectedLotId && this.areaSettlements.length === 0) {
      this.loadAreaSettlements();
    }
    if (tab === 'consolidado' && this.selectedLotId && !this.consolidated) {
      this.loadConsolidated();
    }
  }

  private loadAreaSettlements(): void {
    if (!this.selectedLotId) return;
    this.areaSettlementsLoading = true;
    this.shrimpMs.getAreaSettlements(this.selectedLotId).subscribe({
      next: (data) => {
        this.areaSettlements = data.length > 0 ? data : this.buildMockAreaSettlements();
        this.areaSettlementsLoading = false;
      },
      error: () => {
        this.areaSettlements = this.buildMockAreaSettlements();
        this.areaSettlementsLoading = false;
      }
    });
  }

  private loadConsolidated(): void {
    if (!this.selectedLotId) return;
    this.consolidatedLoading = true;
    this.shrimpMs.getConsolidated(this.selectedLotId).subscribe({
      next: (data) => {
        this.consolidated = data ?? this.buildMockConsolidated();
        this.consolidatedLoading = false;
      },
      error: () => {
        this.consolidated = this.buildMockConsolidated();
        this.consolidatedLoading = false;
      }
    });
  }

  /** Builds mock area settlements enriched with display fields for the template. */
  private buildMockAreaSettlements(): any[] {
    return [
      {
        destinationType: 'BLOQUE', destinationLabel: 'Bloque', destinationIcon: '🧊',
        lotSuffix: '-', receivedLbs: 3300, mastersProduced: 80, masterWeightLbs: 3200,
        areaShrinkageLbs: 100, areaYieldPercent: 96.9, status: 'PENDING'
      },
      {
        destinationType: 'IQF', destinationLabel: 'IQF', destinationIcon: '❄️',
        lotSuffix: '-', receivedLbs: 1100, mastersProduced: 50, masterWeightLbs: 1000,
        areaShrinkageLbs: 100, areaYieldPercent: 90.9, status: 'PENDING'
      }
    ];
  }

  private buildMockConsolidated(): any {
    return {
      inputLbs: this.inputLbs,
      classifiedLbs: this.totalClassifiedLbs,
      rechazoLbs: this.colaLbs,
      mermaClasificacion: this.mermaClasificacionLbs,
      totalOutput: this.totalAreaOutput,
      totalMermaAreas: this.totalMermaAreas,
      rendimientoFinal: this.rendimientoFinal,
      isMock: true
    };
  }
}
