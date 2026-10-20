import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotNumberUtil } from '../utils/lot-number.util';
import {
  ShrimpDataService,
  ShrimpSupplier,
  ShrimpSemiProduct,
  ShrimpFacility
} from '../services/shrimp-data.service';

interface ReceptionRecord {
  id: number;
  coreStockOrderId?: number;
  lotNumber: string;
  supplierName: string;
  supplierId: number | null;
  pesoBruto: number;
  bines: number;
  tipo: string;
  fecha: Date;
  saved: boolean;
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
            <!-- Row: Date + Supplier -->
            <div class="grid-2">
              <!-- Fecha de Recepción -->
              <div class="form-group">
                <label class="form-label">Fecha de Recepción *</label>
                <input
                  type="date"
                  [(ngModel)]="receptionDate"
                  name="receptionDate"
                  class="form-input"
                  required
                  #dateField="ngModel"
                  [class.input-error]="dateField.invalid && dateField.touched"
                >
                <span class="field-error" *ngIf="dateField.invalid && dateField.touched">Fecha requerida</span>
              </div>

              <!-- Número de Lote -->
              <div class="form-group">
                <label class="form-label">Número de Lote *</label>
                <div class="lot-input-row">
                  <input
                    type="text"
                    [(ngModel)]="lotNumber"
                    name="lotNumber"
                    class="form-input lot-input"
                    placeholder="Ej. 270326-001"
                    required
                    #loteField="ngModel"
                    [class.input-error]="loteField.invalid && loteField.touched"
                  >
                  <button type="button" class="btn btn-outline btn-sm" (click)="autoGenerateLot()"
                          title="Generar automático">
                    🔄 Auto
                  </button>
                </div>
                <span class="field-error" *ngIf="loteField.invalid && loteField.touched">El número de lote es obligatorio</span>
              </div>
            </div>

          <!-- Centro de Acopio / Área -->
            <div class="form-group">
              <!-- Múltiples Áreas (Combo) -->
              <div class="supplier-select-wrapper" *ngIf="facilities.length > 1">
                <select
                  [(ngModel)]="receptionFacilityId"
                  name="facilityId"
                  class="form-input form-select"
                  required
                >
                  <option [ngValue]="null" disabled>Seleccione el área...</option>
                  <option *ngFor="let f of facilities" [ngValue]="f.id">
                    {{ f.name }}
                  </option>
                </select>
                <span class="select-icon">▾</span>
              </div>

              <!-- Única Área (Lectura) -->
              <div *ngIf="facilities.length === 1" class="supplier-select-wrapper">
                <input
                  type="text"
                  class="form-input"
                  [value]="facilities[0].name"
                  readonly
                  disabled
                  style="background: #f9fafb; cursor: not-allowed; border-color: #e5e7eb; color: #6b7280; font-weight: 500;"
                >
              </div>

              <!-- Cero áreas (Bloqueado) -->
              <div *ngIf="facilities.length === 0" style="padding: 0.75rem; background: #fef2f2; color: #dc2626; border-radius: 6px; font-size: 0.85rem; border: 1px solid #fca5a5;">
                <strong style="display: block; margin-bottom: 2px;">⚠️ No hay Centros de Acopio configurados</strong>
                No es posible registrar recepciones hasta agregar una instalación como centro de acopio.
              </div>
            </div>

            <!-- Proveedor (full width) -->
            <div class="form-group">
              <label class="form-label">Proveedor *</label>
              <div class="supplier-select-wrapper">
                <select
                  [(ngModel)]="selectedSupplierId"
                  name="supplierId"
                  class="form-input form-select"
                  required
                  #supplierField="ngModel"
                  [class.input-error]="supplierField.invalid && supplierField.touched"
                  (ngModelChange)="onSupplierChange($event)"
                >
                  <option [ngValue]="null" disabled>Seleccione un proveedor...</option>
                  <option *ngFor="let s of suppliers" [ngValue]="s.id">
                    {{ s.displayName }} {{ s.type === 'COLLECTOR' ? '(Acopiador)' : '' }}
                  </option>
                </select>
                <span class="select-icon">▾</span>
              </div>
              <span class="field-hint" *ngIf="selectedSupplier">
                📍 {{ selectedSupplier.location || 'Sin ubicación' }}
                <span *ngIf="selectedSupplier.phone"> · 📞 {{ selectedSupplier.phone }}</span>
              </span>
              <span class="field-error" *ngIf="supplierField.invalid && supplierField.touched">
                Seleccione un proveedor
              </span>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Peso Bruto (Lbs) *</label>
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
                <label class="form-label">Gavetas / Bines *</label>
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

