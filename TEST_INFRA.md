# E2E Test Infra: PulseSync OS Habits Engine Revamp

## Test Philosophy
- Opaque-box, requirement-driven. Derives strictly from ORIGINAL_REQUEST.md.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.
- Test Runner: Node.js test script at `scripts/verify_habits_integrity.mjs`.
- Invocation: `node scripts/verify_habits_integrity.mjs`
- Pass/Fail Semantics: 100% assertion pass rate with exit code 0.

## Feature Inventory Coverage Matrix
| # | Feature | Requirement | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Pillar) | Tier 4 (Workload) |
|---|---------|-------------|:----------------:|:-----------------:|:---------------------:|:-----------------:|
| 1 | Hydration 3.5L target & quick adds | R2.1 | >=5 tests | >=5 tests | ✓ | ✓ |
| 2 | Hydration SVG ring math | R2.1 | >=5 tests | >=5 tests | ✓ | ✓ |
| 3 | Sleep 24h duration & cross-midnight | R2.2 | >=5 tests | >=5 tests | ✓ | ✓ |
| 4 | Sleep 8.0h baseline & debt accumulation | R2.2 | >=5 tests | >=5 tests | ✓ | ✓ |
| 5 | Morning sunlight anchor | R2.2 | >=5 tests | >=5 tests | ✓ | ✓ |
| 6 | Reading bookshelf & pagesReadToday | R2.3 | >=5 tests | >=5 tests | ✓ | ✓ |
| 7 | Reading 20m sprint timer math | R2.3 | >=5 tests | >=5 tests | ✓ | ✓ |
| 8 | Keystone 4-marker Clean Day logic | R2.4 | >=5 tests | >=5 tests | ✓ | ✓ |
| 9 | Clean Day streak & 5-tier classification | R2.4 | >=5 tests | >=5 tests | ✓ | ✓ |
| 10 | Dynamic Horizon Scaling: Sleep Scorecard | R3 | >=5 tests | >=5 tests | ✓ | ✓ |
| 11 | Dynamic Horizon Scaling: Clean Days Scorecard | R3 | >=5 tests | >=5 tests | ✓ | ✓ |
| 12 | Dynamic Horizon Scaling: Hydration Scorecard | R3 | >=5 tests | >=5 tests | ✓ | ✓ |
| 13 | Dynamic Horizon Scaling: Pages Read Scorecard | R3 | >=5 tests | >=5 tests | ✓ | ✓ |
| 14 | Habit Consistency Matrix (5x7 scoring) | R3 | >=5 tests | >=5 tests | ✓ | ✓ |
| 15 | Habits Adherence Ledger pacing & deltas | R3 | >=5 tests | >=5 tests | ✓ | ✓ |
| 16 | Day Ledger Feed receipts formatting | R4 | >=5 tests | >=5 tests | ✓ | ✓ |
| 17 | EditHabitsModal multi-pillar state update | R4 | >=5 tests | >=5 tests | ✓ | ✓ |
| 18 | Bidirectional synchronization contract | R4 | >=5 tests | >=5 tests | ✓ | ✓ |
| 19 | DayBalanceRibbon 24h circadian sleep feed | R4 | >=5 tests | >=5 tests | ✓ | ✓ |
| 20 | Ergonomics: 44px tap targets & zero emojis | R5 | >=5 tests | >=5 tests | ✓ | ✓ |

## Test Architecture
- Test Runner: Node.js native script (`scripts/verify_habits_integrity.mjs`)
- Test Case Structure:
  - Tier 1: Isolated unit math & contracts for each feature (100+ tests)
  - Tier 2: Boundary values (0ml, 8000ml, 00:00 midnight cross, empty records, streak gaps, horizon boundaries)
  - Tier 3: Combinations (Sleep + Clean Day + Hydration + Reading + Day Ledger sync)
  - Tier 4: Real-world 7-day, 14-day, 30-day, and 90-day simulation workloads
