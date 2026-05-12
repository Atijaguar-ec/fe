import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    return this.classificationSubLots
      .filter(s => s.libras)
      .reduce((sum, s) => sum + (s.libras ?? 0), 0);
  }

  get rechazoLbs(): number {
    return this.summary?.rejectedLbs ?? 0;
  }

  get mermaClasificacionLbs(): number {
    return this.inputLbs - this.totalClassifiedLbs - this.rechazoLbs;
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

  //  /** Destination breakdown with pre-computed totals (avoids template assignments). */
  get subLotsByDestino(): { key: string; label: string; icon: string; totalLbs: number; sublots: any[] }[] {
    const groups: Record<string, any[]> = {};
    for (const s of this.classificationSubLots) {
      const key = s.destinoKey || 'BLOQUE';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    const DEST_META: Record<string, { label: string; icon: string }> = {
      'BLOQUE':         { label: 'Bloque',        icon: '🧊' },
      'IQF':            { label: 'IQF',            icon: '❄️' },
      'VALOR_AGREGADO': { label: 'Valor Agregado', icon: '⭐' },
      'SALMUERA':       { label: 'Salmuera',       icon: '🧂' },
    };
    return Object.entries(groups).map(([key, sublots]) => ({
      key,
      label: DEST_META[key]?.label ?? key,
      icon:  DEST_META[key]?.icon  ?? '📦',
      totalLbs: sublots.filter(s => s.libras).reduce((sum, s) => sum + (s.libras ?? 0), 0),
      sublots
    }));
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
      this.summary = s;
      this.classificationSubLots = s?.subLots ?? [];
    });
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
    const ICONS: Record<string, string> = { BLOQUE: '🧊', IQF: '❄️', VALOR_AGREGADO: '⭐', SALMUERA: '🧂' };
    const LABELS: Record<string, string> = { BLOQUE: 'Bloque', IQF: 'IQF', VALOR_AGREGADO: 'Valor Agregado', SALMUERA: 'Salmuera' };
    return this.subLotsByDestino.map(g => {
      const mockYield = g.key === 'VALOR_AGREGADO' ? 0.66 : 0.9;
      const masterWt = g.totalLbs * mockYield;
      return {
        destinationType: g.key as any,
        destinationLabel: LABELS[g.key] ?? g.key,
        destinationIcon:  ICONS[g.key]  ?? '📦',
        lotSuffix: '-',
        receivedLbs: g.totalLbs,
        mastersProduced: Math.ceil(masterWt / 40),
        masterWeightLbs: masterWt,
        areaShrinkageLbs: g.totalLbs - masterWt,
        areaYieldPercent: mockYield * 100,
        status: 'PENDING'
      };
    });
  }

  private buildMockConsolidated(): any {
    return {
      inputLbs: this.inputLbs,
      classifiedLbs: this.totalClassifiedLbs,
      rechazoLbs: this.rechazoLbs,
      mermaClasificacion: this.mermaClasificacionLbs,
      totalOutput: this.totalAreaOutput,
      totalMermaAreas: this.totalMermaAreas,
      rendimientoFinal: this.rendimientoFinal,
      isMock: true
    };
  }
}
