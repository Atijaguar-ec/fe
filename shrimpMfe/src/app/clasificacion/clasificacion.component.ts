import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importando desde las librerías transversales recién creadas
import { NumericKeypadComponent, SizeSelectorComponent } from '@inatrace/shared-ui';

@Component({
  selector: 'app-clasificacion',
  standalone: true,
  imports: [CommonModule, FormsModule, NumericKeypadComponent, SizeSelectorComponent],
  template: `
    <div class="p-4 flex gap-6">
      
      <!-- Panel Izquierdo: Formulario -->
      <div class="flex-1">
        <h1 class="text-3xl font-bold mb-6">📏 Registro de Clasificación</h1>
        
        <div class="bg-slate-800 p-6 rounded-lg shadow-lg mb-6">
          <h2 class="text-xl font-bold mb-4 text-blue-400">1. Talla a Registrar</h2>
          <lib-size-selector (sizeSelected)="onSizeSelected($event)"></lib-size-selector>
          <div *ngIf="selectedSize" class="mt-4 p-3 bg-blue-900 border border-blue-500 rounded text-center text-xl font-bold">
            Talla Activa: {{ selectedSize }}
          </div>
        </div>

        <div *ngIf="selectedSize" class="bg-slate-800 p-6 rounded-lg shadow-lg fade-in">
          <h2 class="text-xl font-bold mb-4 text-emerald-400">2. Cantidades</h2>
          
          <div class="grid grid-cols-2 gap-6 mb-6">
            <!-- Input Cajetas -->
            <div 
              class="input-box" 
              [class.active-input]="activeInput === 'cajetas'"
              (click)="setActiveInput('cajetas')">
              <label>Cajetas (Conteo)</label>
              <div class="value-display">{{ cajetas || '0' }}</div>
            </div>

            <!-- Input Libras -->
            <div 
              class="input-box" 
              [class.active-input]="activeInput === 'libras'"
              (click)="setActiveInput('libras')">
              <label>Libras (Peso)</label>
              <div class="value-display">{{ libras || '0.00' }}</div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-gray-300 font-bold mb-2">Máquina Clasificadora</label>
            <select [(ngModel)]="maquina" name="maquina" class="w-full bg-slate-700 text-white rounded p-4 text-xl">
              <option value="1">Línea 1</option>
              <option value="2">Línea 2</option>
              <option value="3">Línea 3</option>
              <option value="4">Línea 4</option>
            </select>
          </div>

          <button (click)="registrarSalida()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg text-xl" [disabled]="!cajetas || !libras">
            💾 Guardar Registro
          </button>
        </div>
      </div>

      <!-- Panel Derecho: Teclado (Aparece si hay un input activo) -->
      <div class="w-96" *ngIf="activeInput">
        <div class="bg-slate-800 p-6 rounded-lg sticky top-4">
          <div class="text-center mb-4 text-gray-300">
            Ingresando <strong class="text-white">{{ activeInput | uppercase }}</strong>
          </div>
          <lib-numeric-keypad (keyPress)="onKeyPress($event)"></lib-numeric-keypad>
          <button (click)="activeInput = null" class="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded text-lg">
            Cerrar Teclado
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .p-3 { padding: 0.75rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .w-full { width: 100%; box-sizing: border-box; }
    .w-96 { width: 24rem; }
    .flex { display: flex; }
    .flex-1 { flex: 1; }
    .gap-6 { gap: 1.5rem; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .rounded { border-radius: 0.25rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .text-center { text-align: center; }
    .sticky { position: sticky; }
    .top-4 { top: 1rem; }
    .block { display: block; }
    .bg-slate-800 { background-color: #1e293b; }
    .bg-slate-700 { background-color: #334155; }
    .bg-blue-900 { background-color: #1e3a8a; }
    .bg-emerald-600 { background-color: #059669; }
    .hover\\:bg-emerald-500:hover { background-color: #10b981; }
    .hover\\:bg-slate-600:hover { background-color: #475569; }
    .text-white { color: #ffffff; }
    .text-gray-300 { color: #d1d5db; }
    .text-blue-400 { color: #60a5fa; }
    .text-emerald-400 { color: #34d399; }
    .border { border-width: 1px; border-style: solid; }
    .border-blue-500 { border-color: #3b82f6; }
    .text-3xl { font-size: 1.875rem; font-weight: 700; }
    .text-xl { font-size: 1.25rem; font-weight: 700; }
    .text-lg { font-size: 1.125rem; }
    .font-bold { font-weight: 700; }
    .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    
    .input-box {
      background-color: #0f172a;
      border: 2px solid #334155;
      padding: 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .input-box label {
      color: #94a3b8;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      display: block;
    }
    .value-display {
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      text-align: right;
      font-family: monospace;
      min-height: 3rem;
    }
    .active-input {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
    }
    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    button[disabled] { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ClassificationComponent {
  selectedSize: string | null = null;
  activeInput: 'cajetas' | 'libras' | null = null;
  
  cajetas = '';
  libras = '';
  maquina = '1';

  onSizeSelected(size: string) {
    this.selectedSize = size;
    // Auto-focus first input
    this.activeInput = 'cajetas';
  }

  setActiveInput(type: 'cajetas' | 'libras') {
    this.activeInput = type;
  }

  onKeyPress(key: string) {
    if (!this.activeInput) return;
    
    let currentVal = this.activeInput === 'cajetas' ? this.cajetas : this.libras;
    
    if (key === 'CLEAR') {
      currentVal = '';
    } else if (key === 'BACKSPACE') {
      currentVal = currentVal.slice(0, -1);
    } else {
      // Prevent multiple decimals
      if (key === '.' && currentVal.includes('.')) return;
      // Prevent decimals in cajetas (conteo exacto)
      if (this.activeInput === 'cajetas' && key === '.') return;
      
      currentVal += key;
    }

    if (this.activeInput === 'cajetas') {
      this.cajetas = currentVal;
    } else {
      this.libras = currentVal;
    }
  }

  registrarSalida() {
    alert(`Salida Registrada:\n- Talla: ${this.selectedSize}\n- Cajetas: ${this.cajetas}\n- Libras: ${this.libras}\n- Datos adjuntos en StockOrder Comments.`);
    
    // Reset view for next box
    this.selectedSize = null;
    this.cajetas = '';
    this.libras = '';
    this.activeInput = null;
  }
}
