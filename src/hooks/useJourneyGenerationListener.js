import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useJourneys } from '@/hooks/queries/useJourneys';

const NOTIFIED_KEY = 'veridian:notifiedJourneys';

function getNotifiedSet() {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markNotified(journeyId) {
  const set = getNotifiedSet();
  set.add(journeyId);
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
}

/**
 * Polls journeys while any are processing; fires toast when generation completes.
 */
export function useJourneyGenerationListener() {
  const { data: journeys = [], refetch } = useJourneys({ archived: false });
  const navigate = useNavigate();
  const prevStatusRef = useRef({});

  const hasProcessing = journeys.some((j) => j.generationStatus === 'processing');

  useEffect(() => {
    if (!hasProcessing) return undefined;
    const id = window.setInterval(() => refetch(), 5000);
    return () => window.clearInterval(id);
  }, [hasProcessing, refetch]);

  useEffect(() => {
    journeys.forEach((j) => {
      const prev = prevStatusRef.current[j.journeyId];
      const cur = j.generationStatus;
      prevStatusRef.current[j.journeyId] = cur;

      if (prev === 'processing' && cur === 'completed' && !getNotifiedSet().has(j.journeyId)) {
        markNotified(j.journeyId);
        const topic = j.sourceTopic || j.title || 'your topic';
        toast('Engine Ready', {
          description: `Your custom Journey for ${topic} is built and ready for baseline calibration.`,
          action: {
            label: 'Start Diagnostic',
            onClick: () => navigate(`/journeys/${j.journeyId}/diagnostic`),
          },
          duration: Infinity,
        });
      }

      if (prev === 'processing' && cur === 'failed' && !getNotifiedSet().has(`${j.journeyId}:fail`)) {
        markNotified(`${j.journeyId}:fail`);
        toast.error(j.generationError || 'Journey generation failed.', {
          action: {
            label: 'Try again',
            onClick: () => navigate('/journeys/new'),
          },
        });
      }
    });
  }, [journeys, navigate]);
}
