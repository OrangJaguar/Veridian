import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getJourney } from '@/api/entities/journeys';
import { listModulesByJourney, createModules, updateModule } from '@/api/entities/modules';
import { validateAdminJourney, publishAdminJourney, unpublishAdminJourney } from '@/api/admin/adminJourneys';
import { generateModuleId } from '@/utils/schemas/ids';
import { scaffoldJourneyActivities } from '@/api/entities/journeyScaffold';

function ModuleRow({ mod, journeyId, index, total, onMoveUp, onMoveDown, reordering }) {
  return (
    <li className="admin-module-row">
      <div className="admin-module-reorder">
        <button
          type="button"
          className="admin-reorder-btn"
          onClick={onMoveUp}
          disabled={index === 0 || reordering}
          aria-label={`Move ${mod.name} up`}
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          className="admin-reorder-btn"
          onClick={onMoveDown}
          disabled={index === total - 1 || reordering}
          aria-label={`Move ${mod.name} down`}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      <div className="admin-module-row-main">
        <strong>{mod.name}</strong>
        <span className={`admin-journey-badge admin-journey-badge--${mod.moduleStatus ?? 'draft'}`}>
          {mod.moduleStatus ?? 'draft'}
        </span>
      </div>
      <Link to={`/adminjourneys/${journeyId}/modules/${mod.moduleId}`} className="btn btn-secondary btn-sm">
        Edit content
      </Link>
    </li>
  );
}

export default function AdminJourneyEditorPage() {
  const { journeyId } = useParams();
  const qc = useQueryClient();

  const { data: journey, isLoading: jLoading } = useQuery({
    queryKey: ['journey', journeyId],
    queryFn: () => getJourney(journeyId),
  });

  const { data: modules = [], isLoading: mLoading } = useQuery({
    queryKey: ['modules', journeyId],
    queryFn: () => listModulesByJourney(journeyId),
  });

  const { data: validation } = useQuery({
    queryKey: ['admin', 'validate', journeyId],
    queryFn: () => validateAdminJourney(journeyId),
    enabled: !!journeyId,
  });

  const publishMut = useMutation({
    mutationFn: () => publishAdminJourney(journeyId),
    onSuccess: () => {
      toast.success('Journey published as Veridian Certified');
      qc.invalidateQueries({ queryKey: ['journey', journeyId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const unpublishMut = useMutation({
    mutationFn: () => unpublishAdminJourney(journeyId),
    onSuccess: () => {
      toast.success('Journey unpublished');
      qc.invalidateQueries({ queryKey: ['journey', journeyId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const reorderMut = useMutation({
    mutationFn: async ({ fromIndex, toIndex }) => {
      const sorted = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      await Promise.all(sorted.map((mod, order) => updateModule(mod.moduleId, { order })));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules', journeyId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const addModule = async () => {
    const order = modules.length;
    const created = await createModules(journeyId, [{
      moduleId: generateModuleId(),
      name: `Module ${order + 1}`,
      description: '',
      order,
      stage: 'A',
      masteryScore: 0,
      moduleStatus: 'draft',
      estimatedStudyMinutes: 60,
      knowledgeMap: { concepts: [] },
      libraryVisible: false,
    }]);
    await scaffoldJourneyActivities(journeyId, created);
    qc.invalidateQueries({ queryKey: ['modules', journeyId] });
    toast.success('Module added');
  };

  if (jLoading || mLoading) return <p className="journeys-status">Loading…</p>;
  if (!journey) return <p className="journeys-status">Journey not found.</p>;

  const sorted = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const moveModule = (fromIndex, toIndex) => {
    reorderMut.mutate({ fromIndex, toIndex });
  };

  return (
    <div className="admin-journeys-page">
      <header className="admin-dashboard-header">
        <div>
          <Link to="/adminjourneys" className="admin-back-link">← Admin journeys</Link>
          <h1 className="admin-dashboard-title">{journey.title}</h1>
          <p className="admin-dashboard-lead">{journey.subject} · {journey.publishStatus ?? 'draft'}</p>
        </div>
        <div className="admin-journey-actions">
          {journey.isPublic ? (
            <button type="button" className="btn btn-secondary" onClick={() => unpublishMut.mutate()} disabled={unpublishMut.isPending}>
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => publishMut.mutate()}
              disabled={publishMut.isPending || validation?.ok === false}
            >
              Publish certified
            </button>
          )}
        </div>
      </header>

      {validation?.issues?.length > 0 && (
        <div className="admin-validation-box">
          <strong>Before publishing:</strong>
          <ul>
            {validation.issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      )}

      <section className="detail-section-box">
        <h2 className="admin-section-title">Journey metadata</h2>
        <p className="admin-meta-line">{journey.shortDescription || 'No short description'}</p>
        <p className="admin-meta-line">{journey.longDescription || 'No long description'}</p>
      </section>

      <section className="detail-section-box">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Modules</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addModule}>
            <Plus size={14} /> Add module
          </button>
        </div>
        <ul className="admin-module-list">
          {sorted.map((mod, index) => (
            <ModuleRow
              key={mod.moduleId}
              mod={mod}
              journeyId={journeyId}
              index={index}
              total={sorted.length}
              reordering={reorderMut.isPending}
              onMoveUp={() => moveModule(index, index - 1)}
              onMoveDown={() => moveModule(index, index + 1)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
