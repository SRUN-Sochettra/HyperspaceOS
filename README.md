# HyperSpace

A browser-native desktop environment built with vanilla JavaScript and Vite.

HyperSpace provides a window manager, multiple workspaces, a persistent virtual file system, terminal, editor, notes, music synthesizer and visualizer, weather client, whiteboard, system tools, search, clipboard history, themes, and a rule-based command assistant.

## Development

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

Data is stored locally by the browser. System Monitor surfaces browser-observable values such as frame rate, DOM node count, JavaScript heap availability, and event-loop lag; it does not claim native device CPU or GPU telemetry.

## License

MIT
