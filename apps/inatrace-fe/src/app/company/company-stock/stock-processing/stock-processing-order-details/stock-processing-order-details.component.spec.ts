import { of, throwError } from 'rxjs';
import { StockProcessingOrderDetailsComponent } from './stock-processing-order-details.component';
import { ProcessingOrderInputComponent } from './processing-order-input/processing-order-input.component';

/**
 * saveProcessingOrder: ninguna ruta puede terminar sin guardar y sin decírselo al usuario.
 * Se prueba sobre una instancia sin inyección, con solo las dependencias que usa el método.
 */
describe('StockProcessingOrderDetailsComponent: saveProcessingOrder', () => {
  interface BuildOptions {
    invalid?: boolean;
    oneInputStockOrderRequired?: boolean;
    outputQuantityNotUsed?: boolean;
    response?: unknown;
    responseFails?: boolean;
  }

  function build(options: BuildOptions = {}): any {
    const c: any = Object.create(StockProcessingOrderDetailsComponent.prototype);

    const targetStockOrders = {
      controls: options.outputQuantityNotUsed ? [{}] : [],
    };
    const processingAction = {
      value: { type: 'PROCESSING', repackedOutputFinalProducts: false },
    };

    c.saveInProgress = false;
    c.submitted = false;
    c.procOrderGroup = {
      invalid: !!options.invalid,
      getRawValue: () => ({ targetStockOrders: [] }),
      get: (name: string) =>
        name === 'targetStockOrders' ? targetStockOrders : processingAction,
    };
    c.input = {
      oneInputStockOrderRequired: !!options.oneInputStockOrderRequired,
      prepInputTransactionsFromStockOrders: () => [],
    };
    c.output = {
      notAllOutputQuantityIsUsed: () => !!options.outputQuantityNotUsed,
      repackedQuantityExceedsOutput: () => false,
    };
    c.globalEventsManager = { showLoading: jasmine.createSpy('showLoading') };
    c.toasterService = { error: jasmine.createSpy('error') };
    c.enrichTargetStockOrders = jasmine.createSpy('enrichTargetStockOrders');
    c.dismiss = jasmine.createSpy('dismiss');
    c.processingOrderController = {
      createOrUpdateProcessingOrder: jasmine
        .createSpy('createOrUpdateProcessingOrder')
        .and.callFake(() =>
          options.responseFails
            ? throwError(() => new Error('sin red'))
            : of(options.response ?? { status: 'OK' }),
        ),
    };

    return c;
  }

  beforeEach(() => {
    spyOn(console, 'error');
  });

  it('si el guardado se rechaza, avisa y deja saveInProgress en false', async () => {
    const c = build({ responseFails: true });

    await c.saveProcessingOrder();

    expect(c.toasterService.error).toHaveBeenCalledTimes(1);
    expect(c.saveInProgress).toBe(false);
    expect(c.globalEventsManager.showLoading.calls.mostRecent().args).toEqual([
      false,
    ]);
    expect(c.dismiss).not.toHaveBeenCalled();
  });

  it('una respuesta con status distinto de OK avisa en vez de quedarse en silencio', async () => {
    const c = build({
      response: { status: 'ERROR', errorMessage: 'La instalación no existe' },
    });

    await c.saveProcessingOrder();

    expect(c.toasterService.error).toHaveBeenCalledTimes(1);
    // El mensaje del backend es lo más útil que podemos mostrar, así que se aprovecha.
    expect(c.toasterService.error.calls.mostRecent().args[0]).toBe(
      'La instalación no existe',
    );
    expect(c.saveInProgress).toBe(false);
    expect(c.dismiss).not.toHaveBeenCalled();
  });

  it('si el formulario es inválido avisa y no llama al backend', async () => {
    const c = build({ invalid: true });

    await c.saveProcessingOrder();

    expect(c.toasterService.error).toHaveBeenCalledTimes(1);
    expect(
      c.processingOrderController.createOrUpdateProcessingOrder,
    ).not.toHaveBeenCalled();
    expect(c.saveInProgress).toBe(false);
  });

  it('si falta la entrada obligatoria avisa y no llama al backend', async () => {
    const c = build({ oneInputStockOrderRequired: true });

    await c.saveProcessingOrder();

    expect(c.toasterService.error).toHaveBeenCalledTimes(1);
    expect(
      c.processingOrderController.createOrUpdateProcessingOrder,
    ).not.toHaveBeenCalled();
  });

  it('si la cantidad de salida no se usa por completo avisa y no llama al backend', async () => {
    const c = build({ outputQuantityNotUsed: true });

    await c.saveProcessingOrder();

    expect(c.toasterService.error).toHaveBeenCalledTimes(1);
    expect(
      c.processingOrderController.createOrUpdateProcessingOrder,
    ).not.toHaveBeenCalled();
  });

  it('si el guardado va bien cierra la pantalla y no avisa de nada', async () => {
    const c = build();

    await c.saveProcessingOrder();

    expect(c.dismiss).toHaveBeenCalledTimes(1);
    expect(c.toasterService.error).not.toHaveBeenCalled();
    expect(c.saveInProgress).toBe(false);
    expect(c.globalEventsManager.showLoading.calls.mostRecent().args).toEqual([
      false,
    ]);
  });
});

