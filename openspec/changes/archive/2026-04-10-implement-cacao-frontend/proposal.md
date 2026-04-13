# Proposal: Implement Cacao Frontend

## Intent
Synchronize the Angular Frontend (`inatrace-fe`) with the `agstack_dev` Cacao Premium backend. This eliminates historical constraints associated with Shrimp parameters and injects localized Cocoa processing variables natively into the UI—particularly moisture-based net weight formulation during stock intake.

## Scope

### In Scope
- Sync Auto-Generated Models via `generate-api.js` against port 8080 (backend).
- Add `weekNumber`, `parcelLot`, `variety`, `organicCertification`, and `moisturePercentage` into `stock-delivery-details` & `stock-bulk-delivery-details` ReactiveForms.
- Implement live UI Computation of `netQuantity` based dynamically on inputted `moisturePercentage`.
- Add Codebook selection for `CertificationType`.
- Map boolean visual flags on `facility.component.ts`.

### Out of Scope
- Complete redesign of the entire UI theme or dashboard CSS outside the scope of Cacao form fields.
- Modifying offline-sync caching architectures.

## Approach
Adopt the **UI-Calc Mode**:
1. Port the Backend on 8080.
2. Auto-generate the Swagger definition locally to fetch `ApiStockOrder` updates.
3. Hook Angular logic to listen to `moisturePercentage` form `valueChanges`, deducting exactly `((Gross - Tare) * (Moisture / 100))` to show the predictive Net Weight before POST.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `generate-api.js` | Modified | Port mapping for Backend API fetch |
| `src/api/*` | Modified | Transpiled `ApiStockOrder` / `ApiFacility` |
| `stock-core/*` | Modified | HTML DOM & ReactiveForms to encompass Cocoa fields |
| `validation.ts` | Modified | Add Moisture 0-100% min/max limits |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Swagger Generation Failure | Med | Confirm Backend successfully booted on `.env` vars before parsing. |
| Form Submit Blockage | Low | Write explicit tests for `validation.ts` numeric validations bounds. |

## Rollback Plan
Since the integration modifies multiple structural UI files, the safest rollback metric is to revert directly to the current commit `HEAD` of the `agstack_dev` branch for `/fe`, resetting generated APIs and reverting `.ts` form states unconditionally.

## Dependencies
- `agstack_dev` Java Backend running on `localhost:8080`.
- Keycloak setup for testing authorized `/v3/api-docs` reads (if Swagger gets protected).

## Success Criteria
- [ ] `./generate-api.js` compiles without structural TypeScript mismatches.
- [ ] Users can enter `moisturePercentage=50` and see `netQuantity` computed visibly.
- [ ] Creating a `StockOrder` natively persists Cocoa mappings to the database.
