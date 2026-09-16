import { PlotsItemComponent } from './plots-item.component';

describe('PlotsItemComponent.cocoaVarietyLabels', () => {
  it('muestra 1 y 2 con numericVarietyOptions, sin cambiar el valor guardado', () => {
    const labels = PlotsItemComponent.cocoaVarietyLabels({
      configuration: { numericVarietyOptions: true },
    } as any);
    expect(labels).toEqual({ ORGANICO: '1', CCN51: '2' });
  });

  it('mantiene Orgánico / CCN51 sin la opción o sin empresa', () => {
    const expected = { ORGANICO: 'Orgánico', CCN51: 'CCN51' };
    expect(PlotsItemComponent.cocoaVarietyLabels(null)).toEqual(expected);
    expect(PlotsItemComponent.cocoaVarietyLabels({ configuration: { onlyNacionalVariety: true } } as any)).toEqual(expected);
  });
});
