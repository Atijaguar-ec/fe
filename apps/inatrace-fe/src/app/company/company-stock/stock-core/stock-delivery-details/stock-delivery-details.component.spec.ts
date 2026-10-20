import { StockDeliveryDetailsComponent } from './stock-delivery-details.component';

/**
 * Reglas de certificación no orgánica. Se prueban sobre una instancia sin inyección:
 * solo dependen de certificationTypeMap.
 */
describe('StockDeliveryDetailsComponent: certificación no orgánica', () => {
  const NEW_CATALOG = [
    'Organico UE/NOP/Biosuisse/Naturland/Fairtrade/SPP',
    'Organico UE/NOP/Biosuisse/Fairtrade/SPP',
    'Organico UE/NOP/Fairtrade/SPP',
    'Convencional Fairtrade',
  ];

  function withCatalog(names: string[]): any {
    const c: any = Object.create(StockDeliveryDetailsComponent.prototype);
    c.certificationTypeMap = names.reduce((m, n) => ({ ...m, [n]: n }), {});
    return c;
  }

  it('reconoce convencional y transición, con o sin tilde', () => {
    const c = withCatalog([]);
    expect(c.isNonOrganicCertification('Convencional Fairtrade')).toBe(true);
    expect(c.isNonOrganicCertification('Transición / Fairtrade / SPP')).toBe(true);
    expect(c.isNonOrganicCertification('Transition / Fairtrade / SPP')).toBe(true);
    expect(c.isNonOrganicCertification('Organico UE/NOP/Fairtrade/SPP')).toBe(false);
    expect(c.isNonOrganicCertification(null)).toBe(false);
  });

  it('con el catálogo nuevo el valor por defecto es Convencional Fairtrade', () => {
    expect(withCatalog(NEW_CATALOG).getNonOrganicCertificationKey()).toBe('Convencional Fairtrade');
  });

  it('sin certificación no orgánica no inventa un valor', () => {
    expect(withCatalog(NEW_CATALOG.slice(0, 3)).getNonOrganicCertificationKey()).toBeNull();
  });
});
