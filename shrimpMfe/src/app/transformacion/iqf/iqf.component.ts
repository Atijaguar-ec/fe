import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, TransformWorkItem, CommercialPresentation } from '../../services/shrimp-ms.service';
import { PresentationSelectorModalComponent } from '../../shared/components/presentation-selector-modal/presentation-selector-modal.component';
import { ShrimpDataService } from '../../services/shrimp-data.service';

interface FormatOption {
  label: string;
  unidadesPorMaster: number;
  lbsPorUnidad: number;
  pesoPerMaster: number;
}

/**
 * IQF transformation module (Lote base -2).
 */
@Component({
  selector: 'app-iqf',
  standalone: true,
  imports: [CommonModule, FormsModule, PresentationSelectorModalComponent],
  styleUrls: ['../shared/transform.styles.css'],
  template: `
<div class="transform-page">
  <div class="transform-header">
    <div>
      <h1>❄️ IQF — Transformación</h1>
      <p>Lote base <strong>-2</strong> · Gavetas pesadas → Fundas → Cartones máster</p>
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
          <div class="empty-state__text">Sin sub-lotes IQF pendientes</div>
        </div>
        <div class="work-queue" *ngIf="workItems.length > 0">
          <div class="work-item" *ngFor="let item of workItems"
               [style.border-left-color]="selectedItem?.subLotId === item.subLotId ? '#0d9488' : ''"
               (click)="selectedItem = item" style="cursor:pointer">
            <div class="work-item__info">
              <div class="work-item__lote">{{ item.lote }}-2
                <span class="badge badge-teal" style="margin-left:4px">{{ item.talla.displayName }}</span>
              </div>
              <div class="work-item__detail">{{ item.cantidad }} gavetas · Clase {{ item.qualityClass }}</div>
            </div>
            <div class="work-item__lbs" *ngIf="item.libras">{{ item.libras | number:'1.0-1' }} lbs</div>
          </div>
        </div>
      </div>

      <div class="transform-card" style="margin-top:1rem" *ngIf="selectedItem">
        <div class="transform-card-header">
          <h2>➕ Crear Master IQF — {{ selectedItem.talla.displayName }}</h2>
        </div>
        <div class="input-row-2">
          <div class="input-group">
            <label class="input-label">Presentación Comercial</label>
            <div class="presentation-selector-box" *ngIf="selectedPresentation">
              <div class="presentation-info">
                <strong>{{ selectedPresentation.brandName }}</strong> — {{ selectedPresentation.style || '-' }}
                <br>
                <span class="text-gray-600">{{ selectedPresentation.name }} ({{ selectedPresentation.presentationFormat || '-' }})</span>
              </div>
              <button class="btn btn-outline-secondary btn-sm" (click)="openPresentationModal()">Cambiar</button>
            </div>
            <button class="btn btn-outline-primary w-full" *ngIf="!selectedPresentation" (click)="openPresentationModal()">
              🔍 Buscar Presentación
            </button>
          </div>
          <div class="input-group">
            <label class="input-label">N° de Masters</label>
            <input type="number" class="input-field" [(ngModel)]="mastersCount" (ngModelChange)="recalcular()" min="1" placeholder="Ej: 20">
          </div>
        </div>

        <!-- Formato de Presentación -->
        <div class="input-group" style="margin-bottom: 1rem; margin-top: 1rem;" *ngIf="selectedPresentation">
          <label class="input-label">Formato de Presentación <span style="color: #ef4444;">*</span></label>
          <div *ngIf="availableFormats.length === 0" class="alert alert-warning" style="padding: 0.6rem; font-size: 0.85rem; background: #fef3c7; border-left: 4px solid #f59e0b; margin-top: 0;">
            ⚠️ No hay formatos configurados para {{ selectedPresentation.brandName }}.
          </div>
          <div class="format-grid" *ngIf="availableFormats.length > 0">
            <button *ngFor="let fmt of availableFormats"
                    class="format-btn"
                    [class.format-btn--active]="selectedFormat?.label === fmt.label"
                    (click)="onFormatSelected(fmt)">
              <span class="format-btn__label">{{ fmt.label }}</span>
              <span class="format-btn__detail">{{ fmt.unidadesPorMaster }} {{ selectedPresentation.unitLabel || 'funda' }}{{ fmt.unidadesPorMaster !== 1 ? 's' : '' }}</span>
              <span class="format-btn__weight">{{ fmt.lbsPorUnidad }} lbs/{{ selectedPresentation.unitLabel || 'funda' }} · <strong>{{ fmt.pesoPerMaster }} lbs/master</strong></span>
            </button>
          </div>
        </div>

        <!-- Opciones de Glaseado -->
        <div class="input-group" *ngIf="selectedPresentation && glazeOptions.length > 0" style="margin-bottom: 1rem;">
          <label class="input-label">% de Glaseado <span style="color: #ef4444;">*</span></label>
          <div class="format-grid">
            <button *ngFor="let glaze of glazeOptions"
                    class="format-btn format-btn--sm"
                    [class.format-btn--active]="selectedGlaze === glaze"
                    (click)="selectedGlaze = glaze">
              <span class="format-btn__label">{{ glaze }}</span>
            </button>
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Peso Total Masters (lbs)</label>
          <input type="number" class="input-field" [(ngModel)]="mastersTotalLbs" step="0.01" placeholder="Peso neto total en cartones">
          <div class="alert alert-danger" style="margin-top:0.4rem"
               *ngIf="selectedItem.libras && mastersTotalLbs > selectedItem.libras">
            ⚠️ El peso supera las lbs recibidas ({{ selectedItem.libras | number:'1.0-1' }} lbs)
          </div>
        </div>
        <button class="btn btn-primary"
                [disabled]="!mastersCount || mastersCount <= 0 || !selectedPresentation || !mastersTotalLbs || (glazeOptions.length > 0 && !selectedGlaze) || !selectedFormat"
                (click)="registrarMaster()">✅ Registrar Master</button>
      </div>
    </div>

    <div class="transform-card transform-balance-card">
      <div class="transform-card-header">
        <h2>⚖️ Liquidación IQF</h2>
        <span class="badge badge-info">-2</span>
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
          <strong [class.yield-value--green]="areaYield >= 85" [class.yield-value--yellow]="areaYield >= 70 && areaYield < 85" [class.yield-value--red]="areaYield < 70">{{ areaYield | number:'1.1-1' }}%</strong>
        </div>
        <div class="yield-bar">
          <div class="yield-fill" [style.width.%]="areaYield > 100 ? 100 : areaYield"
               [class.yield-fill--green]="areaYield >= 85" [class.yield-fill--yellow]="areaYield >= 70 && areaYield < 85" [class.yield-fill--red]="areaYield < 70"></div>
        </div>
      </div>
      <div style="margin-top:1rem">
        <div class="input-label" style="margin-bottom:0.5rem">Masters IQF Registrados</div>
        <div class="master-list">
          <div class="master-item" *ngFor="let m of masters">
            <div><div class="master-item__label">{{ m.count }} mst · {{ m.presentacion }}</div><div class="master-item__detail">{{ m.talla }} <span *ngIf="m.glaze">· {{ m.glaze }}</span></div></div>
            <strong style="color:#16a34a;font-family:monospace">{{ m.lbs | number:'1.0-1' }} lbs</strong>
          </div>
        </div>
        <div class="empty-state" *ngIf="masters.length === 0" style="padding:1.5rem">
          <div class="empty-state__hint">Sin masters registrados aún</div>
        </div>
      </div>
    </div>
  </div>
  <app-presentation-selector-modal
    [destino]="'IQF'"
    [isVisible]="isPresentationModalOpen"
    (onSelect)="onPresentationSelected($event)"
    (onClose)="closePresentationModal()">
  </app-presentation-selector-modal>
</div>
  `
})
export class IqfComponent implements OnInit {
  workItems: TransformWorkItem[] = [];
  allPresentations: CommercialPresentation[] = [];
  availableFormats: FormatOption[] = [];
  selectedPresentation: CommercialPresentation | null = null;
  selectedFormat: FormatOption | null = null;
  masters: { count: number; lbs: number; presentacion: string; talla: string; glaze?: string }[] = [];
  selectedItem: TransformWorkItem | null = null;
  mastersCount = 0;
  mastersTotalLbs = 0;
  COMPANY_ID = 1;
  isPresentationModalOpen = false;

