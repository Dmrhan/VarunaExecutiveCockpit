# CRM Executive Cockpit — Technical Handover Documentation

**Date:** 2026-02-20  
**Audience:** Senior Backend Engineer taking ownership of this project  
**Stack:** React 18, TypeScript, Vite, TanStack Query, i18next, Framer Motion, Tailwind CSS  
**Project Root:** `executive-cockpit/`

---

## 1. High-Level Architecture

### System Layers

```
┌────────────────────────────────────────────────────────────────────┐
│                       Browser (React SPA)                          │
│                                                                    │
│  ┌──────────────┐   ┌─────────────────┐   ┌──────────────────┐   │
│  │  DataContext │   │ TanStack Query  │   │   Service Layer  │   │
│  │ (global state│   │(server-state +  │   │  (fetch + mock   │   │
│  │  + mock data)│   │   pagination)   │   │   fallback)      │   │
│  └──────────────┘   └─────────────────┘   └──────────────────┘   │
└───────────────────────────────┬────────────────────────────────────┘
                                │ HTTP fetch (no BFF exists yet)
                                ▼
             ┌──────────────────────────────────────┐
             │  Backend API  (localhost:3000)        │
             │  Expected: REST+ODATA endpoints       │
             │  Status: NOT IMPLEMENTED / MOCKED     │
             └──────────────────────────────────────┘
                                │
                                ▼
             ┌──────────────────────────────────────┐
             │         DEXMO / CRM Backend          │
             │         (ODATA v4 compliant)         │
             └──────────────────────────────────────┘
```

### ⚠️ Critical Reality Check

**There is no BFF (Backend-for-Frontend) implemented in this project.** All references to `localhost:3000/api/opportunities` in `OpportunityService.ts` point to a backend that was never built. Every service method has a `try/catch` that falls back to in-memory mock data when the HTTP call fails. As a result, **the application currently runs 100% on generated mock data**.

### Data Flow (as it would work in production)

1. Browser mounts → `DataContext.tsx` runs `refreshData()` on mount
2. `refreshData()` calls `OpportunityService.getAll()` → HTTP GET `localhost:3000/api/opportunities?$top=100&$orderby=created_at+desc`
3. **(Intended but not built)** A BFF at `localhost:3000` would receive this, translate ODATA params, call DEXMO, and return a unified JSON response
4. Response arrives → `DataContext` stores raw data in React state
5. All dashboard components derive their view from `useData()` context hook — computations happen **entirely in the browser via `useMemo`**
6. The `OpportunityManagementPage` uses TanStack Query for server-state management with `$top`, `$skip`, `$filter` — this is proper pagination-ready ODATA integration

### Where Aggregation Happens

**All aggregation is client-side.** There is no server-side `$apply` groupBy. Every chart, KPI, leaderboard, and forecast view is computed through `useMemo` hooks inside components that receive the full dataset from `DataContext`.

### Where Pagination Happens

Only in one place: `OpportunityManagementPage.tsx`. This page uses TanStack Query + `$top` / `$skip` + `$count: true` to implement proper server-side pagination. All other dashboards (Opportunities, Contracts, Orders, Quotes, Activities) render the full dataset in DOM — no server-sde pagination.

---

## 2. Frontend Architecture

### Component Hierarchy

