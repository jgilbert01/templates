import React, { useState, useEffect, useRef } from 'react';

/**
 * Component to display a single event entry in the event log.
 * System events (like connection status changes) are styled differently and show the status and timestamp.
 * Data events show the event type, a preview of the event data, and can be expanded to show the full JSON.
 * @param {Object} param0 - The props object.
 * @param {Object} param0.event - The event data.
 * @param {boolean} param0.isNew - Indicates if the event is new.
 * @returns {JSX.Element} The event entry element.
 */
function EventEntry({ event, isNew }) {
  const [isOpen, setIsOpen] = useState(false);

  if (event.__system) {
    return (
      <div className="wsc-event wsc-event--system">
        <div className={`wsc-event-system-row wsc-event-system-row--${event.status}`}>
          <span className="wsc-event-system-dot" />
          {event.status === 'connected' ? 'Connected' : 'Disconnected'}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11 }}>
            {new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    );
  }

  const type = event.type || event['detail-type'] || 'event';
  const json = JSON.stringify(event, null, 2);
  const preview = JSON.stringify(event);

  const time = event.timestamp
    ? new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 2 })
    : new Date().toLocaleTimeString('en-US', { hour12: false });

  return (
    <div
      className={`wsc-event${isOpen ? ' wsc-event--expanded' : ''}${isNew ? ' wsc-event--new' : ''}`}
      onClick={() => setIsOpen((o) => !o)}
      role="button"
      aria-expanded={isOpen}
    >
      <div className="wsc-event-summary">
        <span className="wsc-event-type">{type}</span>
        <span className="wsc-event-preview">{preview.slice(0, 120)}{preview.length > 120 ? '…' : ''}</span>
        <div className="wsc-event-meta">
          <span className="wsc-event-time">{time}</span>
          <span className={`wsc-event-chevron${isOpen ? ' wsc-event-chevron--open' : ''}`}>▶</span>
        </div>
      </div>
      {isOpen && (
        <div className="wsc-event-body">
          <pre className="wsc-event-json">{json}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * Component to display the event log, which shows a list of events received from the WebSocket connection.
 * System events are displayed at the appropriate positions in the log, and data events can be expanded to show details.
 * @param {Object} param0 - The props object.
 * @param {Array} param0.events - The list of events.
 * @param {Function} param0.onClear - The function to clear the events.
 * @returns {JSX.Element} The event log element.
 */
export default function EventLog({ events, onClear }) {
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (events.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevLengthRef.current = events.length;
  }, [events.length]);

  const dataEventCount = events.filter((e) => !e.__system).length;

  return (
    <div className="wsc-events">
      <div className="wsc-events-header">
        <span className="wsc-events-title">
          Events
          <span className="wsc-events-count">{dataEventCount}</span>
        </span>
        <button className="wsc-btn wsc-btn--ghost" onClick={onClear} disabled={events.length === 0}>
          Clear
        </button>
      </div>
      <div className="wsc-events-list">
        {events.length === 0 ? (
          <div className="wsc-events-empty">
            <span className="wsc-events-empty-icon">📡</span>
            Connect to start receiving events
          </div>
        ) : (
          <>
            {events.map((evt, i) => (
              <EventEntry key={i} event={evt} isNew={i === events.length - 1 && !evt.__system} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
