# Unified Freight Command Center Portal

**Active Port:** `5170`  
**Sovereign Directory:** `products/command-center-portal/`

---

## 1. Overview
The **Unified Freight Command Center Portal** provides an executive operational HUD orchestrating the end-to-end commercial freight lifecycle across the 5 specialized subproducts of the Trucking platform.

---

## 2. Integrated 5-Stage Freight Lifecycle

1. **Stage 1 — Asset Modeling & Digital Twin Catalog (Product 04 · Port 5176):**
   Select or forge commercial vehicles and packaging units from the 20-vehicle / 23-packaging taxonomy, evaluate spatial clearance and temporal fuel curves, and run multi-vehicle fleet partitioning.
2. **Stage 2 — 3D Cargo Fit, Packing & Axle Load Validation (Product 01 · Port 5173):**
   Pack freight deterministically into the equipment envelope, verify Federal Bridge Formula axle distribution, generate VICS Bill of Lading (BOL), and export EDI 204/214 documents.
3. **Stage 3 — Tactical Freight Pricing & Dispatch HUD (Product 02 · Port 5174):**
   Calculate carrier operating cost waterfalls, apply EIA diesel fuel escalation, establish minimum breakeven floors, and output broker rate confirmations.
4. **Stage 4 — FMCSA Hours of Service (HOS) & Corridor Legality (Product 03 · Port 5175):**
   Audit 11-hr driving and 14-hr shift windows, generate 24-hr ELD log sheets, and schedule mandatory rest breaks and 10-hour sleeper berth layovers.
5. **Stage 5 — Real-Time Fleet Telematics & CAN Bus Tracking (Product 05 · Port 5177):**
   Monitor live SAE J1939 engine RPM, coolant, oil pressure, DEF level, cold-chain reefer temperatures, GPS interstate corridors, and active DTC fault codes.

---

## 3. Architecture & Modules
- `src/engine/types.ts`: Domain models for lifecycle stages, freight orders, cross-product deep links, and operational status.
- `src/engine/lifecycle.ts`: Preset order catalog (Chicago-NYC Reefer, LA-Phoenix Heavy Steel, Atlanta-Dallas General Freight), lifecycle stage transitions, and URL parameter encoders.
- `src/ui/App.tsx`: High-contrast tactical command center UI with quick-launch tiles, lifecycle progress stepper, and interactive order selector.
- `tests/portal.test.ts`: Vitest test suite validating lifecycle stages and deep links.

---

## 4. Development & Verification
```bash
# Start local development server on port 5170
npm run dev

# Run Vitest test suite
npm test

# Build production bundle
npm run build

# Run typecheck
npm run typecheck
```