```
main.tsx
└── QueryClientProvider (TanStack Query global client)
    └── App.tsx
        ├── DataProvider (DataContext — global data state)
        │   ├── Shell (layout: Sidebar + Header + slot for content)
        │   │   └── [activeView content — switched via useState]
        │   │       ├── ExecutiveSummaryDashboard
        │   │       ├── ExecutiveDashboardPageV2
        │   │       ├── OpportunitiesDashboard
        │   │       │   ├── PipelineAIInsightPanel
        │   │       │   ├── FunnelChart
        │   │       │   ├── GamifiedLeaderboard
        │   │       │   ├── ProductPerformance
        │   │       │   ├── OpportunityForecast
        │   │       │   └── OpportunityDetailModal
        │   │       ├── OpportunityManagementPage (server-paged)
        │   │       │   └── OpportunityDetailDrawer
        │   │       ├── ActivitiesDashboard
        │   │       │   ├── ActivityAnalysisGrid
        │   │       │   └── ActivityLogGrid
        │   │       ├── QuotesDashboard
        │   │       │   ├── QuotePoolAnalysis
        │   │       │   └── QuoteProductPerformance
        │   │       ├── OrdersDashboard
        │   │       │   ├── OrderPoolAnalysis
        │   │       │   └── OrderProductPerformance
        │   │       └── ContractsDashboard
        │   │           ├── MarketIntelligence
        │   │           └── ContractsDashboard (sub-views)
        │   └── RunaAIBot (floating assistant widget)
        └── [implicit: i18n context via react-i18next]
```

### State Management Strategy

The application uses a **two-tier state strategy**:

| Tier | Tech | Purpose |
|---|---|---|
| Global/domain state | React Context (`DataContext`) | All CRM data: deals, activities, quotes, orders, contracts, users |
| Server-synchronized state | TanStack Query (`useQuery`) | Paginated ODATA fetch in `OpportunityManagementPage` only |
| Local UI state | `useState` inside components | Filters, sort config, view mode (list/kanban), modal open/close |

`DataContext` holds **all data in a single flat array** per entity type and exposes it via `useData()`. Components derive their subsets using `useMemo`. There is **no Zustand, Redux, or Recoil** in this project.

### How Pagination Works

**`OpportunityManagementPage` (server-side pagination):**
- Page index stored in `useState<number>` (zero-based)
- `$top = 10` (fixed), `$skip = page * 10` (derived)
- `$count: true` sent in every request → total record count read from `@odata.count` in response
- `totalPages = Math.ceil(@odata.count / 10)`
- Previous/Next buttons disabled at boundaries
- On search, page is reset to 0 to avoid empty slices
- TanStack Query caches each `{page, search}` combination and shows `placeholderData` (stale data) while fetching, preventing loading flicker

**All other dashboards:** No pagination. The full dataset is rendered into the DOM (up to 850 mock records). This is a known scalability issue — see §8.

### How Filtering Maps to ODATA

In `OpportunityManagementPage`, the search input maps directly to an ODATA `$filter` expression:

```
$filter = contains(title, 'searchterm') or contains(customer_name, 'searchterm')
```

This string is passed verbatim to the `OpportunityService.getList()` method, which appends it as a URL query parameter. **No field is `$encoded` beyond URLSearchParams default behavior.**

In all other dashboards, filtering runs **entirely in the browser** via `useMemo`. There is no ODATA `$filter` call generated from the dashboard filter controls.

### Lazy Loading Strategy

**There is none.** All dashboard data is loaded at application startup via `DataContext.refreshData()`. The `isLoading` flag in context gates a loading spinner at the top level, but code splitting, route-level lazy loading, or data-on-demand are not implemented. `React.lazy()` is not used anywhere.

---

## 3. Backend (BFF) Architecture

### ⚠️ IMPORTANT: No BFF Has Been Built

All the structure described below exists only as **client-side intent** encoded in `OpportunityService.ts`. The actual `localhost:3000` server does not exist. This section documents what was **designed and implied** by the frontend API contract.

### All Service Methods (Frontend API Contract)

File: `src/services/OpportunityService.ts`

| Method | HTTP | URL | Purpose |
|---|---|---|---|
| `getAll()` | GET | `/api/opportunities?$top=100&$orderby=created_at+desc` | Legacy bootstrap — loads first 100 deals for global context |
| `getList(params)` | GET | `/api/opportunities?[ODATA params]` | Paginated, filtered list for Management page |
| `getById(id)` | GET | `/api/opportunities/:id` | Fetch single deal for detail drawer |
| `getContacts(id)` | GET | `/api/opportunities/:id/contacts` | Sub-resource: contacts linked to a deal |
| `getNotes(id)` | GET | `/api/opportunities/:id/notes` | Sub-resource: notes linked to a deal |
| `create(data)` | POST | `/api/opportunities` | Create new opportunity |
| `update(id, data)` | PUT | `/api/opportunities/:id` | Full update of existing opportunity |
| `delete(id)` | DELETE | `/api/opportunities/:id` | Hard delete |

