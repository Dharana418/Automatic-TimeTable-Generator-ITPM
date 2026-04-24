# Testing Evidence: Automatic TimeTable Generator (ITPM)

This document provides formal evidence of the implementation and execution of automated testing tools for the "Automatic TimeTable Generator" project.

## 1. Testing Framework Overview

The project utilizes a dual-framework approach to ensure comprehensive coverage across both the backend and frontend layers.

| Layer | Framework | Key Libraries | Purpose |
|-------|-----------|---------------|---------|
| **Backend** | **Jest** | Supertest, Babel | Unit & Integration testing for API controllers, scheduler logic, and utilities. |
| **Frontend** | **Vitest** | React Testing Library, JSDOM | Component-based testing for UI rendering, user interactions, and state management. |

---

## 2. Backend Testing Evidence (Jest)

### Execution Results
All backend test suites were executed successfully. The tests cover critical business logic, including authentication, scheduler constraints, and error handling.

```bash
# Execution Command
$env:NODE_OPTIONS="--experimental-vm-modules"; npx jest --detectOpenHandles
```

**Output Summary:**
```text
PASS __tests__/controllers/auth.test.js
PASS __tests__/utils/errorHandler.test.js
PASS __tests__/scheduler/batchModeConstraints.test.js
PASS __tests__/scheduler/scheduling.test.js

Test Suites: 4 passed, 4 total
Tests:       42 passed, 42 total
Time:        0.705 s
```

### Critical Logic Validated
- ✅ **Authentication:** Email format, password length/complexity, role assignment, and JWT handling.
- ✅ **Scheduler Constraints:** Hall capacity (120-seat limit), instructor availability, and weekday-only lecture rules.
- ✅ **Batch Mode Integrity:** Verified that WD (Weekday) and WE (Weekend) batches are correctly isolated to their respective slots.
- ✅ **Error Handling:** Validated custom ErrorHandler stack trace and status code propagation.

---

## 3. Frontend Testing Evidence (Vitest)

### Execution Results
Frontend tests validate the user interface and interaction flows. 72 tests across 3 suites were executed with 100% pass rate.

```bash
# Execution Command
npm test -- --run
```

**Output Summary:**
```text
 ✓ src/__tests__/pages/Login.test.js  (16 tests)
 ✓ src/__tests__/components/Common.test.js  (32 tests)
 ✓ src/__tests__/pages/Dashboard.test.js  (24 tests)

 Test Files  3 passed (3)
      Tests  72 passed (72)
   Duration  2.99s
```

### UI Features Validated
- ✅ **Login Flow:** Form validation, API integration, and error message display.
- ✅ **Dashboard:** Statistics card rendering, timetable list filtering, and status badge color logic.
- ✅ **Timetable Generation:** Parameter validation (Year/Sem/Spec/Group) and progress bar functionality.
- ✅ **Common Components:** Reusable buttons, modals, and input field behaviors.

---

## 4. Improvements & Bug Fixes (Evidence of Value)

Testing successfully identified and resolved several critical issues in the codebase:

1.  **Batch Mode Logic:** Identified a case-sensitivity bug where 'WE' (Weekend) batches were being allowed on weekdays. Fixed by normalizing mode detection to lowercase.
2.  **Auth Role Assignment:** Fixed a logic error in test helpers where faculty roles weren't being correctly identified.
3.  **Data Type Integrity:** Fixed several instances where truthy values (like `1`) were being returned instead of explicit Booleans (`true`), ensuring stricter API responses.
4.  **Jest ESM Configuration:** Resolved configuration conflicts in `jest.config.js` to support ES Modules seamlessly.

---

## 5. Code Coverage Summary (Backend)

While in the early stages, critical utility and scheduler logic show high coverage:

| Module | Statement Coverage | Status |
|--------|-------------------|--------|
| `utils/errorHandler.js` | 100% | ✅ Full |
| `scheduler/optimizer.js` | ~30% (Core logic) | 🟡 In Progress |
| `controllers/auth.test.js` | Validated | ✅ Passed |

> [!NOTE]
> Overall project coverage is currently focused on high-risk business logic. Expanded coverage for all controllers and ancillary modules is planned for the next development phase.

---

### Conclusion
The project demonstrates a robust testing culture. The integration of **Jest** and **Vitest** provides a reliable safety net for future enhancements, ensuring that the complex scheduling algorithms remain accurate and conflict-free.
