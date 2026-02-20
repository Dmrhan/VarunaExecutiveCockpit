# Varuna Intelligence BFF

A Node.js + TypeScript Backend-for-Frontend that provides an SQLite-based analytics
projection layer for Varuna Opportunity data.

## Architecture

```
Varuna (source of truth)
    → POST /api/opportunity/sync  (webhook or scheduled push)
    → SQLite (varuna.db)
    → GET  /api/analytics/*
    → React UI (read-only analytics)
```

## Setup

```bash
cd varuna-bff
npm install
npm run dev      # Development server on :3001
```

## Migration (create tables)

```bash
npm run migrate
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/health` | Health check + table count |
| `POST` | `/api/opportunity/sync` | Upsert opportunity + detail data |
| `GET`  | `/api/analytics/pipeline` | Open pipeline KPIs |
| `GET`  | `/api/analytics/funnel/monthly` | Won/Lost by month |
| `GET`  | `/api/analytics/funnel/weekly` | Revenue by week |
| `GET`  | `/api/analytics/funnel/quarterly` | Revenue by quarter |
| `GET`  | `/api/analytics/distribution/probability` | Deals by ProbabilityBand |
| `GET`  | `/api/analytics/owners` | Pipeline per OwnerId |

### Optional Query Filters (all analytics endpoints)

- `?ownerId=usr-042`
- `?accountId=acc-001`
- `?from=2026-01-01`
- `?to=2026-06-30`

## Test Sync

```bash
curl -s -X POST http://localhost:3001/api/opportunity/sync \
  -H "Content-Type: application/json" \
  -d @test/fixtures/sample_opportunity.json | jq .

# Verify
curl http://localhost:3001/api/analytics/pipeline | jq .
```

## Enum Values (⚠️ Confirm against C# model)

The following integer values are **assumptions** pending confirmation:

| Field | Value | Meaning |
|-------|-------|---------|
| `DealStatus` | `2` | Won |
| `DealStatus` | `3` | Lost |
| `WonLostType` | `1` | Won |
| `WonLostType` | `2` | Lost |

Update `src/routes/analytics.ts` constants when confirmed.