All other entity types (Contracts, Quotes, Orders, Activities) have **no service class**. They are served entirely from mock data. There is no `/api/contracts`, `/api/quotes`, etc.

### How ODATA Calls Are Constructed

```typescript
// src/services/OpportunityService.ts
const searchParams = new URLSearchParams();
if (params.$top)    searchParams.append('$top', params.$top.toString());
if (params.$skip)   searchParams.append('$skip', params.$skip.toString());
if (params.$filter) searchParams.append('$filter', params.$filter);
if (params.$select) searchParams.append('$select', params.$select);
if (params.$orderby) searchParams.append('$orderby', params.$orderby);
if (params.$count)  searchParams.append('$count', 'true');

fetch(`${API_URL}?${searchParams.toString()}`)
```

There is **no ODATA request builder library**. Parameters are assembled manually via `URLSearchParams`. The BFF (when built) is expected to accept these parameters and forward them to DEXMO.

### How the DEXMO 20-Record Limit Is Handled

**It is not handled.** The `getAll()` call requests `$top=100`, which would fail silently if DEXMO enforces a page cap of 20. There is no recursive paging, no `@odata.nextLink` tracking, and no loop to fetch all pages.

**[ASSUMPTION]** The design assumes either:
1. DEXMO's page cap is not 20 for this entity, or
2. The BFF would handle recursive fetching before responding, or
3. The 100-record cap is acceptable for the current data volume

### How Recursive Fetching Works

**It is not implemented.** The frontend makes a single HTTP request per `getList()` call. If DEXMO returns `@odata.nextLink`, it is silently ignored. The service only reads `@odata.count` and `value` from the response body.

### Caching Strategy

TanStack Query is configured at `main.tsx` with default settings (no explicit `staleTime`, `gcTime`, or `cacheTime` overrides). Default behavior:
- Stale time: **0 ms** (data is stale immediately on delivery)
- Cache time: **5 minutes** (data stays in memory for 5 min after component unmounts)
- Refetch on window focus: **enabled by default**

`DataContext` has **no caching layer**. It re-fetches on every hard reload.

---

## 4. ODATA Strategy

### Which Entities Are Used (Designed / Intended)

| Entity (DEXMO) | Mapped Frontend Type | Status |
|---|---|---|
| Opportunities | `Deal` | Partially wired (service exists) |
| Contacts | `Contact` | Service method exists, no real calls |
| Notes | `OpportunityNote` | Service method exists, no real calls |
| Quotes | `Quote` | Mock only |
| Orders | `Order` | Mock only |
| Contracts | `Contract` | Mock only |
| Activities | `Activity` | Generated from deals, mock only |

### `$select` Usage

**Not used anywhere.** All ODATA calls fetch all ODATA entity fields. The `ODataParams` interface defines a `$select?: string` field, but no caller populates it.

### `$expand` Usage

**Not used.** ODATA expand (loading related entities inline) is not implemented. The `getContacts` and `getNotes` methods use separate sub-resource endpoints (`/opportunities/:id/contacts`) rather than `$expand=contacts`.

### `$filter` Patterns

Only one `$filter` pattern is generated by the frontend:

```
contains(title, 'searchterm') or contains(customer_name, 'searchterm')
```

No date-range filters, no stage filters, no owner filters ever reach the API. Those operations happen client-side.

### `$orderby` Patterns

Only one default: `created_at desc`. No dynamic sort is passed to the API from any UI control.

### `$count` Usage

Used in `OpportunityManagementPage`. Sent as `$count=true`. The response `@odata.count` is read and used to compute total page count.

### `$apply` Usage

