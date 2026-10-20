import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpDataService, ReceptionLot } from '../services/shrimp-data.service';

@Component({
  selector: 'app-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚖️ Liquidación Matemática</h1>
          <p class="page-subtitle">Conciliación de masa y cálculo de mermas por lote de recepción</p>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="step-number">1</span>
            <h2>Seleccionar Lote</h2>
          </div>
          
          <div class="form-group">
            <label>Lote Base (Recepción)</label>
            <select class="form-input" [(ngModel)]="selectedLotId" (change)="onLotChange()">
              <option [value]="null">-- Seleccione --</option>
              <option *ngFor="let lot of baseLots" [value]="lot.id">
                Lote {{ lot.base_lot_number }} ({{ lot.product_type }}) - {{ lot.reception_date | date:'shortDate' }}
              </option>
            </select>
          </div>
        </div>

        <div class="card animate-fade-in-up" *ngIf="selectedLot">
          <div class="card-header">
            <span class="step-number">2</span>
            <h2>Ecuación de Conservación (Libras)</h2>
          </div>
          
          <div class="equation-board">
            <div class="eq-side eq-in">
              <div class="eq-title">ENTRADA (Recepción)</div>
              <div class="eq-value">{{ selectedLot.gross_weight_lbs | number:'1.2-2' }}</div>
              <div class="eq-label">Lbs Brutas Totales</div>
            </div>
            
            <div class="eq-equal">=</div>
            
            <div class="eq-side eq-out">
              <div class="eq-title">SALIDA (Clasificado)</div>
              <div class="eq-value">{{ totalClassifiedLbs | number:'1.2-2' }}</div>
              <div class="eq-label">Σ (Cajetas x 4.4 + IQF Lbs)</div>
            </div>

            <div class="eq-plus">+</div>

            <div class="eq-side eq-shrink" [class.negative]="shrinkage < 0">
              <div class="eq-title">MERMA (Diferencia)</div>
              <div class="eq-value">{{ shrinkage | number:'1.2-2' }}</div>
              <div class="eq-label">{{ shrinkagePercent | percent:'1.1-2' }} del total</div>
            </div>
          </div>
          
          <div *ngIf="outputs.length > 0" class="outputs-list">
            <h3>Detalle de Salidas</h3>
            <ul>
              <li *ngFor="let out of outputs">
                <span class="out-dest">{{ out.destination }}</span>
                <span class="out-talla">Talla: {{ out.size_grade }}</span>
                <strong class="out-lbs">
                  {{ out.destination === 'BLOQUE' ? (out.cajetas_count * 4.4) : out.weight_lbs | number:'1.2-2' }} lbs
                </strong>
                <span *ngIf="out.destination === 'BLOQUE'">({{ out.cajetas_count }} Cjs)</span>
              </li>
            </ul>
          </div>
          
          <div class="actions">
            <!-- Simulated mathematical validation using the Eval principles -->
            <button class="btn-primary" (click)="closeEquation()">Confirmar Cierre y Liquidar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./liquidacion.component.css']
})
export class LiquidacionComponent implements OnInit {
  baseLots: ReceptionLot[] = [];
  outputs: any[] = [];
  
  selectedLotId: string | null = null;
  selectedLot: ReceptionLot | null = null;
  
  totalClassifiedLbs = 0;
  shrinkage = 0;
  shrinkagePercent = 0;

  constructor(private dataService: ShrimpDataService) {}

  ngOnInit() {
    this.dataService.getReceptionLots().subscribe(lots => {
      this.baseLots = lots;
    });
  }

  onLotChange() {
    this.selectedLot = this.baseLots.find(l => l.id === this.selectedLotId) || null;
    if (this.selectedLot) {
      // Fetch outputs for this lot from the mock
      const mockDb = (this.dataService as any).mockState;
      this.outputs = mockDb.classification_outputs.filter((o: any) => o.reception_lot_id === this.selectedLotId);
      this.calculateMath();
    }
  }

  calculateMath() {
    if (!this.selectedLot) return;
    
    // Convert cajetas (average block = 2kg = 4.4lbs) + regular LBS
    this.totalClassifiedLbs = this.outputs.reduce((acc, out) => {
      if (out.destination === 'BLOQUE') {
         return acc + (out.cajetas_count * 4.4); // Standard approximation for math eval
      }
      return acc + out.weight_lbs;
    }, 0);
    
    this.shrinkage = this.selectedLot.gross_weight_lbs - this.totalClassifiedLbs;
    this.shrinkagePercent = this.shrinkage / this.selectedLot.gross_weight_lbs;
  }
  
  closeEquation() {
    alert(`Balance Cerrado.\nLote: ${this.selectedLot?.base_lot_number}\nEntrada: ${this.selectedLot?.gross_weight_lbs}\nSalida: ${this.totalClassifiedLbs}\nMerma: ${this.shrinkage}`);
    this.selectedLotId = null;
    this.selectedLot = null;
  }
}
