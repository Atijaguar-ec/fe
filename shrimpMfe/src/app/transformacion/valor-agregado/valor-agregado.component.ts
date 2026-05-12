import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, TransformWorkItem, CommercialPresentation } from '../../services/shrimp-ms.service';

const VA_SUBTYPES = ['PPV', 'PUD', 'P&D', 'EZ-PEEL', 'Estuche'] as const;
type VaSubtype = typeof VA_SUBTYPES[number];

/**
 * Valor Agregado transformation module (Lote base -3).
 * DUFER doc: "incluye PPV, PUD, P&D, EZ-PEEL, estuche...
 *  tratamiento previo de hidratación... puede empacarse en bloques sin IQF".
 * Note: Cola rendimiento ~66% is normal here.
 */
@Component({
  selector: 'app-valor-agregado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../shared/transform.styles.css'],
  template: `
<div class="transform-page">
  <div class="transform-header">
    <div>
      <h1>⭐ Valor Agregado — Transformación</h1>
      <p>Lote base <strong>-3</strong> · PPV / PUD / P&D / EZ-PEEL / Estuche · Rendimiento Cola ~66%</p>
    </div>
    <span class="badge badge-info">{{ workItems.length }} sub-lotes pendientes</span>
  </div>

  <div class="transform-grid">
    <div>
      <div class="transform-card">
        <div class="transform-card-header">
          <h2>📋 Cola de Trabajo</h2>
          <button class="btn btn-teal" style="width:auto;padding:0.4rem 1rem;margin:0;min-height:36px;font-size:0.82rem" (click)="loadWorkItems()">⟳</button>
        </div>
        <div class="empty-state" *ngIf="workItems.length === 0">
          <div class="empty-state__icon">📭</div>
          <div class="empty-state__text">Sin sub-lotes V.A. pendientes</div>
        </div>
        <div class="work-queue" *ngIf="workItems.length > 0">
          <div class="work-item" *ngFor="let item of workItems"
               [style.border-left-color]="selectedItem?.subLotId === item.subLotId ? '#7c3aed' : ''"
               (click)="selectedItem = item" style="cursor:pointer">
            <div class="work-item__info">
              <div class="work-item__lote">{{ item.lote }}-3
                <span class="badge badge-info" style="margin-left:4px">{{ item.talla.displayName }}</span>
              </div>
              <div class="work-item__detail">{{ item.cantidad }} gavetas · Clase {{ item.qualityClass }}</div>
            </div>
            <div class="work-item__lbs" *ngIf="item.libras">{{ item.libras | number:'1.0-1' }} lbs</div>
          </div>
        </div>
      </div>

      <div class="transform-card" style="margin-top:1rem" *ngIf="selectedItem">
        <div class="transform-card-header">
          <h2>➕ Registrar VA — {{ selectedItem.talla.displayName }}</h2>
        </div>

        <!-- G1: Sub-type from catalog -->
        <div class="input-group">
          <label class="input-label">Sub-tipo de proceso <span style="color:#dc2626">*</span></label>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.5rem;margin-bottom:0.75rem">
            <button *ngFor="let st of vaSubtypes"
              style="padding:0.55rem;border-radius:8px;font-size:0.82rem;font-weight:700;border:2px solid #e5e7eb;background:#f9fafb;cursor:pointer;transition:all 0.12s"
              [style.border-color]="selectedSubtype === st ? '#7c3aed' : ''"
              [style.background]="selectedSubtype === st ? '#f5f3ff' : ''"
              [style.color]="selectedSubtype === st ? '#7c3aed' : ''"
              (click)="selectedSubtype = st">{{ st }}</button>
          </div>
        </div>

        <!-- Toggle hidratación -->
        <div class="input-group">
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.88rem;font-weight:600;color:#374151">
            <input type="checkbox" [(ngModel)]="hidratacion" style="width:18px;height:18px;cursor:pointer">
            💧 Requiere tratamiento de hidratación previo
          </label>
        </div>

        <div class="input-row-2">
          <div class="input-group">
            <label class="input-label">Presentación</label>
            <select class="input-field" [(ngModel)]="selectedPresentation">
              <option [ngValue]="null">-- Seleccione --</option>
              <option *ngFor="let p of presentations" [ngValue]="p">{{ p.brandName }} — {{ p.name }}</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">N° Masters</label>
            <input type="number" class="input-field" [(ngModel)]="mastersCount" min="1" placeholder="Ej: 6">
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">Peso Total Masters (lbs)</label>
          <input type="number" class="input-field" [(ngModel)]="mastersTotalLbs" step="0.01" placeholder="Peso neto">
        </div>

        <div class="alert alert-warning" *ngIf="areaYield > 0 && areaYield < 70">
          ℹ️ Rendimiento Cola {{ areaYield | number:'1.1-1' }}% — Normal para V.A. (esperado ~66%)
        </div>

        <button class="btn btn-primary"
                [disabled]="!mastersCount || !selectedSubtype || !selectedPresentation || !mastersTotalLbs"
                (click)="registrar()">✅ Registrar Master V.A.</button>
      </div>
    </div>

    <div class="transform-card transform-balance-card">
      <div class="transform-card-header">
        <h2>⚖️ Liquidación V.A.</h2>
        <span class="badge badge-info">-3</span>
      </div>
      <div class="area-balance">
        <div class="area-balance__row"><span>Lbs Recibidas</span><strong>{{ totalReceivedLbs | number:'1.0-1' }} lbs</strong></div>
        <div class="area-balance__row"><span>Masters Producidos</span><strong>{{ masters.length }}</strong></div>
        <div class="area-balance__row"><span>Peso Masters</span><strong>{{ totalMasterWt | number:'1.0-1' }} lbs</strong></div>
        <div class="area-balance__divider"></div>
        <div class="area-balance__row"><span>Merma Área</span><strong>{{ areaShrinkage | number:'1.0-1' }} lbs</strong></div>
      </div>
      <div class="yield-indicator" *ngIf="totalReceivedLbs > 0">
        <div class="yield-header">
          <span>Rendimiento</span>
          <strong [class.yield-value--green]="areaYield >= 70" [class.yield-value--yellow]="areaYield >= 55 && areaYield < 70" [class.yield-value--red]="areaYield < 55">{{ areaYield | number:'1.1-1' }}%</strong>
        </div>
        <div class="yield-bar">
          <div class="yield-fill" [style.width.%]="areaYield > 100 ? 100 : areaYield"
               [class.yield-fill--green]="areaYield >= 70" [class.yield-fill--yellow]="areaYield >= 55 && areaYield < 70" [class.yield-fill--red]="areaYield < 55"></div>
        </div>
        <div style="font-size:0.72rem;color:#6b7280;margin-top:4px">Referencia Cola: ~66%</div>
      </div>
      <div style="margin-top:1rem">
        <div class="input-label" style="margin-bottom:0.5rem">Masters V.A. Registrados</div>
        <div class="master-list">
          <div class="master-item" *ngFor="let m of masters">
            <div><div class="master-item__label">{{ m.count }} mst · {{ m.subtype }}</div><div class="master-item__detail">{{ m.talla }}{{ m.hidratacion ? ' · 💧' : '' }}</div></div>
            <strong style="color:#16a34a;font-family:monospace">{{ m.lbs | number:'1.0-1' }} lbs</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class ValorAgregadoComponent implements OnInit {
  workItems: TransformWorkItem[] = [];
  presentations: CommercialPresentation[] = [];
  masters: { count: number; lbs: number; subtype: string; talla: string; hidratacion: boolean }[] = [];
  selectedItem: TransformWorkItem | null = null;
  selectedPresentation: CommercialPresentation | null = null;
  selectedSubtype: VaSubtype | null = null;
  hidratacion = false;
  mastersCount = 0;
  mastersTotalLbs = 0;
  vaSubtypes = VA_SUBTYPES;
  COMPANY_ID = 1;

  constructor(private shrimpMs: ShrimpMsService) {}

  ngOnInit(): void {
    this.loadWorkItems();
    this.shrimpMs.listPresentations(this.COMPANY_ID, 'VALOR_AGREGADO').subscribe(p => this.presentations = p);
  }

  loadWorkItems(): void {
    this.shrimpMs.listPendingSubLots('VALOR_AGREGADO').subscribe(items => this.workItems = items);
  }

  registrar(): void {
    if (!this.selectedItem || !this.selectedPresentation || !this.selectedSubtype || this.mastersCount <= 0) return;
    this.masters.push({ count: this.mastersCount, lbs: this.mastersTotalLbs, subtype: this.selectedSubtype, talla: this.selectedItem.talla.displayName, hidratacion: this.hidratacion });
    this.selectedItem = null; this.selectedPresentation = null; this.selectedSubtype = null;
    this.hidratacion = false; this.mastersCount = 0; this.mastersTotalLbs = 0;
  }

  get totalReceivedLbs(): number { return this.workItems.filter(w => w.libras).reduce((s, w) => s + (w.libras ?? 0), 0); }
  get totalMasterWt(): number { return this.masters.reduce((s, m) => s + m.lbs, 0); }
  get areaShrinkage(): number { return this.totalReceivedLbs - this.totalMasterWt; }
  get areaYield(): number { return this.totalReceivedLbs <= 0 ? 0 : (this.totalMasterWt / this.totalReceivedLbs) * 100; }
}