            <!-- Tipo de Producto (maps to semi-product) -->
            <div class="form-group">
              <label class="form-label">Tipo de Producto</label>
              <div class="type-selector">
                <button
                  type="button"
                  class="type-option"
                  *ngFor="let sp of semiProducts"
                  [class.type-active]="selectedSemiProductId === sp.id"
                  (click)="selectedSemiProductId = sp.id; tipo = sp.name"
                >
                  <span class="type-icon">{{ sp.name === 'Entero' ? '🦐' : '🔪' }}</span>
                  <span class="type-label">{{ sp.name }}</span>
                  <span class="type-desc">{{ sp.name === 'Entero' ? 'Camarón completo' : 'Sin cabeza' }}</span>
                </button>
              </div>
            </div>


            <!-- Error message -->
            <div class="error-banner" *ngIf="errorMessage">
              <span>⚠️ {{ errorMessage }}</span>
              <button type="button" class="error-close" (click)="errorMessage = ''">✕</button>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-lg btn-block"
              [disabled]="!isFormValid() || saving"
            >
              <span *ngIf="!saving && !editingRecordId">✓ Registrar Recepción</span>
              <span *ngIf="!saving && editingRecordId">✓ Actualizar Recepción (#{{ editingRecordId }})</span>
              <span *ngIf="saving">⏳ Guardando...</span>
            </button>
            <button
              type="button"
              class="btn btn-outline btn-block mt-2"
              *ngIf="editingRecordId && !saving"
              (click)="cancelEdit()"
              style="margin-top: 0.5rem; width: 100%; border-color: #e5e7eb; color: #4b5563;"
            >
              ❌ Cancelar Edición
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
                <div class="record-lot">
                  {{ r.lotNumber }}
                  <span class="record-id" *ngIf="r.coreStockOrderId">#{{ r.coreStockOrderId }}</span>
                </div>
                <div class="record-supplier">{{ r.supplierName }}</div>
                <div class="record-meta">
                  {{ r.pesoBruto | number:'1.0-1' }} lbs · {{ r.bines }} gavetas
                </div>
              </div>
              <div class="record-tags" style="display: flex; gap: 0.25rem; align-items: center;">
                <span class="badge" [class.badge-teal]="r.tipo === 'Entero'" [class.badge-warning]="r.tipo === 'Cola'">
                  {{ r.tipo === 'Entero' ? '🦐 Entero' : '🔪 Cola' }}
                </span>
                <span class="badge badge-saved" *ngIf="r.saved" style="cursor: help" title="Guardado en sistema central">💾</span>
                <button
                  type="button"
                  class="badge"
                  style="cursor: pointer; background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; padding: 0.1rem 0.3rem; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center;"
                  (click)="editRecord(r)"
                  title="Editar Lote"
                  *ngIf="r.coreStockOrderId"
                >✏️</button>
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
            Lote <strong>{{ lastRecord?.lotNumber }}</strong> de
            <strong>{{ lastRecord?.supplierName }}</strong><br>
            {{ lastRecord?.pesoBruto | number:'1.0-1' }} lbs en {{ lastRecord?.bines }} gavetas.
            <div class="success-id" *ngIf="lastRecord?.coreStockOrderId">
              ID en Core: <strong>#{{ lastRecord?.coreStockOrderId }}</strong>
            </div>
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
    .form-input:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
    .form-input-lg { font-size: 1.15rem; padding: 0.75rem 1rem; font-weight: 600; }
    .input-error { border-color: #ef4444 !important; }

    /* Select styling */
    .supplier-select-wrapper { position: relative; }
    .form-select {
      appearance: none;
      -webkit-appearance: none;
      padding-right: 2.5rem;
      cursor: pointer;
    }
    .select-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      font-size: 0.85rem;
      pointer-events: none;
    }

    /* Lot input with auto button */
    .lot-input-row { display: flex; gap: 0.5rem; align-items: stretch; }
    .lot-input { flex: 1; }
    .btn-outline {
      background: white;
      border: 1px solid #d1d5db;
      color: #6b7280;
      white-space: nowrap;
    }
    .btn-outline:hover {
      border-color: var(--ina-primary);
      color: var(--ina-primary);
      background: #f0f9ff;
    }
    .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; }

