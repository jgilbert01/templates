import { useEffect, useRef, useState } from 'react';

const MAX_BACKOFF_MS = 30000;

/**
 * React hook to manage a WebSocket connection with automatic reconnection and event handling.
 * The hook takes configuration options for the WebSocket URL, event subscriptions, authentication, and replay behavior.
 * It returns the connection status and the number of reconnection attempts.
 * The hook handles connecting, disconnecting, and resubscribing to events when the subscriptions change.
 * It also supports replaying missed events on reconnect if the replay option is enabled.
 * @param {Object} options - The configuration options for the WebSocket connection.
 * @param {string} options.url - The WebSocket URL to connect to.
 * @param {string[]} [options.subscriptions] - An optional array of event types to subscribe to, sent as a query parameter on connection.
 * @param {function} options.onUpdate - A callback function that will be called with parsed data whenever a message is received from the WebSocket.
 * @param {string} [options.auth] - An optional authentication token to include as a query parameter on connection.
 * @param {boolean} [options.replay=false] - When true, records disconnect timestamps and sends { action: 'replay', since } on reconnect so the server can push any missed events. Requires the backend replay route. Opt in explicitly — consumers that do not need missed-event recovery incur no sessionStorage side-effects.
 * @param {number} [options.replayWindowSecs=1800] - How far back (in seconds) a stored disconnect timestamp is still considered replayable. Must match the server's EVENT_TTL_SECONDS. Timestamps older than this window are discarded on load. Default is 1800 (30 minutes).
 * @returns {Object} An object containing the connection status and the number of reconnection attempts.
 */
export default function useWebSocket({ url, subscriptions = [], onUpdate, auth, enabled = true, replay = false, replayWindowSecs = 1800 }) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const isUnloadingRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);
  const subscriptionsRef = useRef(subscriptions);
  const prevSubsKeyRef = useRef(null);

  const disconnectedAtRef = useRef((() => {
    if (!replay) return null;
    const stored = Number(sessionStorage.getItem('ws_disconnected_at'));
    const isReplayable = stored > 0 && (Date.now() - stored) < replayWindowSecs * 1000;
    if (stored && !isReplayable) sessionStorage.removeItem('ws_disconnected_at');
    return isReplayable ? stored : null;
  })());

  // Keep the callback ref fresh without triggering reconnects
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Keep subscriptionsRef fresh so reconnect always uses the latest value
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
  });

  useEffect(() => {
    if (!replay) return;
    const onBeforeUnload = () => {
      isUnloadingRef.current = true;
      sessionStorage.setItem('ws_disconnected_at', String(Date.now()));
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [replay]);

  // Live resubscription: send subscribe action when tags change on an open socket
  const subsKey = subscriptions.join(',');
  useEffect(() => {
    if (prevSubsKeyRef.current === null) {
      prevSubsKeyRef.current = subsKey;
      return;
    }
    if (prevSubsKeyRef.current === subsKey) return;
    prevSubsKeyRef.current = subsKey;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', eventTypes: subscriptions }));
    }
  }, [subsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!url || !enabled) {
      clearTimeout(timerRef.current);
      setIsConnected(false);
      setReconnectCount(0);
      reconnectCountRef.current = 0;
      return;
    }

    function connect() {
      const subs = subscriptionsRef.current;
      const query = subs.length ? `?subscribe=${subs.join(',')}` : '';
      const authQuery = auth ? `${query ? '&' : '?'}token=${auth}` : '';
      const ws = new WebSocket(`${url}${query}${authQuery}`);
      wsRef.current = ws;

      // Reset connection status and reconnection attempts on successful connection
      ws.onopen = () => {
        setIsConnected(true);
        reconnectCountRef.current = 0;
        setReconnectCount(0);
        if (replay) {
          const since = disconnectedAtRef.current;
          if (since) {
            ws.send(JSON.stringify({ action: 'replay', since }));
            disconnectedAtRef.current = null;
            sessionStorage.removeItem('ws_disconnected_at');
          }
        }
      };

      // Handle incoming messages by parsing JSON and invoking the onUpdate callback
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onUpdateRef.current?.(data);
        } catch {
          // ignore malformed messages
        }
      };

      // On close, mark as disconnected and schedule a reconnection with exponential backoff
      ws.onclose = () => {
        if (replay) disconnectedAtRef.current = Date.now();
        setIsConnected(false);
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), MAX_BACKOFF_MS);
        reconnectCountRef.current += 1;
        setReconnectCount(reconnectCountRef.current);
        timerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      clearTimeout(timerRef.current);
      if (wsRef.current) {
        if (replay) disconnectedAtRef.current = Date.now(); // record for replay on next connect
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
      }
      if (replay && !isUnloadingRef.current) {
        sessionStorage.removeItem('ws_disconnected_at');
      }
    };
  }, [url, enabled, auth]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isConnected, reconnectCount };
}
