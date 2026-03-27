import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotNumberUtil } from '../utils/lot-number.util';

interface ClassificationRecord {
  id: number;
  talla: string;
  cajetas: number;
  libras: number;
  destino: string;
  loteSuffix: string;
  maquina: string;
  timestamp: Date;
}

const TALLAS = ['16/20', '21/25', '26/30', '31/40', '41/50', '51/60', '61/70', '71/90'];

const DESTINOS: { key: string; label: string; icon: string; suffix: number }[] = [
  { key: 'BLOQUE', label: 'Bloque', icon: '🧊', suffix: 1 },
  { key: 'IQF', label: 'IQF', icon: '❄️', suffix: 2 },
  { key: 'VA', label: 'Valor Agregado', icon: '⭐', suffix: 3 },
  { key: 'SALMUERA', label: 'Salmuera', icon: '🧂', suffix: 4 },
];

@Component({
  selector: 'app-clasificacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in-up">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">📏 Clasificación</h1>
          <p class="page-subtitle">Registro de salidas por talla, destino y línea de máquina</p>
        </div>
        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-value">{{ records.length }}</span>
            <span class="stat-label">Registros</span>
          </div>
          <div class="stat-chip">
            <span class="stat-value">{{ totalLbs | number:'1.0-0' }}</span>
            <span class="stat-label">Lbs total</span>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Form Column -->
        <div class="form-column">
          <!-- Step 1: Lote Base -->
          <div class="card">
            <div class="card-header">
              <span class="step-number">1</span>
              <h2>Lote Base</h2>
            </div>
            <input
              type="text"
              [(ngModel)]="loteBase"
              class="form-input form-input-lg"
              placeholder="Ingrese lote base (ej. 250121)"
            >
          </div>

          <!-- Step 2: Talla -->
          <div class="card" *ngIf="loteBase">
            <div class="card-header">
              <span class="step-number">2</span>
              <h2>Selección de Talla</h2>
            </div>
            <div class="talla-grid">
              <button
                *ngFor="let t of tallas"
                class="talla-btn"
                [class.talla-active]="selectedTalla === t"
                (click)="selectedTalla = t"
              >
                {{ t }}
              </button>
            </div>
          </div>

          <!-- Step 3: Destino -->
          <div class="card" *ngIf="selectedTalla" [class.animate-fade-in-up]="selectedTalla">
            <div class="card-header">
              <span class="step-number">3</span>
              <h2>Destino Productivo</h2>
              <span class="lote-suffix-badge" *ngIf="selectedDestino">
                Lote: {{ getSuffixedLot() }}
              </span>
            </div>
            <div class="destino-grid">
              <button
                *ngFor="let d of destinos"
                class="destino-btn"
                [class.destino-active]="selectedDestino?.key === d.key"
                (click)="selectedDestino = d"
              >
                <span class="destino-icon">{{ d.icon }}</span>
                <span class="destino-label">{{ d.label }}</span>
                <span class="destino-suffix">{{ d.suffix === 1 ? 'Base' : '-' + d.suffix }}</span>
              </button>
            </div>
          </div>

          <!-- Step 4: Cantidades -->
          <div class="card" *ngIf="selectedDestino" [class.animate-fade-in-up]="selectedDestino">
            <div class="card-header">
              <span class="step-number">4</span>
              <h2>Cantidades y Línea</h2>
            </div>

            <div class="qty-grid">
              <div class="qty-box"
                   [class.qty-active]="activeInput === 'cajetas'"
                   (click)="activeInput = 'cajetas'">
                <div class="qty-label">Cajetas</div>
                <div class="qty-value">{{ cajetas || '0' }}</div>
                <div class="qty-unit">conteo</div>
              </div>
              <div class="qty-box"
                   [class.qty-active]="activeInput === 'libras'"
                   (click)="activeInput = 'libras'">
                <div class="qty-label">Libras</div>
                <div class="qty-value">{{ libras || '0.00' }}</div>
                <div class="qty-unit">peso</div>
              </div>
            </div>

            <!-- Numeric Keypad -->
            <div class="keypad-section" *ngIf="activeInput">
              <div class="keypad-active-label">
                Ingresando <strong>{{ activeInput | uppercase }}</strong>
              </div>
              <div class="keypad">
                <button *ngFor="let k of keypadKeys" class="key-btn"
                  [class.key-wide]="k === '0'"
                  [class.key-action]="k === '⌫' || k === 'C'"
                  (click)="onKey(k)">{{ k }}</button>
              </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">Máquina Clasificadora</label>
              <div class="line-grid">
                <button *ngFor="let l of ['1','2','3','4']"
                  class="line-btn"
                  [class.line-active]="maquina === l"
                  (click)="maquina = l">
                  Línea {{ l }}
                </button>
              </div>
            </div>

            <button
              class="btn btn-success btn-lg btn-block"
              [disabled]="!cajetas && !libras"
              (click)="registrar()"
              style="margin-top: 1rem;"
            >
              💾 Guardar Registro
            </button>
          </div>
        </div>

        <!-- Records Column -->
        <div class="card records-card">
          <div class="card-header">
            <h2>Registros de Clasificación</h2>
            <span class="badge badge-info">{{ records.length }}</span>
          </div>

          <div *ngIf="records.length === 0" class="empty-state">
            <div class="empty-icon">📏</div>
            <div class="empty-text">Sin registros</div>
            <div class="empty-hint">Complete los 4 pasos para registrar</div>
          </div>

          <div class="record-list" *ngIf="records.length > 0">
            <div class="record-item" *ngFor="let r of records; let i = index">
              <div class="record-main">
                <div class="record-lot">{{ r.loteSuffix }}</div>
                <div class="record-meta">
                  Talla {{ r.talla }} · {{ r.cajetas }} caj · {{ r.libras | number:'1.0-1' }} lbs · L{{ r.maquina }}
                </div>
              </div>
              <span class="badge badge-teal">{{ r.destino }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Overlay -->
      <div class="success-overlay" *ngIf="showSuccess" (click)="showSuccess = false">
        <div class="success-card" (click)="$event.stopPropagation()">
          <div class="success-icon">✅</div>
          <div class="success-title">Clasificación Registrada</div>
          <div class="success-detail">
            <strong>{{ lastRecord?.loteSuffix }}</strong> — Talla {{ lastRecord?.talla }}<br>
            {{ lastRecord?.cajetas }} cajetas · {{ lastRecord?.libras | number:'1.0-1' }} lbs
          </div>
          <button class="btn btn-primary btn-block" (click)="showSuccess = false">Continuar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem;
    }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--ina-secondary); margin: 0; }
    .page-subtitle { font-size: 0.82rem; color: #6b7280; margin-top: 2px; }
    .header-stats { display: flex; gap: 0.75rem; }
    .stat-chip {
      background: white; border: 1px solid #e5e7eb; border-radius: 10px;
      padding: 0.5rem 1rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .stat-value { display: block; font-size: 1.3rem; font-weight: 700; color: var(--ina-primary); }
    .stat-label {
      display: block; font-size: 0.65rem; font-weight: 600; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.04em;
    }

    .content-grid {
      display: grid; grid-template-columns: 1fr 350px; gap: 1.25rem; align-items: start;
    }
    .form-column {
      display: flex; flex-direction: column; gap: 1rem;
    }

    .card {
      background: white; border: 1px solid #e5e7eb; border-radius: 12px;
      padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .card-header {
      display: flex; align-items: center; gap: 0.5rem;
      margin-bottom: 1rem; padding-bottom: 0.65rem; border-bottom: 1px solid #f3f4f6;
    }
    .card-header h2 { font-size: 0.9rem; font-weight: 600; color: #1f2937; margin: 0; flex: 1; }
    .step-number {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; background: var(--ina-primary); color: white;
      border-radius: 50%; font-size: 0.65rem; font-weight: 700;
    }

    .form-input {
      width: 100%; background: #fff; border: 1px solid #d1d5db; border-radius: 8px;
      padding: 0.6rem 0.85rem; font-family: 'Open Sans', sans-serif; font-size: 0.95rem;
      color: #1f2937; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box;
    }
    .form-input:focus { outline: none; border-color: var(--ina-primary); box-shadow: 0 0 0 3px rgba(153,153,51,0.15); }
    .form-input::placeholder { color: #9ca3af; }
    .form-input-lg { font-size: 1.1rem; padding: 0.7rem 1rem; font-weight: 600; }
    .form-label { display: block; font-size: 0.78rem; font-weight: 600; color: #6b7280; margin-bottom: 0.3rem; }

    /* Talla Grid */
    .talla-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .talla-btn {
      background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 8px;
      padding: 0.65rem; font-family: 'Open Sans', sans-serif; font-size: 0.88rem;
      font-weight: 600; color: #374151; cursor: pointer; transition: all 0.12s;
    }
    .talla-btn:hover { border-color: var(--ina-primary); background: #fdfce8; }
    .talla-active {
      border-color: var(--ina-primary) !important; background: #fdfce8 !important; color: var(--ina-primary) !important;
      box-shadow: 0 0 0 2px rgba(54,155,193,0.12);
    }

    /* Destino Grid */
    .destino-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .destino-btn {
      background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px;
      padding: 0.85rem 0.5rem; text-align: center; cursor: pointer;
      transition: all 0.12s; font-family: 'Open Sans', sans-serif;
    }
    .destino-btn:hover { border-color: #0d9488; background: #f0fdfa; }
    .destino-active {
      border-color: #0d9488 !important; background: #f0fdfa !important;
      box-shadow: 0 0 0 2px rgba(13,148,136,0.12);
    }
    .destino-icon { display: block; font-size: 1.5rem; margin-bottom: 0.3rem; }
    .destino-label { display: block; font-size: 0.78rem; font-weight: 600; color: #1f2937; }
    .destino-suffix { display: block; font-size: 0.65rem; color: #9ca3af; margin-top: 2px; }

    .lote-suffix-badge {
      background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px;
      padding: 2px 8px; font-size: 0.72rem; font-weight: 700; color: #0d9488;
      font-family: monospace;
    }

    /* Qty Boxes */
    .qty-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .qty-box {
      background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px;
      padding: 1rem; text-align: center; cursor: pointer; transition: all 0.15s;
    }
    .qty-box:hover { border-color: #94a3b8; }
    .qty-active {
      border-color: var(--ina-primary) !important;
      box-shadow: 0 0 0 3px rgba(54,155,193,0.12);
    }
    .qty-label { font-size: 0.72rem; font-weight: 600; color: #6b7280; margin-bottom: 0.3rem; }
    .qty-value { font-size: 2rem; font-weight: 700; color: #1f2937; font-family: monospace; min-height: 2.5rem; }
    .qty-unit { font-size: 0.65rem; color: #9ca3af; }

    /* Keypad */
    .keypad-section {
      margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #f3f4f6;
    }
    .keypad-active-label {
      text-align: center; font-size: 0.78rem; color: #6b7280; margin-bottom: 0.65rem;
    }
    .keypad-active-label strong { color: var(--ina-primary); }
    .keypad {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 280px; margin: 0 auto;
    }
    .key-btn {
      background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 0.75rem; font-size: 1.1rem; font-weight: 600; color: #1f2937;
      cursor: pointer; transition: all 0.1s; font-family: 'Open Sans', sans-serif;
    }
    .key-btn:hover { background: #e5e7eb; }
    .key-btn:active { background: #d1d5db; transform: scale(0.97); }
    .key-action { background: #fef3c7; color: #92400e; border-color: #fde68a; }
    .key-action:hover { background: #fde68a; }

    /* Line Grid */
    .line-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .line-btn {
      background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 8px;
      padding: 0.55rem; font-family: 'Open Sans', sans-serif; font-size: 0.8rem;
      font-weight: 600; color: #374151; cursor: pointer; transition: all 0.12s;
    }
    .line-btn:hover { border-color: var(--ina-primary); }
    .line-active { border-color: var(--ina-primary) !important; background: #fdfce8 !important; color: var(--ina-primary) !important; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.65rem 1.25rem; border-radius: 8px; font-family: 'Open Sans', sans-serif;
      font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s;
    }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-success { background: #16a34a; color: white; }
    .btn-success:hover:not(:disabled) { background: #15803d; box-shadow: 0 4px 12px rgba(22,163,74,0.25); }
    .btn-primary { background: var(--ina-primary); color: white; }
    .btn-primary:hover:not(:disabled) { background: #2d87ab; }
    .btn-lg { padding: 0.85rem 1.5rem; font-size: 1rem; }
    .btn-block { width: 100%; }

    /* Records */
    .records-card { position: sticky; top: 0; }
    .badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 600; }
    .badge-info { background: #fef4e8; color: var(--ina-secondary); }
    .badge-teal { background: #ccfbf1; color: #0d9488; }
    .empty-state { text-align: center; padding: 2rem 1rem; }
    .empty-icon { font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5; }
    .empty-text { font-size: 0.9rem; font-weight: 600; color: #6b7280; }
    .empty-hint { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }
    .record-list { display: flex; flex-direction: column; gap: 0.4rem; max-height: 60vh; overflow-y: auto; }
    .record-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.6rem 0.75rem; background: #f9fafb; border: 1px solid #f3f4f6;
      border-radius: 8px; transition: background 0.1s;
    }
    .record-item:hover { background: #f0f9ff; }
    .record-lot { font-size: 0.88rem; font-weight: 700; color: #1f2937; font-family: monospace; }
    .record-meta { font-size: 0.7rem; color: #6b7280; margin-top: 1px; }

    /* Success Overlay */
    .success-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.35); display: flex; align-items: center;
      justify-content: center; z-index: 100; animation: fadeIn 0.2s ease;
    }
    .success-card {
      background: white; border-radius: 16px; padding: 2.5rem; text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15); max-width: 380px; animation: scaleIn 0.25s ease;
    }
    .success-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .success-title { font-size: 1.15rem; font-weight: 700; color: #1f2937; margin-bottom: 0.4rem; }
    .success-detail { font-size: 0.85rem; color: #6b7280; margin-bottom: 1.5rem; line-height: 1.5; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }

    .animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ClassificationComponent {
  tallas = TALLAS;
  destinos = DESTINOS;
  keypadKeys = ['7','8','9','4','5','6','1','2','3','C','0','.','⌫'];

  loteBase = '';
  selectedTalla: string | null = null;
  selectedDestino: typeof DESTINOS[0] | null = null;
  activeInput: 'cajetas' | 'libras' | null = null;
  cajetas = '';
  libras = '';
  maquina = '1';

  records: ClassificationRecord[] = [];
  showSuccess = false;
  lastRecord: ClassificationRecord | null = null;

  get totalLbs(): number {
    return this.records.reduce((sum, r) => sum + r.libras, 0);
  }

  getSuffixedLot(): string {
    if (!this.loteBase || !this.selectedDestino) return '';
    return LotNumberUtil.generateSuffix(this.loteBase, this.selectedDestino.suffix);
  }

  onKey(key: string) {
    if (!this.activeInput) return;
    let val = this.activeInput === 'cajetas' ? this.cajetas : this.libras;

    if (key === 'C') {
      val = '';
    } else if (key === '⌫') {
      val = val.slice(0, -1);
    } else {
      if (key === '.' && val.includes('.')) return;
      if (this.activeInput === 'cajetas' && key === '.') return;
      val += key;
    }

    if (this.activeInput === 'cajetas') this.cajetas = val;
    else this.libras = val;
  }

  registrar() {
    if (!this.selectedTalla || !this.selectedDestino) return;

    const record: ClassificationRecord = {
      id: Date.now(),
      talla: this.selectedTalla,
      cajetas: parseInt(this.cajetas) || 0,
      libras: parseFloat(this.libras) || 0,
      destino: this.selectedDestino.label,
      loteSuffix: this.getSuffixedLot(),
      maquina: this.maquina,
      timestamp: new Date(),
    };

    this.records.unshift(record);
    this.lastRecord = record;
    this.showSuccess = true;

    // Log dual-unit payload
    const comment = LotNumberUtil.packDualUnitComment(record.libras, record.cajetas);
    console.log('[Clasificación] Registro:', record, 'Comment:', comment);

    // Reset quantities only
    this.cajetas = '';
    this.libras = '';
    this.activeInput = null;
  }
}
