import { useEffect, useRef, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core';
import { queryClient } from '@/lib/query-client';
import { asyncStoragePersister, PERSIST_CACHE_BUSTER, shouldPersistQuery } from '@/lib/query-persist';

export default function QueryProvider({ children }) {
  const [isRestoring, setIsRestoring] = useState(true);
  const didRestore = useRef(false);

  useEffect(() => {
    const persistOptions = {
      queryClient,
      persister: asyncStoragePersister,
      buster: PERSIST_CACHE_BUSTER,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => (
          query.state.status === 'success' && shouldPersistQuery(query)
        ),
      },
    };

    if (!didRestore.current) {
      didRestore.current = true;
      persistQueryClientRestore(persistOptions)
        .finally(() => setIsRestoring(false));
    }

    return isRestoring ? undefined : persistQueryClientSubscribe(persistOptions);
  }, [isRestoring]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
