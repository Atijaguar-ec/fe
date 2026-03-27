import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recepcion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <h1 class="text-3xl font-bold mb-6">📥 Recepción de Materia Prima</h1>
      
      <div class="bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl">
        <form (ngSubmit)="onSubmit()">
          
          <div class="mb-4">
            <label class="block text-gray-300 font-bold mb-2 text-lg">Proveedor / Lote Base</label>
            <input type="text" [(ngModel)]="loteBase" name="loteBase" class="w-full bg-slate-700 text-white border border-slate-600 rounded p-4 text-xl" placeholder="Ej. 250121" required>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-gray-300 font-bold mb-2 text-lg">Peso Bruto (Lbs)</label>
              <input type="number" [(ngModel)]="pesoBruto" name="pesoBruto" class="w-full bg-slate-700 text-white border border-slate-600 rounded p-4 text-xl" placeholder="0.00" required>
            </div>
            <div>
              <label class="block text-gray-300 font-bold mb-2 text-lg">Gavetas / Bines</label>
              <input type="number" [(ngModel)]="bines" name="bines" class="w-full bg-slate-700 text-white border border-slate-600 rounded p-4 text-xl" placeholder="0" required>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-gray-300 font-bold mb-2 text-lg">Tipo de Producto</label>
            <select [(ngModel)]="tipo" name="tipo" class="w-full bg-slate-700 text-white border border-slate-600 rounded p-4 text-xl">
              <option value="entero">Camarón Entero</option>
              <option value="cola">Camarón Cola</option>
            </select>
          </div>

          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-lg text-xl transition-colors">
            Registrar Recepción
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Utility classes mapping for basic aesthetics inspired by Tailwind since we haven't confirmed TW integration in this MFE */
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .w-full { width: 100%; box-sizing: border-box; }
    .block { display: block; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-4 { gap: 1rem; }
    .rounded { border-radius: 0.25rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .bg-slate-800 { background-color: #1e293b; }
    .bg-slate-700 { background-color: #334155; }
    .bg-blue-600 { background-color: #2563eb; }
    .hover\\:bg-blue-500:hover { background-color: #3b82f6; }
    .text-white { color: #ffffff; }
    .text-gray-300 { color: #d1d5db; }
    .border { border-width: 1px; border-style: solid; }
    .border-slate-600 { border-color: #475569; }
    .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .font-bold { font-weight: 700; }
    .max-w-2xl { max-width: 42rem; }
    .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    .transition-colors { transition-property: color, background-color, border-color; transition-duration: 200ms; }
    input:focus, select:focus { outline: 2px solid #3b82f6; outline-offset: -1px; }
  `]
})
export class ReceptionComponent {
  loteBase = '';
  pesoBruto: number | null = null;
  bines: number | null = null;
  tipo = 'entero';

  onSubmit() {
    if (!this.pesoBruto || !this.loteBase) {
      alert('Faltan campos (bloqueando envío - req UX)');
      return;
    }
    console.log('POST /api/stock-orders (temporal mock)', {
      lote: this.loteBase,
      peso: this.pesoBruto,
      bines: this.bines,
      tipo: this.tipo
    });
    alert(`Lote Base ${this.loteBase} registrado exitosamente!`);
    
    // Reset
    this.loteBase = '';
    this.pesoBruto = null;
    this.bines = null;
  }
}