  glazeOptions: string[] = [];
  selectedGlaze: string | null = null;

  constructor(
    private shrimpMs: ShrimpMsService,
    private dataService: ShrimpDataService
  ) {}

  ngOnInit(): void {
    this.dataService.getActiveCompany().subscribe(company => {
      const companyIds = company?.data?.companyIds || company?.companyIds || [];
      this.COMPANY_ID = companyIds.length > 0 ? companyIds[0] : 1;
      this.loadPresentations();
    });
    this.loadWorkItems();
  }

  loadPresentations(): void {
    if (!this.COMPANY_ID) return;
    this.shrimpMs.listPresentations(this.COMPANY_ID, 'IQF').subscribe(list => {
      this.allPresentations = list.filter(p => p.isActive !== false);
    });
  }

  loadWorkItems(): void {
    this.shrimpMs.listPendingSubLots('IQF').subscribe(items => this.workItems = items);
  }

  openPresentationModal(): void {
    this.isPresentationModalOpen = true;
  }

  onPresentationSelected(p: CommercialPresentation): void {
    this.selectedPresentation = p;
    this.selectedFormat = null;
    this.isPresentationModalOpen = false;
    
    this.glazeOptions = [];
    this.selectedGlaze = null;
    if (p.style && p.style.startsWith('[')) {
      try {
        this.glazeOptions = JSON.parse(p.style);
      } catch(e) {}
    }

    const brandName = p.brandName || '';
    const style = p.style || '';
    const name = p.name || '';

    const matches = this.allPresentations.filter(pres => 
      (pres.brandName || '') === brandName && (pres.style || '') === style && (pres.name || '') === name
    );

    this.availableFormats = [];
    for (const pres of matches) {
      const formats = this.parseFormatsList(pres.presentationFormat, pres.weightPerUnit);
      this.availableFormats.push(...formats);
    }

    if (this.availableFormats.length === 1) {
      this.onFormatSelected(this.availableFormats[0]);
    } else {
      this.recalcular();
    }
  }

