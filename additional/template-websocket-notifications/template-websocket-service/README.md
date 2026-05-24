# template-websocket-service

A Serverless Framework (v4, Node.js 22) template for real-time WebSocket notification broadcasting using [aws-lambda-stream](https://github.com/nicktindall/aws-lambda-stream). Events flow from EventBridge into connected WebSocket clients with automatic missed-event replay on reconnect and live resubscription.

## Overview

This service bridges EventBridge domain events to browser/client WebSocket connections via API Gateway WebSocket API. It handles:

- **Broadcasting**: Receives events from EventBridge, looks up subscribed connections, and pushes messages via API Gateway WebSocket.
- **Connection lifecycle**: Manages connect/disconnect, writing to DynamoDB tables.
- **Missed event replay**: Client-triggered on reconnect — the hook sends `{ action: 'replay', since }` from `ws.onopen`, and the Lambda queries EventsTable and pushes any missed events.
- **Live resubscription**: Client sends `{ action: 'subscribe', eventTypes }` to update subscriptions without reconnecting.
- **Cross-region forwarding**: Forwards matching events to the other region's event bus so both regions serve WebSocket clients.
- **Event persistence**: Stores recent events in EventsTable (with TTL) for replay.

## Architecture

```
                        ┌──────────────────────────────────────────────────────┐
                        │                   us-west-2 / us-east-1              │
                        │                                                      │
  EventBridge ──────────►  broadcast Lambda                                    │
  (detail-type:         │    │                                                 │
   thing-updated)       │    ├─► query SubscriptionsTable (eventType + *)      │
                        │    │       └─► dedupe → PostToConnection             │
                        │    └─► update EventsTable (persist + TTL)            │
                        │                                                      │
  Client ──$connect────►  connect Lambda                                       │
    ?subscribe=         │    ├─► PutItem ConnectionsTable                      │
     thing-updated      │    └─► PutItem SubscriptionsTable (per eventType)    │
                        │                                                      │
  ws.onopen sends ──────►  replay Lambda { action: 'replay', since? }          │
  { action: 'replay' }  │    └─► query EventsTable → PostToConnection          │
                        │                                                      │
  Tag change sends ─────►  subscribe Lambda { action: 'subscribe',             │
  { action:             │                     eventTypes: [...] }              │
    'subscribe' }       │    ├─► delete old SubscriptionsTable rows            │
                        │    └─► PutItem new rows                              │
                        │                                                      │
  Client ──$disconnect─►  disconnect Lambda                                    │
                        │    ├─► DeleteItem ConnectionsTable                   │
                        │    └─► query GSI connectionId-index                  │
                        │        └─► BatchDelete SubscriptionsTable rows       │
                        │                                                      │
  EventBridge ──────────►  CrossRegionForwardRule ──► other region EventBridge │
                        └──────────────────────────────────────────────────────┘
```

## Subscription Semantics

Event types are stored as DynamoDB partition keys in SubscriptionsTable. The special token `*` is a catch-all.

| `?subscribe=` value | Meaning |
|---|---|
| _(omitted or empty)_ | Subscribe to nothing |
| `thing-updated` | Subscribe to `thing-updated` only |
| `thing-updated,job-done` | Subscribe to both types |
| `*` | Receive all event types |
| `*,thing-updated` | Normalized to `*` (wildcard wins) |

Publishers cannot emit events with type `*` — the broadcast Lambda guards against it with a negative-lookahead regex.

## DynamoDB Tables

All three tables are standard DynamoDB tables, PAY_PER_REQUEST, SSE enabled, with TTL. See `serverless/dynamodb.yml` for a commented-out Global Table configuration for multi-region deployments.

### ConnectionsTable (`<service>-<stage>-connections`)

| Attribute    | Type | Key  | Description                  |
|--------------|------|------|------------------------------|
| connectionId | S    | HASH | API GW connection ID         |
| region       | S    |      | AWS region of the connection |
| ttl          | N    |      | Unix epoch expiry            |

### SubscriptionsTable (`<service>-<stage>-subscriptions`)

| Attribute    | Type | Key   | Description              |
|--------------|------|-------|--------------------------|
| eventType    | S    | HASH  | Event type (or `*`)      |
| connectionId | S    | RANGE | API GW connection ID     |
| ttl          | N    |       | Unix epoch expiry        |

GSI: `connectionId-index` — HASH=connectionId (used by `disconnect` and `subscribe` to find all subscriptions for a connection).

### EventsTable (`<service>-<stage>-events`)

| Attribute | Type | Key   | Description        |
|-----------|------|-------|--------------------|
| eventType | S    | HASH  | Event type         |
| timestamp | S    | RANGE | ISO 8601 timestamp |
| data      | M    |       | Full event payload |
| ttl       | N    |       | Unix epoch expiry  |

## Lambda Functions

### `broadcast` (EventBridge trigger)

Triggered by EventBridge events matching `EVENT_TYPE`. Uses `aws-lambda-stream` pipeline with two rules defined in `src/broadcast/rules.js`. Transformation logic is extracted to `src/models/websocket.js`:

- **b1** (`broadcastToWebSocket`): Uses `toConnections` to query SubscriptionsTable for both the specific `eventType` and `*` in parallel, deduplicates by `connectionId`, then uses `toMessage` to post `{type, data, timestamp}` to each connection via API Gateway Management API.
- **p1** (`update`): Uses `toUpdateRequest` to persist the event to EventsTable with TTL for replay.

### `connect` (WebSocket `$connect`)

Called when a client connects. Query parameter `subscribe` is a comma-separated list of event types (supports `*` wildcard).

1. Writes connection record to ConnectionsTable.
2. Writes one subscription row per event type to SubscriptionsTable.

### `replay` (WebSocket `replay` route)

Triggered by the client sending `{ action: 'replay', since? }` after `ws.onopen`.

1. Queries SubscriptionsTable GSI `connectionId-index` to get subscribed event types.
2. If subscribed to `*`, scans EventsTable with a timestamp filter.
3. Otherwise queries EventsTable per event type.
4. Pushes all matching events to the connection via PostToConnection.

The `since` field is a Unix timestamp (ms); if omitted, events within the last `EVENT_TTL_SECONDS` are returned.

### `subscribe` (WebSocket `subscribe` route)

Triggered by the client sending `{ action: 'subscribe', eventTypes: [...] }` when subscriptions change without reconnecting.

1. Queries SubscriptionsTable GSI `connectionId-index` to find existing subscriptions.
2. Deletes all existing subscription rows for the connection.
3. Writes new subscription rows for the updated event types.

### `disconnect` (WebSocket `$disconnect`)

Called when a client disconnects.

1. Deletes connection record from ConnectionsTable.
2. Queries SubscriptionsTable GSI `connectionId-index` to find all subscriptions.
3. Deletes all subscription rows.

## Configuration

Environment variables (set in `serverless/config.yml`):

| Variable | Default | Description |
|---|---|---|
| `EVENT_TYPE` | `thing-updated` | Regex matched against incoming EventBridge `detail-type` |
| `EVENT_TTL_SECONDS` | `1800` | How long to keep events for replay (seconds). Set the hook's `replayWindowSecs` to the same value so the client and server use the same window. |
| `CONNECTION_TTL_SECONDS` | `7200` | Connection/subscription TTL (seconds) |
| `CONNECTIONS_TABLE` | `<service>-<stage>-connections` | DynamoDB table name |
| `SUBSCRIPTIONS_TABLE` | `<service>-<stage>-subscriptions` | DynamoDB table name |
| `EVENTS_TABLE` | `<service>-<stage>-events` | DynamoDB table name |
| `WEBSOCKET_ENDPOINT` | Constructed from WebsocketsApi | API GW Management API endpoint |
| `BUS_NAME` | From EventBridge bus stack output | EventBridge bus name |
| `BUS_ARN` | From EventBridge bus stack output | EventBridge bus ARN |
| `OTHER_REGION_BUS_ARN` | From EventBridge bus stack (other region) | Cross-region forwarding target |

`EVENT_TYPE` is used as a regex in the broadcast Lambda rules and as a literal string in the EventBridge rule pattern.

## Deployment

> **Requires `aws-lambda-stream` v1.2.0 or later** (`"aws-lambda-stream": "^1.2.0"` in `package.json`).
> The WebSocket pipeline handlers used by this service were introduced in that release.

```bash
# Single region
npm run dp:np:w     # us-west-2, np
npm run dp:np:e     # us-east-1, np
npm run dp:prd:w    # us-west-2, prd
npm run dp:prd:e    # us-east-1, prd
```

Or directly:

```bash
npx serverless deploy --verbose -r us-west-2 -s np --force
```

## How It Works

### Client connects

```
Client → WSS $connect?subscribe=thing-updated
  → connect Lambda
    → PUT ConnectionsTable { connectionId, region, ttl }
    → PUT SubscriptionsTable { eventType: "thing-updated", connectionId, ttl }
  ← 200 OK (WebSocket established)

ws.onopen fires on client
  → send { action: 'replay', since: <lastDisconnectedAt> }
  → replay Lambda
    → QUERY SubscriptionsTable GSI → ["thing-updated"]
    → QUERY EventsTable pk="thing-updated", timestamp >= since
    → POST missed events to connectionId
```

### Event broadcast

```
Producer → PutEvents to EventBridge (detail-type: thing-updated)
  → broadcast Lambda (aws-lambda-stream pipeline)
    → rule b1:
        QUERY SubscriptionsTable pk="thing-updated"   ─┐
        QUERY SubscriptionsTable pk="*"                ├─ parallel, dedupe
      → POST { type, data, timestamp } to each connectionId
    → rule p1:
        PUT EventsTable { eventType, timestamp, data, ttl }
```

### Live resubscription

```
User changes tags in UI
  → hook sends { action: 'subscribe', eventTypes: ['order-placed', 'order-shipped'] }
  → subscribe Lambda
    → QUERY SubscriptionsTable GSI → find existing rows
    → DELETE old rows
    → PUT new rows
```

### Client disconnects

```
Client → WSS $disconnect
  → disconnect Lambda
    → DELETE ConnectionsTable { connectionId }
    → QUERY SubscriptionsTable GSI connectionId-index
    → DELETE each subscription row
```

## Multi-Region

Each region deploys its own WebSocket API and Lambda functions. The `CrossRegionForwardRule` EventBridge rule forwards matching events to the other region's event bus, ensuring clients connected to either region receive all events.

```
us-west-2 EventBridge ──► CrossRegionForwardRuleWest ──► us-east-1 EventBridge
                                                              └─► broadcast Lambda (us-east-1)
                                                                    └─► push to us-east-1 clients

us-east-1 EventBridge ──► CrossRegionForwardRuleEast ──► us-west-2 EventBridge
                                                              └─► broadcast Lambda (us-west-2)
                                                                    └─► push to us-west-2 clients
```

Multi-region support is available via commented-out configuration in `serverless/dynamodb.yml` (Global Tables) and `serverless/eventbridge.yml` (cross-region forwarding).

## Running Tests

```bash
npm test
```

Tests use c8 + Mocha + Chai. Coverage is enforced via c8 thresholds.

