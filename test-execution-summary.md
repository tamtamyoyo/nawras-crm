# CRM Application Test Execution Summary

**Test Execution Date:** 2025-09-22T17:00:26.544Z
**Duration:** 160129ms

## Overall Results

- **Total Tests:** 21
- **Passed:** 11
- **Failed:** 10
- **Success Rate:** 52.38%

## Module Test Results

### Authentication
- **Status:** completed
- **Tests:** 2
- **Pass Rate:** 50.00%

### Customers
- **Status:** completed
- **Tests:** 4
- **Pass Rate:** 50.00%

### Deals
- **Status:** completed
- **Tests:** 2
- **Pass Rate:** 0.00%

### Leads
- **Status:** completed
- **Tests:** 2
- **Pass Rate:** 0.00%

### Invoices
- **Status:** completed
- **Tests:** 1
- **Pass Rate:** 0.00%

### Proposals
- **Status:** completed
- **Tests:** 1
- **Pass Rate:** 0.00%

### Navigation
- **Status:** completed
- **Tests:** 7
- **Pass Rate:** 100.00%

### ErrorHandling
- **Status:** completed
- **Tests:** 1
- **Pass Rate:** 0.00%

### Database
- **Status:** completed
- **Tests:** 1
- **Pass Rate:** 100.00%

## Defects Found

### Defect 1
- **Area:** Console Error
- **Description:** Failed to load resource: the server responded with a status of 400 ()
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:30.216Z

### Defect 2
- **Area:** Console Error
- **Description:** ❌ Sign in error: Invalid login credentials
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:30.216Z

### Defect 3
- **Area:** Logout Functionality
- **Description:** Test assertion failed
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:33.906Z

### Defect 4
- **Area:** Console Error
- **Description:** Global error caught: TypeError: Cannot read properties of null (reading 'name')
    at http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:321:36
    at Array.filter (<anonymous>)
    at Customers (http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:320:39)
    at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:11596:26)
    at updateFunctionComponent (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:14630:28)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:15972:22)
    at HTMLUnknownElement.callCallback2 (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3680:22)
    at Object.invokeGuardedCallbackDev (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3705:24)
    at invokeGuardedCallback (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3739:39)
    at beginWork$1 (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:19818:15)
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:37.745Z

### Defect 5
- **Area:** Page Error
- **Description:** Cannot read properties of null (reading 'name')
- **Severity:** Critical
- **Timestamp:** 2025-09-22T17:00:37.746Z

### Defect 6
- **Area:** Console Error
- **Description:** Global error caught: TypeError: Cannot read properties of null (reading 'name')
    at http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:321:36
    at Array.filter (<anonymous>)
    at Customers (http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:320:39)
    at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:11596:26)
    at updateFunctionComponent (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:14630:28)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:15972:22)
    at HTMLUnknownElement.callCallback2 (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3680:22)
    at Object.invokeGuardedCallbackDev (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3705:24)
    at invokeGuardedCallback (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3739:39)
    at beginWork$1 (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:19818:15)
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:37.750Z

### Defect 7
- **Area:** Page Error
- **Description:** Cannot read properties of null (reading 'name')
- **Severity:** Critical
- **Timestamp:** 2025-09-22T17:00:37.751Z

