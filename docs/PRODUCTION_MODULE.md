# Production module

Manufacturing support for Click One: Bills of Materials, production runs
(raw material in, finished/byproduct/wastage out), and job work challans
(goods sent to an outside processor). Built on top of the existing
Common/Trading billing core — it reuses `Product`, `Party`, and `Counter`
rather than introducing parallel models.

## Where things live

| Concern | Files |
|---|---|
| Schema | `prisma/schema.prisma` — `Bom`, `BomLine`, `ProductionRun`, `ProductionInput`, `ProductionOutput`, `JobWorkChallan`, `JobWorkChallanLine`, `StockLedger`, plus `Product.stockCategory/wipQty/qtyWithJobWorker`, `Party.isJobWorker`, `Tenant.maxWastagePercent` |
| Stock math | `src/lib/stock/stock-movement.ts` — the one place any new code changes a stock balance |
| Run lifecycle | `src/lib/production/production-run-transitions.ts` |
| Yield/wastage math | `src/lib/production/yield.ts` |
| Numbering | `src/lib/production/numbering.ts` (`RUN-YYYY-NNNN`, `JWC-YYYY-NNNN`) |
| Server actions | `src/app/actions/boms.ts`, `production-runs.ts`, `job-work-challans.ts` |
| UI | `src/app/dashboard/production/**` |
| Demo data | `prisma/seed-production-demo.ts` (`npm run seed:production-demo`) |

## Stock model: three buckets per product

Every `Product` already has `stockQty` (on-hand). Two more balances were
added for this module:

- **`wipQty`** — quantity currently issued into an in-progress production
  run, not yet consumed. Only meaningful for products used as raw
  material inputs.
- **`qtyWithJobWorker`** — quantity sent out on an open job-work challan,
  not yet returned.

`stockCategory` (`RAW | WIP | FINISHED | BYPRODUCT | TRADE`) classifies
*what kind* of item a product is — it doesn't move when stock moves.
Existing trading items default to `TRADE` and are unaffected.

Every change to any of these three balances goes through
`recordStockMovement()` / `transferStockBucket()` in
`src/lib/stock/stock-movement.ts`, and each call writes one `StockLedger`
row (`productId`, signed `qty`, `bucket`, `reason`, `refType`/`refId`,
`date`) — a full audit trail of *why* a balance changed. Existing billing
code (invoice/purchase creation, `StockAdjustment`) still writes
`stockQty` directly and was **not** retrofitted onto this service —
that's a separate, higher-risk change to already-working billing flows
that wasn't part of adding this module.

## Selling rule (Feature 1)

Only `FINISHED`, `BYPRODUCT`, and `TRADE` items can go on a **sales**
invoice — enforced in `src/app/actions/invoices.ts` (both create and
edit), returning a clear error naming the offending item. Purchase bills
have no such restriction (a factory buys `RAW` material; existing
`TRADE` purchasing is unaffected).

## BOM

A `Bom` names one output product + standard batch qty, and a list of
`BomLine` inputs (qty + expected wastage %). **Only the primary output is
modeled** — byproducts and wastage are *not* part of the BOM recipe, they're
entered as actuals when a run completes (see below). If a mill's BOM
needs "500kg paddy → 330kg rice, 40kg bran, 100kg husk, 30kg wastage"
represented exactly, only the paddy→rice line is stored on the BOM; the
other three are just typical actuals a user enters on that BOM's runs.

Only one `Bom` can be `isActive` per `outputProductId` — enforced in the
server actions (`boms.ts`), not a DB constraint (Prisma doesn't support a
portable partial/filtered unique index across Postgres and the SQLite
offline build).

## Production run status flow

```
DRAFT ──start──> IN_PROGRESS ──complete──> COMPLETED
  │                   │
  └──────cancel───────┴──cancel──> CANCELLED
```

All transitions run inside a `db.$transaction`, orchestrated by
`src/lib/production/production-run-transitions.ts`:

1. **DRAFT** — just rows (`ProductionRun` + `ProductionInput`s). No stock
   effect. If created from a `Bom`, the UI pre-fills inputs scaled to the
   chosen batch size, but the user can freely edit them — whatever is
   saved is what gets issued.
2. **`startProductionRun`** (DRAFT → IN_PROGRESS): pre-flight-checks every
   input's `stockQty` via `checkSufficientStock()` — if anything is short,
   the run doesn't start and the caller gets back which items and by how
   much. On success, each input's quantity moves `ON_HAND → WIP`
   (`transferStockBucket`, reason `PRODUCTION_ISSUE`), and
   `ProductionInput.unitCost` is stamped from the product's *current*
   `purchasePrice` at this moment (not when the draft was created).
