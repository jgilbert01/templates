import React, { useState, useCallback, useEffect, useRef } from 'react';
import useWebSocket from '../../hooks/useWebSocket';
import ConnectionStatus from '../../components/ConnectionStatus';
import EventLog from '../../components/EventLog';
import TagInput from '../../components/TagInput';

const WS_URL = process.env.WS_URL || '';

/**
 * Main application component for the WebSocket console. It manages the WebSocket connection, event log, and user interactions for connecting, disconnecting, and filtering events.
 * @param {Object} param0 - The props object.
 * @param {Object} param0.auth - The authentication information for the WebSocket connection.
 * @returns {JSX.Element} The main application element.
 */
export default function App({ auth }) {
  const [events, setEvents] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const prevConnectedRef = useRef(null);

  const handleUpdate = useCallback(
    (data) => setEvents((prev) => [...prev, data]),
    [],
  );

  const { isConnected, reconnectCount } = useWebSocket({
    url: WS_URL,
    subscriptions: filterTags.length > 0 ? filterTags : ['*'],
    enabled: isEnabled,
    replay: true,
    auth,
    onUpdate: handleUpdate,
  });

  useEffect(() => {
    if (prevConnectedRef.current === null) {
      prevConnectedRef.current = isConnected;
      return;
    }
    if (isConnected === prevConnectedRef.current) return;
    prevConnectedRef.current = isConnected;
    setEvents((prev) => [
      ...prev,
      { __system: true, status: isConnected ? 'connected' : 'disconnected', timestamp: Date.now() },
    ]);
  }, [isConnected]);

  const handleConnect = () => setIsEnabled(true);

  const handleDisconnect = () => setIsEnabled(false);

  const handleClear = () => setEvents([]);

  return (
    <div className="ws-console">
      <div className="wsc-inner">
        <header className="wsc-header">
          <h1 className="wsc-title">
            <span className="wsc-title-icon">⚡</span>
            WS Console
          </h1>
          <ConnectionStatus isConnected={isConnected} reconnectCount={reconnectCount} isEnabled={isEnabled} />
        </header>

        <div className="wsc-config">
          <div className="wsc-config-row">
            <span className="wsc-label">Endpoint</span>
            <span className="wsc-endpoint" title={WS_URL}>{WS_URL || '(WS_URL not configured)'}</span>
          </div>
          <div className="wsc-config-row">
            <span className="wsc-label">Event Types</span>
            <div style={{ flex: 1 }}>
              <TagInput
                tags={filterTags}
                onChange={setFilterTags}
                placeholder="Filter by type… (or * for all events)"
              />
              <p className="wsc-tag-hint">Type + comma or Enter to add · use * to receive all events · leave empty to receive nothing</p>
            </div>
          </div>
          <div className="wsc-config-row">
            <span className="wsc-label" />
            <div className="wsc-actions">
              {isEnabled ? (
                <button className="wsc-btn wsc-btn--danger" onClick={handleDisconnect}>
                  Disconnect
                </button>
              ) : (
                <button className="wsc-btn wsc-btn--primary" onClick={handleConnect} disabled={!WS_URL}>
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        <EventLog events={events} onClear={handleClear} />
      </div>
    </div>
  );
}
