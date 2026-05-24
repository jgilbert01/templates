import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/console.css';
import App from './containers/App';

/**
 * Standalone entry point for the WebSocket MFE. It renders the main App component into the root element.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
