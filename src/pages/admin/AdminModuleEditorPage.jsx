import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { getJourney } from '@/api/entities/journeys';
import { getModule, updateModule } from '@/api/entities/modules';
import { listActivitiesByModule } from '@/api/entities/activities';
import AdminGuideSectionBuilder from '@/components/admin/AdminGuideSectionBuilder';
import AdminFlashcardEditor from '@/components/admin/AdminFlashcardEditor';
import AdminQuestionBankEditor from '@/components/admin/AdminQuestionBankEditor';
import AdminKnowledgeMapEditor from '@/components/admin/AdminKnowledgeMapEditor';

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'guide', label: 'Learning guide' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'questions', label: 'Practice questions' },
  { id: 'concepts', label: 'Concepts' },
];

export default function AdminModuleEditorPage() {
  const { journeyId, moduleId } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState('details');
  const [details, setDetails] = useState(null);

  const { data: journey } = useQuery({
    queryKey: ['journey', journeyId],
    queryFn: () => getJourney(journeyId),
  });

  const { data: mod, isLoading } = useQuery({
    queryKey: ['module', journeyId, moduleId],
    queryFn: async () => {
      const m = await getModule(moduleId);
      setDetails({
        name: m.name,
        description: m.description ?? '',
        estimatedStudyMinutes: m.estimatedStudyMinutes ?? 60,
        moduleStatus: m.moduleStatus ?? 'draft',
        stage: m.stage ?? 'A',
      });
      return m;
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', journeyId, moduleId],
    queryFn: () => listActivitiesByModule(journeyId, moduleId),
    enabled: !!moduleId,
  });

  const guideActivity = activities.find((a) => a.type === 'learningGuide');
  const quizActivity = activities.find((a) => a.type === 'practiceQuiz');
  const deckActivity = activities.find((a) => a.type === 'flashcardSet');

  const saveDetails = async () => {
    try {
      await updateModule(moduleId, details);
      qc.invalidateQueries({ queryKey: ['module', journeyId, moduleId] });
      toast.success('Module saved');
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (isLoading || !mod || !details) return <p className="journeys-status">Loading…</p>;

  return (
    <div className="admin-journeys-page">
      <header className="admin-dashboard-header">
        <div>
          <Link to={`/adminjourneys/${journeyId}`} className="admin-back-link">← {journey?.title ?? 'Journey'}</Link>
          <h1 className="admin-dashboard-title">{mod.name}</h1>
        </div>
      </header>

      <nav className="admin-module-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-module-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="detail-section-box">
        {tab === 'details' && (
          <div className="admin-journey-form">
            <label className="settings-field">
              <span className="settings-label">Module title</span>
              <input className="settings-input" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
            </label>
            <label className="settings-field">
              <span className="settings-label">Description</span>
              <textarea className="settings-input" rows={3} value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
            </label>
            <label className="settings-field">
              <span className="settings-label">Estimated study minutes</span>
              <input type="number" className="settings-input" value={details.estimatedStudyMinutes} onChange={(e) => setDetails({ ...details, estimatedStudyMinutes: Number(e.target.value) })} />
            </label>
            <label className="settings-field">
              <span className="settings-label">Status</span>
              <select className="settings-input" value={details.moduleStatus} onChange={(e) => setDetails({ ...details, moduleStatus: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
              </select>
            </label>
            <button type="button" className="btn btn-primary" onClick={saveDetails}>Save details</button>
          </div>
        )}

        {tab === 'guide' && guideActivity && (
          <AdminGuideSectionBuilder
            journeyId={journeyId}
            moduleId={moduleId}
            activity={guideActivity}
          />
        )}

        {tab === 'flashcards' && deckActivity && (
          <AdminFlashcardEditor
            journeyId={journeyId}
            activity={deckActivity}
          />
        )}

        {tab === 'questions' && quizActivity && (
          <AdminQuestionBankEditor
            journeyId={journeyId}
            activity={quizActivity}
          />
        )}

        {tab === 'concepts' && (
          <AdminKnowledgeMapEditor
            journeyId={journeyId}
            moduleId={moduleId}
            module={mod}
          />
        )}
      </div>
    </div>
  );
}
