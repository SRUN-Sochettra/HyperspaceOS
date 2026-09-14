# AGY Handoff

## Current repair state

The repository was reconstructed from the packed Repomix text files. Historical runtime claims were retired because they were not current proof and covered only 12 of 22 applications.

## Required local verification

```bash
npm install
npm test
npm run build
npm run dev -- --host 127.0.0.1
python scripts/verify_runtime.py
```

Do not report success unless each required command exits with code 0. The runtime script dynamically reads the registry, requires exactly 22 applications, launches every registered application, records environment versions and UTC timestamps, and exits non-zero if any required group fails. Return raw command output and `verification/results.json`.

## Known unsupported behavior

Mail is local-only. Photos and Video accept supported base64 data URLs from the virtual filesystem and intentionally reject remote, SVG, HTML, and mismatched media schemes. Weather and Browser remain network-dependent demonstrations. Browser verification requires an installed Playwright Chromium executable.
