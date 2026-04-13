import { Validators } from '@angular/forms';
import { SimpleValidationScheme } from 'src/interfaces/Validation';
import { StockOrderType } from 'src/shared/types';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';

export function ApiStockOrderValidationScheme(orderType: StockOrderType) {
  return {
    validators: [],
    fields: {
      semiProduct: {
        validators: orderType === 'PURCHASE_ORDER' ? [Validators.required] : [],
      },
      producerUserCustomer: {
        validators: orderType === 'PURCHASE_ORDER' ? [Validators.required] : [],
      },
      representativeOfProducerUserCustomer: {
        validators: [],
      },
      totalQuantity: {
        validators: [],
      },
      totalGrossQuantity: {
        validators:
          orderType !== 'PROCESSING_ORDER' ? [Validators.required] : [],
      },
      moisturePercentage: {
        validators: [Validators.required, Validators.min(0), Validators.max(100)],
      },
      weekNumber: {
        validators: [Validators.required, Validators.min(1), Validators.max(53)],
      },
      productionDate: {
        validators: [Validators.required],
      },
      pricePerUnit: {
        validators: orderType === 'PURCHASE_ORDER' ? [Validators.required] : [],
      },
      currency: {
        validators: orderType === 'PURCHASE_ORDER' ? [Validators.required] : [],
      },
      preferredWayOfPayment: {
        validators: [Validators.required],
      },
      womenShare: {
        validators: orderType === 'PURCHASE_ORDER' ? [Validators.required] : [],
      },
      creatorId: {
        validators: orderType === 'PURCHASE_ORDER' ? [Validators.required] : [],
      },
    },
  } as SimpleValidationScheme<ApiStockOrder>;
}
