# HyperSpace

A browser-native desktop environment built with vanilla JavaScript and Vite.

HyperSpace provides a window manager, multiple workspaces, a persistent virtual file system, terminal, editor, notes, music synthesizer and visualizer, weather client, whiteboard, system tools, search, clipboard history, themes, and a rule-based command assistant.

## Development

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Architecture

- `src/core`: state, persistence, registry, file system, themes, and OS lifecycle
- `src/wm`: windows, snapping, dragging, resizing, and workspaces
- `src/ui`: desktop shell and shared interface surfaces
- `src/apps`: built-in applications
- `src/styles`: semantic tokens and shared visual language

The project uses vanilla JavaScript with ES modules, custom CSS, and Vite 5.4.21. Its data is stored locally by the browser. System Monitor surfaces browser-observable values such as frame rate, DOM node count, JavaScript heap availability, and event-loop lag; it does not claim native device CPU or GPU telemetry.

## Local demonstration boundaries

Mail, files, contacts, photos, and video use the browser-local virtual filesystem. Mail's "Save to Sent" action records a simulated sent state locally and never claims network delivery. Photos and Video show truthful empty states until supported base64 media is placed in their virtual folders.

## Verification

```bash
npm test
npm run build
npm run dev -- --host 127.0.0.1
python scripts/verify_runtime.py
```

The browser suite must exit successfully before its results are described as passing. Screenshots are diagnostic artifacts only. See `REPAIR_REPORT.md` for the evidence and limitations of the latest repair session.

## License

MIT
