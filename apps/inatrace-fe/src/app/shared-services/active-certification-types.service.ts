import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { GeneralSifrantService } from './general-sifrant.service';
import { ApiCertificationType } from '../../api/model/apiCertificationType';
import { CertificationTypeControllerService } from '../../api/api/certificationTypeController.service';

/**
 * Catálogo administrable de tipos de certificación (Ajustes → Tipos de certificación).
 *
 * Es el MISMO catálogo que alimenta el campo "Tipo de certificación" del formulario de
 * Recepción, y es a propósito: la certificación de la parcela y la de la entrega hablan
 * del mismo concepto, así que no deben tener vocabularios separados. Si se agrega o
 * renombra un valor en Ajustes, ambos formularios lo reflejan sin tocar código.
 *
 * A diferencia del combo de Recepción (que arma un EnumSifrant con los nombres), acá se
 * devuelven los objetos completos: la parcela guarda una referencia al catálogo, no el
 * nombre suelto.
 */
export class ActiveCertificationTypesService extends GeneralSifrantService<ApiCertificationType> {
  constructor(
    private certificationTypeControllerService: CertificationTypeControllerService,
    private language: 'EN' | 'DE' | 'RW' | 'ES' = 'ES',
  ) {
    super();
  }

  public identifier(el: ApiCertificationType) {
    return el.id;
  }

  public textRepresentation(el: ApiCertificationType) {
    return `${el.name}`;
  }

  public makeQuery(
    key: string,
    params?: any,
  ): Observable<PagedSearchResults<ApiCertificationType>> {
    return this.certificationTypeControllerService
      .listActive(this.language)
      .pipe(
        map((items: ApiCertificationType[]) => {
          const results = items || [];
          return {
            results,
            offset: 0,
            limit: results.length,
            totalCount: results.length,
          };
        }),
      );
  }

  public placeholder(): string {
    return $localize`:@@plotDetail.singleChoice.certificationType.placeholder:Seleccionar tipo de certificación ...`;
  }
}
