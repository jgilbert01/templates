import {
  broadcastToWebSocket,
  update,
} from 'aws-lambda-stream';

import { toMessage, toConnections, toUpdateRequest } from '../models/websocket';

// Wildcard (*) is a subscription token only — publishers cannot emit events with type '*'
const USER_PATTERN = process.env.EVENT_TYPE || '.*';
const EVENT_TYPE = new RegExp(`^(?!\\*$)(?:${USER_PATTERN})`);

export default [
  {
    id: 'b1',
    flavor: broadcastToWebSocket,
    eventType: EVENT_TYPE,
    toMessage, // Convert the incoming event to the message format expected by the WebSocket clients.
    toConnections, // Determine which WebSocket connections should receive the message based on their subscriptions.
  },
  {
    id: 'p1',
    flavor: update,
    eventType: EVENT_TYPE,
    toUpdateRequest, // Create the DynamoDB update request to store the event data in the EVENTS_TABLE for replay purposes.
  },
];
