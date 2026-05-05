import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService } from '../services/shrimp-ms.service';
import { ShrimpDataService, ShrimpFacility } from '../services/shrimp-data.service';

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './destinos.component.html',
  styleUrls: ['./destinos.component.css']
})
export class DestinosComponent implements OnInit {
  receptions: any[] = [];
  classificationDetails: any[] = [];
  selectedLotId: number | null = null;
  selectedLot: any = null;
  loading = false;
  saving = false;
  errorMsg = '';
  successMsg = '';
  totalAllocated = 0;
  allocationPct = 0;

  constructor(private shrimpMs: ShrimpMsService, private dataService: ShrimpDataService) {}

  ngOnInit() {
    this.shrimpMs.listReceptions().subscribe(lots => {
      this.receptions = lots.filter(l => l.status !== 'CLOSED');
    });
  }

  onLotChange() {
    this.classificationDetails = [];
    this.errorMsg = '';
    this.successMsg = '';
    this.totalAllocated = 0;
    this.selectedLot = this.receptions.find(r => r.stockOrderId == this.selectedLotId) || null;
    if (!this.selectedLotId) return;
    this.loading = true;
    this.shrimpMs.getClassificationsByLot(this.selectedLotId).subscribe({
      next: (classifications) => {
        this.classificationDetails = classifications.map((c: any) => ({
          id: c.id, classificationId: c.id, shrimpSize: '26/30', weightLbs: 0, cajetasCount: 0,
          _destinationType: 'BLOQUE', _assigned: false
        }));
        this.loading = false;
      },
      error: () => { this.errorMsg = 'Error'; this.loading = false; }
    });
  }

  assignDestination(detail: any) {
    this.saving = true;
    this.shrimpMs.createDestination({
      classificationDetailId: detail.id, destinationType: detail._destinationType, allocatedWeightLbs: detail.weightLbs
    }).subscribe({
      next: (dest) => {
        detail._assigned = true;
        this.totalAllocated += detail.weightLbs;
        this.allocationPct = this.selectedLot ? (this.totalAllocated / this.selectedLot.totalWeightLbs) * 100 : 0;
        this.successMsg = `Destino ${detail._destinationType} asignado (sufijo: ${dest.lotSuffix || 'ninguno'})`;
        this.saving = false;
      },
      error: (err) => { this.errorMsg = err?.error?.errorMessage || 'Error'; this.saving = false; }
    });
  }
}
