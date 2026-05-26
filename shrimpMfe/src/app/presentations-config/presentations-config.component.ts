import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, CommercialPresentation } from '../services/shrimp-ms.service';
import { ShrimpDataService } from '../services/shrimp-data.service';

interface GroupedBrand {
  brandName: string;
  presentations: CommercialPresentation[];
}

@Component({
  selector: 'app-presentations-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presentations-config.component.html',
  styleUrls: ['./presentations-config.component.css']
})
export class PresentationsConfigComponent implements OnInit {

  COMPANY_ID: number | null = null;
  allPresentations: CommercialPresentation[] = [];

  activeTab: string = 'BLOQUE';

  get currentDestinoBrands(): GroupedBrand[] {
    const map = new Map<string, CommercialPresentation[]>();
    const filtered = this.allPresentations.filter(p => p.destino === this.activeTab);
    
    for (const p of filtered) {
      const existing = map.get(p.brandName) || [];
      existing.push(p);
      map.set(p.brandName, existing);
    }
    
    return Array.from(map.entries())
      .map(([brandName, presentations]) => ({ brandName, presentations }))
      .sort((a, b) => a.brandName.localeCompare(b.brandName));
  }

  // ─── Modal State ──────────────────────────────────────
  showModal = false;
  editingId: string | null = null;
  form = {
    brandName: '',
    destino: 'BLOQUE',
    name: '',
    productType: 'COLA',
    style: 'SHELLON',
    presentationFormat: '',
    glazes: '', // Virtual field for IQF glazes
    formats: '', // Virtual field for Bloque formats
    weightPerUnit: null as number | null,
    unitLabel: 'cajeta',
    blocksOnly: false
  };
  saving = false;
  errorMsg = '';
  successMsg = '';

  // ─── Tag/Chip arrays (managed as arrays, serialized to JSON on save) ──
  formatTags: string[] = [];    // BLOQUE: e.g. ['10x4', '5x4', '10x2']
  glazeTags: string[] = [];     // IQF:    e.g. ['10%', '15%', '20%']
  newFormatInput = '';
  newGlazeInput = '';

  readonly destinos = [
    { key: 'BLOQUE',          label: 'Bloque',        defaultUnit: 'cajeta' },
    { key: 'IQF',             label: 'IQF',           defaultUnit: 'funda' },
    { key: 'SALMUERA',        label: 'Salmuera',      defaultUnit: 'cartón' },
    { key: 'VALOR_AGREGADO',  label: 'Valor Agregado', defaultUnit: 'unidad' },
  ];

  readonly destinoIcons: Record<string, string> = {
    BLOQUE: '🧊', IQF: '❄️', SALMUERA: '🧂', VALOR_AGREGADO: '⭐'
  };

  constructor(
    private shrimpMs: ShrimpMsService,
    private dataService: ShrimpDataService
  ) {}

  ngOnInit(): void {
    this.dataService.getActiveCompany().subscribe(company => {
      const companyIds = company?.data?.companyIds || company?.companyIds || [];
      this.COMPANY_ID = companyIds.length > 0 ? companyIds[0] : null;
      if (this.COMPANY_ID) this.loadPresentations();
    });
  }

  loadPresentations(): void {
    if (!this.COMPANY_ID) return;
    this.shrimpMs.listPresentations(this.COMPANY_ID).subscribe(list => {
      this.allPresentations = list;
    });
  }

  get allBrandNames(): string[] {
    return Array.from(new Set(this.allPresentations.map(p => p.brandName))).sort();
  }

  // ─── Modal ────────────────────────────────────────────

  openNew(): void {
    this.editingId = null;
    this.form = { brandName: '', destino: this.activeTab, name: '', productType: 'COLA', style: 'SHELLON', presentationFormat: '', glazes: '', formats: '', weightPerUnit: null, unitLabel: 'cajeta', blocksOnly: false };
    this.formatTags = [];
    this.glazeTags = [];
    this.newFormatInput = '';
    this.newGlazeInput = '';
    this.onDestinoChange();
    this.errorMsg = '';
    this.showModal = true;
  }