**Not used.** No server-side aggregation (`groupby`, `aggregate`) is used anywhere. All grouping and summation happens in client-side `useMemo`.

---

## 5. Aggregation & Forecast Logic

### How Weighted Revenue Is Calculated

```typescript
// In mockData.ts (generation time)
weightedValue = value * (probability / 100)

// In OpportunityForecast.tsx (runtime)
month.weightedValue += deal.value * (deal.probability / 100);
```

Simple multiplication: deal value × close probability. Currency is not normalized — all values are treated as TRY regardless of the `currency` field on the `Deal`. **[ASSUMPTION]** All deals are assumed to be in TRY for aggregation purposes. Multi-currency normalization is not implemented.

### How Slippage Is Calculated

**Slippage is not explicitly calculated** as a delta between forecasted and actual close dates. The `OpportunityForecast` component derives an "overdue" signal:

```typescript
const isOverdue = closeDate < today && 
    !['Kazanıldı', 'Kaybedildi', 'Order', 'Lost', 'Onaylandı'].includes(deal.stage);
```

Overdue deals with a past `expectedCloseDate` that are still in an open stage are **bucketed into the current month** and flagged with an overdueCount badge. This is a visual proxy for slippage, not a proper slippage metric (i.e., no "original forecast date vs revised date" tracking exists).

### How Renewal Risk Is Calculated

In `mockData.ts` during contract generation:

```typescript
// Step 1: Base health = 80–100
let healthScore = 80 + Math.floor(Math.random() * 20);

// Step 2: Risk escalation
if (daysToRenewal < 90) → riskLevel = 'Medium', healthScore -= 20
if (daysToRenewal < 30) → riskLevel = 'High', healthScore -= 30
if (randomPaymentDelay)  → riskLevel = 'High', healthScore -= 40
if (foreignCurrency)     → append risk factor (no score change)
```

In `ExecutiveBriefService.ts`:

```typescript
const highRiskContracts = activeContracts.filter(c => c.riskLevel === 'High');
const highRiskValue = highRiskContracts.reduce((sum, c) => sum + c.totalValueTL, 0);
```

`totalValueTL` = `totalValue × hardcoded exchange rate` (USD×32, EUR×35, TRY×1). These rates are **static constants in mockData.ts**, not live FX rates.

### What Assumptions Are Made

- [ASSUMPTION] All financial aggregations assume TRY as reporting currency
- [ASSUMPTION] USD/EUR exchange rates are hardcoded: USD=32, EUR=35
- [ASSUMPTION] Close probability is a single static number per deal — no probability decay over time
- [ASSUMPTION] `healthScore` on deals is a random number between 0–100 with no relationship to actual activity patterns
- [ASSUMPTION] `aging` = days since `createdAt` — not days in current stage
- [ASSUMPTION] `velocity` = random number between 0–15 (not computed from stage transition history)
- [ASSUMPTION] Execution Confidence Score = % of open deals with `lastActivityDate` within last 14 days

---

## 6. Security Model

### Authentication Flow

**There is no authentication in this application.** No login form, no session management, no token acquisition, no OAuth redirect. The application renders directly without any auth gate.

### Token Handling

**Not implemented.** No JWT, no Bearer token, no session cookie is attached to any outgoing HTTP request. The `fetch()` calls in `OpportunityService.ts` have bare headers:

```typescript
headers: { 'Content-Type': 'application/json' }
```

No `Authorization` header is set. If/when the real DEXMO backend requires authentication, token injection logic must be added to every service method (or through a centralized fetch interceptor/axios instance).

### RLS Assumptions

**[ASSUMPTION]** The design assumes DEXMO enforces Row-Level Security server-side based on the authenticated user's identity. Since there is no auth, there is also no user-scoped data filtering. In production, all ODATA requests would need a token that DEXMO would use to filter records to the user's allowed scope automatically.

### Permission Checks

**None implemented.** The `User` type has a `role` field (`sales_rep`, `manager`, `executive`) but no component gates UI elements based on user role. All navigation items (`Shell.tsx`) are visible to all users. There is no capability system, no RBAC enforcement, no hidden routes.

