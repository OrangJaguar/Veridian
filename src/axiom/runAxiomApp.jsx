import React, { useEffect } from 'react';
import AxiomLayout from '@/components/AxiomLayout';
import { loadSettings, applyAllSettings } from '../lib/modals/settings-ui';

export default function AxiomApp() {
  useEffect(() => {
    const settings = loadSettings();
    applyAllSettings(settings);
  }, []);

  return <AxiomLayout />;
}