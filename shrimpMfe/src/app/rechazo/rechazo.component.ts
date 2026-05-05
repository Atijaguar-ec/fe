import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService } from '../services/shrimp-ms.service';
import { ShrimpDataService } from '../services/shrimp-data.service';

@Component({
  selector: 'app-rechazo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚠️ Recuperación y Rechazo</h1>
          <p class="page-subtitle">Transformación cíclica de producto Entero a Cola</p>
        </div>
        <div class="header-stats" *ngIf="activeCycle">
          <div class="stat-chip status-chip">
            <span class="stat-value">{{ activeCycle.status }}</span>
            <span class="stat-label">Estado del Ciclo</span>
          </div>
        </div>
      </div>

      <div class="content-grid" style="display: grid; grid-template-columns: 350px 1fr; gap: 1.5rem; align-items: start;">
        <!-- Left Column: Lote Selection -->
        <div class="card form-card">
          <div class="card-header">
            <span class="step-number">1</span>
            <h2>Lote Base a Procesar</h2>
          </div>
          <p class="helper-text" style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">Seleccione un lote recibido como <strong>ENTERO</strong> que requiere descabezado por baja calidad visual.</p>

          <div class="form-group">
            <select class="form-input form-select" [(ngModel)]="selectedLotId" (change)="onLotChange()">
              <option [value]="null">-- Seleccione --</option>
              <option *ngFor="let lot of eligibleLots" [value]="lot.stockOrderId">
                Lote {{ lot.internalLotBase }} ({{ lot.totalWeightLbs | number:'1.2-2' }} lbs)
              </option>
            </select>
          </div>

          <!-- Lot Info Card -->
          <div *ngIf="selectedLot" style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-light);">
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Detalle del Lote</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--ina-secondary); margin-bottom: 0.25rem;">
              {{ selectedLot.internalLotBase }}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
              <span style="color: var(--text-secondary)">Total Recibido:</span>
              <span style="font-weight: 600;">{{ selectedLot.totalWeightLbs | number:'1.2-2' }} lbs</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Recuperacion form -->
        <div class="card animate-fade-in-up" *ngIf="selectedLot">
          <div class="card-header">
            <span class="step-number">2</span>
            <h2>Registrar Rechazo</h2>
          </div>

          <div class="conversion-panel" style="display: flex; align-items: center; gap: 1rem; background: #f9fafb; padding: 1.5rem; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 1rem;">
            <div class="conv-input" style="flex: 1;">
              <label class="form-label">Libras de Entero rechazadas</label>
              <input type="number" class="form-input form-input-lg" [(ngModel)]="inputLbs" (ngModelChange)="calcShrinkage()" placeholder="Ej. 500" min="0.01" [max]="selectedLot.totalWeightLbs">
            </div>

            <div class="conv-arrow" style="font-size: 1.5rem; color: #9ca3af; padding: 0 0.5rem;">➡️</div>

            <div class="conv-output" style="flex: 1;">
              <label class="form-label">Libras de Cola recuperada</label>
              <input type="number" class="form-input form-input-lg" [(ngModel)]="outputLbs" (ngModelChange)="calcShrinkage()" placeholder="Ej. 320" [disabled]="!activeCycle || activeCycle.status !== 'PENDING_BEHEADING'">
            </div>
          </div>

          <div class="shrinkage-indicator" *ngIf="shrinkage !== null" style="background: #e0f4fc; color: #0369a1; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.9rem; border: 1px solid #bae6fd; display: flex; justify-content: space-between; align-items: center;">
            <span>Merma por cabezas: <strong>{{ shrinkage | number:'1.2-2' }} lbs</strong></span>
            <span class="shrinkage-pct" *ngIf="inputLbs > 0" style="font-weight: 700; background: #0284c7; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">{{ (shrinkage / inputLbs) * 100 | number:'1.1-2' }}%</span>
          </div>

          <!-- Waste reason selector -->
          <div class="form-group" style="margin-top: 1.5rem;" *ngIf="activeCycle && activeCycle.status === 'PENDING_BEHEADING'">
            <label class="form-label">Motivo de merma</label>
            <select class="form-input form-select" [(ngModel)]="wasteReason">
              <option value="CABEZAS">Cabezas</option>
              <option value="BASURA">Basura / Impurezas</option>
              <option value="AGUA">Agua</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <!-- Error/Success banners -->
          <div class="error-banner" *ngIf="errorMsg" style="margin-top: 1rem; padding: 0.75rem; background: #fef2f2; color: #dc2626; border-radius: 6px; font-size: 0.85rem; border: 1px solid #fca5a5; display: flex; justify-content: space-between;">
            <span>⚠️ {{ errorMsg }}</span>
            <button class="error-close" style="background: none; border: none; color: #dc2626; cursor: pointer;" (click)="errorMsg = ''">✕</button>
          </div>
          <div class="success-banner" *ngIf="successMsg" style="margin-top: 1rem; padding: 0.75rem; background: #ecfdf5; color: #059669; border-radius: 6px; font-size: 0.85rem; border: 1px solid #a7f3d0; display: flex; justify-content: space-between;">
            <span>✅ {{ successMsg }}</span>
            <button class="error-close" style="background: none; border: none; color: #059669; cursor: pointer;" (click)="successMsg = ''">✕</button>
          </div>

          <div style="margin-top: 2rem; display: flex; gap: 0.75rem; justify-content: flex-end; border-top: 1px solid #e5e7eb; padding-top: 1.5rem;">
            <button class="btn btn-primary" *ngIf="!activeCycle" [disabled]="inputLbs <= 0 || saving" (click)="createRejection()">
              {{ saving ? '⏳ Procesando...' : 'Iniciar Rechazo' }}
            </button>
            <button class="btn btn-primary" *ngIf="activeCycle?.status === 'PENDING_BEHEADING'" [disabled]="!isValid() || saving" (click)="completeBeheading()">
              {{ saving ? '⏳ Procesando...' : 'Confirmar Descabezado' }}
            </button>
            <button class="btn btn-success" *ngIf="activeCycle?.status === 'BEHEADING_COMPLETE'" [disabled]="saving" (click)="completeReentry()">
              {{ saving ? '⏳ Procesando...' : '✓ Reingresar como Cola' }}
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!selectedLot" class="card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.5); border-style: dashed;">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">👈</div>
          <h3 style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Seleccione un lote base</h3>
          <p style="font-size: 0.9rem; max-width: 300px;">Elija un lote entero en el panel izquierdo para iniciar el proceso de rechazo y descabezado.</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./rechazo.component.css']
})
export class RechazoComponent implements OnInit {
  eligibleLots: any[] = [];
  selectedLotId: number | null = null;
  selectedLot: any = null;
  activeCycle: any = null;

