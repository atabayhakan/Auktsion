# E2E Test Infra: Auktsion v2.0

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation internals.
- Systematic 4-tier design methodology: Category-Partition, Boundary Value Analysis, Pairwise Combinatorial Testing, Real-World Workload Testing.
- Strict isolation: Self-contained test scripts running against live or mock API targets.

---

## Feature Inventory & Test Mapping

| # | Feature Area | Requirement | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Workload) |
|---|--------------|-------------|:-----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Navigation & Route Matching | R1, F01 | 5 | 5 | ✓ | ✓ |
| 2 | Header Alignment & Search | R1, F02, F03 | 5 | 5 | ✓ | ✓ |
| 3 | Dropdown & Menu Component | R1, F04 | 5 | 5 | ✓ | ✓ |
| 4 | Auction Card & Lot Routing | R1, F05 | 5 | 5 | ✓ | ✓ |
| 5 | Dashboard Sub-Tabs | R1, F06 | 5 | 5 | ✓ | ✓ |
| 6 | Node.js Backend Server & DB | R2, F07 | 5 | 5 | ✓ | ✓ |
| 7 | User Registration & Password Hashing | R2, F08 | 5 | 5 | ✓ | ✓ |
| 8 | User Login & JWT Auth | R2, F09 | 5 | 5 | ✓ | ✓ |
| 9 | Session & Auth Guards | R2, F10, F11 | 5 | 5 | ✓ | ✓ |
| 10 | User Profile & Settings | R2, F12 | 5 | 5 | ✓ | ✓ |
| 11 | User Listings & Bids Flow | R2, F13 | 5 | 5 | ✓ | ✓ |
| 12 | User KYC & Payout Methods | R2, F14 | 5 | 5 | ✓ | ✓ |
| 13 | Admin Layout & RBAC Guard | R3, F15 | 5 | 5 | ✓ | ✓ |
| 14 | Admin Users Management | R3, F16 | 5 | 5 | ✓ | ✓ |
| 15 | Admin Listings Management | R3, F17 | 5 | 5 | ✓ | ✓ |
| 16 | Admin Disputes & Claims | R3, F18 | 5 | 5 | ✓ | ✓ |
| 17 | Admin KYC Approvals | R3, F19 | 5 | 5 | ✓ | ✓ |
| 18 | Admin Financials & Payouts | R3, F20 | 5 | 5 | ✓ | ✓ |
| 19 | Admin Real-Time Monitoring | R3, F21 | 5 | 5 | ✓ | ✓ |
| 20 | Admin Analytics & Charts | R3, F22 | 5 | 5 | ✓ | ✓ |
| 21 | Project Isolation & Integrity | R4, F24 | 5 | 5 | ✓ | ✓ |

---

## Test Architecture
- **Test Runner**: Node.js automated test runner (`tests/e2e/runner.js` / TypeScript test harness) with clear exit codes (`0` on all pass, non-zero on failure).
- **Format**: Structured test suites outputting TAP or JSON test results with clear error traces.
- **Directory Layout**:
  - `tests/e2e/tier1_feature/`: Tier 1 Feature coverage tests (≥ 105 tests)
  - `tests/e2e/tier2_boundary/`: Tier 2 Boundary & edge case tests (≥ 105 tests)
  - `tests/e2e/tier3_pairwise/`: Tier 3 Cross-feature integration tests (≥ 25 tests)
  - `tests/e2e/tier4_workloads/`: Tier 4 Real-world user and admin workflows (≥ 12 end-to-end scenarios)
  - `tests/adversarial/`: Tier 5 Adversarial and anti-cheat coverage hardening tests

---

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Complete Seller Journey (Register -> KYC -> Create Lot -> Receive Bids -> Close -> Payout) | F08, F09, F14, F13, F05, F06 | High |
| 2 | High-Speed Bidding War (Multiple Buyers -> Incremental Bids -> Anti-Sniping Timer -> Winner Notification) | F09, F13, F21 | High |
| 3 | Admin Moderation & User Ban (User reports fraudulent listing -> Admin reviews in monitoring -> Bans user -> Cancels bids) | F16, F17, F21 | High |
| 4 | Kyrgyz Bank Payout Workflow (Seller requests 50,000 KGS payout via MBank -> Admin reviews financials -> Approves -> Transaction logged) | F14, F20 | Medium |
| 5 | KYC Verification & Identity Approval (User uploads passport + INN -> Admin reviews document in KYC module -> Approves -> User unlocked for selling) | F14, F19 | Medium |
| 6 | Buyer-Seller Dispute Resolution (Buyer opens dispute for damaged item -> Admin reviews evidence -> Issues partial refund -> Resolves ticket) | F18, F20 | High |

---

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥ 105 test cases (5 per feature area)
- **Tier 2 (Boundary & Corner)**: ≥ 105 test cases (5 per feature area)
- **Tier 3 (Cross-Feature Pairwise)**: ≥ 25 interaction tests
- **Tier 4 (Real-World Workloads)**: ≥ 12 end-to-end workflows
- **Total Minimum Target**: ≥ 247 automated test cases
