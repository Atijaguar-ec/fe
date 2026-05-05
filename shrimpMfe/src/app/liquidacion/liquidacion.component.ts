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
          <h1 class="page-title">⚖️ Liquidación</h1>
          <p class="page-subtitle">Conciliación de masa y cálculo de mermas por lote de recepción</p>
        </div>
      </div>

      <div class="content-grid" style="display: grid; grid-template-columns: 350px 1fr; gap: 1.5rem; align-items: start;">
        <!-- Left Column: Lote Selection -->
        <div class="card form-card">
          <div class="card-header">
            <span class="step-number">1</span>
            <h2>Seleccionar Lote</h2>
          </div>

          <div class="form-group">
            <label class="form-label">Lote Base (Recepción)</label>
            <select class="form-input form-select" [(ngModel)]="selectedLotId" (change)="onLotChange()">
              <option [value]="null">-- Seleccione --</option>
              <option *ngFor="let lot of receptions" [value]="lot.stockOrderId">
                Lote {{ lot.internalLotBase }} ({{ lot.shrimpType }}) - {{ lot.totalWeightLbs | number:'1.2-2' }} lbs
              </option>
            </select>
          </div>

          <!-- Lot Info Card -->
          <div *ngIf="summary" style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-light);">
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Detalle del Lote</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--ina-secondary); margin-bottom: 0.25rem;">
              {{ summary.lotBase }}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
              <span style="color: var(--text-secondary)">Tipo:</span>
              <span style="font-weight: 600;"><span class="badge badge-info">{{ summary.shrimpType }}</span></span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
              <span style="color: var(--text-secondary)">Total Recibido:</span>
              <span style="font-weight: 600;">{{ summary.inputLbs | number:'1.2-2' }} lbs</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Ecuacion de conservacion -->
        <div class="card animate-fade-in-up" *ngIf="summary">
          <div class="card-header">
            <span class="step-number">2</span>
            <h2>Liquidación del Lote</h2>
          </div>

          <div class="equation-board" style="display: flex; align-items: center; justify-content: space-between; background: #f9fafb; padding: 1.5rem; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 1.5rem; text-align: center;">
            <div class="eq-side eq-in" style="flex: 1;">
              <div class="eq-title" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">ENTRADA</div>
              <div class="eq-value" style="font-size: 1.75rem; font-weight: 800; color: #1f2937;">{{ summary.inputLbs | number:'1.2-2' }}</div>
              <div class="eq-label" style="font-size: 0.8rem; color: var(--text-muted);">Lbs Brutas</div>
            </div>

            <div class="eq-equal" style="font-size: 2rem; color: #d1d5db; font-weight: 300;">=</div>

            <div class="eq-side eq-out" style="flex: 1;">
              <div class="eq-title" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">CLASIFICADO</div>
              <div class="eq-value" style="font-size: 1.75rem; font-weight: 800; color: #059669;">{{ summary.classifiedLbs | number:'1.2-2' }}</div>
              <div class="eq-label" style="font-size: 0.8rem; color: var(--text-muted);">Σ Tallas</div>
            </div>

            <div class="eq-plus" style="font-size: 2rem; color: #d1d5db; font-weight: 300;">+</div>

            <div class="eq-side eq-shrink" [ngClass]="{'anomaly': summary.anomalyDetected}" style="flex: 1;">
              <div class="eq-title" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">MERMA</div>
              <div class="eq-value" style="font-size: 1.75rem; font-weight: 800;" [style.color]="summary.anomalyDetected ? '#dc2626' : '#ea580c'">{{ summary.shrinkageLbs | number:'1.2-2' }}</div>
              <div class="eq-label" style="font-size: 0.8rem;" [style.color]="summary.anomalyDetected ? '#ef4444' : 'var(--text-muted)'">{{ summary.shrinkagePercent | number:'1.2-2' }}%</div>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="progress-bar-container" *ngIf="summary.inputLbs > 0" style="height: 12px; background: #e5e7eb; border-radius: 999px; overflow: hidden; display: flex; margin-bottom: 0.75rem;">
            <div class="progress-segment classified" [style.width.%]="classifiedPct" style="background: #10b981; transition: width 0.5s ease;"></div>
            <div class="progress-segment waste" [style.width.%]="wastePct" style="background: #eab308; transition: width 0.5s ease;"></div>
            <div class="progress-segment shrinkage" [style.width.%]="shrinkagePct" style="background: #f97316; transition: width 0.5s ease;"></div>
          </div>
          <div class="progress-legend" style="display: flex; gap: 1.5rem; justify-content: center; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 2rem;">
            <span class="legend-item" style="display: flex; align-items: center; gap: 0.35rem;"><span class="dot classified" style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span> Clasificado ({{ classifiedPct | number:'1.1-1' }}%)</span>
            <span class="legend-item" style="display: flex; align-items: center; gap: 0.35rem;"><span class="dot shrinkage" style="width: 8px; height: 8px; border-radius: 50%; background: #f97316;"></span> Merma ({{ shrinkagePct | number:'1.1-1' }}%)</span>
          </div>

          <!-- Anomaly banner -->
          <div class="anomaly-banner" *ngIf="summary.anomalyDetected" style="margin-bottom: 1.5rem; padding: 1rem; background: #fef2f2; color: #dc2626; border-radius: 8px; border: 1px solid #fca5a5; display: flex; align-items: flex-start; gap: 0.75rem;">
            <div style="font-size: 1.25rem;">🚨</div>
            <div>
              <strong style="display: block; margin-bottom: 0.25rem;">Alerta de Anomalía en Liquidación</strong>
              <span style="font-size: 0.9rem;">{{ summary.anomalyMessage }}</span>
            </div>
          </div>

          <!-- Waste reason (when closing) -->
          <div class="form-group" *ngIf="summary.shrinkageLbs > 0">
            <label class="form-label">Motivo principal de merma</label>
            <select class="form-input form-select" [(ngModel)]="wasteReason">
              <option value="AGUA">Agua / Hielo</option>
              <option value="BASURA">Basura / Impurezas</option>
              <option value="CABEZAS">Cabezas (descabezado)</option>
              <option value="CALIBRACION">Calibración de balanza</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <!-- Error / Success -->
          <div class="error-banner" *ngIf="errorMsg" style="margin-top: 1rem; padding: 0.75rem; background: #fef2f2; color: #dc2626; border-radius: 6px; font-size: 0.85rem; border: 1px solid #fca5a5;">⚠️ {{ errorMsg }}</div>
          <div class="success-banner" *ngIf="successMsg" style="margin-top: 1rem; padding: 0.75rem; background: #ecfdf5; color: #059669; border-radius: 6px; font-size: 0.85rem; border: 1px solid #a7f3d0;">✅ {{ successMsg }}</div>

          <div class="actions" style="margin-top: 2rem; display: flex; justify-content: flex-end; border-top: 1px solid #e5e7eb; padding-top: 1.5rem;">
            <button class="btn btn-primary" [disabled]="saving" (click)="closeEquation()">
              {{ saving ? '⏳ Cerrando...' : 'Confirmar Cierre y Liquidar' }}
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!summary" class="card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.5); border-style: dashed;">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">👈</div>
          <h3 style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Seleccione un lote</h3>
          <p style="font-size: 0.9rem; max-width: 300px;">Elija un lote base en el panel izquierdo para calcular su ecuación de conservación y liquidar.</p>
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
