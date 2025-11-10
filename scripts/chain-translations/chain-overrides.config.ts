/**
 * 🔧 Chain Translation Overrides Configuration
 * 
 * This file defines terminology differences between value chains.
 * 
 * Structure:
 * - Each chain (cocoa, shrimp, coffee) has overrides for es/en
 * - Only include keys that differ from base translations
 * - Base translations are in src/assets/locale/_base/
 * 
 * Maintenance:
 * - Add new overrides here as terminology differences are identified
 * - Run `npm run translations:sync` after any changes
 * - Run `npm run translations:validate` to check consistency
 * 
 * @author INATrace DevOps Team
 * @version 1.0.0
 */

export interface ChainOverrides {
  cocoa: {
    es?: Record<string, string>;
    en?: Record<string, string>;
  };
  shrimp: {
    es?: Record<string, string>;
    en?: Record<string, string>;
  };
  coffee: {
    es?: Record<string, string>;
    en?: Record<string, string>;
  };
}

/**
 * Chain-specific translation overrides
 * 
 * SHRIMP: Aquaculture/fishing terminology
 * - "Agricultor" → "Piscicultor" (Fish farmer)
 * - "kg" → "libras" (pounds)
 * - "Colector" → "Acopiador" (Collector)
 * 
 * COCOA: Default terminology (uses base as-is)
 * 
 * COFFEE: Coffee-specific terminology
 * - "Agricultor" → "Caficultor" (Coffee farmer)
 */
