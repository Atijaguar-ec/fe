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
    weightPerUnit: null as number | null,
    unitLabel: 'cajeta'
  };
  saving = false;
  errorMsg = '';
  successMsg = '';

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
    this.form = { brandName: '', destino: this.activeTab, name: '', productType: 'COLA', style: 'SHELLON', presentationFormat: '', weightPerUnit: null, unitLabel: 'cajeta' };
    this.onDestinoChange();
    this.errorMsg = '';
    this.showModal = true;
  }

  openEdit(p: CommercialPresentation): void {
    this.editingId = p.id;
    const isEntero = p.style === 'HEADON';
    this.form = {
      brandName: p.brandName,
      destino: p.destino,
      name: p.name,
      productType: isEntero ? 'ENTERO' : 'COLA',
      style: p.style || (isEntero ? 'HEADON' : 'SHELLON'),
      presentationFormat: p.presentationFormat || '',
      weightPerUnit: p.weightPerUnit,
      unitLabel: p.unitLabel
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
  }

  onProductTypeChange(): void {
    if (this.form.productType === 'ENTERO') {
      this.form.style = 'HEADON';
    } else {
      this.form.style = 'SHELLON';
    }
  }

  save(): void {
    if (!this.COMPANY_ID || !this.form.brandName || !this.form.name || !this.form.weightPerUnit) {
      this.errorMsg = 'Completa todos los campos obligatorios';
      return;
    }
    this.saving = true;
    this.errorMsg = '';

    const payload: any = {
      ...this.form,
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
