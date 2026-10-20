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

/**
 * reloadOrder: el indicador de carga debe apagarse siempre y un error de carga debe avisarse.
 * Se prueba sobre una instancia sin inyección, con solo las dependencias que usa.
 */
describe('StockDeliveryDetailsComponent: reloadOrder', () => {
  function build(initializeData: () => Promise<void>): any {
    const c: any = Object.create(StockDeliveryDetailsComponent.prototype);
    c.reloadSequence = 0;
    c.globalEventsManager = { showLoading: jasmine.createSpy('showLoading') };
    c.toasterService = { error: jasmine.createSpy('error') };
    c.initializeData = initializeData;
    return c;
  }

  beforeEach(() => {
    spyOn(console, 'error');
  });

  it('apaga el indicador de carga y avisa si falla la carga', async () => {
    const c = build(() => Promise.reject(new Error('sin red')));

    await c.reloadOrder();

    expect(c.globalEventsManager.showLoading).toHaveBeenCalledWith(true);
    expect(c.globalEventsManager.showLoading.calls.mostRecent().args).toEqual([false]);
    expect(c.toasterService.error).toHaveBeenCalledTimes(1);
  });

  it('en edición, si la entrega no llegó, avisa en vez de dejar la pantalla vacía', async () => {
    const c = build(() => Promise.resolve());
    c.update = true;
    c.order = undefined;

    await c.reloadOrder();

    expect(c.toasterService.error).toHaveBeenCalledTimes(1);
    expect(c.globalEventsManager.showLoading.calls.mostRecent().args).toEqual([false]);
  });

  it('una recarga antigua no apaga el indicador ni avisa si ya hay una más reciente', async () => {
    let rejectOld: (e: Error) => void;
    const old = new Promise<void>((_, reject) => (rejectOld = reject));
    const c = build(() => Promise.resolve());
    c.initializeData = jasmine
      .createSpy('initializeData')
      .and.returnValues(old, Promise.reject(new Error('reciente')));

    const first = c.reloadOrder();
    const second = c.reloadOrder();
    await second;
    const apagadoTrasLaReciente = c.globalEventsManager.showLoading.calls.allArgs().filter((a: any[]) => a[0] === false).length;
    rejectOld(new Error('antigua'));
    await first;

    expect(apagadoTrasLaReciente).toBe(1);
    expect(c.globalEventsManager.showLoading.calls.allArgs().filter((a: any[]) => a[0] === false).length).toBe(1);
    expect(c.toasterService.error).toHaveBeenCalledTimes(1);
  });
});
