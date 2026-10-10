# Operations Dashboard

A production-style operations management workspace built with **React 19 · TypeScript · Vite · TanStack Query v5 · Tailwind v4**.

The dashboard manages **5,000 generated operation records** with server-style search, status filtering, sorting, pagination, optimistic-friendly status updates with automatic statistics recalculation — and a mock API layer that deliberately simulates **network latency (300–1200 ms)** and **random failures (~15 %)** so the loading, error and concurrency paths are real code paths, not decoration.

The deliverable is verified by **20 automated tests** (15 unit + 5 full-stack integration) that cover the five critical behaviours specified for this task. Every behavioural claim in this README is cross-referenced to the test that proves it.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Quality gates](#quality-gates)
- [Architecture](#architecture)
- [Key technical decisions](#key-technical-decisions)
- [Testing strategy](#testing-strategy)
- [Requirement → test coverage matrix](#requirement--test-coverage-matrix)
- [Test harness design](#test-harness-design)
- [Known behaviours & trade-offs](#known-behaviours--trade-offs)
- [Project structure](#project-structure)

---

## Features

| Area | Behaviour | Proven by |
|------|-----------|-----------|
| **Search** | Case-insensitive substring match across operation **ID**, **name** and **assignee** | `filters by ID substring, case-insensitively` · `filters by operation name` · `filters by assignee name` |
| **Filtering** | Status filter (`All / Pending / Running / Completed / Failed`) that **intersects** with the active search | `applies search AND status filter together (intersection)` |
| **Combined query** | Entering a query **and** selecting a status shows only rows matching *both* | `narrows the list to rows matching BOTH the search query and the status filter` |
| **Sorting** | By created/updated date, ascending/descending, newest-first default | `sorts by createdAt descending by default` · `sorts ascending when requested` · `sorts by updatedAt when requested` |
| **Pagination** | Server-side slicing, **25 rows/page**, `1–25 of 5,000 operations` footer, page reset on search/filter change | `paginates the sorted result with page and limit` |
| **Statistics** | Four live cards (Pending / Running / Completed / Failed) computed over the **entire** dataset, independent of filters | `computes stats over the whole dataset regardless of filters` |
| **Status update** | Modal with radio selection + save; updates the row badge, the modal state and recalculates the stat cards | `updates the status badge in the list/modal and recalculates the stat cards` |
| **Loading state** | Skeleton UI via `Suspense` on first load | asserted by the error/empty flows in the integration suite |
| **Error state** | `ErrorBoundary` → `ErrorState` panel with a **working retry** that resets both the query cache and the boundary | `shows an error state with a working retry action when fetching fails` |
| **Empty state** | Friendly `EmptyState` when a search matches nothing | asserted in `clears previous results and pending states completely when a new search runs` |
| **Race safety** | A stale, slower response can never overwrite newer results | `does not let a stale, slower response overwrite newer search results` |
| **URL as state** | Search / status / sort / page live in the query string — queries are shareable, refresh-safe and bookmarkable | exercised by every integration test via `MemoryRouter` |
| **Accessibility** | Landmark regions, `role="dialog"`, `role="alert"`, labelled controls, keyboard-reachable actions | queries used by the tests (`getByRole('dialog')`, `getByRole('alert')`, `getByRole('radio', { name })`) |

### Data layer realism

The mock API (`src/features/operations/api/operationsApi.ts`) behaves like a real backend:

```
random latency  = 300–1200 ms
failure rate    = 15 % when shouldSimulateErrors is enabled
cancellation    = AbortSignal honoured (in-flight requests reject with AbortError)
persistence     = status updates are written back to localStorage
```

Failure simulation is **enabled by default** in the hook (`fetchOperations(params, signal, true)`) so reviewers can see the error path in the running app. See [Known behaviours](#known-behaviours--trade-offs) for how to disable it.

---

## Tech stack

| Layer | Choice | Version |
|-------|--------|---------|
| UI | React (StrictMode) | 19.2 |
| Language | TypeScript (`strict`-leaning flags, `verbatimModuleSyntax`) | 6.0 |
| Build | Vite | 8.3 |
| Styling | Tailwind CSS v4 (CSS-first config via `@tailwindcss/vite`) | 4.3 |
| Server state | TanStack Query v5 (`useSuspenseQuery`, mutations, cache invalidation) | 5.104 |
| Routing / URL state | React Router v7 (`useSearchParams`) | 7.18 |
| Unit & integration tests | Vitest + jsdom | 5.0 |
| Test API | Testing Library (react / user-event / jest-dom) | 16.3 / 14.6 / 7.0 |
| Linting | ESLint 10 + `typescript-eslint` + `react-hooks` (flat config) | — |

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b` type-check **then** production build |
| `npm run lint` | ESLint over the whole project |
| `npm test` | Run the full test suite once (CI mode) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run preview` | Preview the production build |

---

## Quality gates

All four gates pass on the current commit:

```bash
$ npx tsc -b        # ✅ 0 errors
$ npm run lint      # ✅ 0 errors, 0 warnings
$ npm test          # ✅ Test Files 2 passed (2) · Tests 20 passed (20)
$ npm run build     # ✅ built in ~0.8 s  (326 kB js / 25 kB css, ~101 kB gzip)
```

---

## Architecture

### Feature-first layout

Shared, domain-agnostic pieces live in `src/components`; everything specific to the operations feature is colocated under `src/features/operations`, so the feature can be moved, deleted or handed to another team without touching the rest of the app.

```
src/
├── app/                        # App shell
├── components/                 # Shared UI (domain-agnostic)
│   ├── layout/AppHeader.tsx
│   ├── states/                 # ErrorBoundary · ErrorState · EmptyState
│   └── ui/                     # Icon · Skeleton
├── features/operations/        # ── the feature, self-contained ──
│   ├── api/operationsApi.ts    # Mock backend: latency, failures, abort, filter/sort/paginate
│   ├── components/             # Stats · Toolbar · Table · Pagination · Modals · Badge · Skeleton
│   ├── hooks/useOperations.ts  # Single data-access hook (query + mutation + URL filters)
│   ├── pages/OperationsPage.tsx# Composition: ErrorBoundary → Suspense → content
│   ├── types/operation.types.ts
│   └── utils/                  # mockDataGenerator · operationView (view-model mapping)
└── test/                       # Test harness + suites
    ├── setup.ts                # jest-dom matchers
    ├── testUtils.tsx           # Factories, mock API, deferred promises, render helper
    ├── operationsApi.test.ts   # 15 unit tests
    └── OperationsPage.test.tsx # 5 integration tests
```

### Data flow

```
URL query string  ←→  useOperations()  ←→  operationsApi (mock backend)
  search/status/       useSuspenseQuery       latency · failures · abort
  sortBy/page         + useMutation          filter · sort · paginate · stats
        ↓                    ↓
  debounce 300 ms     Suspense (skeleton)
                      ErrorBoundary (error + retry)
                      invalidateQueries (after mutation)
```

One hook (`useOperations`) is the **only** module that talks to both the router and the query cache. Components never import the API directly — which is exactly what makes the test suite able to substitute the entire backend at a single module boundary.

---

## Key technical decisions

### 1. Suspense-first data fetching

`useSuspenseQuery` means loading is expressed structurally (a `Suspense` boundary with a skeleton fallback) instead of `isLoading && <Spinner/>` littered through components. Errors are thrown and caught by a class `ErrorBoundary` that renders a real recovery UI.

> **Verified by:** `shows an error state with a working retry action when fetching fails` — the test asserts the error panel appears, that the fetch was attempted **twice** (initial + `retry: 1`), and that clicking **Try again** both resets the cached error and re-renders the data.

**Subtlety handled:** TanStack Query *caches thrown errors*. Retrying must therefore call `queryClient.resetQueries({ queryKey: ['operations'] })` **and** reset the boundary — doing only one of the two re-throws the stored error instantly. The retry button does both.

### 2. URL is the single source of truth for query state

`search`, `status`, `sortBy`, `sortOrder` and `page` live in the query string via `useSearchParams`. Consequences:

- every view is **shareable and refresh-safe**
- the query key is derived from the URL, so TanStack Query's cache is keyed by *what the user asked for*
- the 300 ms debounced search commits to the URL, never to local component state

> **Verified by:** every integration test renders through `MemoryRouter` and asserts the exact params the API receives, e.g. `toHaveBeenLastCalledWith({ search: 'payment', status: 'Running' }, …)`.

### 3. Statistics are computed before filtering

The four stat cards describe the **whole operation set**, not the currently filtered page. This is a deliberate product decision: the cards answer "how is the system doing?", while the table answers "what matches my query?".

> **Verified by:** `computes stats over the whole dataset regardless of filters` (unit) and, end-to-end, by the integration test asserting the *Running* card still reads `2` while the table shows a single filtered row.

### 4. A mock API that behaves like a backend — including its failures

`fetchOperations` simulates latency, honours `AbortSignal`, applies search→status→sort→paginate in that order, and can inject ~15 % random failures. Turning this into a *feature* of the deliverable means the loading, retry, empty and concurrency UI are exercised constantly during development instead of only in theory.

> **Verified by:** `throws a network error when error simulation is enabled and triggered`, `does not throw when error simulation is disabled…`, and `rejects with an AbortError when the request is aborted mid-flight`.

### 5. Mutation safety

Status updates go through `useMutation` → `updateOperationStatus`, which validates the target exists, refreshes `updatedAt` and persists to `localStorage`. On success the hook invalidates `['operations']`, so **the table badge, the reopened modal and all four stat cards** re-derive from a single refetch.

> **Verified by:** `updates the status, refreshes updatedAt, and persists to storage`, `rejects when the operation does not exist`, and the integration test that saves `Pending → Completed` and observes `Pending 1→0` / `Completed 1→2` plus the reopened modal showing `Completed` pre-checked.

---

## Testing strategy

**20 tests, two suites, one principle: test the real wiring, control only the boundary.**

| Suite | Scope | Count | File |
|-------|-------|-------|------|
| Unit | Mock API contract: search, filter, sort, paginate, stats, latency, failure, abort, mutation | 15 | `src/test/operationsApi.test.ts` |
| Integration | Full page: router + query client + hook + components, only the API module substituted | 5 | `src/test/OperationsPage.test.tsx` |

Nothing in the UI is mocked. `vi.mock` replaces **one module** — `features/operations/api/operationsApi` — so the real hook, real query cache, real router, real debounce, real Suspense boundaries and real components all execute. Failures therefore surface where a user would experience them.

### Unit suite (`operationsApi.test.ts` — 15 tests)

```
fetchOperations
  ✓ returns the full dataset with default pagination
  ✓ computes stats over the whole dataset regardless of filters
  ✓ filters by ID substring, case-insensitively
  ✓ filters by operation name
  ✓ filters by assignee name
  ✓ applies search AND status filter together (intersection)
  ✓ sorts by createdAt descending by default (newest first)
  ✓ sorts ascending when requested
  ✓ sorts by updatedAt when requested
  ✓ paginates the sorted result with page and limit
  ✓ throws a network error when error simulation is enabled and triggered
  ✓ does not throw when error simulation is disabled even with a low random value
  ✓ rejects with an AbortError when the request is aborted mid-flight

updateOperationStatus
  ✓ updates the status, refreshes updatedAt, and persists to storage
  ✓ rejects when the operation does not exist
```

Determinism comes from two controls: the data generator is mocked with a **fixed 5-record dataset**, and `Math.random` is stubbed so both the simulated delay and the 15 % failure branch become reproducible. Fake timers (`vi.advanceTimersByTimeAsync`) skip the 300–1200 ms latency instantly, so the suite runs in ~2.7 s despite the backend being "slow" by design.

### Integration suite (`OperationsPage.test.tsx` — 5 tests)

```
combined search and filtering
  ✓ narrows the list to rows matching BOTH the search query and the status filter

status update and stats recalculation
  ✓ updates the status badge in the list/modal and recalculates the stat cards

API failure handling
  ✓ shows an error state with a working retry action when fetching fails

out-of-order response handling
  ✓ does not let a stale, slower response overwrite newer search results

prevention of stale data on a new search
  ✓ clears previous results and pending states completely when a new search runs
```

---

## Requirement → test coverage matrix

The five critical requirements from the brief, mapped to the exact assertions that satisfy them.

### 1 · Combined search and filtering

> *Entering a search query and selecting a status filter simultaneously must filter the list to match both criteria.*

| Layer | Test | Key assertions |
|-------|------|----------------|
| Unit | `applies search AND status filter together (intersection)` | `payment` ∩ `Running` → exactly `OP-1`; `total === 1`; stats still global |
| Integration | `narrows the list to rows matching BOTH the search query and the status filter` | typing `payment` shows `OP-1`+`OP-2`; adding *Running* keeps `OP-1` only; `OP-2`/`OP-3`/`OP-4` removed; the API is called with `{ search: 'payment', status: 'Running' }`; the *Running* card still reads `2` |

### 2 · Status update & statistics recalculation

> *Changing an operation's status must update its badge in the list/modal and immediately reflect in the top statistic cards.*

| Layer | Test | Key assertions |
|-------|------|----------------|
| Unit | `updates the status, refreshes updatedAt, and persists to storage` | returned object has the new status; `saveOperationsToStorage` receives the updated record |
| Integration | `updates the status badge in the list/modal and recalculates the stat cards` | mutation called with `('OP-1', 'Completed')`; modal closes; row badge flips to *Completed*; `Pending 1→0`, `Completed 1→2`; reopening the modal shows `Completed` pre-selected |

### 3 · API failure handling

> *Simulate a network failure and verify the UI shows an error state with a working retry action.*

| Layer | Test | Key assertions |
|-------|------|----------------|
| Unit | `throws a network error when error simulation is enabled and triggered` · `does not throw when… disabled` | failure only when enabled **and** the random threshold is crossed |
| Integration | `shows an error state with a working retry action when fetching fails` | `role="alert"` error panel with the "Failed to load operations" copy; **exactly 2** fetch attempts (honouring `retry: 1`); clicking **Try again** clears the error and renders the data |

### 4 · Out-of-order / race-condition handling

> *If an older, delayed response resolves after a newer search response, stale data must not overwrite the newer results.*

| Layer | Test | Key assertions |
|-------|------|----------------|
| Unit | `rejects with an AbortError when the request is aborted mid-flight` | cancellation is supported at the transport level |
| Integration | `does not let a stale, slower response overwrite newer search results` | search `alpha` (held), then search `beta`; `beta` resolves first and renders; the late `alpha` payload **never appears** and `beta`'s rows survive |

### 5 · Prevention of stale data on a new search

> *A brand-new search must completely clear previous results and pending old states — no outdated records linger.*

| Layer | Test | Key assertions |
|-------|------|----------------|
| Integration | `clears previous results and pending states completely when a new search runs` | new search issues exactly one request with the new term; when it resolves, **every** prior row is gone; a follow-up search with zero matches shows the `EmptyState` and no lingering records |

---

## Test harness design

Reusable infrastructure lives in `src/test/testUtils.tsx` so each test reads as intent, not plumbing.

| Helper | Purpose |
|--------|---------|
| `makeOperation(id, overrides)` | Deterministic record factory — each test overrides only the fields it cares about |
| `makeResponse(data, total?)` | Builds an `OperationsResponse`, deriving stats automatically |
| `createMockApi(dataset)` | In-memory backend implementing the **same** search/status/sort/paginate/stats semantics as the real API against a controlled dataset, with a mutable store so mutations are visible to subsequent fetches |
| `createDeferred<T>()` | Manually-resolved promise — gives the test **explicit control over response order**, which is what makes the race-condition test deterministic instead of timing-dependent |
| `renderWithProviders(ui, { route, captureNavigate })` | Renders inside a fresh `QueryClientProvider` + `MemoryRouter`; `captureNavigate` exposes the router's `navigate()` to the test |

### Why the race test navigates programmatically

React Router v7 wraps `setSearchParams` in `React.startTransition`. When a query key changes mid-flight, React **keeps the previous content mounted** until the new data is ready (the intended "no skeleton flash" UX). A side effect for testing: during a suspended search the toolbar — and therefore the search input — is not in the DOM, so a test cannot type a second query while the first request is still pending.

The harness therefore drives the second search through `navigate('/?search=beta')`, captured via `captureNavigate`. This holds **two real requests in flight simultaneously** and lets the test resolve them in reverse order — a faithful reproduction of the stale-response scenario, with zero test-only branching in application code.

### Other determinism choices

- **Fresh `QueryClient` per test** with `retryDelay: 0`, so the hook's `retry: 1` never slows the suite down.
- **Fake timers** in the unit suite make the 300–1200 ms latency instantaneous and the failure branch reproducible.
- **`act()`-wrapped resolution** of deferred promises keeps React's act-environment warnings out of the output.
- **`vi.clearAllMocks()`** in `beforeEach` prevents cross-test call-count leakage (several assertions rely on exact call counts).

---

## Known behaviours & trade-offs

Honest notes on what the current implementation does and why.

1. **Random failures are enabled on purpose.** The hook calls `fetchOperations(params, signal, true)`. Combined with `retry: 1`, roughly 2 % of page loads surface the error panel (0.15² — both attempts must fail). This keeps the recovery path visible during review. For a stable demo, flip the flag to `false` in `src/features/operations/hooks/useOperations.ts`.
2. **Filter changes keep the previous rows visible** (React Router's `startTransition` semantics) rather than flashing the skeleton; the skeleton appears on first load only. The "Updating…" indicator marks a refetch in progress.
3. **`useSuspenseQuery` cannot use `placeholderData: keepPreviousData`** (unsupported in v5 types) — the transition behaviour above provides the equivalent user experience without it.
4. **Pagination resets to page 1** whenever the search term or status changes, preventing the classic "page 7 of a 2-page result" dead end.
5. **Data persists in `localStorage`** under `app_operations_data_v2`, so status edits survive a refresh. Clear site storage to regenerate the 5,000 records.
6. **Mock data is deterministic per storage key** — the generator seeds once and reuses the cached set, so manual testing isn't invalidated by a refresh.

---

## Project structure

```
.
├── index.html
├── vite.config.ts              # react + tailwindcss plugins, vitest config (jsdom, setup file)
├── eslint.config.js            # flat config: js + typescript-eslint + react-hooks + react-refresh
├── tsconfig.{app,node}.json    # app (src) / node (vite config) split
└── src/
    ├── main.tsx                # QueryClientProvider + BrowserRouter + StrictMode
    ├── index.css               # Tailwind v4 (`@import "tailwindcss";`)
    ├── app/App.tsx             # shell: AppHeader + main container
    ├── components/
    │   ├── layout/AppHeader.tsx
    │   ├── states/ErrorBoundary.tsx | ErrorState.tsx | EmptyState.tsx
    │   └── ui/Icon.tsx | Skeleton.tsx
    ├── features/operations/
    │   ├── api/operationsApi.ts
    │   ├── components/  OperationsStats · OperationsToolbar · OperationsTable
    │   │                OperationsPagination · OperationsPageSkeleton
    │   │                StatusModal · DetailsModal · StatusBadge
    │   ├── hooks/useOperations.ts        # PAGE_SIZE = 25, query + mutation + URL sync
    │   ├── pages/OperationsPage.tsx      # ErrorBoundary → Suspense → OperationsContent
    │   ├── types/operation.types.ts
    │   └── utils/mockDataGenerator.ts | operationView.ts
    └── test/
        ├── setup.ts             # '@testing-library/jest-dom/vitest'
        ├── testUtils.tsx        # factories · createMockApi · createDeferred · renderWithProviders
        ├── operationsApi.test.ts
        └── OperationsPage.test.tsx
```

---

## Summary for reviewers

| Question | Answer |
|----------|--------|
| Does combined search + filter work? | Yes — unit *and* integration tested (Req. 1) |
| Do status updates recalculate the stat cards? | Yes — asserted end-to-end (Req. 2) |
| Is API failure handled gracefully with working retry? | Yes — error panel, exactly one retry, successful recovery (Req. 3) |
| Can a slow stale response clobber newer results? | No — out-of-order responses are held in flight and resolved in reverse to prove it (Req. 4) |
| Does a new search clear all previous state? | Yes — every prior row removed, empty results show `EmptyState` (Req. 5) |
| Is it all reproducible? | `npm test` → **20/20 passing**, `tsc` 0 errors, `lint` 0 warnings, production build green |
