import React from 'react';

/**
 * Component to display the connection status of the WebSocket.
 * The status can be one of the following:
 * - Idle: when the WebSocket is not enabled.
 * - Connected: when the WebSocket is connected.
 * - Reconnecting: when the WebSocket is trying to reconnect, showing the number of attempts.
 * - Disconnected: when the WebSocket is disconnected and not trying to reconnect.
 * @param {boolean} isConnected - Indicates if the WebSocket is currently connected.
 * @param {number} reconnectCount - The number of reconnection attempts made.
 * @param {boolean} isEnabled - Indicates if the WebSocket is enabled.
 * @returns {JSX.Element} The connection status element.
 */
export default function ConnectionStatus({ isConnected, reconnectCount, isEnabled }) {
  if (!isEnabled) {
    return (
      <span className="wsc-status wsc-status--idle">
        <span className="wsc-status-dot" />
        Idle
      </span>
    );
  }
  if (isConnected) {
    return (
      <span className="wsc-status wsc-status--connected">
        <span className="wsc-status-dot" />
        Connected
      </span>
    );
  }
  if (reconnectCount > 0) {
    return (
      <span className="wsc-status wsc-status--reconnecting">
        <span className="wsc-status-dot wsc-status-dot--pulse" />
        Reconnecting · {reconnectCount}
      </span>
    );
  }
  return (
    <span className="wsc-status wsc-status--disconnected">
      <span className="wsc-status-dot" />
      Disconnected
    </span>
  );
}