---

## 7. Performance Assumptions

### Maximum Expected Record Count

| Entity | Mock Volume | Production Assumption |
|---|---|---|
| Deals (Opportunities) | 853 (850 random + 3 story) | Unknown — [ASSUMPTION: < 10,000] |
| Contracts | 122 (120 random + 2 story) | Unknown — [ASSUMPTION: < 1,000] |
| Activities | ~4,000–7,000 (1–8 per deal) | Unknown — [ASSUMPTION: < 50,000] |
| Quotes | ~425 (50% of deals) | Unknown |
| Orders | ~350 (subset of quotes) | Unknown |

### How Many ODATA Calls Per Dashboard Load

| Dashboard | ODATA Calls Made |
|---|---|
| ExecutiveSummaryDashboard | 1 (bootstrap via `DataContext`) |
| OpportunitiesDashboard | 1 (bootstrap) |
| OpportunityManagementPage | 1 per page change or search change |
| ActivitiesDashboard | 1 (bootstrap) |
| QuotesDashboard | 1 (bootstrap) |
| OrdersDashboard | 1 (bootstrap) |
| ContractsDashboard | 1 (bootstrap) |
| RunaAIBot overlay | 0 (purely local logic) |

Currently all calls fail → fall back to mock. In production, only the ManagementPage uses correct server-side ODATA. All others would require proper integrations.

### Where Bottlenecks Might Exist

1. **`DataContext.refreshData()` at startup**: A single `getAll()` call fetches `$top=100`. If in production the dataset has 10,000 deals, this is insufficient. If the limit is raised to fetch all records, it becomes a massive blocking initial load.

2. **Client-side aggregation over 850+ records on every filter interaction**: Every `useMemo` in every dashboard recalculates over the full unsorted array on each filter state change. At 10,000+ records this would cause noticeable jank without `useTransition` or Web Worker offloading.

3. **`generateMockData(850)`** is called synchronously on the main thread: This runs a 850-iteration loop including contract generation and activity generation (potentially 7,000+ items) synchronously during app init. In development this is fast; in production this code path should not exist.

4. **`ActivityLogGrid` and `OrdersDashboard` render full unvirtualized lists**: Large datasets with no `react-window` or intersection-observer-based virtualization will cause DOM bloat.

5. **TanStack Query refetch on focus**: With default settings, every time the browser tab regains focus the ManagementPage will re-fetch from the API. This is correct behavior but could be noisy if the API is slow.

---

## 8. Known Limitations

### What Is Not Production Ready

- **No real backend**: The entire data layer is mocked. The `localhost:3000` API does not exist.
- **No authentication**: No login flow, no token management, no user identity.
- **No authorization**: Role field exists on the `User` type but is never used for access control.
- **Client-side aggregation only**: No `$apply` / groupBy / server-side aggregate. All computation is in the browser.
- **No ODATA for Contracts/Quotes/Orders/Activities**: Only Opportunities have a service class. All other entities are mock-only.
- **Static exchange rates**: USD=32, EUR=35 hardcoded in `mockData.ts`.
- **No real AI**: `AiService.ts`, `CollectionAnalysisService.ts`, `ManagementIntelligenceService.ts`, and `ExecutiveBriefService.ts` all simulate AI with random selection or deterministic mock logic + artificial delays.
- **i18n incomplete**: The `i18n/locales` directory exists but some keys are used with `{ defaultValue: '...' }` fallback, indicating incomplete translation coverage, particularly in newer dashboard sections.
- **`healthScore` is random**: On deals, `healthScore` is `Math.floor(Math.random() * 100)`. It has no relationship to activity recency, value, stage, or any computed metric.

### What Might Break at Scale

