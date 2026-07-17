import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useQuery } from '@tanstack/react-query';
import { listAllModules } from '@/api/entities/modules';
import { listAllSessions } from '@/api/entities/sessions';
import { listAllCards } from '@/api/entities/cards';
import { listAllActivities } from '@/api/entities/activities';
import { queryKeys } from '@/api/query-keys';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';
import ConceptStatusBoard from '@/components/concepts/ConceptStatusBoard';
import { buildConceptStatusBoard } from '@/utils/study/buildConceptStatusBoard';
import { normalizeConceptRelations } from '@/utils/schemas/ai/knowledgeMap';

export default function ConceptsPage() {
  const { isAuthenticated } = useAuth();
  const { data: journeys = [] } = useJourneys({ archived: false });
  const { data: modules = [], isPending: modulesPending } = useQuery({
    queryKey: queryKeys.catalog.allModules,
    queryFn: listAllModules,
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
  const { data: sessions = [] } = useQuery({
    queryKey: queryKeys.catalog.allSessions,
    queryFn: listAllSessions,
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
  const { data: cards = [] } = useQuery({
    queryKey: queryKeys.catalog.allCards,
    queryFn: listAllCards,
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
  const { data: activities = [] } = useQuery({
    queryKey: queryKeys.catalog.allActivities,
    queryFn: listAllActivities,
    staleTime: 60_000,
    enabled: isAuthenticated,
  });

  const [selectedModuleId, setSelectedModuleId] = useState('');

  const moduleOptions = useMemo(
    () => modules
      .filter((m) => (m.knowledgeMap?.concepts?.length ?? 0) > 0)
      .map((m) => ({
        moduleId: m.moduleId,
        journeyId: m.journeyId,
        name: m.name,
        journeyTitle: journeys.find((j) => j.journeyId === m.journeyId)?.title ?? '',
      })),
    [modules, journeys],
  );

  const activeModuleId = selectedModuleId || moduleOptions[0]?.moduleId || '';
  const activeModule = modules.find((m) => m.moduleId === activeModuleId) ?? null;
  const journey = journeys.find((j) => j.journeyId === activeModule?.journeyId) ?? null;

  const rows = useMemo(() => {
    if (!activeModule) return [];
    return buildConceptStatusBoard({
      module: activeModule,
      journey,
      sessions,
      cards,
    });
  }, [activeModule, journey, sessions, cards]);

  const relations = useMemo(
    () => normalizeConceptRelations(
      activeModule?.knowledgeMap?.relations ?? [],
      activeModule?.knowledgeMap?.concepts ?? [],
    ),
    [activeModule],
  );

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Concepts</h1>
        <LoginPrompt action="view your concept map" />
      </div>
    );
  }

  if (modulesPending) {
    return <VeridianLoading fullPage />;
  }

  return (
    <div className="concepts-page">
      <header className="concepts-page-header">
        <h1 className="concepts-page-title">Concept map</h1>
        <p className="concepts-page-lead">
          See which ideas are solid, developing, fragile, or still unseen.
        </p>
      </header>

      {moduleOptions.length === 0 ? (
        <p className="concepts-page-empty">
          Create a journey with concepts to unlock your concept map.
        </p>
      ) : (
        <>
          <label className="concepts-module-picker">
            <span>Module</span>
            <select
              value={activeModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
            >
              {moduleOptions.map((opt) => (
                <option key={opt.moduleId} value={opt.moduleId}>
                  {opt.journeyTitle ? `${opt.journeyTitle} · ` : ''}{opt.name}
                </option>
              ))}
            </select>
          </label>

          <ConceptStatusBoard
            rows={rows}
            relations={relations}
            activities={activities}
            journeyId={activeModule?.journeyId}
            moduleId={activeModule?.moduleId}
            moduleName={activeModule?.name}
          />
        </>
      )}
    </div>
  );
}
