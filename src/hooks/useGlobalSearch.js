import { useState, useMemo, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { listAllModules } from '@/api/entities/modules';
import { listAllCards } from '@/api/entities/cards';
import { queryKeys } from '@/api/query-keys';
import { buildSearchIndex } from '@/utils/search/buildSearchIndex';
import { searchAndRank } from '@/utils/search/searchAndRank';

let _open = false;
const _listeners = new Set();
function notify() { _listeners.forEach((fn) => fn()); }

export function openGlobalSearch() {
  _open = true;
  notify();
}

export function closeGlobalSearch() {
  _open = false;
  notify();
}

export function toggleGlobalSearch() {
  _open = !_open;
  notify();
}

function subscribe(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function getSnapshot() {
  return _open;
}

export function useGlobalSearch() {
  const open = useSyncExternalStore(subscribe, getSnapshot);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data: journeys = [] } = useJourneys({ archived: false });
  const { data: modules = [] } = useQuery({
    queryKey: queryKeys.catalog.allModules,
    queryFn: listAllModules,
    staleTime: 120_000,
    enabled: open,
  });
  const { data: cards = [] } = useQuery({
    queryKey: queryKeys.catalog.allCards,
    queryFn: listAllCards,
    staleTime: 120_000,
    enabled: open,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const index = useMemo(
    () => buildSearchIndex({ journeys, modules, cards }),
    [journeys, modules, cards],
  );

  const results = useMemo(
    () => searchAndRank(index, debouncedQuery),
    [index, debouncedQuery],
  );

  const setOpen = useCallback((v) => {
    const next = typeof v === 'function' ? v(_open) : v;
    if (next) openGlobalSearch();
    else {
      closeGlobalSearch();
      setQuery('');
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleGlobalSearch();
        if (!_open) setQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen, query, setQuery, results };
}
