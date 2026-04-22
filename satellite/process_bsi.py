#!/usr/bin/env python3
"""
ConstructAIQ Sentinel-2 BSI Processing Pipeline
Computes Bare Soil Index for US MSAs to detect construction activity.
BSI = ((SWIR + Red) - (NIR + Blue)) / ((SWIR + Red) + (NIR + Blue))
Sentinel-2 bands: Blue=B02, Red=B04, NIR=B08, SWIR=B11
"""

import os, sys, json, logging, requests
from datetime import datetime, timedelta
from io import BytesIO
import numpy as np
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ['NEXT_PUBLIC_SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
COPERNICUS_ID = os.environ.get('COPERNICUS_CLIENT_ID', '')
COPERNICUS_SECRET = os.environ.get('COPERNICUS_CLIENT_SECRET', '')

# Max cloud cover to accept a scene
MAX_CLOUD_PCT = 40
# Min valid pixels required
MIN_VALID_PIXELS = 1000


def get_copernicus_token():
    """Get OAuth2 token from Copernicus Data Space."""
    r = requests.post(
        'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
        data={
            'client_id': COPERNICUS_ID,
            'client_secret': COPERNICUS_SECRET,
            'grant_type': 'client_credentials',
        },
        timeout=30,
    )
    r.raise_for_status()
    return r.json()['access_token']


def search_sentinel2_scenes(bbox, date_from, date_to, token):
    """Search for Sentinel-2 L2A scenes over a bounding box."""
    west, south, east, north = bbox
    footprint = (
        f"POLYGON(({west} {south},{east} {south},"
        f"{east} {north},{west} {north},{west} {south}))"
    )

    params = {
        'maxRecords': 5,
        'startDate': date_from,
        'completionDate': date_to,
        'processingLevel': 'S2MSI2A',
        'cloudCover': f'[0,{MAX_CLOUD_PCT}]',
        'geometry': footprint,
        'sortParam': 'cloudCover',
        'sortOrder': 'ascending',
    }

    r = requests.get(
        'https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel2/search.json',
        params=params,
        headers={'Authorization': f'Bearer {token}'},
        timeout=30,
    )
    r.raise_for_status()
    features = r.json().get('features', [])
    log.info(f"Found {len(features)} scenes")
    return features


def download_band(product_id, band_name, token):
    """Download a single Sentinel-2 band as a numpy array via WMS/STAC."""
    # Returns None if download fails — caller handles gracefully
    try:
        url = (
            f"https://sh.dataspace.copernicus.eu/ogc/wcs/{COPERNICUS_ID}"
            f"?SERVICE=WCS&VERSION=1.1.1&REQUEST=GetCoverage"
            f"&IDENTIFIER={band_name}&FORMAT=image/tiff"
            f"&TIME={product_id}"
        )
        r = requests.get(url, headers={'Authorization': f'Bearer {token}'}, timeout=60)
        if not r.ok:
            return None
        import rasterio
        with rasterio.open(BytesIO(r.content)) as src:
            return src.read(1).astype(np.float32)
    except Exception as e:
        log.warning(f"Band download failed for {band_name}: {e}")
        return None


def compute_bsi_evalscript():
    """Return the Sentinel Hub evalscript for BSI computation."""
    return """
//VERSION=3
function setup() {
  return {
    input: [{bands: ["B02","B04","B08","B11","SCL"]}],
    output: {bands: 2, sampleType: "FLOAT32"}
  };
}
function evaluatePixel(s) {
  // SCL cloud mask: values 3,8,9,10,11 are cloud/shadow/snow
  var scl = s.SCL;
  var masked = [3,8,9,10,11].includes(scl);
  if (masked) return [-9999, 0]; // nodata, invalid pixel

  var B02 = s.B02, B04 = s.B04, B08 = s.B08, B11 = s.B11;
  var denom = (B11 + B04) + (B08 + B02);
  var bsi = denom > 0 ? ((B11 + B04) - (B08 + B02)) / denom : 0;
  return [bsi, 1]; // [BSI value, valid pixel flag]
}
"""


def fetch_bsi_for_msa(msa, date_from, date_to, token):
    """
    Fetch BSI for one MSA using Sentinel Hub Process API.
    Returns dict with bsi_mean, cloud_cover_pct, valid_pixels, total_pixels.
    """
    bbox = [msa['bbox_west'], msa['bbox_south'], msa['bbox_east'], msa['bbox_north']]

    payload = {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"},
            },
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange": {
                        "from": date_from + "T00:00:00Z",
                        "to": date_to + "T23:59:59Z",
                    },
                    "maxCloudCoverage": MAX_CLOUD_PCT,
                    "mosaickingOrder": "leastCC",
                },
            }],
        },
        "evalscript": compute_bsi_evalscript(),
        "output": {
            "width": 512,
            "height": 512,
            "responses": [{"identifier": "default", "format": {"type": "image/tiff"}}],
        },
    }

    try:
        r = requests.post(
            'https://sh.dataspace.copernicus.eu/api/v1/process',
            json=payload,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
            },
            timeout=120,
        )

        if not r.ok:
            log.warning(
                f"Process API failed for {msa['msa_code']}: {r.status_code} {r.text[:200]}"
            )
            return None

        import rasterio
        with rasterio.open(BytesIO(r.content)) as src:
            data = src.read()  # shape: (2, height, width)

        bsi_band   = data[0].astype(np.float32)
        valid_band = data[1].astype(np.float32)

        valid_mask   = (valid_band == 1) & (bsi_band != -9999)
        total_pixels = bsi_band.size
        valid_pixels = int(valid_mask.sum())

        if valid_pixels < MIN_VALID_PIXELS:
            log.warning(f"{msa['msa_code']}: insufficient valid pixels ({valid_pixels})")
            return {
                'bsi_mean': None,
                'cloud_cover_pct': round((1 - valid_pixels / total_pixels) * 100, 1),
                'valid_pixels': valid_pixels,
                'total_pixels': total_pixels,
                'confidence': 'LOW',
            }

        bsi_values      = bsi_band[valid_mask]
        cloud_cover_pct = round((1 - valid_pixels / total_pixels) * 100, 1)
        confidence      = 'HIGH' if cloud_cover_pct < 20 else ('MEDIUM' if cloud_cover_pct < 40 else 'LOW')

        return {
            'bsi_mean': round(float(np.mean(bsi_values)), 4),
            'cloud_cover_pct': cloud_cover_pct,
            'valid_pixels': valid_pixels,
            'total_pixels': total_pixels,
            'confidence': confidence,
        }

    except Exception as e:
        log.error(f"BSI fetch failed for {msa['msa_code']}: {e}")
        return None