3. **`completeProductionRun`** (IN_PROGRESS → COMPLETED): takes the
   actual output lines (`productId`, `qty`, `outputType`:
   `FINISHED | BYPRODUCT | WASTAGE`).
   - Every input's full issued `WIP` quantity is deducted (reason
     `PRODUCTION_OUTPUT`) — it's been fully converted into whatever
     outputs and wastage resulted.
   - `FINISHED`/`BYPRODUCT` outputs credit `ON_HAND`. `WASTAGE` outputs
     touch **no** stock bucket — the `ProductionOutput` row itself is the
     record, used for reporting only.
   - Validation: total output (finished + byproduct + wastage) must not
     exceed total input, same unit only — blocks with an error otherwise.
     If output is >2% below input (same unit), a **non-blocking warning**
     is returned (some quantity is unaccounted for) but the run still
     completes.
   - `yieldPercent` = (total `FINISHED` output ÷ total input) × 100, same
     unit only — `null` (shown as "—") when inputs and outputs don't
     share exactly one unit, since the ratio wouldn't mean anything.
   - `wastageExceeded` is set when total `WASTAGE` ÷ total input exceeds
     `Tenant.maxWastagePercent` (default 5%), same unit only.
4. **`cancelProductionRun`** (DRAFT or IN_PROGRESS → CANCELLED): DRAFT
   never touched stock, so it's a pure status flip. IN_PROGRESS reverses
   the issue — every input's quantity moves back `WIP → ON_HAND`.
   COMPLETED runs cannot be cancelled.

## Job work challans

`JobWorkChallan.direction` is `OUTWARD` (goods sent out) or `INWARD` (a
return recorded against an outward challan via `linkedChallanId`).

- **Outward**: pre-flight-checks `ON_HAND` stock the same way a run
  start does, then moves each line's quantity `ON_HAND → WITH_JOB_WORKER`
  (reason `JOB_WORK_OUT`).
- **Inward return**: the returned item can be a **different product**
  from what was sent (fabric out, shirts back) — there's no forced 1:1
  line match. Returned items credit `ON_HAND` on whatever product the
  user selects (reason `JOB_WORK_IN`).

### Pending-quantity tracking is an approximation

Because returns can be a different product entirely, "how much is still
pending" can't always be computed exactly — you can't meaningfully
compare "500 kg of fabric" against "200 shirts". The implementation:

- Tracks pending **at the challan level**: total qty across the outward
  challan's lines, minus total qty across all inward returns linked to
  it, regardless of product. This is **exact** for the common case (the
  same item is returned — repair, reprocessing) and an approximation for
  true transformations.
- A return that would push the total returned above the total sent is
  rejected with a clear error.
- Status auto-derives: `OPEN` (nothing returned yet) →
  `PARTIALLY_RETURNED` (some, not all) → `CLOSED` (fully accounted for).
- The `WITH_JOB_WORKER` balance on the *original outward* products is
  released proportionally to how much of the total outward quantity a
  given return represents (`thisReturnQty / outwardTotalQty` applied to
  each outward line). This keeps `qtyWithJobWorker` trending toward zero
  as returns come in, without needing an exact per-product mapping.

If a shop's job-work pattern is mostly straightforward (same item back),
this is exact. If it's genuinely transformative on a large scale, treat
the derived status/balances as a good-enough default and reconcile
manually when needed — building exact per-transformation accounting
would need the job worker to report material consumption, which is
outside what this app can observe.

## Deleting a product with production history

`BomLine.inputProductId`, `ProductionInput.productId`,
`ProductionOutput.productId`, `JobWorkChallanLine.productId`, and
`StockLedger.productId` are all `onDelete: Restrict` — **intentionally**.
A product that's been used in a BOM, a run, a challan, or has ledger
history can't be deleted, the same way `InvoiceItem`/`StockBatch`/
`StockAdjustment` already protect products with billing history. This
also means a `Tenant` with any production history can't be deleted via a
plain cascade — children need deleting first (see
`removeExistingDemoTenant()` in the seed script for the correct order).

## Demo data

```
npm run seed:production-demo
```

Creates (or replaces) a **Demo Rice Mill** tenant — login
`demo@ricemill.test` / `DemoRiceMill123`, subscription pre-activated so
it's usable immediately:

- Products: Paddy (RAW), Rice (FINISHED), Bran (BYPRODUCT), Husk
  (BYPRODUCT), Milling Wastage (BYPRODUCT).
- One BOM: 500kg paddy → 330kg rice.
- `RUN-DEMO-0001` — **COMPLETED** (500kg paddy → 330kg rice + 40kg bran +
  100kg husk + 30kg wastage), 66% yield, wastage flagged (6% > 5%
  default threshold) — so reports have data immediately.
- `RUN-DEMO-0002` — left **IN_PROGRESS** (250kg paddy issued) so you can
  try the complete-run flow yourself instead of only seeing history.
- One job worker (Sundaram Packaging Works) and one **OPEN** outward
  challan (20kg bran) — so Job Work and its reports have data too.

Safe to re-run; it removes the previous demo tenant first.
