import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotNumberUtil } from '../utils/lot-number.util';
import { ShrimpDataService } from '../services/shrimp-data.service';

interface ClassificationRecord {
  id: number;
  talla: any; // backend semiProduct
  cajetas: number;
  libras: number;
  destino: string;
  loteSuffix: string;
  maquina: string;
  timestamp: Date;
}

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
          <div class="stat-chip" [class.text-danger]="massBalance < 0">
            <span class="stat-value">{{ massBalance | number:'1.0-0' }}</span>
            <span class="stat-label">Lbs Disponibles</span>
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
              <h2>Lote Base de Recepción</h2>
            </div>
            
            <select
              [(ngModel)]="selectedReception"
              class="form-input form-input-lg"
              (change)="onReceptionChanged()"
            >
              <option [ngValue]="null">Seleccione un Lote Abierto...</option>
              <option *ngFor="let rec of openReceptions" [ngValue]="rec">
                {{ rec.lotNumber }} — {{ rec.pesoBruto | number:'1.0-0' }} lbs ({{ rec.tipo }})
              </option>
            </select>
            
            <div class="info-alert mt-3" *ngIf="selectedReception">
              <strong>Tipo:</strong> {{ selectedReception.tipo }} <br>
              <strong>Peso Recibido:</strong> {{ selectedReception.pesoBruto | number }} lbs
            </div>
            
            <!-- Rechazo (si es Entero) -->
            <div class="mt-3" *ngIf="selectedReception?.tipo === 'Entero'">
              <label class="form-label" style="display:flex; justify-content:space-between">
                <span>Merma / Descarte Inicial (lbs)</span>
                <span class="badge badge-teal">Descabezado</span>
              </label>
              <input type="number" [(ngModel)]="mermaLibras" class="form-input" placeholder="0" min="0">
            </div>
          </div>

          <!-- Step 2: Talla -->
          <div class="card" *ngIf="selectedReception" [class.disabled-form]="massBalance <= 0">
            <div class="card-header">
              <span class="step-number">2</span>
              <h2>Selección de Talla</h2>
            </div>
            <div class="talla-grid">
              <button
                *ngFor="let t of tallasApi"
                class="talla-btn"
                [class.talla-active]="selectedTalla?.id === t.id"
                (click)="selectedTalla = t"
              >
                {{ t.name.replace('Talla ', '') }}
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
              class="btn btn-primary btn-lg btn-block"
              [disabled]="!cajetas && !libras || isExceedingBalance"
              (click)="adicionarSubLote()"
              style="margin-top: 1rem;"
            >
              ➕ Añadir Sub-Lote
            </button>
            <div class="field-error mt-2 text-center" *ngIf="isExceedingBalance">
              El peso excede el Balance Disponible ({{ massBalance | number }} lbs).
            </div>
          </div>
        </div>

        <!-- Records Column -->
        <div class="card records-card flex-col">
          <div class="card-header">
            <h2>Liquidación Pendiente</h2>
            <span class="badge badge-info">{{ records.length }} sub-lotes</span>
          </div>

          <div *ngIf="!selectedReception" class="empty-state flex-1">
            <div class="empty-icon">📂</div>
            <div class="empty-text">Esperando Lote Fuente</div>
            <div class="empty-hint">Seleccione un lote base en el Paso 1</div>
          </div>

          <div class="record-list flex-1" *ngIf="selectedReception">
            <div class="record-item" *ngFor="let r of records; let i = index">
              <div class="record-main">
                <div class="record-lot" style="display:flex; gap:0.5rem">
                  {{ r.loteSuffix }}
                  <span class="badge badge-teal">{{ r.destino }}</span>
                </div>
                <div class="record-meta">
                  {{ r.talla.name }} · {{ r.cajetas }} caj · <strong>{{ r.libras | number:'1.0-1' }} lbs</strong> · M{{ r.maquina }}
                </div>
              </div>
              <button class="remove-btn" (click)="removerSubLote(i)">❌</button>
            </div>
          </div>
          
          <!-- Liquidación Status Panel -->
          <div class="balance-panel" *ngIf="selectedReception">
            <div class="balance-row">
              <span>Ingreso Base ({{ selectedReception.tipo }})</span>
              <strong>{{ selectedReception.pesoBruto | number }} lbs</strong>
            </div>
            <div class="balance-row text-danger" *ngIf="mermaLibras > 0">
              <span>Menos Merma/Rechazo</span>
              <strong>-{{ mermaLibras | number }} lbs</strong>
            </div>
            <div class="balance-row text-primary">
              <span>Total Clasificado</span>
              <strong>-{{ totalLbs | number }} lbs</strong>
            </div>
            <div class="balance-divider"></div>
            <div class="balance-row" [class.text-danger]="massBalance < 0" [class.text-success]="massBalance === 0">
              <span>Balance Disponible (Merma de Sistema)</span>
              <strong>{{ massBalance | number }} lbs</strong>
            </div>
            
            <button
              class="btn btn-success btn-lg btn-block mt-3"
              [disabled]="records.length === 0 || massBalance < 0 || isSubmitting"
              (click)="terminarYEnviarAlCore()"
            >
              {{ isSubmitting ? 'Procesando...' : '💾 Terminar y Cerrar Lote' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Success Overlay -->
      <div class="success-overlay" *ngIf="showSuccess" (click)="cerrarSuccessModal()">
        <div class="success-card" (click)="$event.stopPropagation()">
          <div class="success-icon">✅</div>
          <div class="success-title">Distribución Registrada (Core INATrace)</div>
          <div class="success-detail">
            Se generó el Processing Order en el backend derivando a {{ records.length }} sub-lotes.
          </div>
          <button class="btn btn-primary btn-block" (click)="cerrarSuccessModal()">Nueva Clasificación</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; padding-bottom: 3rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--ina-secondary); margin: 0; }
    .page-subtitle { font-size: 0.82rem; color: #6b7280; margin-top: 2px; }
    .header-stats { display: flex; gap: 0.75rem; }
    .stat-chip { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.5rem 1rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .stat-value { display: block; font-size: 1.3rem; font-weight: 700; color: var(--ina-primary); }
    .text-danger .stat-value { color: #dc2626; }
    .stat-label { display: block; font-size: 0.65rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; }

    .content-grid { display: grid; grid-template-columns: 1fr 400px; gap: 1.25rem; align-items: start; }
    .form-column { display: flex; flex-direction: column; gap: 1rem; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-1 { flex: 1; overflow-y: auto; max-height: 400px; }

    .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding-bottom: 0.65rem; border-bottom: 1px solid #f3f4f6; }
    .card-header h2 { font-size: 0.9rem; font-weight: 600; color: #1f2937; margin: 0; flex: 1; }
    .step-number { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: var(--ina-primary); color: white; border-radius: 50%; font-size: 0.65rem; font-weight: 700; }

    .form-input { width: 100%; background: #fff; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.6rem 0.85rem; font-family: 'Open Sans', sans-serif; font-size: 0.95rem; color: #1f2937; box-sizing: border-box; }
    .form-input-lg { font-size: 1.05rem; padding: 0.75rem 1rem; font-weight: 600; }
    .form-label { display: block; font-size: 0.78rem; font-weight: 600; color: #6b7280; margin-bottom: 0.3rem; }

    .talla-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .talla-btn { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 0.65rem; font-family: 'Open Sans', sans-serif; font-size: 0.88rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.12s; }
    .talla-btn:hover { border-color: var(--ina-primary); background: #fdfce8; }
    .talla-active { border-color: var(--ina-primary) !important; background: #fdfce8 !important; color: var(--ina-primary) !important; box-shadow: 0 0 0 2px rgba(54,155,193,0.12); }

    .destino-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .destino-btn { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 0.85rem 0.5rem; text-align: center; cursor: pointer; transition: all 0.12s; font-family: 'Open Sans', sans-serif; }
    .destino-btn:hover { border-color: #0d9488; background: #f0fdfa; }
    .destino-active { border-color: #0d9488 !important; background: #f0fdfa !important; box-shadow: 0 0 0 2px rgba(13,148,136,0.12); }
    .destino-icon { display: block; font-size: 1.5rem; margin-bottom: 0.3rem; }
    .destino-label { display: block; font-size: 0.78rem; font-weight: 600; color: #1f2937; }
    .destino-suffix { display: block; font-size: 0.65rem; color: #9ca3af; margin-top: 2px; }

    .lote-suffix-badge { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 2px 8px; font-size: 0.72rem; font-weight: 700; color: #0d9488; font-family: monospace; }
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; }
    .badge-info { background: #e0f2fe; color: #0284c7; }
    .badge-teal { background: #ccfbf1; color: #0f766e; }

    .qty-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .qty-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px; padding: 1rem; text-align: center; cursor: pointer; transition: all 0.15s; }
    .qty-box:hover { border-color: #d1d5db; }
    .qty-active { border-color: var(--ina-primary) !important; background: #fdfce8 !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .qty-label { font-size: 0.78rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .qty-value { font-size: 2rem; font-weight: 800; color: #1f2937; font-family: monospace; line-height: 1; margin-bottom: 0.25rem; }
    .qty-unit { font-size: 0.7rem; color: #9ca3af; }

    .keypad-section { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px dashed #e5e7eb; }
    .keypad-active-label { text-align: center; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.75rem; }
    .keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; max-width: 250px; margin: 0 auto; }
    .key-btn { background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.75rem 0; font-size: 1.25rem; font-weight: 600; color: #374151; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .key-btn:active { background: #f3f4f6; transform: scale(0.96); }
    .key-wide { grid-column: span 2; }
    .key-action { color: #dc2626; font-size: 1.1rem; }

    .line-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .line-btn { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.5rem; font-size: 0.8rem; font-weight: 600; color: #4b5563; cursor: pointer; }
    .line-active { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; }

    .info-alert { padding: 0.75rem; border-radius: 8px; background-color: #f8fafc; border-left: 4px solid var(--ina-primary); font-size: 0.85rem; color: #334155; }

    .record-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .record-item { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
    .record-main { display: flex; flex-direction: column; gap: 0.25rem; }
    .record-lot { font-family: monospace; font-weight: 700; font-size: 0.95rem; color: #1f2937; }
    .record-meta { font-size: 0.78rem; color: #6b7280; }
    .remove-btn { background: none; border: none; cursor: pointer; opacity: 0.5; font-size: 1rem; }
    .remove-btn:hover { opacity: 1; transform: scale(1.1); }

    .balance-panel { background: #f8fafc; border-radius: 12px; padding: 1.25rem; margin-top: 1rem; border: 1px solid #cbd5e1; }
    .balance-row { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem; color: #475569; }
    .balance-row strong { font-family: monospace; font-size: 0.95rem; }
    .balance-divider { height: 1px; background: #cbd5e1; margin: 0.75rem 0; }
    .text-danger { color: #dc2626 !important; }
    .text-success { color: #16a34a !important; }
    .text-primary { color: var(--ina-primary) !important; }

    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.6rem 1.25rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s; font-family: 'Open Sans', sans-serif; font-size: 0.9rem; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-block { width: 100%; }
    .btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; }
    .btn-primary { background: var(--ina-primary); color: white; }
    .btn-primary:hover:not(:disabled) { background: #2a7c9d; }
    .btn-success { background: #0d9488; color: white; }
    .btn-success:hover:not(:disabled) { background: #0f766e; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
    .text-center { text-align: center; }
    .field-error { font-size: 0.75rem; color: #dc2626; }
    .disabled-form { opacity: 0.6; pointer-events: none; }

    /* Empty States */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; background: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 12px; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.5; }
    .empty-text { font-size: 1rem; font-weight: 600; color: #4b5563; }
    .empty-hint { font-size: 0.8rem; color: #9ca3af; text-align: center; margin-top: 0.25rem; }

    /* Success Modal */
    .success-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .success-card { background: white; border-radius: 16px; padding: 2.5rem; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.15); max-width: 380px; animation: scaleIn 0.25s ease; }
    .success-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .success-title { font-size: 1.15rem; font-weight: 700; color: #1f2937; margin-bottom: 0.4rem; }
    .success-detail { font-size: 0.85rem; color: #6b7280; margin-bottom: 1.5rem; line-height: 1.5; }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ClassificationComponent implements OnInit {
  COMPANY_ID = 1;

  // Domain Masters
  openReceptions: any[] = [];
  tallasApi: any[] = [];
  classificationAction: any = null;
  colaSemiProduct: any = null;

  destinos = DESTINOS;
  keypadKeys = ['7','8','9','4','5','6','1','2','3','C','0','.','⌫'];

  // Form State
  selectedReception: any = null;
  selectedTalla: any = null;
  selectedDestino: typeof DESTINOS[0] | null = null;
  
  activeInput: 'cajetas' | 'libras' | null = null;
  cajetas = '';
  libras = '';
  maquina = '1';
  mermaLibras: number = 0;

  records: ClassificationRecord[] = [];
  showSuccess = false;
  isSubmitting = false;

  constructor(private dataService: ShrimpDataService) {}

  ngOnInit() {
    this.loadMasters();
  }

  loadMasters() {
    this.dataService.getAvailableForClassification(this.COMPANY_ID).subscribe(list => {
      this.openReceptions = list;
    });

    this.dataService.getClassificationAction(this.COMPANY_ID).subscribe(action => {
      this.classificationAction = action;
    });

    this.dataService.getSemiProducts(this.COMPANY_ID).subscribe(sps => {
      // Typically tallas start with "Talla"
      this.tallasApi = sps.filter(sp => sp.name.startsWith('Talla'));
      this.colaSemiProduct = sps.find(sp => sp.name === 'Cola');
    });
  }

  get totalLbs(): number {
    return this.records.reduce((sum, r) => sum + r.libras, 0);
  }

  get massBalance(): number {
    if (!this.selectedReception) return 0;
    return this.selectedReception.pesoBruto - this.totalLbs - (this.mermaLibras || 0);
  }

  get isExceedingBalance(): boolean {
    const inputLbs = parseFloat(this.libras) || 0;
    return inputLbs > this.massBalance;
  }

  getSuffixedLot(): string {
    if (!this.selectedReception || !this.selectedDestino) return '';
    const baseLot = this.selectedReception.lotNumber;
    return LotNumberUtil.generateSuffix(baseLot, this.selectedDestino.suffix);
  }

  onReceptionChanged() {
    this.records = [];
    this.mermaLibras = 0;
    this.selectedTalla = null;
    this.selectedDestino = null;
    this.activeInput = null;
    this.cajetas = '';
    this.libras = '';
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

  adicionarSubLote() {
    if (!this.selectedTalla || !this.selectedDestino) return;
    const inputLbs = parseFloat(this.libras) || 0;
    if (inputLbs <= 0) return;

    if (this.isExceedingBalance) return;

    const record: ClassificationRecord = {
      id: Date.now(),
      talla: this.selectedTalla,
      cajetas: parseInt(this.cajetas) || 0,
      libras: inputLbs,
      destino: this.selectedDestino.label,
      loteSuffix: this.getSuffixedLot(),
      maquina: this.maquina,
      timestamp: new Date(),
    };

    this.records.unshift(record);

    // Reset just the lower form
    this.cajetas = '';
    this.libras = '';
    this.activeInput = null;
    this.selectedDestino = null;
    this.selectedTalla = null;
  }

  removerSubLote(index: number) {
    this.records.splice(index, 1);
  }

  terminarYEnviarAlCore() {
    if (this.records.length === 0 || !this.selectedReception || !this.classificationAction) return;

    if (this.massBalance < 0) {
      alert("Error: El balance no puede ser negativo.");
      return;
    }

    this.isSubmitting = true;

    // 1. Map Target Stock Orders from UI records
    const targetStockOrders = this.records.map(r => ({
      semiProduct: { id: r.talla.id },
      facility: { id: this.selectedReception.facilityId },
      totalGrossQuantity: r.libras,
      totalQuantity: r.libras,
      internalLotNumber: r.loteSuffix,
      preferredWayOfPayment: 'CASH',
      isPurchaseOrder: false,
      comments: JSON.stringify({
        dualUnit: true,
        cajetas: r.cajetas,
        maquina: r.maquina,
        destino: r.destino
      })
    }));

    // 2. Add an optional "Cola" output if there is "Descabezado" (merma/rechazo)
    // Following rule: Rechazo de Entero se de-cabeza y genera "Cola" (which then goes back to pool)
    if (this.mermaLibras > 0 && this.selectedReception.tipo === 'Entero' && this.colaSemiProduct) {
      targetStockOrders.push({
        semiProduct: { id: this.colaSemiProduct.id },
        facility: { id: this.selectedReception.facilityId },
        totalGrossQuantity: this.mermaLibras, // Representa la cola sin cabeza de ese rechazo
        totalQuantity: this.mermaLibras,
        internalLotNumber: this.selectedReception.lotNumber, // Mismo lote base
        preferredWayOfPayment: 'CASH',
        isPurchaseOrder: false,
        comments: JSON.stringify({ rechazoDeClasificacion: true })
      });
    }

    // 3. Assemble ApiProcessingOrder
    const payload = {
      processingAction: { id: this.classificationAction.id },
      processingDate: new Date().toISOString().split('T')[0],
      inputTransactions: [
        {
          sourceStockOrder: { id: this.selectedReception.coreStockOrderId },
          inputQuantity: this.selectedReception.pesoBruto // Completamente consumido
        }
      ],
      targetStockOrders: targetStockOrders
    };

    this.dataService.submitClassificationOrder(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.showSuccess = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        alert("Ocurrió un error al registrar en el Core: " + err.message);
      }
    });
  }

  cerrarSuccessModal() {
    this.showSuccess = false;
    this.onReceptionChanged(); 
    this.selectedReception = null;
    this.loadMasters(); // Reload to remove the processed reception
  }
}
