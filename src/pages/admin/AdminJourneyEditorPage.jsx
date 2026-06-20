import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getJourney } from '@/api/entities/journeys';
import { listModulesByJourney, createModules, updateModule } from '@/api/entities/modules';
import { validateAdminJourney, publishAdminJourney, unpublishAdminJourney } from '@/api/admin/adminJourneys';
import { generateModuleId } from '@/utils/schemas/ids';
import { scaffoldJourneyActivities } from '@/api/entities/journeyScaffold';

function SortableModuleRow({ mod, journeyId }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: mod.moduleId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} className="admin-module-row">
      <button type="button" className="admin-drag-handle" {...attributes} {...listeners} aria-label="Reorder">
        <GripVertical size={16} />
      </button>
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.findIndex((m) => m.moduleId === active.id);
    const newIndex = modules.findIndex((m) => m.moduleId === over.id);
    const reordered = arrayMove(modules, oldIndex, newIndex);
    await Promise.all(reordered.map((mod, order) =>
      updateModule(mod.moduleId, { order }),
    ));
    qc.invalidateQueries({ queryKey: ['modules', journeyId] });
  };

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((m) => m.moduleId)} strategy={verticalListSortingStrategy}>
            <ul className="admin-module-list">
              {sorted.map((mod) => (
                <SortableModuleRow key={mod.moduleId} mod={mod} journeyId={journeyId} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </section>
    </div>
  );
}
