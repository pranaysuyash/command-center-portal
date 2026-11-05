# Operating Doctrine Review

- Doctrine path: /Users/pranay/Projects/trucking/products/command-center-portal/OPERATING_DOCTRINE.md
- SHA-256: e14bab7b1964d8b755c9e6c7f5b1c2b44e1d726033fa23aeaee6ce921e271a75
- Generated: 2026-11-05T10:05:05Z
- This is a generated review artifact, not an instruction source.

## SECTION_0

- Label: §0 Start from live truth
- Reviewed: True
- Evidence: Read live truth: git status showed 5 dirty paths (src/engine/types.ts, src/ui/App.tsx, src/ui/icons.tsx, new PersonaCockpitSwitcher.tsx, new personaCockpit.test.ts) plus full diffs.

## SECTION_00_INTEGRATED

- Label: Full doctrine integrated audit
- Reviewed: True
- Evidence: Integrated audit of OPERATING_DOCTRINE.md across 18 sections for this diff: live truth read first (git status/diff of src/engine/types.ts, src/ui/App.tsx, src/ui/icons.tsx); outcomes limited to icon-label corrections plus a typed persona cockpit in src/ui/PersonaCockpitSwitcher.tsx; canonical single source kept and the old nested ternary removed; additive edits preserve existing lifecycle rendering; evidence from npm test (5 files/30 tests) and npm run build; no AI, auth, or external effects introduced; residual risk is visual only in src/ui/App.tsx ROLE FOCUS badges.

## SECTION_1

- Label: §1 Outcomes and retained value
- Reviewed: True
- Evidence: Outcomes: src/engine/types.ts corrects P06/P07/P08 icon labels; src/ui/App.tsx adds getProductSystemId and persona cockpit; tests/personaCockpit.test.ts locks the roster.

## SECTION_10

- Label: §10 Parallel work and contested state
- Reviewed: True
- Evidence: Parallel work: src/ui/App.tsx edits additive (new state, new mount); existing 5-stage ribbon logic preserved, comment renamed to 8-Stage.

## SECTION_11

- Label: §11 Engineering and data integrity
- Reviewed: True
- Evidence: Engineering integrity: src/ui/PersonaCockpitSwitcher.tsx exports typed interfaces; tests/personaCockpit.test.ts covers no-NaN metric evaluation and fallback lookup.

## SECTION_12

- Label: §12 AI output boundary
- Reviewed: True
- Evidence: AI boundary: n/a: no model calls added; role metrics are deterministic functions in src/ui/PersonaCockpitSwitcher.tsx.

## SECTION_13

- Label: §13 Product, operator, and claim reality
- Reviewed: True
- Evidence: Product reality: src/ui/PersonaCockpitSwitcher.tsx roles map to existing lifecycle stages declared in src/engine/types.ts; no new claim surface.

## SECTION_14

- Label: §14 Documentation and decisions
- Reviewed: True
- Evidence: Documentation: n/a: change documented in commit message; no docs/ file changed in this diff.

## SECTION_15

- Label: §15 Completion contract
- Reviewed: True
- Evidence: Completion contract: npm test 30/30 pass, npm run build exits 0; report covers src/ and tests/ paths only.

## SECTION_16

- Label: §16 Specialist doctrine routing
- Reviewed: True
- Evidence: Specialist doctrine: n/a: no review/security/release doctrine gate triggered by src/ui UI change.

## SECTION_17

- Label: §17 Propagation contract
- Reviewed: True
- Evidence: Propagation: src/engine/types.ts icon fix propagates to src/ui/App.tsx SUB_PRODUCTS rendering and src/ui/icons.tsx ProductIcon switch.

## SECTION_2

- Label: §2 Truth taxonomy
- Reviewed: True
- Evidence: Truth taxonomy: tests/personaCockpit.test.ts asserts roster/metrics; role metrics read from FreightOrderSpec via src/ui/PersonaCockpitSwitcher.tsx focalMetrics(order), not fabricated.

## SECTION_3

- Label: §3 Proportional rigor and evidence
- Reviewed: True
- Evidence: Evidence: npm test ran 5 files / 30 tests passed including tests/personaCockpit.test.ts (6 its); npm run build typecheck+build.

## SECTION_4

- Label: §4 Authorization and side effects
- Reviewed: True
- Evidence: Authorization: user explicitly authorized repo publish; edits confined to src/ui/App.tsx, src/ui/icons.tsx, src/engine/types.ts and new component/test files.

## SECTION_5

- Label: §5 Canonical paths and ownership
- Reviewed: True
- Evidence: Canonical ownership: src/ui/PersonaCockpitSwitcher.tsx is the single persona-role source; App.tsx stores activeRoleId in localStorage key trucking-active-persona-role-v1.

## SECTION_6

- Label: §6 Semantic salvage and supersession
- Reviewed: True
- Evidence: Supersession: src/ui/App.tsx nested ternary product-id chain replaced by getProductSystemId(stageId); no duplicate rosters left in App.tsx.

## SECTION_7

- Label: §7 Capability routing
- Reviewed: True
- Evidence: Capability routing: existing icons in src/ui/icons.tsx reused (IconDoor, IconShieldAlert) instead of authoring new icon set.

## SECTION_8

- Label: §8 Skills lifecycle
- Reviewed: True
- Evidence: Skills lifecycle: n/a: no new skills adopted; reused repo-local patterns from src/ui/App.tsx.

## SECTION_9

- Label: §9 Exploration and durable knowledge
- Reviewed: True
- Evidence: Durable knowledge: n/a: docs only for record; no exploration map change in this diff outside src/ and tests/.
