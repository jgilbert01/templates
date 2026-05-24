#!/usr/bin/env node

const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i += 2) {
  flags[args[i].replace('--', '')] = args[i + 1];
}

const busName = flags.bus || process.env.BUS_NAME;
const type = flags.type || 'thing-updated';
const region = flags.region || process.env.AWS_REGION || 'us-west-2';
const data = flags.data || JSON.stringify({ id: String(Date.now()), name: 'demo' });

if (!busName) {
  console.error('Usage: node src/emit.js --bus <bus-name> --type <event-type> [--data <json>] [--region <region>]');
  process.exit(1);
}

const detail = {
  id: JSON.parse(data).id || String(Date.now()),
  type,
  timestamp: Date.now(),
  ...JSON.parse(data),
  tags: { region, ...(JSON.parse(data).tags || {}) },
};

const client = new EventBridgeClient({ region });

client.send(new PutEventsCommand({
  Entries: [{
    EventBusName: busName,
    Source: 'template-websocket-demo',
    DetailType: type,
    Detail: JSON.stringify(detail),
  }],
}))
  .then((res) => {
    console.log(`✓ Event published to ${busName}`);
    console.log(`  type: ${type}`);
    console.log(`  region: ${region}`);
    console.log(`  detail: ${JSON.stringify(detail, null, 2)}`);
    if (res.FailedEntryCount > 0) {
      console.error('  ✗ Failed entries:', res.Entries);
    }
  })
  .catch((err) => {
    console.error('✗ Failed to publish:', err.message);
    process.exit(1);
  });
