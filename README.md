# DatadistApp

Proyecto con datos, graficas y visuales de informacion del comportamiento de consumo de energia de usuarios Vivivan.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Datadis + Database strategy (24h refresh)

The app is configured so dashboard reads come from Supabase, not directly from Datadis:

- `GET /api/consumption` reads from table `consumption_data`
- `POST /api/sync/clients` pulls authorizations/supplies from Datadis and upserts to DB
- `POST /api/sync/consumption` pulls consumption from Datadis and upserts to DB
- `GET /api/cron/weekly-sync` runs both sync steps and only refreshes supplies with `last_sync` older than 24 hours

### Daily automation on Vercel (every 24h)

1. Set `CRON_SECRET` in Vercel environment variables.
2. Keep `vercel.json` cron:
   - Daily 03:00 UTC: `0 3 * * *` -> `/api/cron/weekly-sync`
3. Vercel will call cron with `Authorization: Bearer <CRON_SECRET>`.

### Daily automation on Netlify (every 24h)

- Netlify does not read `vercel.json`, so Vercel cron config is ignored there.
- This repo includes a Netlify Scheduled Function:
  - `netlify/functions/weekly-sync.ts`
  - schedule configured in `netlify.toml` as `0 3 * * *`
- The Netlify function runs both steps:
  - `POST /api/sync/clients`
  - `POST /api/sync/consumption` with `{ "staleDays": 1 }`

### Local manual sync

- Full sync: trigger button in UI or `POST /api/sync/clients` + `POST /api/sync/consumption`
- Stale-only sync: `POST /api/sync/consumption` with body `{ "staleDays": 1 }`
