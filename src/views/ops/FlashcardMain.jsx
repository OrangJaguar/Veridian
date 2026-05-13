import React, { useState } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { createDeck, createFlashcard, getDueCards, reviewCard } from '../../lib/ops/deck-storage';
import { DECK_COLORS } from '../../lib/constants-storage';

export default function FlashcardMain() {
  const { decks, activeDeckId, addDeck, updateDeck, deleteDeck, setActiveDeck } = useAxiomStore();
  const [view, setView] = useState('list');
  const [flipped, setFlipped] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [newDeckName, setNewDeckName] = useState('');
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const activeDeck = decks.find(d => d.id === activeDeckId);
  const dueCards = activeDeck ? getDueCards(activeDeck) : [];
  const studyCard = dueCards[studyIndex];

  const handleAddDeck = () => {
    if (!newDeckName.trim()) return;
    const deck = createDeck(newDeckName.trim(), '', DECK_COLORS[decks.length % DECK_COLORS.length]);
    addDeck(deck);
    setNewDeckName('');
  };

  const handleAddCard = () => {
    if (!newFront.trim() || !newBack.trim() || !activeDeck) return;
    const card = createFlashcard(newFront.trim(), newBack.trim());
    updateDeck(activeDeck.id, { cards: [...activeDeck.cards, card] });
    setNewFront(''); setNewBack('');
  };

  const handleReview = (quality) => {
    if (!studyCard || !activeDeck) return;
    const updated = reviewCard(studyCard, quality);
    const cards = activeDeck.cards.map(c => c.id === updated.id ? updated : c);
    updateDeck(activeDeck.id, { cards });
    setFlipped(false);
    if (studyIndex >= dueCards.length - 1) { setView('list'); setStudyIndex(0); }
    else setStudyIndex(i => i + 1);
  };

  if (view === 'study' && studyCard) {
    return (
      <div className="axiom-view axiom-flashcard-study">
        <div className="axiom-study-header">
          <button className="axiom-btn" onClick={() => { setView('list'); setStudyIndex(0); }}>← Back</button>
          <span className="axiom-muted">{studyIndex + 1} / {dueCards.length} due</span>
        </div>
        <div className={`axiom-card-flip ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
          <div className="axiom-card-front"><p>{studyCard.front}</p></div>
          {flipped && <div className="axiom-card-back"><p>{studyCard.back}</p></div>}
        </div>
        {flipped ? (
          <div className="axiom-review-btns">
            <button className="axiom-btn axiom-btn-danger" onClick={() => handleReview(0)}>Again</button>
            <button className="axiom-btn axiom-btn-warning" onClick={() => handleReview(3)}>Good</button>
            <button className="axiom-btn axiom-btn-success" onClick={() => handleReview(5)}>Easy</button>
          </div>
        ) : <p className="axiom-muted axiom-hint">Click card to reveal answer</p>}
      </div>
    );
  }

  return (
    <div className="axiom-view axiom-flashcards">
      <div className="axiom-flashcard-sidebar">
        <h2>Decks</h2>
        <div className="axiom-deck-new">
          <input className="axiom-input" placeholder="New deck…" value={newDeckName}
            onChange={e => setNewDeckName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddDeck()} />
          <button className="axiom-btn axiom-btn-primary" onClick={handleAddDeck}>+</button>
        </div>
        <div className="axiom-deck-list">
          {decks.map(d => (
            <div key={d.id} className={`axiom-deck-item ${activeDeckId === d.id ? 'active' : ''}`}
              onClick={() => setActiveDeck(d.id)} style={{ borderLeft: `3px solid ${d.color ?? '#6366f1'}` }}>
              <span>{d.name}</span><span className="axiom-muted">{d.cards.length} cards</span>
            </div>
          ))}
        </div>
      </div>
      <div className="axiom-flashcard-main">
        {activeDeck ? (
          <>
            <div className="axiom-flashcard-topbar">
              <h2>{activeDeck.name}</h2>
              <div className="axiom-flashcard-actions">
                <button className="axiom-btn" onClick={() => setView('add-card')}>+ Card</button>
                <button className="axiom-btn axiom-btn-primary" disabled={dueCards.length === 0}
                  onClick={() => { setStudyIndex(0); setFlipped(false); setView('study'); }}>
                  Study ({dueCards.length} due)
                </button>
                <button className="axiom-btn axiom-btn-danger" onClick={() => { deleteDeck(activeDeck.id); setActiveDeck(null); }}>Delete</button>
              </div>
            </div>
            {view === 'add-card' && (
              <div className="axiom-add-card-form">
                <textarea className="axiom-input" placeholder="Front…" value={newFront} onChange={e => setNewFront(e.target.value)} rows={3} />
                <textarea className="axiom-input" placeholder="Back…" value={newBack} onChange={e => setNewBack(e.target.value)} rows={3} />
                <button className="axiom-btn axiom-btn-primary" onClick={handleAddCard}>Add Card</button>
                <button className="axiom-btn" onClick={() => setView('list')}>Cancel</button>
              </div>
            )}
            <div className="axiom-card-grid">
              {activeDeck.cards.map(card => (
                <div key={card.id} className="axiom-card-preview">
                  <div className="axiom-card-front-preview">{card.front}</div>
                  <div className="axiom-card-back-preview axiom-muted">{card.back}</div>
                </div>
              ))}
              {activeDeck.cards.length === 0 && <p className="axiom-muted axiom-empty">No cards yet — add some!</p>}
            </div>
          </>
        ) : <div className="axiom-empty axiom-muted">Select or create a deck to get started</div>}
      </div>
    </div>
  );
}