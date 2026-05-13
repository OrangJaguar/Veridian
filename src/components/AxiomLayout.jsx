import { useEffect } from 'react';
import { runAxiomApp } from '../axiom/runAxiomApp';
import { AppHeader, AppFooter } from '../views/ops/AppHeader';
import {
  PromptAndPreviewModals,
  CmdAndAgendaModals,
  CalendarModals,
  JournalAndSettingsModals,
  CmdSidebarOverlay,
} from '../views/ops/AppOverlays';
import { DashboardMain } from '../views/ops/DashboardMain';
import { FlashcardMain } from '../views/ops/FlashcardMain';
import { QuizMain } from '../views/ops/QuizMain';
import { TypingMain } from '../views/ops/TypingMain';
import { SummaryMain } from '../views/ops/SummaryMain';
import { EditorMain } from '../views/ops/EditorMain';
import { MasterySummaryMain } from '../views/ops/MasterySummaryMain';
import { CmdMain } from '../views/ops/CmdMain';

let axiomBooted = false;

export default function AxiomLayout() {
  useEffect(() => {
    if (axiomBooted) return;
    axiomBooted = true;
    runAxiomApp();
  }, []);

  return (
    <div className="app-wrapper">
      <AppHeader />
      <DashboardMain />
      <CmdMain />
      <EditorMain />
      <FlashcardMain />
      <TypingMain />
      <QuizMain />
      <SummaryMain />
      <MasterySummaryMain />
      <AppFooter />
      <PromptAndPreviewModals />
      <CmdAndAgendaModals />
      <CalendarModals />
      <JournalAndSettingsModals />
      <CmdSidebarOverlay />
    </div>
  );
}