import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, CommercialPresentation, TransformWorkItem } from '../services/shrimp-ms.service';
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
  
  // Flow state
  freezeType = 'BLOQUE';
  pendingSubLots: TransformWorkItem[] = [];
  selectedSubLots: TransformWorkItem[] = [];

  numMasters = 1;
  areaShrinkageLbs = 0; // Merma de área (Agua/Glaseo)
  wasteLbs = 0; // Desperdicio (Solo para Valor Agregado)

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
    this.dataService.getActiveCompany().subscribe(company => {
      const companyIds = company?.data?.companyIds || company?.companyIds || [];
      this.COMPANY_ID = companyIds.length > 0 ? companyIds[0] : null;
      if (this.COMPANY_ID) {
        this.loadPresentations();
      }
    });
    this.loadPendingSubLots();
  }

  loadPresentations() {
    if (!this.COMPANY_ID) return;
    this.shrimpMs.listPresentations(this.COMPANY_ID).subscribe(list => {
      this.presentations = list;
      this.filterPresentations();
    });
  }

  loadPendingSubLots() {
    this.selectedSubLots = [];
    this.createdMasters = [];
    this.errorMsg = '';
    this.successMsg = '';
    
    this.shrimpMs.listPendingSubLots(this.freezeType).subscribe(lots => {
      this.pendingSubLots = lots;
    });
  }

  onFreezeTypeChange() {
    this.filterPresentations();
    this.loadPendingSubLots();
  }

  toggleSubLotSelection(lot: TransformWorkItem) {
    const index = this.selectedSubLots.findIndex(l => l.subLotId === lot.subLotId);
    if (index > -1) {
      this.selectedSubLots.splice(index, 1);
    } else {
      this.selectedSubLots.push(lot);
    }
    this.createdMasters = [];
    this.errorMsg = '';
    this.successMsg = '';
  }

  isSubLotSelected(lot: TransformWorkItem): boolean {
    return this.selectedSubLots.some(l => l.subLotId === lot.subLotId);
  }

  filterPresentations() {
    this.filteredPresentations = this.presentations.filter(p => p.destino === this.freezeType);
    if (!this.filteredPresentations.includes(this.selectedPresentation as any)) {
      this.selectedPresentation = null;
    }
  }

  get availableLbs(): number {
    return this.selectedSubLots.reduce((sum, lot) => sum + (lot.libras || 0), 0);
  }

  get primaryTalla(): string {
    return this.selectedSubLots.length > 0 ? this.selectedSubLots[0].talla.displayName : '';
  }

  get totalMastersWeight(): number {
    return this.selectedPresentation ? this.numMasters * this.selectedPresentation.weightPerUnit : 0;
  }

  isValid() {
    if (!this.selectedPresentation || this.numMasters <= 0 || this.selectedSubLots.length === 0) {
      return false;
    }
    // Balance de masa (con tolerancia de 5% por variaciones de glaseo)
    const requiredLbs = this.totalMastersWeight;
    const availableLbs = this.availableLbs + (this.availableLbs * 0.05); 
    
    return requiredLbs <= availableLbs;
  }

  createMasters() {
    if (!this.isValid() || !this.selectedPresentation || this.selectedSubLots.length === 0) return;
    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';

    // TODO: El backend de ApiProcessingLot solo acepta un destinationId actualmente.
    // Usaremos el primero por ahora. En el futuro, se debe enviar la lista de selectedSubLots.
    const primaryDestinationId = this.selectedSubLots[0].subLotId;

    // Paso 1: Registrar Desperdicio si es Valor Agregado y hay cantidad
    if (this.freezeType === 'VALOR_AGREGADO' && this.wasteLbs > 0) {
      this.shrimpMs.createWasteRecord({
        wasteType: 'DESPERDICIO_VALOR_AGREGADO',
        weightLbs: this.wasteLbs,
        reason: 'Desperdicio registrado durante masterizado de Valor Agregado'
      }).subscribe({
        error: (err) => console.error('Error guardando desperdicio:', err)
      });
    }

    // Paso 2: Crear el lote de proceso vinculado a la derivación
    this.shrimpMs.createProcessingLot({
      destinationId: primaryDestinationId,
      outputMasters: this.numMasters,
      shrinkageLbs: this.areaShrinkageLbs,
      status: 'PROCESSING'
    }).subscribe({
      next: (lot) => {
        // Paso 3: Crear cada master carton
        let completed = 0;
        let hasErrors = false;
        
        for (let i = 0; i < this.numMasters; i++) {
          this.shrimpMs.createMasterCarton({
            processingLotId: lot.id,
            brand: this.selectedPresentation!.brandName,
            shrimpSize: this.primaryTalla,
            presentation: this.selectedPresentation!.name,
            freezeType: this.freezeType,
            grossWeightLbs: this.selectedPresentation!.weightPerUnit
          }).subscribe({
            next: (mc) => {
              this.createdMasters.push(mc);
              completed++;
              this.checkCompletion(completed, hasErrors);
            },
            error: (err) => {
              this.errorMsg = err?.error?.errorMessage || 'Error al crear un master.';
              hasErrors = true;
              completed++;
              this.checkCompletion(completed, hasErrors);
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
  
  private checkCompletion(completed: number, hasErrors: boolean) {
    if (completed === this.numMasters) {
      if (!hasErrors) {
        this.successMsg = `${this.numMasters} cajas master creadas exitosamente.`;
      }
      this.saving = false;
      // Resetear campos de merma/desperdicio
      this.areaShrinkageLbs = 0;
      this.wasteLbs = 0;
      // Recargar lista para actualizar saldos
      this.loadPendingSubLots();
    }
  }
}
