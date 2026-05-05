import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, ColdStorageSlot } from '../services/shrimp-ms.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">📦 Inventario de Cámaras</h1>
          <p class="page-subtitle">Stock congelado en cámaras de mantenimiento — FIFO</p>
        </div>
        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-value">{{ slots.length }}</span>
            <span class="stat-label">Cámaras</span>
          </div>
        </div>
      </div>

      <!-- FIFO Alert -->
      <div class="fifo-alert" *ngIf="fifoWarning">
        ⚠️ <strong>Alerta FIFO:</strong> {{ fifoWarning }}
        <button class="alert-close" (click)="fifoWarning = ''">✕</button>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Cámaras registradas</h2>
          <button class="btn btn-sm btn-outline" (click)="showAddSlot = !showAddSlot">+ Agregar</button>
        </div>

        <!-- Add slot form -->
        <div *ngIf="showAddSlot" class="add-slot-form">
          <input type="text" class="form-input" [(ngModel)]="newChamberName" placeholder="Nombre de cámara">
          <input type="text" class="form-input" [(ngModel)]="newSlotCode" placeholder="Código (ej: C1-A01)">
          <input type="number" class="form-input" [(ngModel)]="newCapacity" placeholder="Capacidad (masters)" min="1">
          <button class="btn btn-primary btn-sm" [disabled]="!newChamberName || !newSlotCode || newCapacity < 1" (click)="addSlot()">Guardar</button>
        </div>

        <div *ngIf="slots.length === 0" class="empty-state">
          <div class="empty-icon">🧊</div>
          <div class="empty-text">No hay cámaras registradas</div>
        </div>

        <div class="slot-grid" *ngIf="slots.length > 0">
          <div class="slot-card" *ngFor="let slot of slots">
            <div class="slot-header">
              <span class="slot-name">{{ slot.chamberName }}</span>
              <span class="slot-code">{{ slot.slotCode }}</span>
            </div>
            <div class="slot-capacity">Cap: {{ slot.capacityMasters }} masters</div>
          </div>
        </div>
      </div>

      <div *ngIf="errorMsg" style="color: #dc2626; margin: 0.5rem 0;">⚠️ {{ errorMsg }}</div>
      <div *ngIf="successMsg" style="color: #059669; margin: 0.5rem 0;">✅ {{ successMsg }}</div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--ina-secondary); margin: 0; }
    .page-subtitle { font-size: 0.82rem; color: #6b7280; margin-top: 2px; }
    .header-stats { display: flex; gap: 0.75rem; }
    .stat-chip { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.5rem 1rem; text-align: center; }
    .stat-value { display: block; font-size: 1.3rem; font-weight: 700; color: var(--ina-primary); }
    .stat-label { display: block; font-size: 0.65rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); margin-bottom: 1rem; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6; }
    .card-header h2 { font-size: 0.95rem; font-weight: 600; color: #1f2937; margin: 0; }
    .fifo-alert { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.85rem; color: #92400e; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .alert-close { background: none; border: none; cursor: pointer; font-size: 1rem; margin-left: auto; }
    .empty-state { text-align: center; padding: 2rem; }
    .empty-icon { font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5; }
    .empty-text { font-size: 0.9rem; font-weight: 600; color: #6b7280; }
    .add-slot-form { display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: flex-end; }
    .form-input { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.9rem; }
    .form-input:focus { outline: none; border-color: var(--ina-primary); }
    .btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; font-size: 0.85rem; }
    .btn-primary { background: var(--ina-primary); color: white; }
    .btn-outline { background: white; border: 1px solid #d1d5db; color: #6b7280; }
    .btn-sm { padding: 0.35rem 0.65rem; font-size: 0.78rem; }
    .slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
    .slot-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1rem; }
    .slot-header { display: flex; justify-content: space-between; align-items: center; }
    .slot-name { font-weight: 700; color: #1f2937; }
    .slot-code { font-size: 0.75rem; color: #9ca3af; font-family: monospace; }
    .slot-capacity { font-size: 0.8rem; color: #6b7280; margin-top: 0.35rem; }
  `]
})
export class InventarioComponent implements OnInit {
  slots: ColdStorageSlot[] = [];
  fifoWarning = '';
  showAddSlot = false;
  newChamberName = '';
  newSlotCode = '';
  newCapacity = 100;
  errorMsg = '';
  successMsg = '';

  constructor(private shrimpMs: ShrimpMsService) {}

  ngOnInit() {
    this.loadSlots();
  }

  loadSlots() {
    this.shrimpMs.getSlots().subscribe(slots => this.slots = slots);
  }

  addSlot() {
    this.shrimpMs.createSlot({
      chamberName: this.newChamberName,
      slotCode: this.newSlotCode,
      capacityMasters: this.newCapacity
    }).subscribe({
      next: (slot) => {
        this.slots.push(slot);
        this.successMsg = `Cámara ${slot.chamberName} creada`;
        this.showAddSlot = false;
        this.newChamberName = '';
        this.newSlotCode = '';
        this.newCapacity = 100;
      },
      error: (err) => this.errorMsg = err?.error?.errorMessage || 'Error al crear cámara'
    });
  }
}
