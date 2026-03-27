import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotNumberUtil } from '../utils/lot-number.util';

interface ReceptionRecord {
  id: number;
  loteBase: string;
  pesoBruto: number;
  bines: number;
  tipo: string;
  fecha: Date;
}

@Component({
  selector: 'app-recepcion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in-up">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">📥 Recepción de Materia Prima</h1>
          <p class="page-subtitle">Registro de ingreso de camarón — Empacadora Dufer</p>
        </div>
        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-value">{{ records.length }}</span>
            <span class="stat-label">Lotes hoy</span>
          </div>
          <div class="stat-chip">
            <span class="stat-value">{{ totalWeight | number:'1.0-0' }}</span>
            <span class="stat-label">Lbs total</span>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Form Card -->
        <div class="card form-card">
          <div class="card-header">
            <span class="step-number">1</span>
            <h2>Datos de Recepción</h2>
          </div>

          <form (ngSubmit)="onSubmit()" #receptionForm="ngForm">
            <div class="form-group">
              <label class="form-label">Lote Base / Proveedor</label>
              <input
                type="text"
                [(ngModel)]="loteBase"
                name="loteBase"
                class="form-input form-input-lg"
                placeholder="Ej. 250121"
                required
                #loteField="ngModel"
                [class.input-error]="loteField.invalid && loteField.touched"
              >
              <span class="field-hint" *ngIf="!loteField.invalid">Identificador único del lote de origen</span>
              <span class="field-error" *ngIf="loteField.invalid && loteField.touched">El lote base es obligatorio</span>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Peso Bruto (Lbs)</label>
                <input
                  type="number"
                  [(ngModel)]="pesoBruto"
                  name="pesoBruto"
                  class="form-input"
                  placeholder="0.00"
                  required
                  min="0.01"
                  step="0.01"
                  #pesoField="ngModel"
                  [class.input-error]="pesoField.invalid && pesoField.touched"
                >
                <span class="field-error" *ngIf="pesoField.invalid && pesoField.touched">Peso requerido (> 0)</span>
              </div>
              <div class="form-group">
                <label class="form-label">Gavetas / Bines</label>
                <input
                  type="number"
                  [(ngModel)]="bines"
                  name="bines"
                  class="form-input"
                  placeholder="0"
                  required
                  min="1"
                  #binesField="ngModel"
                  [class.input-error]="binesField.invalid && binesField.touched"
                >
                <span class="field-error" *ngIf="binesField.invalid && binesField.touched">Cantidad requerida</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Tipo de Producto</label>
              <div class="type-selector">
                <button
                  type="button"
                  class="type-option"
                  [class.type-active]="tipo === 'entero'"
                  (click)="tipo = 'entero'"
                >
                  <span class="type-icon">🦐</span>
                  <span class="type-label">Entero</span>
                  <span class="type-desc">Camarón completo</span>
                </button>
                <button
                  type="button"
                  class="type-option"
                  [class.type-active]="tipo === 'cola'"
                  (click)="tipo = 'cola'"
                >
                  <span class="type-icon">🔪</span>
                  <span class="type-label">Cola</span>
                  <span class="type-desc">Sin cabeza</span>
                </button>
              </div>
            </div>

            <!-- Suffix Preview -->
            <div class="suffix-preview" *ngIf="loteBase">
              <div class="suffix-label">Lotes derivados (automáticos):</div>
              <div class="suffix-chips">
                <span class="suffix-chip active">{{ loteBase }} <small>Bloque</small></span>
                <span class="suffix-chip">{{ loteBase }}-2 <small>IQF</small></span>
                <span class="suffix-chip">{{ loteBase }}-3 <small>VA</small></span>
                <span class="suffix-chip">{{ loteBase }}-4 <small>Salm.</small></span>
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-lg btn-block"
              [disabled]="!loteBase || !pesoBruto || !bines"
            >
              ✓ Registrar Recepción
            </button>
          </form>
        </div>

        <!-- Recent Records -->
        <div class="card records-card">
          <div class="card-header">
            <h2>Lotes Recibidos Hoy</h2>
            <span class="badge badge-info">{{ records.length }}</span>
          </div>

          <div *ngIf="records.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <div class="empty-text">Sin recepciones registradas</div>
            <div class="empty-hint">Los lotes aparecerán aquí al registrarlos</div>
          </div>

          <div class="record-list" *ngIf="records.length > 0">
            <div class="record-item animate-fade-in-up" *ngFor="let r of records; let i = index"
                 [style.animation-delay]="(i * 0.05) + 's'">
              <div class="record-main">
                <div class="record-lot">{{ r.loteBase }}</div>
                <div class="record-meta">
                  {{ r.pesoBruto | number:'1.0-1' }} lbs · {{ r.bines }} gavetas
                </div>
              </div>
              <div class="record-tags">
                <span class="badge" [class.badge-teal]="r.tipo === 'entero'" [class.badge-warning]="r.tipo === 'cola'">
                  {{ r.tipo === 'entero' ? '🦐 Entero' : '🔪 Cola' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Overlay -->
      <div class="success-overlay" *ngIf="showSuccess" (click)="showSuccess = false">
        <div class="success-card" (click)="$event.stopPropagation()">
          <div class="success-icon">✅</div>
          <div class="success-title">Recepción Registrada</div>
          <div class="success-detail">
            Lote <strong>{{ lastRecord?.loteBase }}</strong> registrado con
            {{ lastRecord?.pesoBruto | number:'1.0-1' }} lbs en {{ lastRecord?.bines }} gavetas.
          </div>
          <button class="btn btn-primary btn-block" (click)="showSuccess = false">Continuar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ina-secondary);
      margin: 0;
    }
    .page-subtitle {
      font-size: 0.82rem;
      color: #6b7280;
      margin-top: 2px;
    }
    .header-stats {
      display: flex;
      gap: 0.75rem;
    }
    .stat-chip {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 0.5rem 1rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .stat-value {
      display: block;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--ina-primary);
    }
    .stat-label {
      display: block;
      font-size: 0.65rem;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.25rem;
      align-items: start;
    }

    .card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f3f4f6;
    }
    .card-header h2 {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
      flex: 1;
    }
    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: var(--ina-primary);
      color: white;
      border-radius: 50%;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .form-group { margin-bottom: 1rem; }
    .form-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.3rem;
    }
    .form-input {
      width: 100%;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      font-family: 'Open Sans', sans-serif;
      font-size: 0.95rem;
      color: #1f2937;
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--ina-primary);
      box-shadow: 0 0 0 3px rgba(54,155,193,0.15);
    }
    .form-input::placeholder { color: #9ca3af; }
    .form-input-lg { font-size: 1.15rem; padding: 0.75rem 1rem; font-weight: 600; }
    .input-error { border-color: #ef4444 !important; }

    .field-hint {
      display: block;
      font-size: 0.7rem;
      color: #9ca3af;
      margin-top: 3px;
    }
    .field-error {
      display: block;
      font-size: 0.72rem;
      color: #ef4444;
      margin-top: 3px;
      font-weight: 500;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    /* Type Selector */
    .type-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .type-option {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 1rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: 'Open Sans', sans-serif;
    }
    .type-option:hover {
      border-color: var(--ina-primary);
      background: #f0f9ff;
    }
    .type-active {
      border-color: var(--ina-primary) !important;
      background: #f0f9ff !important;
      box-shadow: 0 0 0 3px rgba(54,155,193,0.12);
    }
    .type-icon { display: block; font-size: 1.75rem; margin-bottom: 0.3rem; }
    .type-label { display: block; font-size: 0.9rem; font-weight: 700; color: #1f2937; }
    .type-desc { display: block; font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }

    /* Suffix Preview */
    .suffix-preview {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
    }
    .suffix-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }
    .suffix-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .suffix-chip {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
    }
    .suffix-chip small {
      color: #9ca3af;
      font-weight: 400;
      margin-left: 2px;
    }
    .suffix-chip.active {
      background: #f0f9ff;
      border-color: var(--ina-primary);
      color: var(--ina-primary);
    }

    /* Button */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-family: 'Open Sans', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--ina-primary); color: white; }
    .btn-primary:hover:not(:disabled) { background: #2d87ab; box-shadow: 0 4px 12px rgba(54,155,193,0.25); }
    .btn-lg { padding: 0.85rem 1.5rem; font-size: 1rem; }
    .btn-block { width: 100%; }

    /* Records */
    .empty-state {
      text-align: center;
      padding: 2rem 1rem;
    }
    .empty-icon { font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5; }
    .empty-text { font-size: 0.9rem; font-weight: 600; color: #6b7280; }
    .empty-hint { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }

    .record-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .record-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.7rem 0.85rem;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      transition: background 0.1s;
    }
    .record-item:hover { background: #f0f9ff; }
    .record-lot {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1f2937;
      font-family: monospace;
    }
    .record-meta {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 1px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.68rem;
      font-weight: 600;
    }
    .badge-teal { background: #ccfbf1; color: #0d9488; }
    .badge-warning { background: #fef3c7; color: #d97706; }

    /* Success Overlay */
    .success-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      animation: fadeIn 0.2s ease;
    }
    .success-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      max-width: 380px;
      animation: scaleIn 0.25s ease;
    }
    .success-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .success-title { font-size: 1.15rem; font-weight: 700; color: #1f2937; margin-bottom: 0.4rem; }
    .success-detail { font-size: 0.85rem; color: #6b7280; margin-bottom: 1.5rem; line-height: 1.5; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class ReceptionComponent {
  loteBase = '';
  pesoBruto: number | null = null;
  bines: number | null = null;
  tipo = 'entero';

  records: ReceptionRecord[] = [];
  showSuccess = false;
  lastRecord: ReceptionRecord | null = null;

  get totalWeight(): number {
    return this.records.reduce((sum, r) => sum + r.pesoBruto, 0);
  }

  onSubmit() {
    if (!this.pesoBruto || !this.loteBase || !this.bines) return;

    const record: ReceptionRecord = {
      id: Date.now(),
      loteBase: this.loteBase,
      pesoBruto: this.pesoBruto,
      bines: this.bines,
      tipo: this.tipo,
      fecha: new Date(),
    };

    this.records.unshift(record);
    this.lastRecord = record;
    this.showSuccess = true;

    // Serialize to dual-unit comment (showing the util works)
    const comment = LotNumberUtil.packDualUnitComment(this.pesoBruto, this.bines);
    console.log('[Recepción] Lote registrado:', record, 'Comment payload:', comment);

    // Reset
    this.loteBase = '';
    this.pesoBruto = null;
    this.bines = null;
    this.tipo = 'entero';
  }
}
