import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, CommercialPresentation } from '../services/shrimp-ms.service';
import { ShrimpDataService } from '../services/shrimp-data.service';

@Component({
  selector: 'app-masterizado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './masterizado.component.html',
  styleUrls: ['./masterizado.component.css']
})
export class MasterizadoComponent implements OnInit {
  COMPANY_ID: number | null = null;
  receptions: any[] = [];
  selectedLotId: number | null = null;
  selectedLot: any = null;

  // Master form
  shrimpSize = '26/30';
  freezeType = 'BLOQUE';
  numMasters = 1;

  presentations: CommercialPresentation[] = [];
  filteredPresentations: CommercialPresentation[] = [];
  selectedPresentation: CommercialPresentation | null = null;

  saving = false;
  errorMsg = '';
  successMsg = '';
  createdMasters: any[] = [];

  constructor(
    private shrimpMs: ShrimpMsService,
    private dataService: ShrimpDataService
  ) {}

  ngOnInit() {
    this.shrimpMs.listReceptions().subscribe(lots => {
      this.receptions = lots.filter(l => l.status !== 'CLOSED');
    });

    this.dataService.getActiveCompany().subscribe(company => {
      const companyIds = company?.data?.companyIds || company?.companyIds || [];
      this.COMPANY_ID = companyIds.length > 0 ? companyIds[0] : null;
      if (this.COMPANY_ID) {
        this.loadPresentations();
      }
    });
  }

  loadPresentations() {
    if (!this.COMPANY_ID) return;
    this.shrimpMs.listPresentations(this.COMPANY_ID).subscribe(list => {
      this.presentations = list;
      this.filterPresentations();
    });
  }

  onLotChange() {
    this.selectedLot = this.receptions.find(r => r.stockOrderId == this.selectedLotId) || null;
    this.createdMasters = [];
    this.errorMsg = '';
    this.successMsg = '';
  }

  onFreezeTypeChange() {
    this.filterPresentations();
  }

  filterPresentations() {
    this.filteredPresentations = this.presentations.filter(p => p.destino === this.freezeType);
    if (!this.filteredPresentations.includes(this.selectedPresentation as any)) {
      this.selectedPresentation = null;
    }
  }

  isValid() {
    return this.selectedPresentation && this.shrimpSize && this.numMasters > 0 && this.selectedLot;
  }

  createMasters() {
    if (!this.isValid() || !this.selectedPresentation) return;
    this.saving = true;
    this.errorMsg = '';

    // We need a processingLotId — for now create a processing lot, then master cartons
    // In production this would be linked to an existing processing lot
    this.shrimpMs.createProcessingLot({
      outputMasters: this.numMasters,
      status: 'PROCESSING'
    }).subscribe({
      next: (lot) => {
        // Create each master carton
        let completed = 0;
        for (let i = 0; i < this.numMasters; i++) {
          this.shrimpMs.createMasterCarton({
            processingLotId: lot.id,
            brand: this.selectedPresentation!.brandName,
            shrimpSize: this.shrimpSize,
            presentation: this.selectedPresentation!.name,
            freezeType: this.freezeType,
            grossWeightLbs: this.selectedPresentation!.weightPerUnit
          }).subscribe({
            next: (mc) => {
              this.createdMasters.push(mc);
              completed++;
              if (completed === this.numMasters) {
                this.successMsg = `${this.numMasters} masters creados (${this.selectedPresentation!.brandName} / ${this.shrimpSize})`;
                this.saving = false;
              }
            },
            error: (err) => {
              this.errorMsg = err?.error?.errorMessage || 'Error al crear master';
              this.saving = false;
            }
          });
        }
      },
      error: (err) => {
        this.errorMsg = err?.error?.errorMessage || 'Error al crear lote de proceso';
        this.saving = false;
      }
    });
  }
}
