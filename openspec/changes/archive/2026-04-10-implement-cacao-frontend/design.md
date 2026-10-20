# Design: Implement Cacao Frontend

## Technical Approach
Following the **UI-Calc Mode** selected in the Proposal, we will synchronize the Swagger definitions via `generate-api.js` against port `8080` to populate the `ApiStockOrder` with the Cocoa backend fields. At the component level (`stock-delivery-details` and `stock-bulk-delivery-details`), we will inject `ReactiveForms` controls for `moisturePercentage`, `weekNumber`, `parcelLot`, and `variety`, updating the `setToBePaid()` method to calculate `netWeight` symmetrically to the backend logic.

## Architecture Decisions

### Decision: Local Swagger Auto-gen vs Manual Interface Extension

**Choice**: Regenerate API via `generate-api.js` mapping to `localhost:8080/v3/api-docs`.
**Alternatives considered**: Manually inserting `weekNumber?: number` into `ApiStockOrder.ts`.
**Rationale**: INATrace strongly enforces API sync. Skipping codegen disables future schema updates and fractures the type system between the frontend and the `agstack_dev` backend constraints.

### Decision: Net Weight Predictive Calculation

**Choice**: Modify `setToBePaid()` in `stock-delivery-details.component.ts` to hook `moisturePercentage` into `netWeight`.
**Alternatives considered**: Send Data blindly and await POST response to render values.
**Rationale**: The farmers using *Fortaleza del Valle* require instant cost prediction. Augmenting `netWeight = netWeight * (moisturePercentage / 100)` locally respects the UX demands before the backend ultimately validates it.

## Data Flow

    Farmer UI (Angular)
         │  1. `valueChanges` on moisture/tare
         ▼
    `setToBePaid()` computes predicted netQuantity & cost
         │  2. Submit StockOrder (`ApiStockOrder`)
         ▼
    Java Backend (`StockOrderController`)
         │  3. Re-computes actual Net Quantity
         ▼
    PostgreSQL local DB (storing Cocoa variables)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `generate-api.js` | Modify | Switch port from `8082` to `8080`. |
| `src/api/*` | Modify | Overridden by `./generate-api.js`. |
| `stock-delivery-details.component.ts` | Modify | Add Cacao fields to the Form creation and `setToBePaid()` logic. |
| `stock-delivery-details.component.html` | Modify | Add inputs for Week Number, Moisture (%), Parcel Lot, Variety. |
| `stock-bulk-delivery-details.component.ts/html` | Modify | Ditto for bulk intake components. |
| `facility.component.ts` | Modify | Allow toggling `displayMoisturePercentage` flags. |
| `validation.ts` | Modify | `moisturePercentage` bound to `Min(0)` & `Max(100)`. |

## Interfaces / Contracts

```typescript
// Auto-generated subset expected from Swagger
export interface ApiStockOrder {
    // ...existing
    weekNumber?: number;
    parcelLot?: string;
    variety?: string;
    moisturePercentage?: number;
    netQuantity?: number;
    organicCertification?: string; 
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `setToBePaid()` | Invoke the form calculation providing `Tare=100`, `Gross=200`, `Moisture=50` and verify Cost output matches expected deduction. |
| Integration | Forms Validations | Assert Form remains Invalid (`cannotUpdatePO()`) when `moisturePercentage > 100` or below 0. |

## Migration / Rollout
No database migration required at the UI layer. Ensure Backend is deployed with Flyway configuration `V2026_04_10_01_00`.

## Open Questions
- None. Design is locked to match exactly the established Java backend variables.
