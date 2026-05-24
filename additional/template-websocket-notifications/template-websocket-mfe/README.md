# template-websocket-mfe

A React micro-frontend (MFE) that connects to a WebSocket notification service and displays received events in real time. Uses [Single-SPA](https://single-spa.js.org/) for lifecycle management. Built with Vite and React 18.

---

## Overview

This MFE opens a persistent WebSocket connection to a backend notification service (e.g. `template-websocket-service`), subscribes to one or more event types, and renders a live event log. Subscriptions can be changed live without reconnecting. Reconnection uses automatic exponential backoff.

---

## Architecture

```
Shell App (Single-SPA)
  └── template-websocket-mfe
        ├── src/index.jsx                     ← Single-SPA lifecycle registration
        ├── src/containers/App/               ← Root component, wires hook + UI
        ├── src/hooks/useWebSocket.js         ← Core WebSocket logic
        ├── src/components/ConnectionStatus/  ← Visual connection indicator
        ├── src/components/EventLog/          ← Scrollable event list
        ├── src/components/TagInput/          ← Tag-style subscription editor
        └── src/styles/console.css            ← Scoped dark design system
```

The MFE connects to `template-websocket-service` via:

```
{WS_URL}?subscribe={eventTypes}
```

`WS_URL` is a full `wss://` URL. Subscriptions default to `['*']` (all events) when no tags are set.

---

## Components

### `App` (`src/containers/App/index.jsx`)

Root component. Reads `WS_URL` from `process.env`, manages event state and subscription tags, and renders the full console UI.

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `auth` | `string` | `undefined` | Optional auth token passed to the hook; reconnects when value changes |

Subscriptions are managed internally via `TagInput`. Leaving all tags empty subscribes to `*` (all events).

### `ConnectionStatus` (`src/components/ConnectionStatus/index.jsx`)

Displays a colored indicator:

- Green dot — Connected
- Yellow pulsing — Reconnecting (attempt N)
- Red dot — Disconnected
- Grey dot — Idle (not enabled)

Props: `isConnected: boolean`, `reconnectCount: number`, `isEnabled: boolean`

### `EventLog` (`src/components/EventLog/index.jsx`)

Scrollable event list. Each entry shows event type, timestamp, and expandable JSON. Includes a Clear button, event counter, and flash animation on new events. System entries (connected/disconnected) are shown inline.

Props: `events: object[]`, `onClear: () => void`

### `TagInput` (`src/components/TagInput/index.jsx`)

Tag-style editor for subscription event types. Commit a tag with Enter or comma. Remove with Backspace or clicking the `×`. Use `*` to subscribe to all events.

Props: `tags: string[]`, `onChange: (tags: string[]) => void`, `placeholder?: string`

---

## Hook API: `useWebSocket`

```js
import useWebSocket from './hooks/useWebSocket';

const { isConnected, reconnectCount } = useWebSocket({
  url,           // string — full WebSocket URL, e.g. 'wss://api.example.com/np'
  subscriptions, // string[] — event types; ['*'] = all, [] = nothing
  onUpdate,      // (data: object) => void — called on each parsed message
  auth,          // string? — optional token; reconnects when value changes
  enabled,       // boolean? — default true; set false to disconnect
  replay,        // boolean? — default false; opt in to missed-event recovery (see below)
  replayWindowSecs, // number? — default 1800 (30 min); must match server EVENT_TTL_SECONDS
});
```

**Returns:**

- `isConnected: boolean` — whether the socket is currently open
- `reconnectCount: number` — number of reconnect attempts since last successful connection

**Behaviours:**

- On subscription change: sends `{ action: 'subscribe', eventTypes }` to the open socket without reconnecting
- On drop: reconnects with exponential backoff (1s → 2s → 4s → … → max 30s)
- `enabled: false`: immediately closes the socket and stops reconnect attempts

**`replay` option:**

Opt-in. When `replay: true`:

- Records a disconnect timestamp on every close (including page unload via `beforeunload`)
- On reconnect, sends `{ action: 'replay', since: <timestamp> }` to the server so it can push any events that arrived while the client was away
- Requires the backend `replay` route (present in `template-websocket-service`)
- Uses `sessionStorage` to persist the timestamp across page reloads; discards it if older than `replayWindowSecs` on load

`replayWindowSecs` defaults to `1800` (30 min) to match the server's default `EVENT_TTL_SECONDS`. If you change the server TTL, pass the same value here:

```js
useWebSocket({
  replay: true,
  replayWindowSecs: 3600, // matches EVENT_TTL_SECONDS: 3600
});
```

When `replay: false` (default), none of the above occurs — no `sessionStorage` reads or writes, no `beforeunload` listener.

---

## Configuration

| Variable | Description |
|----------|-------------|
| `WS_URL` | Full WebSocket URL including `wss://` protocol. Injected at build time from `.env` via Vite's `loadEnv`. |

Set in `.env` before starting or building:

```bash
# template-websocket-mfe/.env
WS_URL=wss://abc123.execute-api.us-west-2.amazonaws.com/np
```

---

## Development

```bash
npm install
npm start        # Vite dev server on http://localhost:9090
npm test         # jest
npm run lint     # eslint
npm run build    # production ES module → dist/micro-apps/template-websocket-mfe/{SHA}/
```

The Vite dev server (`npm start`) serves the app directly in the browser. There is no webpack standalone mode — import the `App` component directly or use single-spa's `start()` in the browser console for integrated testing.

---

## Integration: Single-SPA Shell

Register this MFE in your shell's import map and `registerApplication` call:

```js
// import-map.json
{
  "imports": {
    "@template/websocket-mfe": "https://cdn.example.com/micro-apps/template-websocket-mfe/{SHA}/index.js"
  }
}
```

```js
// shell app
import { registerApplication, start } from 'single-spa';

registerApplication({
  name: '@template/websocket-mfe',
  app: () => System.import('@template/websocket-mfe'),
  activeWhen: ['/notifications'],
});

start();
```

---

## Customization

### Use the hook directly

```js
const { isConnected } = useWebSocket({
  url: process.env.WS_URL,
  subscriptions: ['order-created', 'shipment-dispatched'],
  onUpdate: (data) => dispatch({ type: 'ORDER_UPDATE', payload: data }),
  replay: true, // opt in if you need missed-event recovery
});
```

### Extend the EventLog

Replace `EventLog` with your own component — it receives an `events` array of parsed JSON objects.

---

## Connection Lifecycle

```
enabled = true
  └── WebSocket opens → isConnected = true
        ├── [replay=true] if disconnect timestamp stored: sends { action: 'replay', since }
        └── messages arrive → onUpdate(data) called
              └── connection drops → isConnected = false
                    ├── [replay=true] records disconnect timestamp
                    └── exponential backoff → reconnect attempt N
                          └── WebSocket opens → isConnected = true, reconnectCount resets

subscriptions change (tags edited)
  └── { action: 'subscribe', eventTypes } sent on open socket
        └── server deletes old rows, writes new rows

enabled = false
  └── [replay=true] records disconnect timestamp
      socket closed → reconnect timer cleared → isConnected = false

page unload (replay=true only)
  └── beforeunload → sessionStorage.ws_disconnected_at = Date.now()
        └── on next load, if within replayWindowSecs: used as 'since' for replay
              └── if older than replayWindowSecs: discarded, no replay sent
```

