# template-websocket-demo

End-to-end demo of the WebSocket notification system. Deploys a minimal EventBridge bus, WebSocket service, and a hosted MFE (S3 + CloudFront), then connects a browser client and pushes events — all from a single terminal.

> **⚠ This demo creates real AWS resources in your currently configured AWS account.**
> All resources are named with a `template-websocket-demo-*` prefix and a stage suffix (default: `np`).
> **Run the cleanup script when you are done** — see [Cleanup](#cleanup).

## Resources deployed

| Service | Resource name |
|---------|---------------|
| EventBridge | `template-websocket-demo-bus-<stage>` (custom event bus) |
| S3 | `template-websocket-demo-bus-mfe-<stage>` (private bucket) |
| CloudFront | distribution serving the MFE over HTTPS |
| API Gateway | `template-websocket-service-<stage>` (WebSocket API) |
| Lambda | `template-websocket-service-<stage>-connect` |
| Lambda | `template-websocket-service-<stage>-disconnect` |
| Lambda | `template-websocket-service-<stage>-subscribe` |
| Lambda | `template-websocket-service-<stage>-replay` |
| Lambda | `template-websocket-service-<stage>-broadcast` |
| DynamoDB | `template-websocket-service-<stage>-connections` |
| DynamoDB | `template-websocket-service-<stage>-subscriptions` |
| DynamoDB | `template-websocket-service-<stage>-events` |

All DynamoDB tables use on-demand billing and TTL — there are no standing costs when idle. CloudFront and S3 costs are minimal for demo traffic.

---

## What's in here

```
template-websocket-demo/
  serverless.yml          ← deploys EventBridge bus + S3 + CloudFront
  src/emit.js             ← CLI tool to publish test events
  scripts/
    demo.sh               ← interactive menu runner (recommended entry point)
    deploy.sh             ← non-interactive deploy (CI/CD friendly)
    cleanup.sh            ← tear everything down
  package.json
```

This demo depends on `../template-websocket-service` being deployed (handled by the deployment script) as it provides the WebSocket API and DynamoDB tables.

---

## Prerequisites

### Node.js >= 22
Make sure you are using the right version. Verify with `node -v`.

### AWS CLI
Make sure it is installed and authenticated — if you use named profiles, run `export AWS_PROFILE=your-profile` before proceeding. Verify with: `aws sts get-caller-identity`

**Note**: Both the interactive menu (`demo.sh`) and the standalone deploy script (`deploy.sh`) verify AWS credentials at startup and exit immediately with a clear error if no active session is found. They display the account ID and caller identity before asking for confirmation.


### AWS Lambda Stream
`aws-lambda-stream` v1.2.0 or later (the WebSocket pipeline handlers required by the service were introduced in that release)

---

## Quick start: interactive menu

```bash
cd template-websocket-demo
./scripts/demo.sh
```

This opens an interactive menu. All demos run from a single terminal:

```
   0) Deploy infrastructure
   ──────────────────────────────────────
   1) Emit single event
   2) Emit burst (5 events)
   3) Demo per-client filtering
   4) Demo missed-event replay
   ──────────────────────────────────────
   9) Remove all deployed resources
   ──────────────────────────────────────
   q) Quit
```

Run `0` first to deploy. The script deploys all infrastructure **and** builds and hosts the MFE automatically. It waits until the CloudFront distribution is fully deployed before printing the MFE URL, so the URL is ready to use immediately.

> **First deploy:** CloudFront provisioning can take about 5 minutes. The script polls and waits automatically — you will see a live status line and a confirmation once it is ready.

Re-running option `0` is safe — stacks that are already deployed are detected via CloudFormation and skipped. Only missing or failed stacks are deployed.

Each step shows the current WS and MFE URLs at the top.

> **Remember to run option `9` when you are finished to remove all AWS resources.**

The script accepts optional stage and region arguments:

```bash
./scripts/demo.sh prd us-east-1
```

---

## Individual scripts

For non-interactive or CI/CD use:

```bash
./scripts/deploy.sh           # deploy all infrastructure (idempotent — skips already-deployed stacks)
./scripts/cleanup.sh          # tear everything down
```

Both accept optional `STAGE` and `REGION` args (default: `np` and `us-west-2`):

```bash
./scripts/deploy.sh prd us-east-1
```

To emit events outside the interactive menu, use `emit.js` directly:

```bash
node src/emit.js --bus template-websocket-demo-bus-np --type thing-updated --data '{"id":"1"}'
```

---

## Step-by-step (manual)

### Step 1: Deploy the EventBridge Bus

```bash
cd template-websocket-demo
npm install
npm run deploy:bus
```

Note the bus name from the output:

```
template-websocket-demo-bus-np
```

### Step 2: Deploy the WebSocket service

```bash
cd ../template-websocket-service
npm install
```

The `deploy.sh` script handles the bus name override automatically. To deploy manually:

```bash
BUS_NAME=template-websocket-demo-bus-np
BUS_ARN="arn:aws:events:us-west-2:$(aws sts get-caller-identity --query Account --output text):event-bus/${BUS_NAME}"

npx serverless deploy --stage np --region us-west-2 \
  --param="busNameOverride=${BUS_NAME}" \
  --param="busArnOverride=${BUS_ARN}"
```

Note the WebSocket endpoint from the output:

```
wss://{api-id}.execute-api.us-west-2.amazonaws.com/np
```

### Step 3: Deploy and open the MFE

The `deploy.sh` script handles this automatically: it builds the MFE with `WS_URL` injected, uploads it to S3, and invalidates the CloudFront cache. When it finishes it prints:

```
  MFE URL: https://<dist-id>.cloudfront.net
```

Open that URL in your browser. The deploy script waits for the CloudFront distribution to reach `Deployed` status before printing the URL, so it is ready to use straight away.

1. Click **Connect**
2. Leave the Event Types input empty to receive all events, or add specific types (e.g. `thing-updated`)

### Step 4: Emit an event

```bash
cd template-websocket-demo

node src/emit.js \
  --bus template-websocket-demo-bus-np \
  --type thing-updated \
  --data '{"id":"42","name":"hello world"}'
```

The event should appear in the browser client instantly.

### Step 5: Test missed event replay

1. Click **Disconnect** in the MFE
2. Emit another event:
   ```bash
   node src/emit.js \
     --bus template-websocket-demo-bus-np \
     --type thing-updated \
     --data '{"id":"99","name":"missed this one"}'
   ```
3. Click **Connect** again in the MFE
4. The missed event appears immediately on reconnect

### Step 6: Try per-client filtering

Open a second browser tab pointing to the MFE URL printed after deployment. In each tab, use the **Event Types** input to set a different subscription (e.g. `thing-updated` in Tab 1, `job-completed` in Tab 2).

```bash
node src/emit.js --bus template-websocket-demo-bus-np --type thing-updated --data '{"id":"1"}'
node src/emit.js --bus template-websocket-demo-bus-np --type job-completed --data '{"id":"2"}'
```

Each tab only receives the events it subscribed to.

---

## emit.js reference

```
node src/emit.js --bus <bus-name> --type <event-type> [--data <json>] [--region <region>]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--bus` | `$BUS_NAME` env var | EventBridge bus name (required) |
| `--type` | `thing-updated` | Event detail-type |
| `--data` | `{"id":"<timestamp>","name":"demo"}` | Event payload as JSON |
| `--region` | `us-west-2` | AWS region |

Or use the npm shortcut:

```bash
npm run emit -- --bus my-bus --type thing-updated --data '{"id":"1"}'
```

---

## Cleanup

> **⚠ Always run cleanup after the demo** to avoid ongoing AWS charges.

```bash
# Via interactive menu (recommended)
./scripts/demo.sh   # then select 9

# Or standalone
./scripts/cleanup.sh
```

The cleanup script:
1. Removes the WebSocket service stack (Lambda, API Gateway, DynamoDB tables)
2. Empties the MFE S3 bucket (required before CloudFormation can delete it)
3. Removes the EventBridge bus stack (EventBridge bus, S3 bucket, CloudFront distribution)
4. Verifies each resource is gone and prints a final report — any resource that could not be removed is listed explicitly

---

## What to demo

| Scenario | What to show |
|----------|-------------|
| Real-time push | Emit event → appears in browser instantly |
| Per-client filtering | Two tabs with different subscriptions, each gets only its events |
| Missed event replay | Disconnect → emit → reconnect → missed event arrives |
| Auto-reconnect | Kill the connection → watch it reconnect with backoff |
| Live resubscription | Change tags while connected → new subscription takes effect without reconnect |
| Burst | Rapid-fire several emits → all arrive in order |