/**
 * prepareTransferTargetStockOrders: al editar una transferencia, las entradas ya guardadas
 * viven en inputTransactions y selectedInputStockOrders está vacío. Regenerar siempre las
 * salidas desde ahí dejaba la lista vacía y el backend rechazaba la edición con 400
 * "At least one target StockOrder has to be provided!".
 *
 * Se usa la implementación real de ProcessingOrderInputComponent para que la numeración de
 * lotes se pruebe de verdad y no contra un doble.
 */
describe('StockProcessingOrderDetailsComponent: salidas de una transferencia', () => {
  function build(editing: boolean, selectedInputStockOrders: any[]): any {
    const c: any = Object.create(StockProcessingOrderDetailsComponent.prototype);
    c.editing = editing;

    const input: any = Object.create(ProcessingOrderInputComponent.prototype);
    input.selectedInputStockOrders = selectedInputStockOrders;
    input.processingUserId = 7;
    c.input = input;

    return c;
  }

  const entrada = (id: number) => ({
    id,
    semiProduct: { id: 1 },
    finalProduct: null,
    availableQuantity: 100,
    productionDate: '2026-10-06',
  });

  it('al crear, genera una salida por cada entrada marcada', () => {
    const c = build(false, [entrada(11), entrada(12)]);

    const result = c.prepareTransferTargetStockOrders({
      targetStockOrders: [
        { facility: { id: 42 }, internalLotNumber: '2026-41-02' },
      ],
    });

    expect(result.length).toBe(2);
    expect(result.map((tso: any) => tso.internalLotNumber)).toEqual([
      '2026-41-02/1',
      '2026-41-02/2',
    ]);
    expect(result.every((tso: any) => tso.id == null)).toBe(true);
  });

  it('al editar sin entradas nuevas, conserva las salidas guardadas con el área corregida', () => {
    const c = build(true, []);

    const result = c.prepareTransferTargetStockOrders({
      targetStockOrders: [
        {
          id: 3243,
          facility: { id: 99, name: 'Área de Fermentación Quiroga' },
          internalLotNumber: '2026-41-02/1',
        },
      ],
    });

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(3243);
    expect(result[0].facility.name).toBe('Área de Fermentación Quiroga');
    expect(result[0].internalLotNumber).toBe('2026-41-02/1');
  });

  it('al editar añadiendo una entrada, conserva las existentes y numera la nueva a continuación', () => {
    const c = build(true, [entrada(11)]);

    const result = c.prepareTransferTargetStockOrders({
      targetStockOrders: [
        { id: 3243, facility: { id: 99 }, internalLotNumber: '2026-41-02/1' },
        { id: 3244, facility: { id: 99 }, internalLotNumber: '2026-41-02/2' },
      ],
    });

    expect(result.length).toBe(3);
    expect(result.map((tso: any) => tso.id)).toEqual([3243, 3244, undefined]);
    // La nueva parte del nombre base, no de "2026-41-02/1", y sigue la numeración.
    expect(result[2].internalLotNumber).toBe('2026-41-02/3');
  });

  it('nunca devuelve una lista vacía: avisa en vez de dejar que el backend responda 400', () => {
    const c = build(true, []);

    expect(() =>
      c.prepareTransferTargetStockOrders({
        targetStockOrders: [
          { facility: { id: 42 }, internalLotNumber: '2026-41-02' },
        ],
      }),
    ).toThrowError(/Target stock orders are required/);
  });
});
