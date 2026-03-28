import { useState, useCallback } from 'react';
import { DEFAULT_SETTINGS, type BoardSettings } from '../types';

export function useBoardSettings() {
  const [settings, setSettings] = useState<BoardSettings>({ ...DEFAULT_SETTINGS });

  const update = useCallback(<K extends keyof BoardSettings>(key: K, value: BoardSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  return { settings, update, reset };
}