  onFormatSelected(fmt: FormatOption): void {
    this.selectedFormat = fmt;
    this.recalcular();
  }

  closePresentationModal(): void {
    this.isPresentationModalOpen = false;
  }

  parseFormatsList(formatStr: string | undefined, weightPerUnit: number): FormatOption[] {
    if (!formatStr) return [];
    let rawFormats: string[];
    if (formatStr.startsWith('[')) {
      try {
        rawFormats = JSON.parse(formatStr);
      } catch {
        rawFormats = [formatStr];
      }
    } else {
      rawFormats = [formatStr];
    }
    
    return rawFormats
      .filter(f => f && f.trim())
      .map(f => {
        const label = f.trim();
        const match = label.match(/^(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
        const unidades = match ? parseInt(match[1], 10) : 1;
        const lbs = match ? parseFloat(match[2]) : weightPerUnit;
        return {
          label,
          unidadesPorMaster: unidades,
          lbsPorUnidad: lbs,
          pesoPerMaster: unidades * lbs
        };
      });
  }

  recalcular(): void {
    if (this.selectedFormat && this.mastersCount > 0) {
      this.mastersTotalLbs = parseFloat((this.mastersCount * this.selectedFormat.pesoPerMaster).toFixed(2));
    }
  }

  resetForm(): void {
    this.selectedPresentation = null;
    this.selectedFormat = null;
    this.availableFormats = [];
    this.mastersCount = 0;
    this.mastersTotalLbs = 0;
    this.glazeOptions = [];
    this.selectedGlaze = null;
  }

  registrarMaster(): void {
    if (!this.selectedItem || !this.selectedPresentation || this.mastersCount <= 0) return;
    this.masters.push({ 
      count: this.mastersCount, 
      lbs: this.mastersTotalLbs, 
      presentacion: `${this.selectedPresentation.brandName} ${this.selectedPresentation.name}${this.selectedFormat ? ' (' + this.selectedFormat.label + ')' : ''}`, 
      talla: this.selectedItem.talla.displayName,
      glaze: this.selectedGlaze || undefined
    });
    this.selectedItem = null;
    this.resetForm();
  }

  get totalReceivedLbs(): number { return this.workItems.filter(w => w.libras).reduce((s, w) => s + (w.libras ?? 0), 0); }
  get totalMasterWt(): number { return this.masters.reduce((s, m) => s + m.lbs, 0); }
  get areaShrinkage(): number { return this.totalReceivedLbs - this.totalMasterWt; }
  get areaYield(): number { return this.totalReceivedLbs <= 0 ? 0 : (this.totalMasterWt / this.totalReceivedLbs) * 100; }
}
