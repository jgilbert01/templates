import React from 'react';
import ReactDOM from 'react-dom';
// eslint-disable-next-line import/no-unresolved
import { SecurityProvider } from '@template-ui/auth';
import { BrowserRouter } from 'react-router-dom';
import App from './app';

console.log('Region: ', process.env.AWS_REGION);

/* istanbul ignore next */
if ('serviceWorker' in navigator) {
  console.log('SW registeration...');
  // window.addEventListener('load', () => {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then(registration => {
      console.log('SW registered: ', registration);
    })
    .catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  // });
}

const rootDom = document.getElementById('root');

function RootApp() {
  return (
    <BrowserRouter>
      <SecurityProvider idleTimeoutMin={20}>
        <App />
      </SecurityProvider>
    </BrowserRouter>
  );
}

const renderUI = () => {
  ReactDOM.render(<RootApp />, rootDom);
};
renderUI();

export { default as MainPropsContext } from './Root/MainPropsContext';

export {
  default as useMountPoint,
  filterMountPoints,
} from './hooks/useMountPoint';

export default RootApp;
