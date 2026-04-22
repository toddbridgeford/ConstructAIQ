# Satellite BSI Pipeline

Computes Bare Soil Index from Sentinel-2 imagery for 20 US MSAs.

## Setup

```bash
pip install -r satellite/requirements.txt
```

## Credentials needed

- `COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET`
  - Register free at: https://dataspace.copernicus.eu
  - Create OAuth2 client at: https://shapps.dataspace.copernicus.eu/dashboard

Copy `.env.example` to `.env` and fill in both Copernicus values plus your Supabase credentials.

## Run manually

```bash
cd /path/to/ConstructAIQ
python satellite/process_bsi.py
```

## Schedule

Runs weekly via GitHub Actions (`.github/workflows/satellite.yml`).
Results stored in Supabase `satellite_bsi` table.
Read by Next.js via `/api/satellite` route.

## How it works

1. Loads MSA bounding boxes from `msa_boundaries` table
2. Authenticates with Copernicus Data Space OAuth2
3. For each MSA, submits a Sentinel Hub Process API request with a custom evalscript
4. Evalscript computes BSI per pixel and applies SCL cloud masking (classes 3, 8, 9, 10, 11)
5. Computes mean BSI over valid pixels, derives 90-day and YoY change vs prior observations
6. Upserts results to `satellite_bsi` with confidence level (HIGH/MEDIUM/LOW)

## BSI formula

```
BSI = ((SWIR + Red) - (NIR + Blue)) / ((SWIR + Red) + (NIR + Blue))
```

Sentinel-2 band mapping: Blue=B02, Red=B04, NIR=B08, SWIR=B11

Positive BSI values indicate bare/disturbed soil. A rising 90-day trend over an MSA
is a leading indicator of construction ground disturbance.

## Confidence levels

| Level  | Cloud cover |
|--------|-------------|
| HIGH   | < 20%       |
| MEDIUM | 20–40%      |
| LOW    | > 40% or < 1,000 valid pixels |
