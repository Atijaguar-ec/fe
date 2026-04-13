# Tasks: Implement Cacao Frontend

## Phase 1: API Code Generation

- [x] 1.1 Modify `fe/generate-api.js` to target port `:8080` instead of `:8082`.
- [x] 1.2 Bootstrap the local Java Backend (`agstack_dev`) so it's actively serving `/v3/api-docs`.
- [x] 1.3 Run `node generate-api.js` to map `weekNumber`, `parcelLot`, `variety`, `moisturePercentage`, `netQuantity`, `organicCertification` directly to `apps/inatrace-fe/src/api/model/apiStockOrder.ts`.

## Phase 2: ReactiveForms UI Integration (`stock-delivery-details`)

- [x] 2.1 Update `apps/inatrace-fe/src/app/company/company-stock/stock-core/stock-delivery-details/stock-delivery-details.component.html` layout to inject `variety`, `parcelLot`, `weekNumber`, `organicCertification`, and `moisturePercentage` standard `<input>` and `<select>` blocks.
- [x] 2.2 Update `stock-delivery-details.component.ts` Reactive Form initialization matching `ApiStockOrder.formMetadata()`.
- [x] 2.3 Modify hook `setToBePaid()` inside `stock-delivery-details.component.ts` to compute: `netWeight = (grossQuantity - tare) * (moisturePercentage / 100)`.

## Phase 3: Bulk ReactiveForms Sync (`stock-bulk-delivery-details`)

- [ ] 3.1 Synchronize HTML views mirroring Phase 2.1 inside `apps/inatrace-fe/src/app/company/company-stock/stock-core/stock-bulk-delivery-details/stock-bulk-delivery-details.component.html`.
- [ ] 3.2 Update `stock-bulk-delivery-details.component.ts` mapping arrays.

## Phase 4: Facility Configuration & Validations

- [x] 4.1 Update `apps/inatrace-fe/src/app/company/company-stock/stock-core/stock-delivery-details/validation.ts`, mapping `moisturePercentage` using `Validators.min(0)` and `Validators.max(100)`.
- [ ] 4.2 Expose `displayFinalPriceDiscount` and `displayMoisturePercentage` toggle flags in `facility.component.ts/.html` config layout.
- [ ] 4.3 Add `<ngx-select>` block for Codebooks (`CertificationType`) if applicable on `stock-delivery-details.component.ts`.

## Phase 5: Verification & Cleanup

- [ ] 5.1 Run `npm run build inatrace-fe` to verify TypeScript AST compliance.
- [ ] 5.2 Validate local UI via `npm start inatrace-fe`, entering `Gross:100; Tare:20; Moist:50` verifying `Cost / Net Weight` defaults appropriately.
