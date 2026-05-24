/* istanbul ignore file */
import './styles/console.css';
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';

/**
 * Entry point for the WebSocket MFE. It sets up the single-spa React lifecycle methods to bootstrap, mount, and unmount the application.
 * The main App component is loaded asynchronously when the MFE is mounted.
 * An error boundary is provided to catch any errors in the React components and display a fallback UI.
 */
export const { bootstrap, mount, unmount } = singleSpaReact({
  React,
  ReactDOMClient,
  errorBoundary: (err, info, props) => <div>WebSocket MFE error</div>,
  loadRootComponent: () => import('./containers/App').then(mod => mod.default),
});
