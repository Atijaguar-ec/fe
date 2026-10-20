import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpDataService } from '../services/shrimp-data.service';

@Component({
  selector: 'app-masterizado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">📦 Masterizado</h1>
          <p class="page-subtitle">Embalaje de cajetas o fundas en cajas Master para exportación</p>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="step-number">1</span>
            <h2>Stock Empacado Disponible (Cajetas)</h2>
          </div>
          
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Talla</th>
                  <th>Destino</th>
                  <th>Stock (Cajetas)</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of stock">
                  <td><span class="lote-badge">{{ item.lot_suffix }}</span></td>
                  <td>{{ item.size_grade }}</td>
                  <td>{{ item.destination }}</td>
                  <td><strong>{{ item.cajetas_count }}</strong></td>
                  <td>
                    <button class="btn-primary btn-sm" (click)="selectItem(item)" [disabled]="item.cajetas_count < 10">
                      Masterizar
                    </button>
                  </td>
                </tr>
                <tr *ngIf="stock.length === 0">
                  <td colspan="5" class="text-center">No hay stock en cajetas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Masterizado Form -->
        <div class="card animate-fade-in-up" *ngIf="selectedItem">
          <div class="card-header">
            <span class="step-number">2</span>
            <h2>Crear Master</h2>
          </div>
          
          <div class="master-info">
            <p>Empacando Lote: <strong>{{ selectedItem.lot_suffix }}</strong> (Talla {{ selectedItem.size_grade }})</p>
            <p>Stock disponible: <strong>{{ selectedItem.cajetas_count }} cajetas</strong></p>
          </div>

          <div class="master-input-group">
            <div class="form-group">
              <label>Cajetas por Master</label>
              <select class="form-input" [(ngModel)]="cajetasPerMaster" (change)="calcMasters()">
                <option [value]="6">6 cajetas (aprox 12 kg)</option>
                <option [value]="10">10 cajetas (aprox 20 kg)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Cantidad de Masters a crear</label>
              <input type="number" class="form-input" [(ngModel)]="numMasters" (ngModelChange)="calcMasters()" min="1" [max]="maxMasters()">
            </div>
          </div>

          <div class="master-summary" *ngIf="cajetasToConsume > 0">
            <p>Se consumirán: <strong>{{ cajetasToConsume }} / {{ selectedItem.cajetas_count }}</strong> cajetas.</p>
            <p *ngIf="cajetasToConsume > selectedItem.cajetas_count" style="color: red;">
              Error: No hay suficiente stock.
            </p>
          </div>

          <div style="margin-top: 24px; text-align: right;">
            <button class="btn-outline" (click)="selectedItem = null" style="margin-right: 12px;">Cancelar</button>
            <button class="btn-primary" [disabled]="!isValid()" (click)="confirmMaster()">Empacar Masters</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./masterizado.component.css']
})
export class MasterizadoComponent implements OnInit {
  stock: any[] = [];
  selectedItem: any = null;
  
  cajetasPerMaster = 10;
  numMasters = 1;
  cajetasToConsume = 0;

  constructor(private dataService: ShrimpDataService) {}

  ngOnInit() {
    // Only show items that were packed in BLOQUE (discrete boxes)
    const mockDb = (this.dataService as any).mockState;
    this.stock = mockDb.classification_outputs.filter((o: any) => o.destination === 'BLOQUE' && o.cajetas_count > 0);
  }

  selectItem(item: any) {
    this.selectedItem = item;
    this.numMasters = 1;
    this.calcMasters();
  }

  maxMasters() {
    if (!this.selectedItem) return 0;
    return Math.floor(this.selectedItem.cajetas_count / this.cajetasPerMaster);
  }

  calcMasters() {
    this.cajetasToConsume = this.numMasters * this.cajetasPerMaster;
  }

  isValid() {
    return this.numMasters > 0 && 
           this.cajetasToConsume <= (this.selectedItem?.cajetas_count || 0);
  }

  confirmMaster() {
    alert(`Mock API Call:\nSe han generado ${this.numMasters} cajas Master (x${this.cajetasPerMaster} cajetas).\nStock actualizado.`);
    
    // Update local stock map
    this.selectedItem.cajetas_count -= this.cajetasToConsume;
    this.selectedItem = null;
  }
}
