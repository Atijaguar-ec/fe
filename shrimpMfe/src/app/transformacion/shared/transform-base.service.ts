import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ShrimpMsService, TransformWorkItem, AreaSettlement } from '../../services/shrimp-ms.service';

/**
 * Shared base for all transformation components (Bloque, IQF, VA, Salmuera).
 * Encapsulates the common work-queue + area-settlement logic so each
 * destination component only implements its own presentation-specific steps.
 *
 * DUFER doc point 7.2:
 *   - receivedLbs comes from classification sub-lots
 *   - mastersProduced is the result the supervisor registers
 *   - Yield% = mastersWeightLbs / receivedLbs × 100
 */
@Injectable()
export abstract class TransformBaseService {
  workItems: TransformWorkItem[] = [];
  areaSettlement: AreaSettlement | null = null;
  isLoading = false;
  errorMsg = '';

  constructor(protected shrimpMs: ShrimpMsService) {}

  /** Load pending sub-lots for this destination type. */
  loadWorkItems(destinationType: string): void {
    this.isLoading = true;
    this.shrimpMs.listPendingSubLots(destinationType).subscribe({
      next: (items) => {
        this.workItems = items;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMsg = 'Error al cargar la cola de trabajo.';
      }
    });
  }

  /** Total lbs received from classification for this destination. */
  get totalReceivedLbs(): number {
    return this.workItems
      .filter(w => w.libras !== undefined)
      .reduce((sum, w) => sum + (w.libras ?? 0), 0);
  }
}
