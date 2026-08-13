# KM. Lancar Berkat Prima Last-Position GPS Integration

## Goal

Add an isolated crawler job for the partner GPS API that retrieves the latest position of KM. Lancar Berkat Prima and stores it using the repository's existing GPS models.

## Scope

The first implementation covers only `GET /getlastposition`. It does not implement history retrieval, date-range splitting, pagination, or vessel selection because the partner credential is scoped to one vessel and the request is specifically for last position.

## Configuration

The job reads these environment variables:

- `LANCAR_GPS_API_KEY`: required partner API key; never committed or logged.
- `LANCAR_GPS_API_URL`: defaults to `https://shipmanagement-iksn.com/api/partner/v1/gps`.
- `LANCAR_GPS_ESN`: defaults to `4585161` and is used as the storage identity.
- `LANCAR_GPS_INTERVAL_MS`: defaults to six hours.

## Data flow

1. The job calls `${LANCAR_GPS_API_URL}/getlastposition` with `X-API-Key` and a 30-second timeout.
2. The response must contain a `data` array with at least one record and valid numeric latitude/longitude.
3. The record is normalized to `{ esn, name, latitude, longitude, speed, heading, timestamp }`.
4. `device_gps` is upserted with the ESN and vessel name.
5. `device_gpsHits` receives one history record using the reported timestamp.

`null` speed and heading remain `null`. Invalid coordinates or invalid/missing timestamps fail the fetch and do not write to the database.

## Integration boundary

The existing VesselAPI tracking job remains unchanged. A new `lancar` job is exported from `src/jobs/index.js`, exposed by `src/app.js`, and included in `all` alongside the existing tracking and ports jobs.

## Testing

Tests will cover response normalization, invalid response rejection, request URL/header/timeout, database writes, and one-shot job execution with injected HTTP and Prisma-like clients. The full Node test suite must pass.
