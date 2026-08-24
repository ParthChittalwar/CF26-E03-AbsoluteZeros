# ClimateShield — Render Deployment Checklist

This repository is prepared for a two-service Render deployment.

## Services

| Service | Type | Root | Build | Start/Publish | Health |
|---|---|---|---|---|---|
| `climateshield-api` | Web Service | `backend` | `npm ci && npm run build` | `npm start` | `/api/health` |
| `climateshield-web` | Static Site | `frontend` | `npm ci && npm run build` | `dist` | CDN/static |

## Required secret

Only the backend needs a secret during deployment:

```text
MONGODB_URI=<your working MongoDB Atlas connection string>
```

Do not put the real MongoDB URI into `render.yaml` or Git. The Blueprint marks it as `sync: false`, so Render asks for it during initial setup.

`GEMINI_API_KEY` is intentionally not required. The current project does not use Gemini.

## Blueprint deployment

1. Push the repository, including `render.yaml`, to GitHub.
2. Keep the repository private if the hackathon requires it to remain private.
3. Render Dashboard → **New** → **Blueprint**.
4. Connect the GitHub repository.
5. Review the two services.
6. Enter the working `MONGODB_URI` when Render asks for it.
7. Deploy the Blueprint.
8. Wait for the backend to become healthy.
9. Open the generated frontend URL.

The frontend's `VITE_API_BASE_URL` is wired to the backend service's Render external URL by the Blueprint.

## Post-deploy verification

### 1. Backend health

Open:

```text
https://<backend>.onrender.com/api/health
```

Expected shape:

```json
{
  "status": "ok",
  "dbConnected": true
}
```

`dbConnected` may be false if MongoDB is unavailable; the core simulator can still run.

### 2. Frontend

Open the generated frontend URL. Confirm the top bar reports persistence when MongoDB is connected.

### 3. Demo smoke test

Use:

- Scenario: Extreme Flood
- Budget: ₹100 Cr
- Runs: 500
- Seed: 2026
- Generate & Recommend

Expected recommendation from the verified local demo:

**Flood Barrier + Urban Forest + Heat Shelters**

Expected displayed result:

- Expected damage: about ₹9.5 Cr
- Baseline damage: about ₹32.2 Cr
- Damage reduction: 71%
- Success probability: 100%
- 63 combinations explored
- 39 feasible under ₹100 Cr

## Important Render behavior

The backend is configured to listen on `0.0.0.0` and uses the `PORT` environment variable supplied by Render. Do not hard-code port 5000 for production.

The frontend is a Vite static site, so `VITE_API_BASE_URL` is a build-time value. If the backend URL changes, redeploy the frontend so Vite rebuilds the bundle with the new URL.

Free Render web services can spin down after inactivity, so the first request after a period of inactivity may be slower.