    .field-hint { display: block; font-size: 0.7rem; color: #9ca3af; margin-top: 3px; }
    .field-error { display: block; font-size: 0.72rem; color: #ef4444; margin-top: 3px; font-weight: 500; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    /* Checkbox */
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #4b5563;
      cursor: pointer;
      padding-top: 0.6rem;
    }
    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--ina-primary);
    }

    /* Type Selector */
    .type-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
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
    .type-option:hover { border-color: var(--ina-primary); background: #f0f9ff; }
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
    .suffix-label { font-size: 0.72rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem; }
    .suffix-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .suffix-chip {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
    }
    .suffix-chip small { color: #9ca3af; font-weight: 400; margin-left: 2px; }
    .suffix-chip.active { background: #f0f9ff; border-color: var(--ina-primary); color: var(--ina-primary); }

    /* Error Banner */
    .error-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 0.65rem 1rem;
      margin-bottom: 1rem;
      font-size: 0.82rem;
      color: #dc2626;
    }
    .error-close {
      background: none;
      border: none;
      color: #dc2626;
      cursor: pointer;
      font-size: 1rem;
      padding: 0 4px;
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
    .empty-state { text-align: center; padding: 2rem 1rem; }
    .empty-icon { font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5; }
    .empty-text { font-size: 0.9rem; font-weight: 600; color: #6b7280; }
    .empty-hint { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }

    .record-list { display: flex; flex-direction: column; gap: 0.5rem; }
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
    .record-lot { font-size: 0.95rem; font-weight: 700; color: #1f2937; font-family: monospace; }
    .record-id { font-size: 0.65rem; color: #9ca3af; font-weight: 400; margin-left: 4px; }
    .record-supplier { font-size: 0.75rem; color: var(--ina-primary); font-weight: 600; }
    .record-meta { font-size: 0.75rem; color: #6b7280; margin-top: 1px; }
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
    .badge-info { background: #e0e7ff; color: #4f46e5; }
    .badge-saved { background: #dcfce7; color: #16a34a; }

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
    .success-id { margin-top: 0.5rem; font-size: 0.8rem; color: #059669; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class ReceptionComponent implements OnInit {
  // Form fields
  receptionDate = '';
  lotNumber = '';
  selectedSupplierId: number | null = null;
  selectedSupplier: ShrimpSupplier | null = null;
  selectedSemiProductId: number | null = null;
  pesoBruto: number | null = null;
  bines: number | null = null;
  tipo = 'Entero';

  // Data from API
  suppliers: ShrimpSupplier[] = [];
  semiProducts: ShrimpSemiProduct[] = [];
  facilities: ShrimpFacility[] = [];
  companyId: number | null = null;
  receptionFacilityId: number | null = null;

  // UI state
  records: ReceptionRecord[] = [];
  showSuccess = false;
  lastRecord: ReceptionRecord | null = null;
  saving = false;
  errorMessage = '';
  editingRecordId: number | null = null;
  private lotSequence = 0;

  constructor(private shrimpData: ShrimpDataService) {}

  ngOnInit() {
    // Default date = today
    this.receptionDate = this.formatDate(new Date());

    // Load company data, then suppliers, semi-products, and facilities
    this.shrimpData.getActiveCompany().subscribe(company => {
      this.companyId = company?.data?.id || company?.id;
      if (!this.companyId) return;

      this.shrimpData.getSuppliers(this.companyId).subscribe(s => this.suppliers = s);

      this.shrimpData.getSemiProducts(this.companyId).subscribe(sp => {
        this.semiProducts = sp;
        // Default to first semi-product (Entero)
        if (sp.length > 0) {
          this.selectedSemiProductId = sp[0].id;
          this.tipo = sp[0].name;
        }
      });

      this.shrimpData.getFacilities(this.companyId).subscribe(f => {
        this.facilities = f;
        
        if (f.length === 1) {
          // Si solo hay una instalación, seleccionarla automáticamente
          this.receptionFacilityId = f[0].id;
        } else if (f.length > 1) {
          // Si hay varias, intentar buscar una que se llame 'Recepción' para sugerirla por defecto
          const recepcion = f.find((fac: any) =>
            (fac.name || '').toLowerCase().includes('recepción') ||
            (fac.name || '').toLowerCase().includes('recepcion')
          );
          this.receptionFacilityId = recepcion?.id || null;
        } else {
          // Si es 0, no seleccionar nada y bloqueará isFormValid()
          this.receptionFacilityId = null;
        }
      });
      
      // Load today's existings records
      this.shrimpData.getTodayReceptions(this.companyId, this.receptionDate).subscribe(historicRecords => {
         this.records = historicRecords;
      });
    });
  }

  get totalWeight(): number {
    return this.records.reduce((sum, r) => sum + r.pesoBruto, 0);
  }

  isFormValid(): boolean {
    return !!(
      this.lotNumber &&
      this.pesoBruto && this.pesoBruto > 0 &&
      this.bines && this.bines > 0 &&
      this.selectedSupplierId &&
      this.selectedSemiProductId &&
      this.receptionDate &&
      this.receptionFacilityId
    );
  }

  onSupplierChange(supplierId: number) {
    this.selectedSupplier = this.suppliers.find(s => s.id === supplierId) || null;
  }

  autoGenerateLot() {
    const dateParts = this.receptionDate.split('-');
    const dd = dateParts[2] || '01';
    const mm = dateParts[1] || '01';
    const yy = dateParts[0]?.slice(-2) || '26';
    this.lotSequence++;
    this.lotNumber = `${dd}${mm}${yy}-${String(this.lotSequence).padStart(3, '0')}`;
  }

  cancelEdit() {
    this.editingRecordId = null;
    this.lotNumber = '';
    this.pesoBruto = null;
    this.bines = null;
    this.saving = false;
    this.errorMessage = '';
    this.receptionDate = this.formatDate(new Date());
  }

  editRecord(r: ReceptionRecord) {
    if (!r.coreStockOrderId) return;
    this.editingRecordId = r.coreStockOrderId;
    this.lotNumber = r.lotNumber;
    this.pesoBruto = r.pesoBruto;
    this.bines = r.bines;
    this.selectedSupplierId = r.supplierId;
    this.tipo = r.tipo;
    
    // Convert current Date to YYYY-MM-DD
    this.receptionDate = this.formatDate(r.fecha);

    const matchSp = this.semiProducts.find(s => s.name === r.tipo);
    if (matchSp) {
      this.selectedSemiProductId = matchSp.id;
    }

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit() {
    if (!this.isFormValid()) return;
    this.saving = true;
    this.errorMessage = '';

    const supplier = this.suppliers.find(s => s.id === this.selectedSupplierId);
    const binsComment = LotNumberUtil.packDualUnitComment(this.pesoBruto!, this.bines!);

    this.shrimpData.createPurchaseOrder({
      id: this.editingRecordId || undefined,
      facilityId: this.receptionFacilityId!,
      semiProductId: this.selectedSemiProductId!,
      producerUserCustomerId: this.selectedSupplierId!,
      totalGrossQuantity: this.pesoBruto!,
      internalLotNumber: this.lotNumber,
      deliveryTime: this.receptionDate,
      priceDeterminedLater: true,
      comments: binsComment,
    }).subscribe({
      next: (result) => {
        const isEditing = !!this.editingRecordId;
        const targetId = isEditing ? this.editingRecordId! : result.id;
        
        const record: ReceptionRecord = {
          id: isEditing ? targetId : Date.now(),
          coreStockOrderId: targetId,
          lotNumber: this.lotNumber,
          supplierId: this.selectedSupplierId,
          supplierName: supplier?.displayName || 'Desconocido',
          pesoBruto: this.pesoBruto!,
          bines: this.bines!,
          tipo: this.tipo,
          fecha: new Date(this.receptionDate),
          saved: true,
        };

        if (isEditing) {
          // Replace it in array
          const idx = this.records.findIndex(x => x.coreStockOrderId === targetId);
          if (idx >= 0) {
            this.records[idx] = record;
          }
        } else {
          this.records.unshift(record);
        }

        this.lastRecord = record;
        this.showSuccess = true;

        // Also push to local cache for other modules
        this.shrimpData.pushLocalReceptionLot({
          id: `so-${targetId}`,
          base_lot_number: this.lotNumber,
          supplier_id: this.selectedSupplierId,
          supplier_name: supplier?.displayName || '',
          gross_weight_lbs: this.pesoBruto!,
          bins_count: this.bines!,
          product_type: this.tipo,
          reception_date: this.receptionDate,
        });

        console.log('[Recepción] StockOrder guardado en Core:', targetId);

        // Reset form fully
        this.cancelEdit();
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.errorMessage || err?.error?.data?.errorMessage || err?.message || 'Error desconocido';
        this.errorMessage = `No se pudo guardar: ${msg}`;
        console.error('[Recepción] Error al guardar:', err);
      }
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
