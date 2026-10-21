# Unified Freight Command Center Portal

## 1. Instruction Hierarchy & Governance
This directory governs the Unified Command Center Portal of the TRUCKING platform.
Precedence:
1. `/Users/pranay/AGENTS.md`
2. `/Users/pranay/Projects/AGENTS.md`
3. `/Users/pranay/Projects/trucking/AGENTS.md`
4. This file (`products/command-center-portal/AGENTS.md`)
5. Local `OPERATING_DOCTRINE.md`

Compatibility symlinks (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`) must point directly to this file.

---

## 2. Product Identity & Domain Boundary
- **Port:** `5170`
- **Focus:** Executive freight operations portal orchestrating the end-to-end commercial freight lifecycle across all 5 specialized subproducts: Asset Selection (P04) -> 3D Cargo Fit (P01) -> Tactical Pricing (P02) -> Corridor HOS Compliance (P03) -> Live Corridor Telematics (P05).
- **Tech Stack:** React 19, TypeScript, Vite 7, Vitest 3.

---

## 3. Sovereign Verification Commands
```bash
npm test        # Run 4 Vitest tests
npm run build   # Typecheck and production bundle build
npm run dev     # Start local server on port 5170
```

---

## 4. Cross-Project Bridges
- **Orchestrates:**
  - Product 01 (Cargo Fit · Port 5173)
  - Product 02 (Freight Pricing HUD · Port 5174)
  - Product 03 (HOS Planner · Port 5175)
  - Product 04 (Asset Studio · Port 5176)
  - Product 05 (Fleet Telematics · Port 5177)

---

## 5. Git & Mutation Policy
- Read-only inspection is permitted (`git status`, `git diff`, `git log`).
- Staging, commits, pushes, and branch changes require explicit user authorization.
