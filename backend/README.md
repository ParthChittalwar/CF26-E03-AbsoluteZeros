# ClimateShield backend — Phase 1 scaffold

Deterministic core is not implemented yet. This phase proves the
folder structure, config layer, persistence layer, and PRNG are in
place and reproducible before any simulation math is written.

## Setup

```
npm install
cp .env.example .env
npm run dev
```

Server starts on http://localhost:5000. MongoDB is optional at this
stage — if `MONGODB_URI` is unreachable the server logs a warning and
keeps serving the config-backed routes.

## Endpoints (Phase 1)

- `GET /api/health` — server + DB connection status
- `GET /api/scenarios` — scenario catalog (from config)
- `GET /api/interventions` — intervention catalog (from config)

## Tests

```
npm test
```

Covers PRNG determinism: same seed -> same sequence, different seed
-> different sequence, including a mock simulation-shaped call
pattern that anticipates how Phase 2 will consume the RNG.
