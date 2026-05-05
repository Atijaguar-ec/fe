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

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="step-number">1</span>
            <h2>Lote Base a Procesar</h2>
          </div>
          <p class="helper-text">Seleccione un lote recibido como <strong>ENTERO</strong> que requiere descabezado por baja calidad visual.</p>

          <div class="form-group" style="margin-top: 15px;">
            <select class="form-input" [(ngModel)]="selectedLotId" (change)="onLotChange()">
              <option [value]="null">-- Seleccione --</option>
              <option *ngFor="let lot of eligibleLots" [value]="lot.stockOrderId">
                Lote {{ lot.internalLotBase }} ({{ lot.totalWeightLbs | number:'1.2-2' }} lbs)
              </option>
            </select>
          </div>
        </div>

        <!-- Recuperacion form -->
        <div class="card animate-fade-in-up" *ngIf="selectedLot">
          <div class="card-header">
            <span class="step-number">2</span>
            <h2>Registrar Rechazo</h2>
          </div>

          <div class="conversion-panel">
            <div class="conv-input">
              <label>Libras de Entero rechazadas</label>
              <input type="number" class="form-input" [(ngModel)]="inputLbs" (ngModelChange)="calcShrinkage()" placeholder="Ej. 500" min="0.01" [max]="selectedLot.totalWeightLbs">
            </div>

            <div class="conv-arrow">➡️</div>

            <div class="conv-output">
              <label>Libras de Cola recuperada</label>
              <input type="number" class="form-input" [(ngModel)]="outputLbs" (ngModelChange)="calcShrinkage()" placeholder="Ej. 320" [disabled]="!activeCycle || activeCycle.status !== 'PENDING_BEHEADING'">
            </div>
          </div>

          <div class="shrinkage-indicator" *ngIf="shrinkage !== null">
            Merma por cabezas: <strong>{{ shrinkage | number:'1.2-2' }} lbs</strong>
            <span class="shrinkage-pct" *ngIf="inputLbs > 0">({{ (shrinkage / inputLbs) * 100 | number:'1.1-2' }}%)</span>
          </div>

          <!-- Waste reason selector -->
          <div class="form-group" style="margin-top: 1rem;" *ngIf="activeCycle && activeCycle.status === 'PENDING_BEHEADING'">
            <label class="form-label">Motivo de merma</label>
            <select class="form-input" [(ngModel)]="wasteReason">
              <option value="CABEZAS">Cabezas</option>
              <option value="BASURA">Basura / Impurezas</option>
              <option value="AGUA">Agua</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <!-- Error/Success banners -->
          <div class="error-banner" *ngIf="errorMsg">
            ⚠️ {{ errorMsg }}
            <button class="error-close" (click)="errorMsg = ''">✕</button>
          </div>
          <div class="success-banner" *ngIf="successMsg">
            ✅ {{ successMsg }}
            <button class="error-close" (click)="successMsg = ''">✕</button>
          </div>

          <div style="margin-top: 20px; display: flex; gap: 0.75rem; justify-content: flex-end;">
            <button class="btn btn-primary" *ngIf="!activeCycle" [disabled]="inputLbs <= 0 || saving" (click)="createRejection()">
              {{ saving ? '⏳...' : 'Iniciar Rechazo' }}
            </button>
            <button class="btn btn-primary" *ngIf="activeCycle?.status === 'PENDING_BEHEADING'" [disabled]="!isValid() || saving" (click)="completeBeheading()">
              {{ saving ? '⏳...' : 'Confirmar Descabezado' }}
            </button>
            <button class="btn btn-primary" *ngIf="activeCycle?.status === 'BEHEADING_COMPLETE'" [disabled]="saving" (click)="completeReentry()">
              {{ saving ? '⏳...' : 'Reingresar como Cola' }}
            </button>
          </div>
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
