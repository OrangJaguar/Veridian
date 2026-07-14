import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import StepDeckSetup from '@/components/deck-create/StepDeckSetup';
import StepDeckSource from '@/components/deck-create/StepDeckSource';
import StepDeckPreview from '@/components/deck-create/StepDeckPreview';
import StepDeckProcessing from '@/components/deck-create/StepDeckProcessing';
import { useDeckCreateStore } from '@/store/deckCreateStore';

const STEPS = ['Setup', 'Content', 'Preview', 'Generate'];
const AUTO_STEPS = ['Setup', 'Generate'];

export default function CreateDeckPage() {
  const { id: journeyId, moduleId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: journey } = useJourney(journeyId);
  const { data: modules = [] } = useModules(journeyId);
  const mod = modules.find((m) => m.moduleId === moduleId);

  const step = useDeckCreateStore((s) => s.step);
  const setStep = useDeckCreateStore((s) => s.setStep);
  const init = useDeckCreateStore((s) => s.init);
  const resetWizard = useDeckCreateStore((s) => s.resetWizard);
  const draft = useDeckCreateStore((s) => s.draft);
  const runExtractPreview = useDeckCreateStore((s) => s.runExtractPreview);
  const runGenerate = useDeckCreateStore((s) => s.runGenerate);
  const finalizeDeck = useDeckCreateStore((s) => s.finalizeDeck);

  useEffect(() => {
    if (journey && mod) {
      init({
        journeyId,
        moduleId,
        context: {
          journeyTitle: journey.title,
          subject: journey.subject,
          priorKnowledge: journey.priorKnowledge,
          moduleName: mod.name,
          moduleDescription: mod.description,
          concepts: mod.knowledgeMap?.concepts ?? [],
        },
      });
    }
    return () => resetWizard();
  }, [journeyId, moduleId, journey, mod, init, resetWizard]);

  const generateAndSave = async () => {
    const ok = await runGenerate();
    if (!ok) return;

    useDeckCreateStore.setState({ isProcessing: true, processingError: null });
    try {
      const { activity } = await finalizeDeck();
      toast.success('Deck created');
      navigate(`/journeys/${journeyId}/modules/${moduleId}/decks/${activity.activityId}/edit`);
    } catch (err) {
      useDeckCreateStore.setState({
        isProcessing: false,
        processingError: err.message || 'Failed to save deck',
      });
      toast.error(err.message || 'Failed to save deck');
    }
  };

  const handleSourceNext = async () => {
    if (draft.sourceMode === 'pdf') {
      setStep(3);
      await runExtractPreview();
    } else {
      setStep(4);
      await generateAndSave();
    }
  };

  const handlePreviewNext = async () => {
    setStep(4);
    await generateAndSave();
  };

  const handleRetryGenerate = async () => {
    await generateAndSave();
  };

  const isAutoMode = draft.sourceMode === 'moduleAuto';
  const visibleSteps = isAutoMode
    ? AUTO_STEPS
    : draft.sourceMode === 'pdf'
      ? STEPS
      : STEPS.filter((s) => s !== 'Preview');
  const displayStep = isAutoMode
    ? (step === 4 ? 2 : 1)
    : draft.sourceMode === 'pdf'
      ? step
      : step > 3 ? step - 1 : step;

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Create Deck</h1>
        <LoginPrompt action="create a flashcard deck" />
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="create-journey-page">
        <p className="journeys-error">Module not found.</p>
        <Link to={`/journeys/${journeyId}`} className="btn btn-primary">Back</Link>
      </div>
    );
  }

  return (
    <div className="create-journey-page create-deck-page">
      <Link to={`/journeys/${journeyId}/modules/${moduleId}`} className="journey-detail-back">
        ← {mod.name}
      </Link>

      <header className="create-journey-header">
        <h1 className="create-journey-title">Create Flashcard Deck</h1>
        <ol className="create-stepper">
          {visibleSteps.map((label, i) => (
            <li
              key={label}
              className={`create-stepper-item${displayStep === i + 1 ? ' active' : ''}${displayStep > i + 1 ? ' done' : ''}`}
            >
              {label}
            </li>
          ))}
        </ol>
      </header>

      {step === 1 && (
        <StepDeckSetup
          onNext={() => setStep(2)}
          onAutoGenerate={async () => {
            setStep(4);
            await generateAndSave();
          }}
        />
      )}

      {step === 2 && (
        <StepDeckSource onBack={() => setStep(1)} onNext={handleSourceNext} />
      )}

      {step === 3 && draft.sourceMode === 'pdf' && (
        <StepDeckPreview onBack={() => setStep(2)} onNext={handlePreviewNext} />
      )}

      {step === 4 && (
        <StepDeckProcessing
          onBack={() => setStep(draft.sourceMode === 'pdf' ? 3 : 2)}
          onRetry={handleRetryGenerate}
        />
      )}
    </div>
  );
}
