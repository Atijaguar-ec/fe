import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiCompanyProcessingAction } from '../../../api/model/apiCompanyProcessingAction';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyProcessingActionsService {

  constructor(private http: HttpClient) { }

  /**
   * Get enabled processing actions for a company (for processing order creation)
   */
  getEnabledProcessingActions(companyId: number, language: string = 'EN'): Observable<{data: ApiCompanyProcessingAction[]}> {
    return this.http.get<{data: ApiCompanyProcessingAction[]}>(
      `${environment.basePath}/api/company/${companyId}/processing-actions`,
      { params: { language } }
    );
  }

  /**
   * Get all processing action configurations for a company (for settings management)
   */
  getAllProcessingActionConfigurations(companyId: number, language: string = 'EN'): Observable<{data: ApiCompanyProcessingAction[]}> {
    return this.http.get<{data: ApiCompanyProcessingAction[]}>(
      `${environment.basePath}/api/company/${companyId}/processing-actions/all`,
      { params: { language } }
    );
  }

  /**
   * Update a company processing action configuration
   */
  updateCompanyProcessingAction(
    companyId: number,
    processingActionId: number,
    config: ApiCompanyProcessingAction,
    language: string = 'EN'
  ): Observable<{data: ApiCompanyProcessingAction}> {
    return this.http.put<{data: ApiCompanyProcessingAction}>(
      `${environment.basePath}/api/company/${companyId}/processing-actions/${processingActionId}`,
      config,
      { params: { language } }
    );
  }

  /**
   * Initialize processing actions for a company
   */
  initializeCompanyProcessingActions(companyId: number): Observable<any> {
    return this.http.post(
      `${environment.basePath}/api/company/${companyId}/processing-actions/initialize`,
      {}
    );
  }
}
