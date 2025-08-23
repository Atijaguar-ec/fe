import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CompanyProcessingActionsService as CompanyProcessingActionsApiService } from '../core/api/company-processing-actions.service';
import { ApiProcessingAction } from '../../api/model/apiProcessingAction';
import { ApiCompanyProcessingAction } from '../../api/model/apiCompanyProcessingAction';

/**
 * Adapter service that bridges the new company-specific processing actions API
 * with the existing component structure that expects ApiProcessingAction objects.
 */
@Injectable({
  providedIn: 'root'
})
export class CompanyProcessingActionsAdapterService {

  constructor(private apiService: CompanyProcessingActionsApiService) { }

  /**
   * Get enabled processing actions for a company, mapped to ApiProcessingAction format
   * for compatibility with existing components.
   */
  getEnabledProcessingActionsForCompany(companyId: number, language: string = 'EN'): Observable<ApiProcessingAction[]> {
    return this.apiService.getEnabledProcessingActions(companyId, language).pipe(
      map(response => {
        if (!response.data) return [];
        
        return response.data
          .filter(cpa => cpa.enabled && cpa.processingAction)
          .map(cpa => {
            const action = cpa.processingAction!;
            // Override sortOrder with effective order from company configuration
            if (cpa.effectiveOrder !== undefined) {
              action.sortOrder = cpa.effectiveOrder;
            }
            return action;
          })
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      })
    );
  }

  /**
   * Fallback method that uses the original processing action service
   * when company-specific endpoint is not available.
   */
  getFallbackProcessingActions(): Observable<ApiProcessingAction[]> {
    // This would use the original ProcessingActionControllerService
    // For now, return empty array as fallback
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }
}