  openEdit(p: CommercialPresentation): void {
    this.editingId = p.id;
    const isEntero = p.style === 'HEADON';

    // Parse BLOQUE formats from JSON array
    this.formatTags = [];
    this.glazeTags = [];
    this.newFormatInput = '';
    this.newGlazeInput = '';

    let formats = p.presentationFormat || '';
    if (formats.startsWith('[')) {
      try { this.formatTags = JSON.parse(formats); } catch {}
    } else if (formats) {
      this.formatTags = formats.split(',').map(s => s.trim()).filter(s => s);
    }

    let styleVal = p.style || '';
    if (p.destino === 'IQF' && styleVal.startsWith('[')) {
      try { this.glazeTags = JSON.parse(styleVal); } catch {}
      styleVal = '';
    }

    this.form = {
      brandName: p.brandName,
      destino: p.destino,
      name: p.name,
      productType: isEntero ? 'ENTERO' : 'COLA',
      style: styleVal,
      presentationFormat: p.presentationFormat || '',
      formats: '',
      glazes: '',
      weightPerUnit: p.weightPerUnit,
      unitLabel: p.unitLabel,
      blocksOnly: p.blocksOnly ?? false
    };
    this.errorMsg = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  onDestinoChange(): void {
    const match = this.destinos.find(d => d.key === this.form.destino);
    if (match) this.form.unitLabel = match.defaultUnit;
    // Clear tag arrays when switching destino
    this.formatTags = [];
    this.glazeTags = [];
    this.newFormatInput = '';
    this.newGlazeInput = '';
  }

  onProductTypeChange(): void {
    if (this.form.productType === 'ENTERO') {
      this.form.style = 'HEADON';
    } else {
      this.form.style = 'SHELLON';
    }
  }

  // ─── Format Tag Management ────────────────────────────

  addFormat(): void {
    const val = this.newFormatInput.trim().toUpperCase();
    if (!val) return;
    if (!this.formatTags.includes(val)) {
      this.formatTags.push(val);
    }
    this.newFormatInput = '';
  }

  addFormatOnEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addFormat();
    }
  }

  removeFormat(tag: string): void {
    this.formatTags = this.formatTags.filter(t => t !== tag);
  }

  // ─── Glaze Tag Management ─────────────────────────────

  addGlaze(): void {
    let val = this.newGlazeInput.trim();
    if (!val) return;
    // Auto-add % if missing
    if (!val.endsWith('%')) val = val + '%';
    if (!this.glazeTags.includes(val)) {
      this.glazeTags.push(val);
    }
    this.newGlazeInput = '';
  }

  addGlazeOnEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addGlaze();
    }
  }

  removeGlaze(tag: string): void {
    this.glazeTags = this.glazeTags.filter(t => t !== tag);
  }

  save(): void {
    if (!this.COMPANY_ID || !this.form.brandName || !this.form.name || !this.form.weightPerUnit) {
      this.errorMsg = 'Completa todos los campos obligatorios';
      return;
    }
    this.saving = true;
    this.errorMsg = '';

    // Convert formatTags to JSON array
    let finalFormat = this.form.presentationFormat;
    if (this.form.destino === 'BLOQUE') {
      finalFormat = this.formatTags.length > 0 ? JSON.stringify(this.formatTags) : '';
    }

    // Convert glazeTags to JSON array for IQF
    let finalStyle = this.form.style;
    if (this.form.destino === 'IQF') {
      finalStyle = this.glazeTags.length > 0 ? JSON.stringify(this.glazeTags) : this.form.style;
    }

    const payload: any = {
      ...this.form,
      presentationFormat: finalFormat,
      style: finalStyle,
      companyId: this.COMPANY_ID
    };

    const obs = this.editingId
      ? this.shrimpMs.updatePresentation(this.editingId, payload)
      : this.shrimpMs.createPresentation(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.successMsg = this.editingId ? 'Presentación actualizada' : 'Presentación creada';
        this.loadPresentations();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.error?.errorMessage || 'Error al guardar';
      }
    });
  }

  remove(p: CommercialPresentation): void {
    if (!confirm(`¿Eliminar "${p.brandName} — ${p.name}"?`)) return;
    this.shrimpMs.deletePresentation(p.id).subscribe({
      next: () => {
        this.successMsg = 'Presentación eliminada';
        this.loadPresentations();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => this.errorMsg = 'Error al eliminar'
    });
  }
}
