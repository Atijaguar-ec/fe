import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService } from '../services/shrimp-ms.service';

@Component({
  selector: 'app-masterizado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './masterizado.component.html',
  styleUrls: ['./masterizado.component.css']
})
export class MasterizadoComponent implements OnInit {
  receptions: any[] = [];
  selectedLotId: number | null = null;
  selectedLot: any = null;

  // Master form
  brand = '';
  shrimpSize = '26/30';
  presentation = '2lb box';
  freezeType = 'BLOQUE';
  grossWeightLbs = 0;
  numMasters = 1;

  saving = false;
  errorMsg = '';
  successMsg = '';
  createdMasters: any[] = [];

  constructor(private shrimpMs: ShrimpMsService) {}

  ngOnInit() {
    this.shrimpMs.listReceptions().subscribe(lots => {
      this.receptions = lots.filter(l => l.status !== 'CLOSED');
    });
  }

  onLotChange() {
    this.selectedLot = this.receptions.find(r => r.stockOrderId == this.selectedLotId) || null;
    this.createdMasters = [];
    this.errorMsg = '';
    this.successMsg = '';
  }

  isValid() {
    return this.brand && this.shrimpSize && this.grossWeightLbs > 0 && this.numMasters > 0 && this.selectedLot;
  }

  createMasters() {
    if (!this.isValid()) return;
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
            brand: this.brand,
            shrimpSize: this.shrimpSize,
            presentation: this.presentation,
            freezeType: this.freezeType,
            grossWeightLbs: this.grossWeightLbs
          }).subscribe({
            next: (mc) => {
              this.createdMasters.push(mc);
              completed++;
              if (completed === this.numMasters) {
                this.successMsg = `${this.numMasters} masters creados (${this.brand} / ${this.shrimpSize})`;
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
