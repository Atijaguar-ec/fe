import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService } from '../services/shrimp-ms.service';

@Component({
  selector: 'app-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚖️ Liquidación Matemática</h1>
          <p class="page-subtitle">Conciliación de masa y cálculo de mermas por lote de recepción</p>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="step-number">1</span>
            <h2>Seleccionar Lote</h2>
          </div>

          <div class="form-group">
            <label class="form-label">Lote Base (Recepción)</label>
            <select class="form-input" [(ngModel)]="selectedLotId" (change)="onLotChange()">
              <option [value]="null">-- Seleccione --</option>
              <option *ngFor="let lot of receptions" [value]="lot.stockOrderId">
                Lote {{ lot.internalLotBase }} ({{ lot.shrimpType }}) - {{ lot.totalWeightLbs | number:'1.2-2' }} lbs
              </option>
            </select>
          </div>
        </div>

        <div class="card animate-fade-in-up" *ngIf="summary">
          <div class="card-header">
            <span class="step-number">2</span>
            <h2>Ecuación de Conservación (Libras)</h2>
          </div>

          <div class="equation-board">
            <div class="eq-side eq-in">
              <div class="eq-title">ENTRADA</div>
              <div class="eq-value">{{ summary.inputLbs | number:'1.2-2' }}</div>
              <div class="eq-label">Lbs Brutas</div>
            </div>

            <div class="eq-equal">=</div>

            <div class="eq-side eq-out">
              <div class="eq-title">CLASIFICADO</div>
              <div class="eq-value">{{ summary.classifiedLbs | number:'1.2-2' }}</div>
              <div class="eq-label">Σ Tallas</div>
            </div>

            <div class="eq-plus">+</div>

            <div class="eq-side eq-shrink" [class.anomaly]="summary.anomalyDetected">
              <div class="eq-title">MERMA</div>
              <div class="eq-value">{{ summary.shrinkageLbs | number:'1.2-2' }}</div>
              <div class="eq-label">{{ summary.shrinkagePercent | number:'1.2-2' }}%</div>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="progress-bar-container" *ngIf="summary.inputLbs > 0">
            <div class="progress-segment classified" [style.width.%]="classifiedPct"></div>
            <div class="progress-segment waste" [style.width.%]="wastePct"></div>
            <div class="progress-segment shrinkage" [style.width.%]="shrinkagePct"></div>
          </div>
          <div class="progress-legend">
            <span class="legend-item"><span class="dot classified"></span> Clasificado ({{ classifiedPct | number:'1.1-1' }}%)</span>
            <span class="legend-item"><span class="dot shrinkage"></span> Merma ({{ shrinkagePct | number:'1.1-1' }}%)</span>
          </div>

          <!-- Anomaly banner -->
          <div class="anomaly-banner" *ngIf="summary.anomalyDetected">
            🚨 <strong>Alerta:</strong> {{ summary.anomalyMessage }}
          </div>

          <!-- Waste reason (when closing) -->
          <div class="form-group" style="margin-top: 1rem;" *ngIf="summary.shrinkageLbs > 0">
            <label class="form-label">Motivo principal de merma</label>
            <select class="form-input" [(ngModel)]="wasteReason">
              <option value="AGUA">Agua / Hielo</option>
              <option value="BASURA">Basura / Impurezas</option>
              <option value="CABEZAS">Cabezas (descabezado)</option>
              <option value="CALIBRACION">Calibración de balanza</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <!-- Error / Success -->
          <div class="error-banner" *ngIf="errorMsg">⚠️ {{ errorMsg }}</div>
          <div class="success-banner" *ngIf="successMsg">✅ {{ successMsg }}</div>

          <div class="actions">
            <button class="btn btn-primary" [disabled]="saving" (click)="closeEquation()">
              {{ saving ? '⏳ Cerrando...' : 'Confirmar Cierre y Liquidar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./liquidacion.component.css']
})
export class LiquidacionComponent implements OnInit {
  receptions: any[] = [];
  selectedLotId: number | null = null;
  summary: any = null;
  wasteReason = 'AGUA';
  saving = false;
  errorMsg = '';
  successMsg = '';

  classifiedPct = 0;
  wastePct = 0;
  shrinkagePct = 0;

  constructor(private shrimpMs: ShrimpMsService) {}

  ngOnInit() {
    this.shrimpMs.listReceptions().subscribe(lots => {
      this.receptions = lots.filter(l => l.status !== 'CLOSED');
    });
  }

  onLotChange() {
    this.summary = null;
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.selectedLotId) return;

    this.shrimpMs.getSettlementSummary(this.selectedLotId).subscribe({
      next: (data) => {
        this.summary = data;
        this.calculatePercentages();
      },
      error: () => this.errorMsg = 'Error al obtener resumen de liquidación'
    });
  }

  calculatePercentages() {
    if (!this.summary || this.summary.inputLbs <= 0) return;
    this.classifiedPct = (this.summary.classifiedLbs / this.summary.inputLbs) * 100;
    this.shrinkagePct = Math.max(0, (this.summary.shrinkageLbs / this.summary.inputLbs) * 100);
    this.wastePct = 0;
  }

  closeEquation() {
    if (!this.selectedLotId) return;
    this.saving = true;
    this.errorMsg = '';

    this.shrimpMs.closeSettlement(this.selectedLotId).subscribe({
      next: () => {
        this.successMsg = `Liquidación cerrada para lote ${this.summary.lotBase}`;
        this.saving = false;
        // Refresh list
        this.receptions = this.receptions.filter(r => r.stockOrderId !== this.selectedLotId);
      },
      error: (err) => {
        this.errorMsg = err?.error?.errorMessage || 'Error al cerrar liquidación';
        this.saving = false;
      }
    });
  }
}