- Rendering 10,000+ records without virtualization → browser freeze
- Fetching all deals without server-side pagination in `DataContext.getAll()` → timeout or memory overflow
- Synchronous mock data generation (`generateMockData(850)`) if fallback is triggered in production under load → main thread blocking
- The `generateActivitiesForDeals()` function creates up to 8 activities per deal in a single sync loop — at 5,000 deals this is 40,000 object allocations on the main thread
- TanStack Query default `staleTime: 0` causes every focus event to re-fetch from the API — tolerable at low request volume, but hammers the backend under heavy use

### What Depends on DEXMO Configuration

- **ODATA entity names**: The frontend calls `/api/opportunities`. Whether DEXMO exposes `Opportunities`, `CRM_Opportunities`, or another entity path is assumed to be handled by the (nonexistent) BFF.
- **Field names**: The frontend snake_case → camelCase mapping in `mapToDeal()` assumes DEXMO returns: `customer_name`, `owner_id`, `expected_close_date`, `last_activity_date`, `weighted_value`, `health_score`, `created_at`, `updated_at`. If DEXMO field names differ, the mapper breaks silently (fields become `undefined`).
- **`$filter contains()` support**: The `contains(title, 'term')` filter assumes DEXMO supports the OData v4 string function `contains`. If DEXMO uses OData v3 or a different operator, search breaks.
- **`$count` support**: Pagination in ManagementPage depends on DEXMO returning `@odata.count`. If not configured, `totalCount` will be 0, disabling all pagination navigation.
- **Maximum page size**: If DEXMO enforces a server-side cap below `$top=100`, the `getAll()` bootstrap call will return a truncated dataset with no warning.

---

## 9. Deviation Report

### Deviations from Standard ODATA Best Practices

| Deviation | Description | Impact |
|---|---|---|
| No `$select` | All fields are returned from every ODATA call | Over-fetching; large payloads |
| No `$expand` | Sub-resources fetched via separate endpoints, not inline | N+1 request pattern for contacts/notes on deal detail |
| No `$apply` | All aggregation is client-side | Prevents efficient server-side groupBy and count operations |
| No `@odata.nextLink` tracking | Pagination ignores next-page links from DEXMO | Only the first page of results is accessible via `getAll()` |
| `$filter` constructed by string concatenation | No sanitization, no parameterization | Injection risk if user input is passed directly; the current implementation appends raw search string |
| Mixed response format handling | `getList()` accepts both `T[]` and `{ value: T[], '@odata.count': number }` | Indicates uncertainty about DEXMO response contract; the `Array.isArray()` branch should be removed once the API contract is fixed |

### Architectural Decisions Made Without Explicit Instruction

| Decision | Rationale (inferred) |
|---|---|
| React Context (`DataContext`) holds all entities | Simplicity over correctness; avoids per-dashboard fetch orchestration at the cost of holding the entire dataset in memory |
| Mock data as primary fallback | Enables frontend development and demo without a running backend; every service method silently falls back without user notification |
| Two separate "Opportunities" pages | `OpportunitiesDashboard` = read-only analytics view; `OpportunityManagementPage` = CRUD DataGrid. Different UX purposes, different data strategies (context vs. server-fetched). This distinction is correct but inconsistent in implementation. |
| TanStack Query only in ManagementPage | Other pages don't use server-state management. The decision to use React Context for global data and TanStack Query for paginated lists is intentional but never documented or enforced as a pattern. |
| AI services are fully mocked | External AI/LLM API integration was out of scope. Simulated with async delays and random text selection. |
| Hardcoded USERS list | The 10 users in `mockData.ts` are statically defined and shared across all mock data generation. In production, users must come from a DEXMO user/identity API. |
| `currency` field on `Deal` is never used for normalization | Currency field exists in the type and is set to `'TRY'` for all mock deals. Normalization logic is only applied in contract generation (via hardcoded exchange rates). Revenue aggregations in dashboards do not normalize by currency. |
| No React Router | Navigation is implemented as `useState('executive')` in `App.tsx` with a switch statement. This is intentional for the current embedded/iframe deployment model, but makes deep linking and browser history broken. |

---

*End of Technical Handover Documentation.*
