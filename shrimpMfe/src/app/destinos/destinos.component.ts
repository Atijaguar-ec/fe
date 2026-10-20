import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShrimpDataService, ShrimpFacility } from '../services/shrimp-data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">🚚 Destinos y Transferencias</h1>
          <p class="page-subtitle">Autorización de flujo físico entre áreas de proceso</p>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="step-number">1</span>
            <h2>Lotes Pendientes por Enviar</h2>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Lote Base</th>
                  <th>Talla</th>
                  <th>Destino Asignado</th>
                  <th>Lbs</th>
                  <th>Cajetas</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of pendingOutputs">
                  <td><span class="lote-badge">{{ item.lot_suffix || item.reception_lot_id }}</span></td>
                  <td>{{ item.size_grade }}</td>
                  <td><span class="status-badge" [ngClass]="item.destination.toLowerCase()">{{ item.destination }}</span></td>
                  <td>{{ item.weight_lbs | number:'1.2-2' }}</td>
                  <td>{{ item.cajetas_count }}</td>
                  <td>
                    <button class="btn-primary" (click)="selectItem(item)">Mover</button>
                  </td>
                </tr>
                <tr *ngIf="pendingOutputs.length === 0">
                  <td colspan="6" class="text-center">No hay producto pendiente.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card" *ngIf="selectedItem">
          <div class="card-header">
            <span class="step-number">2</span>
            <h2>Confirmar Transferencia Física</h2>
          </div>
          <p>Moviendo: <strong>Lote {{ selectedItem.lot_suffix }}</strong> ({{ selectedItem.size_grade }})</p>
          
          <div class="form-group" style="margin-top: 20px;">
            <label>Instalación Destino (Desde el Backend Core)</label>
            <select class="form-input" [(ngModel)]="selectedFacilityId">
              <option [value]="null">-- Seleccione --</option>
              <option *ngFor="let f of facilities" [value]="f.id">
                {{ f.name }}
              </option>
            </select>
          </div>

          <div style="margin-top: 24px; text-align: right;">
             <button class="btn-outline" (click)="selectedItem = null" style="margin-right: 12px;">Cancelar</button>
             <button class="btn-primary" [disabled]="!selectedFacilityId" (click)="confirmTransfer()">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./destinos.component.css']
})
export class DestinosComponent implements OnInit {
  pendingOutputs: any[] = [];
  facilities: ShrimpFacility[] = [];
  
  selectedItem: any = null;
  selectedFacilityId: number | null = null;

  constructor(private dataService: ShrimpDataService) {}

  ngOnInit() {
    this.loadPendingOutputs();
    this.loadLiveFacilities();
  }

  loadPendingOutputs() {
    // This is using local mock data from ShrimpDataService
    const mockDb = (this.dataService as any).mockState;
    this.pendingOutputs = mockDb.classification_outputs || [];
  }

  loadLiveFacilities() {
    // Uses the LIVE /api/ endpoints to get real facility list
    this.dataService.getActiveCompany().subscribe(company => {
      if (company && company.id) {
        this.dataService.getFacilities(company.id).subscribe(facs => {
          this.facilities = facs;
        });
      }
    });
  }

  selectItem(item: any) {
    this.selectedItem = item;
    // Auto-select based on destination logic
    if (this.facilities.length > 0) {
      if (item.destination === 'IQF') {
        const tunel = this.facilities.find(f => f.name.includes('IQF'));
        if (tunel) this.selectedFacilityId = tunel.id;
      } else {
        const camara = this.facilities.find(f => f.name.includes('Cámara'));
        if (camara) this.selectedFacilityId = camara.id;
      }
    }
  }

  confirmTransfer() {
    const facilityName = this.facilities.find(f => f.id == this.selectedFacilityId)?.name;
    alert(`MocK API Call: \nTransferencia de Lote ${this.selectedItem.lot_suffix} \nHacia: ${facilityName} exitosa.`);
    this.pendingOutputs = this.pendingOutputs.filter(p => p.id !== this.selectedItem.id);
    this.selectedItem = null;
  }
}
