## Exploration: Implement Cacao Frontend

### Current State
Currently, the frontend provides `stock-delivery-details` and `stock-bulk-delivery-details` heavily reliant on the legacy MySQL baseline (`grossQuantity`, `tare`) without domain-specific input limits or definitions for Cacao Premium parameters natively added on the `agstack_dev` backend. Furthermore, the Swagger generated API interfaces like `ApiStockOrder` do not reflect the new variables.

### Affected Areas
- `fe/generate-api.js` — Needs backend mapping (port configuration) to accurately update all `ApiStockOrder` and `ApiFacility` interfaces locally.
- `fe/apps/inatrace-fe/src/api/` — The auto-generated models that the Angular services invoke.
- `fe/apps/inatrace-fe/src/app/company/company-stock/stock-core/stock-delivery-details/stock-delivery-details.component.ts|html` — The actual reactive forms where the user enters the `StockOrder` inputs.
- `fe/apps/inatrace-fe/src/app/company/company-stock/stock-core/stock-bulk-delivery-details/stock-bulk-delivery-details.component.ts|html` — The massive-upload parallel form.
- `fe/apps/inatrace-fe/src/app/company/company-stock/stock-core/stock-delivery-details/validation.ts` — Requires limits for `moisturePercentage` (0–100%) and `weekNumber`.

### Approaches
1. **Regenerate API and Modify ReactiveForms (UI-Calc Mode)**
   - **Description:** Adjust the `generate-api.js` script to connect to the new Java Backend locally (`:8080`), re-sync `ApiStockOrder` Typescript definitions. Add `weekNumber`, `parcelLot`, `variety`, `moisturePercentage` into `formControlName`, and calculate `netQuantity` visually inside the component HTML reacting to changes in `moisture` input before submitting to Backend.
   - **Pros:** Fast UX visually predicting the `netQuantity`; tight TS definitions.
   - **Cons:** Frontend duplicates the business math formula slightly.
   - **Effort:** Medium

2. **Backend-Only Calculation with Payload Sync**
   - **Description:** Add the new Cacao domains, but don't compute `netQuantity` locally. Only display the raw inputs, submit, and display the resulting weight only upon retrieving the saved payload or reloading the table.
   - **Pros:** No business logic duplicated entirely.
   - **Cons:** Poorer UX as farmers won't know their net kilos instantly while typing.
   - **Effort:** Low

### Recommendation
**Approach 1: Regenerate API and Modify ReactiveForms (UI-Calc Mode).** 
To provide the best User Experience to the farmers/cooperatives in *Fortaleza del Valle*, observing the deducción (deduction) of net weight dynamically while typing the moisture levels is essential. Since the Backend enforces the final value validation via `.calculateNetQuantity()` anyway, displaying a front-end estimation creates harmony.
Additionally, pulling API parameters straight via `generate-api.js` avoids manual typing deviations in model mappings.

### Risks
- **Swagger Availability:** `generate-api.js` requires the Java Backend running correctly on the target port locally to read `/v3/api-docs`. If it fails, the models won't generate.
- **Form Validity:** Modifying `validation.ts` with required fields could temporarily block `StockOrder` creation flow if not tested end-to-end.

### Ready for Proposal
Yes — We have identified the exact components and scripts required to migrate Cacao interfaces successfully into Angular.
