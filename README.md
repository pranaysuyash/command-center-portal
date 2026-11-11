# Command Center Portal (`PORT 5170`)

Top-level unified freight command center and multi-product orchestration shell under `products/command-center-portal/`. It connects eight operational lifecycle tools over cross-tab `BroadcastChannel` (`trucking-platform-bus`) events, scenario handoffs, role-based views, and ANSI X12 EDI bundles.

## Supported Lifecycle Stages

1. **Stage 1, Asset Studio (`product-04-asset-studio`, Port 5176):** equipment digital twin catalog, 2D/3D chassis geometry, and dynamic axle CG distribution.
2. **Stage 2, Cargo Fit (`product-01-cargo-fit`, Port 5173):** 3D pallet packing heuristics, payload cubic utilization, and bridge formula checks.
3. **Stage 3, Warehouse Space & Flow (`product-06-warehouse-space-flow`, Port 5178):** inbound space planning, HazMat compatibility, and EPCIS 2.0 putaway execution.
4. **Stage 4, Carrier Safety & Trust (`product-08-carrier-trust`, Port 5180):** FMCSA SMS BASIC score simulation, insurance review, and anti-fraud rules.
5. **Stage 5, Freight Pricing HUD (`product-02-freight-pricing`, Port 5174):** carrier cost waterfall, EIA diesel index pegging, and operating ratio calculation.
6. **Stage 6, HOS Planner (`product-03-hos-planner`, Port 5175):** FMCSA Part 395 duty clock modeling and corridor rest-stop itinerary.
7. **Stage 7, Fleet Telematics (`product-05-fleet-telematics`, Port 5177):** SAE J1939 telemetry simulator, reefer excursion monitoring, and geofence alerts.
8. **Stage 8, Yard & Dock (`product-07-yard-dock`, Port 5179):** gate check-in, door allocation, dwell tracking, and detention estimates.

Cross-product context passes through URL query parameters (`source=command_center_portal`) and `PlatformEventBus` events, without modifying standalone subproduct functionality.

## Standalone Local Development

```bash
npm install
npm run dev
```

For full integrated browser checks, run the eight subproduct dev servers on ports `5173` through `5180` alongside this portal on `5170`. When run alone, the portal displays simulated order presets and scenario data cleanly without external servers.

## Verification

Run `npm test` and `npm run build` inside `products/command-center-portal/` to validate lifecycle routing, persona cockpit projections, platform event bus messaging, and ANSI X12 EDI (204/990/214/210) generation.
