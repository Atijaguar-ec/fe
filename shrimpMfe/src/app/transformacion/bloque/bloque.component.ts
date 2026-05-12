import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, TransformWorkItem, CommercialPresentation } from '../../services/shrimp-ms.service';

interface BloqueCreado {
  lote: string;
  talla: string;
  cajetas: number;
  librasTotal: number;
  presentacion: string;
}

/**
 * BLOQUE transformation module.
 * DUFER doc: "cajetas se cuentan manualmente, el peso unitario del bloque
 * está previamente definido" (CommercialPresentation.weightPerUnit).
 * G2: peso_master = cajetas × weightPerUnit (auto-calculated).
 */
@Component({
  selector: 'app-bloque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../shared/transform.styles.css'],
  template: `
<div class="transform-page">
  <div class="transform-header">
    <div>
      <h1>🧊 Bloque — Transformación</h1>
      <p>Lote base (sin sufijo) · Cajetas contadas manualmente</p>
    </div>
    <span class="badge badge-info">{{ workItems.length }} sub-lotes pendientes</span>
  </div>

  <div class="transform-grid">
    <!-- Work Queue -->
    <div>
      <div class="transform-card">
        <div class="transform-card-header">
          <h2>📋 Cola de Trabajo — Sub-lotes clasificados</h2>
          <button class="btn btn-teal" style="width:auto; padding: 0.4rem 1rem; margin:0; min-height:36px; font-size:0.82rem" (click)="loadWorkItems()">⟳ Actualizar</button>
        </div>

        <div class="empty-state" *ngIf="workItems.length === 0 && !isLoading">
          <div class="empty-state__icon">📭</div>
          <div class="empty-state__text">Sin sub-lotes pendientes para Bloque</div>
          <div class="empty-state__hint">Los sub-lotes aparecen cuando se cierra una clasificación con destino Bloque</div>
        </div>

        <div class="work-queue" *ngIf="workItems.length > 0">
          <div class="work-item" *ngFor="let item of workItems"
               [style.border-left-color]="selectedItem?.subLotId === item.subLotId ? '#0d9488' : ''"
               (click)="selectItem(item)" style="cursor:pointer">
            <div class="work-item__info">
              <div class="work-item__lote">
                {{ item.lote }}
                <span class="badge badge-teal" style="margin-left:4px">{{ item.talla.displayName }}</span>
                <span class="badge badge-success" style="margin-left:4px">Clase {{ item.qualityClass }}</span>
              </div>
              <div class="work-item__detail">
                M{{ item.maquina }} · {{ item.cantidad }} cajetas
                <span *ngIf="item.libras"> · {{ item.libras | number:'1.0-1' }} lbs recibidas</span>
              </div>
            </div>
            <div class="work-item__lbs" *ngIf="item.libras">{{ item.libras | number:'1.0-1' }} lbs</div>
          </div>
        </div>
      </div>

      <!-- Master creation form -->
      <div class="transform-card" style="margin-top:1rem" *ngIf="selectedItem">
        <div class="transform-card-header">
          <h2>➕ Crear Master — {{ selectedItem.talla.displayName }}</h2>
        </div>

        <div class="input-row-2">
          <div class="input-group">
            <label class="input-label">Presentación Comercial</label>
            <select class="input-field" [(ngModel)]="selectedPresentation">
              <option [ngValue]="null">-- Seleccione --</option>
              <option *ngFor="let p of presentations" [ngValue]="p">
                {{ p.brandName }} — {{ p.name }} ({{ p.weightPerUnit }} lbs)
              </option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Cantidad de Cajetas</label>
            <input type="number" class="input-field" [(ngModel)]="cajetas"
                   placeholder="Ej: 60" min="1" (ngModelChange)="calcularPeso()">
          </div>
        </div>

        <!-- G2: Auto-calculated weight -->
        <div class="alert alert-success" *ngIf="pesoAutoCalc > 0">
          ⚡ Peso calculado: <strong>{{ pesoAutoCalc | number:'1.2-2' }} lbs</strong>
          ({{ cajetas }} × {{ selectedPresentation?.weightPerUnit }} lbs/cajeta)
        </div>

        <button class="btn btn-primary"
                [disabled]="!cajetas || cajetas <= 0 || !selectedPresentation"
                (click)="crearBloque()">
          ✅ Registrar Bloque
        </button>
      </div>
    </div>

    <!-- Area Balance -->
    <div class="transform-card transform-balance-card">
      <div class="transform-card-header">
        <h2>⚖️ Liquidación Bloque</h2>
        <span class="badge badge-info">Base</span>
      </div>

      <div class="area-balance">
        <div class="area-balance__row">
          <span>Lbs Recibidas</span>
          <strong>{{ totalReceivedLbs | number:'1.0-1' }} lbs</strong>
        </div>
        <div class="area-balance__row">
          <span>Bloques Creados</span>
          <strong>{{ bloquesCreados.length }}</strong>
        </div>
        <div class="area-balance__row">
          <span>Lbs en Bloques</span>
          <strong>{{ totalBloqueWt | number:'1.0-1' }} lbs</strong>
        </div>
        <div class="area-balance__divider"></div>
        <div class="area-balance__row">
          <span>Merma Área</span>
          <strong [style.color]="areaShrinkage < 0 ? '#dc2626' : ''">
            {{ areaShrinkage | number:'1.0-1' }} lbs
          </strong>
        </div>
      </div>

      <div class="yield-indicator" *ngIf="totalReceivedLbs > 0">
        <div class="yield-header">
          <span>Rendimiento Área</span>
          <strong [class.yield-value--green]="areaYield >= 90"
                  [class.yield-value--yellow]="areaYield >= 75 && areaYield < 90"
                  [class.yield-value--red]="areaYield < 75">
            {{ areaYield | number:'1.1-1' }}%
          </strong>
        </div>
        <div class="yield-bar">
          <div class="yield-fill"
               [style.width.%]="areaYield > 100 ? 100 : areaYield"
               [class.yield-fill--green]="areaYield >= 90"
               [class.yield-fill--yellow]="areaYield >= 75 && areaYield < 90"
               [class.yield-fill--red]="areaYield < 75">
          </div>
        </div>
      </div>

      <!-- Bloques registrados -->
      <div style="margin-top:1rem">
        <div class="input-label" style="margin-bottom:0.5rem">Bloques Registrados</div>
        <div class="master-list">
          <div class="master-item" *ngFor="let b of bloquesCreados">
            <div>
              <div class="master-item__label">{{ b.talla }}</div>
              <div class="master-item__detail">{{ b.cajetas }} cajetas · {{ b.presentacion }}</div>
            </div>
            <strong style="color:#16a34a; font-family:monospace">{{ b.librasTotal | number:'1.0-1' }} lbs</strong>
          </div>
        </div>
        <div class="empty-state" *ngIf="bloquesCreados.length === 0" style="padding:1.5rem">
          <div class="empty-state__hint">Sin bloques registrados aún</div>
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class BloqueComponent implements OnInit {
  workItems: TransformWorkItem[] = [];
  presentations: CommercialPresentation[] = [];
  bloquesCreados: BloqueCreado[] = [];
  selectedItem: TransformWorkItem | null = null;
  selectedPresentation: CommercialPresentation | null = null;
  cajetas = 0;
  pesoAutoCalc = 0;
  isLoading = false;

  // TODO: get from auth service
  COMPANY_ID = 1;

  constructor(private shrimpMs: ShrimpMsService) {}

  ngOnInit(): void {
    this.loadWorkItems();
    this.shrimpMs.listPresentations(this.COMPANY_ID, 'BLOQUE').subscribe(p => {
      this.presentations = p;
    });
  }

  loadWorkItems(): void {
    this.shrimpMs.listPendingSubLots('BLOQUE').subscribe(items => {
      this.workItems = items;
    });
  }

  selectItem(item: TransformWorkItem): void {
    this.selectedItem = item;
    this.cajetas = item.cantidad;
    this.calcularPeso();
  }

  calcularPeso(): void {
    if (this.selectedPresentation && this.cajetas > 0) {
      this.pesoAutoCalc = this.cajetas * this.selectedPresentation.weightPerUnit;
    } else {
      this.pesoAutoCalc = 0;
    }
  }

  crearBloque(): void {
    if (!this.selectedItem || !this.selectedPresentation || this.cajetas <= 0) return;
    this.bloquesCreados.push({
      lote: this.selectedItem.loteSuffix,
      talla: this.selectedItem.talla.displayName,
      cajetas: this.cajetas,
      librasTotal: this.pesoAutoCalc,
      presentacion: `${this.selectedPresentation.brandName} ${this.selectedPresentation.name}`
    });
    this.selectedItem = null;
    this.selectedPresentation = null;
    this.cajetas = 0;
    this.pesoAutoCalc = 0;
  }

  get totalReceivedLbs(): number {
    return this.workItems.filter(w => w.libras).reduce((s, w) => s + (w.libras ?? 0), 0);
  }

  get totalBloqueWt(): number {
    return this.bloquesCreados.reduce((s, b) => s + b.librasTotal, 0);
  }

  get areaShrinkage(): number {
    return this.totalReceivedLbs - this.totalBloqueWt;
  }

  get areaYield(): number {
    if (this.totalReceivedLbs <= 0) return 0;
    return (this.totalBloqueWt / this.totalReceivedLbs) * 100;
  }
}
