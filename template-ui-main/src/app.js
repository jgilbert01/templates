import React from 'react';
import { toast } from 'react-toastify';
import { QueryClient, QueryCache, QueryClientProvider } from 'react-query';
import Root from './Root';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        toast.error(error.message);
      }
    },
  }),
});

function App() {
  return (
    <QueryClientProvider client={queryClient} contextSharing>
      <Root queryClient={queryClient} />
    </QueryClientProvider>
  );
}

export default App;
