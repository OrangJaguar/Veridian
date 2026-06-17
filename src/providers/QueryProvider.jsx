import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/lib/query-client';
import { asyncStoragePersister, PERSIST_CACHE_BUSTER, shouldPersistQuery } from '@/lib/query-persist';

export default function QueryProvider({ children }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        buster: PERSIST_CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => (
            query.state.status === 'success' && shouldPersistQuery(query)
          ),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