const CHAIN_OVERRIDES: ChainOverrides = {
  // ============================================================================
  // COCOA - Uses base translations without modifications
  // ============================================================================
  cocoa: {
    es: {},
    en: {}
  },

  // ============================================================================
  // SHRIMP - Aquaculture terminology
  // ============================================================================
  shrimp: {
    es: {
      // Farmer → Fish farmer / Shrimp producer
      'collectorDetail.roles.farmer': 'Piscicultor',
      'productLabelPurchaseOrder.sortOptions.farmer.name': 'Piscicultor',
      'collectorDetail.textinput.farmerCompanyInternalId.label': 'Identificación interna del piscicultor (ID)',
      'collectorDetail.textinput.farmerCompanyInternalId.placeholder': 'Introduzca identificación interna del piscicultor (ID)',
      'collectorDetail.textinput.farmerCompanyInternalId.error': 'Se requiere Identificación interna del piscicultor (ID)',
      'collectorDetail.section.balance': 'Saldo del piscicultor',
      'productLabelStakeholders.title.farmers': 'Piscicultores',
      'productLabelStakeholders.button.newFarmer': '{$START_TAG_SPAN}+ Añadir piscicultor{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.button.exportFarmerData': '{$START_TAG_SPAN}Exportar datos de piscicultores{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.subTitle.listOfFarmers': 'Lista de piscicultores',
      'productLabelStakeholders.tab2.title': 'Piscicultores',
      'collectorDetail.newFarmer.title': 'Nuevo piscicultor',
      'collectorDetail.editFarmer.title': 'Editar piscicultor',
      'farmerStoryPhotos.attachment-uploader.label': 'Foto del piscicultor o del grupo de piscicultores (PNG/JPG)',
      'farmerStoryPhotos.attachment-uploader.small': 'Suba una foto de alta calidad del piscicultor o grupo de piscicultores que mejor represente a su empresa/marca.',
      'facilityStockOrderPaymentModal.singleChoice.farmers': 'Piscicultor',
      'facilityStockOrderPaymentModal.title': 'Seleccione el piscicultor y la entrega',
      'orderHistoryView.tableCol.farmerRepresentative': 'Representante de los piscicultores',
      'paymentForm.textinput.payableTo.farmer': 'Piscicultor',
      'productLabelStockPayments.singleChoice.farmer.error.atLeastOne': 'Es necesario rellenar al menos uno de los campos del piscicultor',
      'productLabelStockPayments.singleChoice.farmer.error.onlyOne': 'Es necesario rellenar solo uno de los campos del piscicultor',
      'productLabelStockBulkPayments.textinput.payableTo.farmer': 'Piscicultor',

      // Collector → Acopiador (Collector/Aggregator)
      'collectorDetail.roles.collector': 'Acopiador',
      'productLabelStakeholders.title.collectors': 'Acopiadores',
      'productLabelStakeholders.button.newCollector': '{$START_TAG_SPAN}+ Añadir acopiador{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.subTitle.listOfCollectors': 'Lista de acopiadores',
      'productLabelStakeholders.tab1.title': 'Acopiadores',
      'productLabelStockBulkPayments.textinput.payableTo.collector': 'Acopiador',
      'paymentForm.textinput.payableTo.collector': 'Acopiador',

      // Units: kg → libras (pounds)
      'productLabelPurchaseOrder.sortOptions.quantityAvailable.name': 'Cantidad / Disponible (lb)',
      'productLabelProcessingAction.textinput.maxOutputWeight.label': 'Peso máximo de salida en libras',
      'productLabelProcessingAction.textinput.maxOutputWeight.placeholder': 'Introduzca el peso máximo de salida en libras',
      'productLabelProcessingAction.newProcessingAction.field.pricePerUnit': 'Precio (RWF) / lb para el productor',
      'productLabelProcessingAction.newProcessingAction.field.priceOwner': 'Precio (USD) / lb para el Propietario',
      'productLabelProcessingAction.newProcessingAction.field.priceBuyer': 'Precio (EUR) / lb para el Comprador',
      'productLabelProcessingAction.newProcessingAction.field.priceEndCustomer': 'Precio (EUR) / lb para el Cliente final',
      'collectorDetail.sortOptionsPO.quantity.name': 'Cantidad (lb)',

      // Delivery-specific terms
      'productLabelStock.tab0.title': 'Cosechas',  // Instead of "Entregas"
      'productLabelStock.search.purchase': 'cosecha',
      'productLabelPurchaseOrder.sortOptions.identifier.name': 'Cosecha',

      // Farm-specific terms for shrimp
      'collectorDetail.textinput.totalCultivatedArea.label': 'Área total de piscinas',
      'collectorDetail.textinput.totalCultivatedArea.placeholder': 'Ingrese área total de piscinas',
      'collectorDetail.textinput.plantCultivatedArea.label': 'Área de piscinas cultivadas con',
      'collectorDetail.textinput.plantCultivatedArea.placeholder': 'Ingrese área de piscinas cultivadas',
      'collectorDetail.textinput.areaOrganicCertified.label': 'Área certificada orgánica de piscinas',
      'collectorDetail.textinput.areaOrganicCertified.placeholder': 'Ingrese área certificada',
      'collectorDetail.section.farmInfo': 'Información de la granja acuícola',
      'collectorDetail.textinput.farmSize.label': 'Tamaño de la granja acuícola (ha)',
      'collectorDetail.textinput.farmSize.helpText': 'Introduzca el área total de la granja acuícola.',
      'collectorDetail.textinput.numberOfTrees.label': 'Cantidad total de estanques',
      'collectorDetail.textinput.numberOfTrees.placeholder': 'Introduzca la cantidad de estanques',
      'collectorDetail.checkbox-input.organicFarm': 'Granja acuícola certificada',
      'collectorDetail.textinput.fertilizerDescription.label': 'Plan de alimentación y bioseguridad',
      'collectorDetail.textinput.fertilizerDescription.helpText': 'Describa los alimentos, probióticos o insumos utilizados en la granja.',

      // Stakeholders terminology
      'productLabelStakeholders.title.producers': 'Productores acuícolas',
      'productLabelStakeholders.button.newProducer': '{$START_TAG_SPAN}+ Añadir productor acuícola{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.modal.producer.title': 'Añadir productor acuícola',
      'productLabelStakeholders.modal.producer.instructionsHtml': 'Seleccione la empresa acuícola',

      // Storytelling & front page content
      'frontPage.journey.title': 'Viaje del camarón',
      'front-page.fair-prices.paragraph1': 'Su lote de camarón es parte del pedido número {$INTERPOLATION}. Más abajo puede ver cuánto se pagó a los piscicultores por este pedido {$UNIT} en comparación con precios de referencia nacionales e internacionales.',
      'frontPage.fair-prices.title2': 'Aumento de los ingresos de los piscicultores mediante trazabilidad y transparencia',
      'frontPage.fair-prices.barChart.label1': 'Precio del camarón en el mercado mundial',
      'frontPage.fair-prices.barChart.label2': 'Precio de referencia del camarón certificado',
      'frontPage.fair-prices.barChart.label1Farmers': 'Precio actual por camarón exportado',
      'frontPage.fair-prices.barChart.label2Farmers': 'Precio estimado en mercado local',
      'frontPage.producers.title.meetFarmers': 'Conozca a los piscicultores',
      'frontPage.producers.title.meetCooperative': 'Conozca la organización acuícola',
      'frontPage.quality.paragraph.points': 'El gráfico muestra el puntaje de calidad de este lote de camarón considerando frescura, temperatura en cadena de frío y trazabilidad digital.',
      'frontPage.quality.paragraph.flavor': 'Textura firme, sabor dulce y balanceado, ideal para preparaciones a la parrilla, al vapor o salteadas.',
      'frontPage.quality.title': 'Calidad y certificaciones acuícolas',
      'frontPage.quality.flavourProfile': 'Perfil sensorial del camarón',
      'frontPage.quality.roastingProfile': 'Proceso post-cosecha',
      'frontPage.feedback.textinput.text.label': 'Los piscicultores desean recibir sus comentarios (¿Qué le gustó o qué mejoraría?)',
      'frontPage.feedback.taste': '1. ¿Cómo calificaría el sabor del camarón en comparación con otros productos que consume?',
      'frontPage.feedback.prepare': '2. ¿Cómo preparó el camarón? (es posible seleccionar respuestas múltiples)',
      'frontPage.feedback.checkbox-input.filterCoffee': 'Hervido',
      'frontPage.feedback.checkbox-input.espresso': 'A la plancha',
      'frontPage.feedback.checkbox-input.frenchPress': 'A la parrilla',
      'frontPage.feedback.checkbox-input.fullyAutomatic': 'Al horno',
      'frontPage.feedback.checkbox-input.stovetop': 'Salteado',
      'frontPage.feedback.textinput.other.label': 'Otra preparación',

      // Processing terminology
      'productLabelProcessingAction.newProcessingAction.field.screenSize': 'Calibre',
      'productLabelProcessingAction.newProcessingAction.field.flavourProfile': 'Notas sensoriales',
      'productLabelProcessingAction.newProcessingAction.field.cuppingResult': 'Resultados de laboratorio',
      'productLabelProcessingAction.newProcessingAction.field.cuppingGrade': 'Puntaje de laboratorio',
      'productLabelProcessingAction.newProcessingAction.field.cuppingFlavour': 'Notas sensoriales',
      'productLabelProcessingAction.newProcessingAction.field.roastingDate': 'Fecha de procesamiento en planta',
      'productLabelProcessingAction.newProcessingAction.field.roastingProfile': 'Proceso post-cosecha'
    },

    en: {
      // Farmer → Fish farmer / Shrimp producer
      'collectorDetail.roles.farmer': 'Fish farmer',
      'productLabelPurchaseOrder.sortOptions.farmer.name': 'Fish farmer',
      'collectorDetail.textinput.farmerCompanyInternalId.label': 'Fish farmer internal ID',
      'collectorDetail.textinput.farmerCompanyInternalId.placeholder': 'Enter fish farmer internal ID',
      'collectorDetail.textinput.farmerCompanyInternalId.error': 'Fish farmer internal ID is required',
      'collectorDetail.section.balance': 'Fish farmer balance',
      'productLabelStakeholders.title.farmers': 'Fish farmers',
      'productLabelStakeholders.button.newFarmer': '{$START_TAG_SPAN}+ Add fish farmer{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.button.exportFarmerData': '{$START_TAG_SPAN}Export fish farmers data{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.subTitle.listOfFarmers': 'List of fish farmers',
      'productLabelStakeholders.tab2.title': 'Fish farmers',
      'collectorDetail.newFarmer.title': 'New fish farmer',
      'collectorDetail.editFarmer.title': 'Edit fish farmer',
      'farmerStoryPhotos.attachment-uploader.label': 'Photo of fish farmer or group (PNG/JPG)',
      'farmerStoryPhotos.attachment-uploader.small': 'Upload a high quality photo of the fish farmer or group that best represents your company/brand.',
      'facilityStockOrderPaymentModal.singleChoice.farmers': 'Fish farmer',
      'facilityStockOrderPaymentModal.title': 'Select fish farmer and delivery',
      'orderHistoryView.tableCol.farmerRepresentative': 'Fish farmer representative',
      'paymentForm.textinput.payableTo.farmer': 'Fish farmer',
      'productLabelStockPayments.singleChoice.farmer.error.atLeastOne': 'At least one of the fish farmer fields must be filled',
      'productLabelStockPayments.singleChoice.farmer.error.onlyOne': 'Only one of the fish farmer fields must be filled',
      'productLabelStockBulkPayments.textinput.payableTo.farmer': 'Fish farmer',

      // Collector → Aggregator
      'collectorDetail.roles.collector': 'Aggregator',
      'productLabelStakeholders.title.collectors': 'Aggregators',
      'productLabelStakeholders.button.newCollector': '{$START_TAG_SPAN}+ Add aggregator{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.subTitle.listOfCollectors': 'List of aggregators',
      'productLabelStakeholders.tab1.title': 'Aggregators',
      'productLabelStockBulkPayments.textinput.payableTo.collector': 'Aggregator',
      'paymentForm.textinput.payableTo.collector': 'Aggregator',

      // Units: kg → lbs (pounds)
      'productLabelPurchaseOrder.sortOptions.quantityAvailable.name': 'Quantity / Available (lbs)',
      'productLabelProcessingAction.textinput.maxOutputWeight.label': 'Maximum output weight in lbs',
      'productLabelProcessingAction.textinput.maxOutputWeight.placeholder': 'Enter maximum output weight in lbs',
      'productLabelProcessingAction.newProcessingAction.field.pricePerUnit': 'Price (RWF) / lb for producer',
      'productLabelProcessingAction.newProcessingAction.field.priceOwner': 'Price (USD) / lb for Owner',
      'productLabelProcessingAction.newProcessingAction.field.priceBuyer': 'Price (EUR) / lb for Buyer',
      'productLabelProcessingAction.newProcessingAction.field.priceEndCustomer': 'Price (EUR) / lb for End customer',
      'collectorDetail.sortOptionsPO.quantity.name': 'Quantity (lbs)',

      // Delivery-specific terms
      'productLabelStock.tab0.title': 'Harvests',
      'productLabelStock.search.purchase': 'harvest',
      'productLabelPurchaseOrder.sortOptions.identifier.name': 'Harvest',

      // Farm-specific terms for shrimp
      'collectorDetail.textinput.totalCultivatedArea.label': 'Total pond area',
      'collectorDetail.textinput.totalCultivatedArea.placeholder': 'Enter total pond area',
      'collectorDetail.textinput.plantCultivatedArea.label': 'Cultivated pond area with',
      'collectorDetail.textinput.plantCultivatedArea.placeholder': 'Enter cultivated pond area',
      'collectorDetail.textinput.areaOrganicCertified.label': 'Organic certified pond area',
      'collectorDetail.textinput.areaOrganicCertified.placeholder': 'Enter certified area',
      'collectorDetail.section.farmInfo': 'Aquaculture farm information',
      'collectorDetail.textinput.farmSize.label': 'Aquaculture farm size (ha)',
      'collectorDetail.textinput.farmSize.helpText': 'Enter the total area of the aquaculture farm.',
      'collectorDetail.textinput.numberOfTrees.label': 'Total number of ponds',
      'collectorDetail.textinput.numberOfTrees.placeholder': 'Enter the number of ponds',
      'collectorDetail.checkbox-input.organicFarm': 'Certified aquaculture farm',
      'collectorDetail.textinput.fertilizerDescription.label': 'Feed and biosecurity plan',
      'collectorDetail.textinput.fertilizerDescription.helpText': 'Describe the feeds, probiotics or inputs used on the farm.',

      // Stakeholders terminology
      'productLabelStakeholders.title.producers': 'Aquaculture producers',
      'productLabelStakeholders.button.newProducer': '{$START_TAG_SPAN}+ Add aquaculture producer{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.modal.producer.title': 'Add aquaculture producer',
      'productLabelStakeholders.modal.producer.instructionsHtml': 'Select the aquaculture company',

      // Storytelling & front page content
      'frontPage.journey.title': 'Shrimp product journey',
      'front-page.fair-prices.paragraph1': 'Your shrimp lot is part of order number {$INTERPOLATION}. Below you can see how much was paid to the fish farmers for this order {$UNIT} compared with national and international benchmarks.',
      'frontPage.fair-prices.title2': 'Improving fish farmers income through traceability and transparency',
      'frontPage.fair-prices.barChart.label1': 'World market price for shrimp',
      'frontPage.fair-prices.barChart.label2': 'Certified shrimp reference price',
      'frontPage.fair-prices.barChart.label1Farmers': 'Current price for exported shrimp',
      'frontPage.fair-prices.barChart.label2Farmers': 'Estimated price on local market',
      'frontPage.producers.title.meetFarmers': 'Meet the fish farmers',
      'frontPage.producers.title.meetCooperative': 'Meet the aquaculture organization',
      'frontPage.quality.paragraph.points': 'The chart shows the quality score of this shrimp lot based on freshness, cold chain temperature and digital traceability.',
      'frontPage.quality.paragraph.flavor': 'Firm texture, sweet balanced flavor, perfect for grilling, steaming or sautéing.',
      'frontPage.quality.title': 'Aquaculture quality and certifications',
      'frontPage.quality.flavourProfile': 'Shrimp sensory profile',
      'frontPage.quality.roastingProfile': 'Post-harvest process',
      'frontPage.feedback.textinput.text.label': 'Fish farmers would love to hear your feedback (what did you like or what can improve?)',
      'frontPage.feedback.taste': '1. How would you rate the taste of the shrimp compared to other products you consume?',
      'frontPage.feedback.prepare': '2. How did you prepare the shrimp? (multiple answers allowed)',
      'frontPage.feedback.checkbox-input.filterCoffee': 'Boiled',
      'frontPage.feedback.checkbox-input.espresso': 'Griddled',
      'frontPage.feedback.checkbox-input.frenchPress': 'Grilled',
      'frontPage.feedback.checkbox-input.fullyAutomatic': 'Baked',
      'frontPage.feedback.checkbox-input.stovetop': 'Sautéed',
      'frontPage.feedback.textinput.other.label': 'Other preparation',

      // Processing terminology
      'productLabelProcessingAction.newProcessingAction.field.screenSize': 'Size grade',
      'productLabelProcessingAction.newProcessingAction.field.flavourProfile': 'Sensory notes',
      'productLabelProcessingAction.newProcessingAction.field.cuppingResult': 'Lab test results',
      'productLabelProcessingAction.newProcessingAction.field.cuppingGrade': 'Lab score',
      'productLabelProcessingAction.newProcessingAction.field.cuppingFlavour': 'Sensory notes',
      'productLabelProcessingAction.newProcessingAction.field.roastingDate': 'Processing plant date',
      'productLabelProcessingAction.newProcessingAction.field.roastingProfile': 'Post-harvest process'
    }
  },

  // ============================================================================
  // COFFEE - Coffee-specific terminology
  // ============================================================================
  coffee: {
    es: {
      // Farmer → Coffee farmer
      'collectorDetail.roles.farmer': 'Caficultor',
      'productLabelPurchaseOrder.sortOptions.farmer.name': 'Caficultor',
      'collectorDetail.textinput.farmerCompanyInternalId.label': 'Identificación interna del caficultor (ID)',
      'collectorDetail.textinput.farmerCompanyInternalId.placeholder': 'Introduzca identificación interna del caficultor (ID)',
      'collectorDetail.textinput.farmerCompanyInternalId.error': 'Se requiere Identificación interna del caficultor (ID)',
      'collectorDetail.section.balance': 'Saldo del caficultor',
      'productLabelStakeholders.title.farmers': 'Caficultores',
      'productLabelStakeholders.button.newFarmer': '{$START_TAG_SPAN}+ Añadir caficultor{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.button.exportFarmerData': '{$START_TAG_SPAN}Exportar datos de caficultores{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.subTitle.listOfFarmers': 'Lista de caficultores',
      'productLabelStakeholders.tab2.title': 'Caficultores',
      'collectorDetail.newFarmer.title': 'Nuevo caficultor',
      'collectorDetail.editFarmer.title': 'Editar caficultor',
      'farmerStoryPhotos.attachment-uploader.label': 'Foto del caficultor o del grupo de caficultores (PNG/JPG)',
      'farmerStoryPhotos.attachment-uploader.small': 'Suba una foto de alta calidad del caficultor o grupo de caficultores que mejor represente a su empresa/marca.',
      'facilityStockOrderPaymentModal.singleChoice.farmers': 'Caficultor',
      'facilityStockOrderPaymentModal.title': 'Seleccione el caficultor y la entrega',
      'orderHistoryView.tableCol.farmerRepresentative': 'Representante de los caficultores',
      'paymentForm.textinput.payableTo.farmer': 'Caficultor',
      'productLabelStockPayments.singleChoice.farmer.error.atLeastOne': 'Es necesario rellenar al menos uno de los campos del caficultor',
      'productLabelStockPayments.singleChoice.farmer.error.onlyOne': 'Es necesario rellenar solo uno de los campos del caficultor',
      'productLabelStockBulkPayments.textinput.payableTo.farmer': 'Caficultor',
    },

    en: {
      // Farmer → Coffee farmer
      'collectorDetail.roles.farmer': 'Coffee farmer',
      'productLabelPurchaseOrder.sortOptions.farmer.name': 'Coffee farmer',
      'collectorDetail.textinput.farmerCompanyInternalId.label': 'Coffee farmer internal ID',
      'collectorDetail.textinput.farmerCompanyInternalId.placeholder': 'Enter coffee farmer internal ID',
      'collectorDetail.textinput.farmerCompanyInternalId.error': 'Coffee farmer internal ID is required',
      'collectorDetail.section.balance': 'Coffee farmer balance',
      'productLabelStakeholders.title.farmers': 'Coffee farmers',
      'productLabelStakeholders.button.newFarmer': '{$START_TAG_SPAN}+ Add coffee farmer{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.button.exportFarmerData': '{$START_TAG_SPAN}Export coffee farmers data{$CLOSE_TAG_SPAN}',
      'productLabelStakeholders.subTitle.listOfFarmers': 'List of coffee farmers',
      'productLabelStakeholders.tab2.title': 'Coffee farmers',
      'collectorDetail.newFarmer.title': 'New coffee farmer',
      'collectorDetail.editFarmer.title': 'Edit coffee farmer',
      'farmerStoryPhotos.attachment-uploader.label': 'Photo of coffee farmer or group (PNG/JPG)',
      'farmerStoryPhotos.attachment-uploader.small': 'Upload a high quality photo of the coffee farmer or group that best represents your company/brand.',
      'facilityStockOrderPaymentModal.singleChoice.farmers': 'Coffee farmer',
      'facilityStockOrderPaymentModal.title': 'Select coffee farmer and delivery',
      'orderHistoryView.tableCol.farmerRepresentative': 'Coffee farmer representative',
      'paymentForm.textinput.payableTo.farmer': 'Coffee farmer',
      'productLabelStockPayments.singleChoice.farmer.error.atLeastOne': 'At least one of the coffee farmer fields must be filled',
      'productLabelStockPayments.singleChoice.farmer.error.onlyOne': 'Only one of the coffee farmer fields must be filled',
      'productLabelStockBulkPayments.textinput.payableTo.farmer': 'Coffee farmer',
    }
  }
};

/**
 * Load chain overrides configuration
 */
export function loadChainOverrides(): ChainOverrides {
  return CHAIN_OVERRIDES;
}

/**
 * Get overrides for a specific chain and language
 */
export function getChainOverrides(chain: keyof ChainOverrides, language: 'es' | 'en'): Record<string, string> {
  return CHAIN_OVERRIDES[chain]?.[language] || {};
}

/**
 * Get all override keys for a specific chain
 */
export function getChainOverrideKeys(chain: keyof ChainOverrides): string[] {
  const esKeys = Object.keys(CHAIN_OVERRIDES[chain]?.es || {});
  const enKeys = Object.keys(CHAIN_OVERRIDES[chain]?.en || {});
  return [...new Set([...esKeys, ...enKeys])];
}