def check_false_positives(msa_code, date_str):
    """
    Check for signals that might explain a BSI increase without new construction.
    Returns list of flag strings.
    """
    flags = []

    # NOAA storm events, USDA CropScape agricultural land, and USFS FIRMS fire
    # perimeter checks are Phase 4B additions — infrastructure is in place here
    # but the API calls are not yet wired.

    return flags


def compute_bsi_change(supabase_client, msa_code, current_bsi, current_date):
    """Compare current BSI to 90-day and 1-year prior values."""
    date_90d_ago = (datetime.fromisoformat(current_date) - timedelta(days=90)).strftime('%Y-%m-%d')
    date_1y_ago  = (datetime.fromisoformat(current_date) - timedelta(days=365)).strftime('%Y-%m-%d')

    r90 = (
        supabase_client.table('satellite_bsi')
        .select('bsi_mean, observation_date')
        .eq('msa_code', msa_code)
        .gte('observation_date', date_90d_ago)
        .lt('observation_date', current_date)
        .not_.is_('bsi_mean', 'null')
        .order('observation_date', desc=True)
        .limit(1)
        .execute()
    )

    r1y = (
        supabase_client.table('satellite_bsi')
        .select('bsi_mean, observation_date')
        .eq('msa_code', msa_code)
        .gte('observation_date', date_1y_ago)
        .lt('observation_date', date_90d_ago)
        .not_.is_('bsi_mean', 'null')
        .order('observation_date', desc=True)
        .limit(1)
        .execute()
    )

    bsi_change_90d = None
    bsi_change_yoy = None

    if r90.data and r90.data[0]['bsi_mean'] and current_bsi is not None:
        prior = float(r90.data[0]['bsi_mean'])
        if prior != 0:
            bsi_change_90d = round(((current_bsi - prior) / abs(prior)) * 100, 2)

    if r1y.data and r1y.data[0]['bsi_mean'] and current_bsi is not None:
        prior = float(r1y.data[0]['bsi_mean'])
        if prior != 0:
            bsi_change_yoy = round(((current_bsi - prior) / abs(prior)) * 100, 2)

    return bsi_change_90d, bsi_change_yoy


def main():
    log.info("=== ConstructAIQ Satellite BSI Pipeline Starting ===")

    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

    if not COPERNICUS_ID or not COPERNICUS_SECRET:
        log.error("COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET required")
        sys.exit(1)

    token = get_copernicus_token()
    log.info("Copernicus token obtained")

    msas = supabase_client.table('msa_boundaries').select('*').execute().data
    log.info(f"Processing {len(msas)} MSAs")

    date_to   = datetime.utcnow().strftime('%Y-%m-%d')
    date_from = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')

    results = {'success': 0, 'failed': 0, 'skipped': 0}

    for msa in msas:
        msa_code = msa['msa_code']
        log.info(f"Processing {msa_code} — {msa['msa_name']}")

        try:
            bsi_data = fetch_bsi_for_msa(msa, date_from, date_to, token)

            if bsi_data is None:
                log.warning(f"{msa_code}: fetch returned None — skipping")
                results['skipped'] += 1
                continue

            bsi_change_90d, bsi_change_yoy = compute_bsi_change(
                supabase_client, msa_code, bsi_data['bsi_mean'], date_to
            )

            fp_flags = check_false_positives(msa_code, date_to)

            row = {
                'msa_code': msa_code,
                'observation_date': date_to,
                'bsi_mean': bsi_data['bsi_mean'],
                'bsi_change_90d': bsi_change_90d,
                'bsi_change_yoy': bsi_change_yoy,
                'cloud_cover_pct': bsi_data['cloud_cover_pct'],
                'valid_pixels': bsi_data['valid_pixels'],
                'total_pixels': bsi_data['total_pixels'],
                'confidence': bsi_data['confidence'],
                'false_positive_flags': fp_flags,
            }

            supabase_client.table('satellite_bsi').upsert(row).execute()
            log.info(
                f"{msa_code}: BSI={bsi_data['bsi_mean']}, "
                f"90d_change={bsi_change_90d}%, confidence={bsi_data['confidence']}"
            )
            results['success'] += 1

        except Exception as e:
            log.error(f"{msa_code}: failed — {e}")
            results['failed'] += 1
            continue

    log.info(f"=== Pipeline complete: {results} ===")


if __name__ == '__main__':
    main()