### Defect 8
- **Area:** Console Error
- **Description:** The above error occurred in the <Customers> component:

    at Customers (http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:36:39)
    at main
    at div
    at div
    at Layout (http://localhost:5173/src/components/Layout.tsx?t=1758558165849:47:26)
    at ProtectedRoute (http://localhost:5173/src/components/ProtectedRoute.tsx?t=1758558165849:21:34)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=7cb0d54d:4088:5)
    at Routes (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=7cb0d54d:4558:5)
    at div
    at Router (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=7cb0d54d:4501:15)
    at BrowserRouter (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=7cb0d54d:5247:5)
    at AuthProvider (http://localhost:5173/src/hooks/useAuthHook.tsx?t=1758558165849:32:32)
    at ErrorBoundary (http://localhost:5173/src/components/ErrorBoundary.tsx:8:5)
    at App

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:37.753Z

### Defect 9
- **Area:** Console Error
- **Description:** Error caught by boundary: {message: Cannot read properties of null (reading 'name'), timestamp: 2025-09-22T17:00:37.753Z, userAgent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb…KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36, url: http://localhost:5173/customers} {componentStack: 
    at Customers (http://localhost:5173/src/pages…/src/components/ErrorBoundary.tsx:8:5)
    at App}
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:37.754Z

### Defect 10
- **Area:** Create Customer
- **Description:** Test assertion failed
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:40.444Z

### Defect 11
- **Area:** Console Error
- **Description:** Failed to load resource: the server responded with a status of 500 ()
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:43.948Z

### Defect 12
- **Area:** Console Error
- **Description:** Error saving customer: {code: 42P17, details: null, hint: null, message: infinite recursion detected in policy for relation "users"}
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:43.948Z

### Defect 13
- **Area:** Console Error
- **Description:** Supabase customer saving failed: {code: 42P17, details: null, hint: null, message: infinite recursion detected in policy for relation "users"}
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:43.949Z

### Defect 14
- **Area:** Delete Customer
- **Description:** Test assertion failed
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:50.225Z

### Defect 15
- **Area:** Create Deal
- **Description:** Test assertion failed
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:00:58.456Z

### Defect 16
- **Area:** Change Deal Status
- **Description:** page.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="edit-deal-button"]:first-child')[22m

- **Severity:** High
- **Timestamp:** 2025-09-22T17:01:28.472Z

### Defect 17
- **Area:** Console Error
- **Description:** Failed to load resource: the server responded with a status of 404 ()
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:01:32.685Z

### Defect 18
- **Area:** Console Error
- **Description:** Supabase operation failed: {code: PGRST205, details: null, hint: Perhaps you meant the table 'public.leads', message: Could not find the table 'public.leads&select=*' in the schema cache}
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:01:32.686Z

### Defect 19
- **Area:** Console Error
- **Description:** Error saving lead: {code: PGRST205, details: null, hint: Perhaps you meant the table 'public.leads', message: Could not find the table 'public.leads&select=*' in the schema cache}
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:01:32.686Z

### Defect 20
- **Area:** Create Lead
- **Description:** Test assertion failed
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:01:35.143Z

### Defect 21
- **Area:** Convert Lead to Customer
- **Description:** Test assertion failed
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:01:35.147Z

### Defect 22
- **Area:** Create Invoice
- **Description:** elementHandle.click: Timeout 30000ms exceeded.
Call log:
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div data-state="open" aria-hidden="true" data-aria-hidden="true" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"></div> intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div data-state="open" aria-hidden="true" data-aria-hidden="true" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"></div> intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    56 × waiting for element to be visible, enabled and stable[22m
[2m       - element is visible, enabled and stable[22m
[2m       - scrolling into view if needed[22m
[2m       - done scrolling[22m
[2m       - <div data-state="open" aria-hidden="true" data-aria-hidden="true" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"></div> intercepts pointer events[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

- **Severity:** High
- **Timestamp:** 2025-09-22T17:02:11.712Z

### Defect 23
- **Area:** Create Proposal
- **Description:** Test assertion failed
- **Severity:** Medium
- **Timestamp:** 2025-09-22T17:02:21.044Z

### Defect 24
- **Area:** Form Validation
- **Description:** page.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="save-customer"]')[22m

- **Severity:** High
- **Timestamp:** 2025-09-22T17:03:03.553Z

## Recommendations

❌ 10 test(s) failed. Please address the following issues before deployment:

- Fix Console Error: Failed to load resource: the server responded with a status of 400 ()
- Fix Console Error: ❌ Sign in error: Invalid login credentials
- Fix Logout Functionality: Test assertion failed
- Fix Console Error: Global error caught: TypeError: Cannot read properties of null (reading 'name')
    at http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:321:36
    at Array.filter (<anonymous>)
    at Customers (http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:320:39)
    at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:11596:26)
    at updateFunctionComponent (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:14630:28)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:15972:22)
    at HTMLUnknownElement.callCallback2 (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3680:22)
    at Object.invokeGuardedCallbackDev (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3705:24)
    at invokeGuardedCallback (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3739:39)
    at beginWork$1 (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:19818:15)
- Fix Page Error: Cannot read properties of null (reading 'name')
- Fix Console Error: Global error caught: TypeError: Cannot read properties of null (reading 'name')
    at http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:321:36
    at Array.filter (<anonymous>)
    at Customers (http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:320:39)
    at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:11596:26)
    at updateFunctionComponent (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:14630:28)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:15972:22)
    at HTMLUnknownElement.callCallback2 (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3680:22)
    at Object.invokeGuardedCallbackDev (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3705:24)
    at invokeGuardedCallback (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:3739:39)
    at beginWork$1 (http://localhost:5173/node_modules/.vite/deps/chunk-KPD4VVXB.js?v=7cb0d54d:19818:15)
- Fix Page Error: Cannot read properties of null (reading 'name')
- Fix Console Error: The above error occurred in the <Customers> component:

    at Customers (http://localhost:5173/src/pages/Customers.tsx?t=1758558165849:36:39)
    at main
    at div
    at div
    at Layout (http://localhost:5173/src/components/Layout.tsx?t=1758558165849:47:26)
    at ProtectedRoute (http://localhost:5173/src/components/ProtectedRoute.tsx?t=1758558165849:21:34)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=7cb0d54d:4088:5)
    at Routes (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=7cb0d54d:4558:5)
    at div
    at Router (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=7cb0d54d:4501:15)
    at BrowserRouter (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=7cb0d54d:5247:5)
    at AuthProvider (http://localhost:5173/src/hooks/useAuthHook.tsx?t=1758558165849:32:32)
    at ErrorBoundary (http://localhost:5173/src/components/ErrorBoundary.tsx:8:5)
    at App

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
- Fix Console Error: Error caught by boundary: {message: Cannot read properties of null (reading 'name'), timestamp: 2025-09-22T17:00:37.753Z, userAgent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb…KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36, url: http://localhost:5173/customers} {componentStack: 
    at Customers (http://localhost:5173/src/pages…/src/components/ErrorBoundary.tsx:8:5)
    at App}
- Fix Create Customer: Test assertion failed
- Fix Console Error: Failed to load resource: the server responded with a status of 500 ()
- Fix Console Error: Error saving customer: {code: 42P17, details: null, hint: null, message: infinite recursion detected in policy for relation "users"}
- Fix Console Error: Supabase customer saving failed: {code: 42P17, details: null, hint: null, message: infinite recursion detected in policy for relation "users"}
- Fix Delete Customer: Test assertion failed
- Fix Create Deal: Test assertion failed
- Fix Change Deal Status: page.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="edit-deal-button"]:first-child')[22m

- Fix Console Error: Failed to load resource: the server responded with a status of 404 ()
- Fix Console Error: Supabase operation failed: {code: PGRST205, details: null, hint: Perhaps you meant the table 'public.leads', message: Could not find the table 'public.leads&select=*' in the schema cache}
- Fix Console Error: Error saving lead: {code: PGRST205, details: null, hint: Perhaps you meant the table 'public.leads', message: Could not find the table 'public.leads&select=*' in the schema cache}
- Fix Create Lead: Test assertion failed
- Fix Convert Lead to Customer: Test assertion failed
- Fix Create Invoice: elementHandle.click: Timeout 30000ms exceeded.
Call log:
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div data-state="open" aria-hidden="true" data-aria-hidden="true" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"></div> intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div data-state="open" aria-hidden="true" data-aria-hidden="true" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"></div> intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    56 × waiting for element to be visible, enabled and stable[22m
[2m       - element is visible, enabled and stable[22m
[2m       - scrolling into view if needed[22m
[2m       - done scrolling[22m
[2m       - <div data-state="open" aria-hidden="true" data-aria-hidden="true" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"></div> intercepts pointer events[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

- Fix Create Proposal: Test assertion failed
- Fix Form Validation: page.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="save-customer"]')[22m


**Next Steps:**
1. Fix all identified issues
2. Re-run focused regression tests
3. Only deploy after all tests pass
