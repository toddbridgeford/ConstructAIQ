# Post-Binding Verification — Run Sheet

> Fill this in immediately after Vercel domain binding is complete.
> Commands are copy-paste ready. Paste output directly into each section.

---

## Meta

| Field | Value |
|-------|-------|
| Timestamp | |
| Operator | |

---

## 1. Domain check

```bash
npm run domain:check
```

**Output:**
```
(paste here)
```

**Result:** `APEX_OK` + `WWW_REDIRECT_OK` → GO / FAIL →

---

## 2. www smoke

```bash
npm run smoke:www
```

**Output:**
```
(paste here)
```

**Result:** exit 0 → GO / exit 1 →

---

## 3. Full production smoke

```bash
npm run smoke:prod
```

**Output:**
```
(paste here)
```

**Result:** exit 0 → GO / exit 1 →

---

## 4. Env variables (`/api/status .env`)

```bash
curl -s https://constructaiq.trade/api/status | jq .env
```

**Output:**
```json
(paste here)
```

Expected all `true`. Required for GO: `supabaseConfigured`, `cronSecretConfigured`.

| Key | Value | Required |
|-----|-------|----------|
| `supabaseConfigured` | | P0 |
| `cronSecretConfigured` | | P0 |
| `anthropicConfigured` | | Warning |
| `upstashConfigured` | | Warning |
| `sentryConfigured` | | Warning |

---

## 5. Runtime data (`/api/status .data`)

```bash
curl -s https://constructaiq.trade/api/status | jq .data
```

**Output:**
```json
(paste here)
```

---

## 6. Federal data source

```bash
curl -s https://constructaiq.trade/api/federal | jq '{dataSource, contractors: (.contractors|length), agencies: (.agencies|length)}'
```

**Output:**
```json
(paste here)
```

`dataSource: "live"` = GO · `dataSource: "static"` = Warning (not a blocker).

---

## 7. Weekly brief source

```bash
curl -s https://constructaiq.trade/api/weekly-brief | jq '{source, live, configured}'
```

**Output:**
```json
(paste here)
```

`live: true` = GO · `live: false` = Warning (not a blocker).

---

## 8. Dashboard shape

```bash
curl -s https://constructaiq.trade/api/dashboard | jq '{fetched_at, cshi: (.cshi|type), signals: (.signals|length), commodities: (.commodities|length), forecast: (.forecast|type)}'
```

**Output:**
```json
(paste here)
```

`cshi` must not be `"string"`. `signals` and `commodities` must be > 0. `forecast` must be `"object"`.

---

## Final verdict

| Check | Result |
|-------|--------|
| Domain check | |
| smoke:www | |
| smoke:prod | |
| `supabaseConfigured` | |
| `cronSecretConfigured` | |
| Dashboard shape | |

**Overall: GO / NO-GO**

---

## Remaining blockers

*(list any NO-GO items and their fix)*

-
