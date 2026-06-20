import DetailBackButton from '@/components/shared/DetailBackButton';
import EditableRenameTitle from '@/components/shared/EditableRenameTitle';
import { buildModuleNameRules, isValidModuleName, normalizeModuleName } from '@/utils/schemas/moduleName';
import { useUpdateModule } from '@/hooks/mutations/useModuleMutations';

const STAGE_LABELS = { A: 'Learn', B: 'Practice', C: 'Mastery' };

export default function ModuleDetailHeader({ module: mod, journey, journeyId }) {
  const updateModule = useUpdateModule();
  const stage = mod.stage || 'A';
  const mastery = mod.masteryScore ?? 0;
  const backLabel = journey?.title ?? 'Journey';

  const handleRename = (name) => {
    updateModule.mutate({ moduleId: mod.moduleId, journeyId, patch: { name } });
  };

  return (
    <>
      <header className="detail-title-header">
        <DetailBackButton to={`/journeys/${journeyId}`} label={backLabel} />
        <div className="detail-title-body">
          <EditableRenameTitle
            value={mod.name}
            onSave={handleRename}
            buildRules={buildModuleNameRules}
            isValid={isValidModuleName}
            normalize={normalizeModuleName}
            titleClassName="module-detail-title"
            modalTitle="Module name requirements"
          />
          {mod.description && <p className="module-detail-desc">{mod.description}</p>}
        </div>
      </header>

      <section className="detail-meta-section" aria-label="Module details">
        <div className="detail-meta-tags">
          <span>{journey?.subject}</span>
          <span className="journey-detail-meta-sep" aria-hidden>·</span>
          <span>Stage {stage} · {STAGE_LABELS[stage]}</span>
        </div>
        <div className="detail-meta-mastery">
          <div className="detail-mastery-bar" aria-hidden>
            <div className="detail-mastery-fill" style={{ width: `${mastery}%` }} />
          </div>
          <span className="detail-mastery-label">{mastery}% mastery</span>
        </div>
      </section>
    </>
  );
}