  inputLbs = 0;
  outputLbs = 0;
  shrinkage: number | null = null;
  wasteReason = 'CABEZAS';
  saving = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private shrimpMs: ShrimpMsService,
    private shrimpData: ShrimpDataService
  ) {}

  ngOnInit() {
    this.shrimpMs.listReceptions().subscribe(lots => {
      this.eligibleLots = lots.filter(l => l.shrimpType === 'ENTERO' && l.status !== 'CLOSED');
    });
  }

  onLotChange() {
    this.selectedLot = this.eligibleLots.find(l => l.stockOrderId == this.selectedLotId) || null;
    this.activeCycle = null;
    this.inputLbs = 0;
    this.outputLbs = 0;
    this.shrinkage = null;
    this.errorMsg = '';
    this.successMsg = '';
  }

  calcShrinkage() {
    if (this.inputLbs > 0 && this.outputLbs > 0) {
      this.shrinkage = this.inputLbs - this.outputLbs;
    } else {
      this.shrinkage = null;
    }
  }

  isValid() {
    return this.inputLbs > 0 &&
           this.outputLbs > 0 &&
           this.outputLbs < this.inputLbs &&
           (this.selectedLot ? this.inputLbs <= this.selectedLot.totalWeightLbs : false);
  }

  createRejection() {
    if (!this.selectedLot || this.inputLbs <= 0) return;
    this.saving = true;

    // First get the classification for this lot
    this.shrimpMs.getClassificationsByLot(this.selectedLot.stockOrderId).subscribe({
      next: (classifications) => {
        if (classifications.length === 0) {
          this.errorMsg = 'No hay clasificaciones para este lote. Clasifique primero.';
          this.saving = false;
          return;
        }
        const latestClassification = classifications[classifications.length - 1];
        this.shrimpMs.createRejection({
          classificationId: latestClassification.id,
          lbsRejected: this.inputLbs
        }).subscribe({
          next: (cycle) => {
            this.activeCycle = cycle;
            this.successMsg = `Ciclo de rechazo creado (${this.inputLbs} lbs)`;
            this.saving = false;
          },
          error: (err) => {
            this.errorMsg = err?.error?.errorMessage || 'Error al crear rechazo';
            this.saving = false;
          }
        });
      },
      error: () => {
        this.errorMsg = 'Error al obtener clasificaciones';
        this.saving = false;
      }
    });
  }

  completeBeheading() {
    if (!this.activeCycle || !this.isValid()) return;
    this.saving = true;

    this.shrimpMs.completeBeheading(this.activeCycle.id, this.outputLbs, this.shrinkage!).subscribe({
      next: (cycle) => {
        this.activeCycle = cycle;
        this.successMsg = `Descabezado completado. Cola: ${this.outputLbs} lbs, Merma: ${this.shrinkage} lbs`;
        this.saving = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.errorMessage || 'Error en balance de descabezado';
        this.saving = false;
      }
    });
  }

  completeReentry() {
    if (!this.activeCycle) return;
    this.saving = true;

    this.shrimpMs.completeReentry(this.activeCycle.id).subscribe({
      next: (cycle) => {
        this.activeCycle = cycle;
        this.successMsg = `Reingreso completado. Nueva ronda de clasificación creada como Cola.`;
        this.saving = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.errorMessage || 'Error al reingresar';
        this.saving = false;
      }
    });
  }
}
