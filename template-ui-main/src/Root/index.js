import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
// eslint-disable-next-line import/no-unresolved
import { useAuth } from '@template-ui/auth';
import PropTypes from 'prop-types';
import { QueryClient } from 'react-query';
import registerMicroApps from './register-micro-apps';

function Root({ queryClient }) {
  const [loading, setLoading] = useState(true);
  const { isAuthorized } = useAuth();

  useEffect(() => {
    const loadAndRegisterApps = () => {
      registerMicroApps(isAuthorized, queryClient)
        .then(() => {
          setLoading(false);
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.log(err);
          setLoading(false);
        });
    };
    loadAndRegisterApps();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <>
      <ToastContainer position="top-right" pauseOnHover autoClose={10000} />
      <div id="nav" />
      <div
        id="main-content-container"
        className="container-fluid"
        style={{
          overflowY: 'auto',
        }}
      >
        <div id="container" />
      </div>
      <div id="db" />
    </>
  );
}

Root.propTypes = {
  queryClient: PropTypes.objectOf(QueryClient),
};

export default Root;
