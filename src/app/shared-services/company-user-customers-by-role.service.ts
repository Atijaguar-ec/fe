import { GeneralSifrantService } from './general-sifrant.service';
import { ApiUserCustomer } from '../../api/model/apiUserCustomer';
import { Observable } from 'rxjs';
import { PagedSearchResults } from '../../interfaces/CodebookHelperService';
import { map } from 'rxjs/operators';
import { ApiPaginatedResponseApiUserCustomer } from '../../api/model/apiPaginatedResponseApiUserCustomer';
import { CompanyControllerService, GetUserCustomersForCompanyAndType } from '../../api/api/companyController.service';

export class CompanyUserCustomersByRoleService extends GeneralSifrantService<ApiUserCustomer> {

  constructor(
    private companyControllerService: CompanyControllerService,
    private companyId: number,
    private role: string
  ) {
    super();
  }

  requestParams = {
    limit: 1000,
    offset: 0,
  } as GetUserCustomersForCompanyAndType.PartialParamMap;

  identifier(el: ApiUserCustomer) {
    return el.id;
  }

  textRepresentation(el: ApiUserCustomer): string {
    const isLegal = el.personType === ApiUserCustomer.PersonTypeEnum.LEGAL || (el as any).personType === 'LEGAL';

    // Nombre base según tipo de persona
    const baseName = ((): string => {
      if (isLegal) {
        // Para personas jurídicas priorizamos el nombre de la empresa
        if (el.companyName && el.companyName.trim().length > 0) {
          return el.companyName.trim();
        }
      }

      const namePart = el.name ? el.name.trim() : '';
      const surnamePart = el.surname ? el.surname.trim() : '';
      return `${namePart} ${surnamePart}`.trim();
    })();

    if (el.location?.address?.country?.code === 'RW') {
      const cell = el.location.address.cell ? el.location.address.cell.substring(0, 2).toLocaleUpperCase() : '--';
      const village = el.location.address.village ? el.location.address.village.substring(0, 2).toLocaleUpperCase() : '--';
      return `${baseName} (${el.id}, ${village}-${cell})`;
    } else if (el.location?.address?.country?.code === 'HN') {
      const municipality = el.location.address.hondurasMunicipality ? el.location.address.hondurasMunicipality : '--';
      const village = el.location.address.hondurasVillage ? el.location.address.hondurasVillage : '--';
      return `${baseName} (${el.id}, ${municipality}-${village})`;
    }

    return `${baseName} (${el.id})`;
  }

  makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiUserCustomer>> {

    const limit = params && params.limit ? params.limit : this.limit();
    const reqParams: GetUserCustomersForCompanyAndType.PartialParamMap = {
      query: key,
      searchBy: 'BY_NAME_AND_SURNAME',
      companyId: this.companyId,
      type: this.role,
      ...this.requestParams
    };

    return this.companyControllerService.getUserCustomersForCompanyAndTypeByMap(reqParams)
      .pipe(
        map((res: ApiPaginatedResponseApiUserCustomer) => {
          return {
            results: res.data.items,
            offset: 0,
            limit,
            totalCount: res.data.count
          };
        })
      );
  }

  public placeholder(): string {
    return $localize`:@@activeUserCustomersByOrganizationAndRole.input.placehoder:Select ...`;
  }

}
