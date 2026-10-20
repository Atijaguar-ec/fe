import { GeneralSifrantService } from './general-sifrant.service';
import { ApiUserCustomer } from '../../api/model/apiUserCustomer';
import { Observable } from 'rxjs';
import { PagedSearchResults } from '../../interfaces/CodebookHelperService';
import { map } from 'rxjs/operators';
import { ApiPaginatedResponseApiUserCustomer } from '../../api/model/apiPaginatedResponseApiUserCustomer';
import {
  CompanyControllerService,
  GetUserCustomersForCompanyAndType,
} from '../../api/api/companyController.service';

export class CompanyUserCustomersByRoleService extends GeneralSifrantService<ApiUserCustomer> {
  constructor(
    private companyControllerService: CompanyControllerService,
    private companyId: number,
    private role: string,
    /**
     * Cuando es true solo se ofrecen productores en estado ACTIVE. Úsalo en los
     * selectores que inician una transacción (recepción, procesamiento, pagos).
     * El valor ya asignado a un registro existente se sigue mostrando, porque
     * single-choice lo lee del form control y no de este listado.
     */
    private onlyAvailableForTransactions: boolean = false,
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
    if (el.location?.address?.country?.code === 'RW') {
      const cell = el.location.address.cell
        ? el.location.address.cell.substring(0, 2).toLocaleUpperCase()
        : '--';
      const village = el.location.address.village
        ? el.location.address.village.substring(0, 2).toLocaleUpperCase()
        : '--';
      return (
        el.surname +
        ' ' +
        el.name +
        ' (' +
        el.id +
        ', ' +
        village +
        '-' +
        cell +
        ')'
      );
    } else if (el.location?.address?.country?.code === 'HN') {
      const municipality = el.location.address.hondurasMunicipality
        ? el.location.address.hondurasMunicipality
        : '--';
      const village = el.location.address.hondurasVillage
        ? el.location.address.hondurasVillage
        : '--';
      return (
        el.surname +
        ' ' +
        el.name +
        ' (' +
        el.id +
        ', ' +
        municipality +
        '-' +
        village +
        ')'
      );
    }

    // Formato APELLIDOS NOMBRES pedido por FV para el selector de Agricultor
    // (Entrega, Entrega masiva, Pagos, Dashboard comparten este servicio).
    return `${el.surname} ${el.name} (${el.id})`;
  }

  makeQuery(
    key: string,
    params?: any,
  ): Observable<PagedSearchResults<ApiUserCustomer>> {
    const limit = params && params.limit ? params.limit : this.limit();
    const reqParams: GetUserCustomersForCompanyAndType.PartialParamMap = {
      query: key,
      searchBy: 'BY_NAME_AND_SURNAME',
      companyId: this.companyId,
      type: this.role,
      ...(this.onlyAvailableForTransactions
        ? { onlyAvailableForTransactions: true }
        : {}),
      ...this.requestParams,
    };

    return this.companyControllerService
      .getUserCustomersForCompanyAndTypeByMap(reqParams)
      .pipe(
        map((res: ApiPaginatedResponseApiUserCustomer) => {
          // Filtrar duplicados por ID (evitar el error de datos repetidos en Combobox)
          const uniqueItems = res.data.items ? res.data.items.filter(
            (item, index, self) => index === self.findIndex((t) => t.id === item.id)
          ) : [];
          return {
            results: uniqueItems,
            offset: 0,
            limit,
            totalCount: res.data.count,
          };
        }),
      );
  }

  public placeholder(): string {
    return $localize`:@@activeUserCustomersByOrganizationAndRole.input.placehoder:Select ...`;
  }
}
