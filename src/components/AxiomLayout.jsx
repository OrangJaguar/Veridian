import React, { useState } from 'react';
import { useAxiomStore } from '../store/useAxiomStore';
import AppHeader from '../views/ops/AppHeader';
import AppOverlays from '../views/ops/AppOverlays';
import DashboardMain from '../views/ops/DashboardMain';
import AgendaMain from '../views/ops/AgendaMain';
import CalendarMain from '../views/ops/CalendarMain';
import JournalMain from '../views/ops/JournalMain';
import FocusMain from '../views/ops/FocusMain';
import FlashcardMain from '../views/ops/FlashcardMain';
import QuizMain from '../views/ops/QuizMain';
import TypingMain from '../views/ops/TypingMain';
import EditorMain from '../views/ops/EditorMain';
import MasterySummaryMain from '../views/ops/MasterySummaryMain';
import CmdPanel from '../views/cmd/CmdPanel';

const VIEW_MAP = {
  dashboard: DashboardMain,
  agenda: AgendaMain,
  calendar: CalendarMain,
  journal: JournalMain,
  focus: FocusMain,
  flashcards: FlashcardMain,
  quiz: QuizMain,
  typing: TypingMain,
  editor: EditorMain,
  mastery: MasterySummaryMain,
};

export default function AxiomLayout() {
  const { mode, opsView } = useAxiomStore();
  const [showSettings, setShowSettings] = useState(false);

  if (mode === 'cmd') {
    return <CmdPanel />;
  }

  const ActiveView = VIEW_MAP[opsView] ?? DashboardMain;

  return (
    <div className="axiom-root">
      <AppHeader />
      <main className="axiom-main">
        <ActiveView />
      </main>
      <AppOverlays showSettings={showSettings} onCloseSettings={() => setShowSettings(false)} />
      <button className="axiom-settings-fab" onClick={() => setShowSettings(true)} title="Settings">⚙</button>
    </div>
  );
}