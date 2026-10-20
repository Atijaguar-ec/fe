import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpDataService, ReceptionLot } from '../services/shrimp-data.service';

@Component({
  selector: 'app-rechazo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚠️ Recuperación y Rechazo</h1>
          <p class="page-subtitle">Transformación cíclica de producto Entero a Cola</p>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <span class="step-number">1</span>
            <h2>Lote Base a Procesar</h2>
          </div>
          <p class="helper-text">Seleccione un lote recibido como <strong>ENTERO</strong> que requiere descabezado por baja calidad visual.</p>
          
          <div class="form-group" style="margin-top: 15px;">
            <select class="form-input" [(ngModel)]="selectedLotId" (change)="onLotChange()">
              <option [value]="null">-- Seleccione --</option>
              <option *ngFor="let lot of eligibleLots" [value]="lot.id">
                Lote {{ lot.base_lot_number }} ({{ lot.gross_weight_lbs | number:'1.2-2' }} lbs)
              </option>
            </select>
          </div>
        </div>

        <!-- Recuperacion form -->
        <div class="card animate-fade-in-up" *ngIf="selectedLot">
          <div class="card-header">
            <span class="step-number">2</span>
            <h2>Registro de Conversión (Cola)</h2>
          </div>
          
          <div class="conversion-panel">
            <div class="conv-input">
              <label>Libras de Entero a sacar</label>
              <input type="number" class="form-input" [(ngModel)]="inputLbs" (ngModelChange)="calcShrinkage()" placeholder="Ej. 500">
            </div>
            
            <div class="conv-arrow">➡️</div>
            
            <div class="conv-output">
              <label>Libras de Cola recuperada</label>
              <input type="number" class="form-input" [(ngModel)]="outputLbs" (ngModelChange)="calcShrinkage()" placeholder="Ej. 320">
            </div>
          </div>
          
          <div class="shrinkage-indicator" *ngIf="shrinkage !== null">
            Merma por cabezas: <strong>{{ shrinkage | number:'1.2-2' }} lbs</strong> 
            <span class="shrinkage-pct" *ngIf="inputLbs > 0">({{ (shrinkage / inputLbs) | percent:'1.1-2' }})</span>
          </div>

          <div style="margin-top: 30px; text-align: right;">
            <button class="btn-primary" [disabled]="!isValid()" (click)="confirmRecovery()">Confirmar Recuperación</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./rechazo.component.css']
})
export class RechazoComponent implements OnInit {
  eligibleLots: ReceptionLot[] = [];
  selectedLotId: string | null = null;
  selectedLot: ReceptionLot | null = null;

  inputLbs: number = 0;
  outputLbs: number = 0;
  shrinkage: number | null = null;

  constructor(private dataService: ShrimpDataService) {}

  ngOnInit() {
    this.dataService.getReceptionLots().subscribe(lots => {
      // Solo lotes enteros son elegibles para sacar cabezas (Cola)
      this.eligibleLots = lots.filter(l => l.product_type === 'ENTERO');
    });
  }

  onLotChange() {
    this.selectedLot = this.eligibleLots.find(l => l.id === this.selectedLotId) || null;
    this.inputLbs = 0;
    this.outputLbs = 0;
    this.shrinkage = null;
  }

  calcShrinkage() {
    if (this.inputLbs > 0 && this.outputLbs > 0) {
      this.shrinkage = this.inputLbs - this.outputLbs;
    } else {
      this.shrinkage = null;
    }
  }

  isValid() {
    return this.inputLbs > 0 && 
           this.outputLbs > 0 && 
           this.outputLbs < this.inputLbs &&
           (this.selectedLot ? this.inputLbs <= this.selectedLot.gross_weight_lbs : false);
  }

  confirmRecovery() {
    alert(`Mock API Call:\nConversión ciclica a Cola completada.\nNuevo Lote Cola generado bajo Lote Base: ${this.selectedLot?.base_lot_number}`);
    this.selectedLotId = null;
    this.selectedLot = null;
  }
}
