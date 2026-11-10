import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'workspace-theme';

const useWorkspaceTheme = () => {
  const [isLightMode, setIsLightMode] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'light';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isLightMode ? 'light' : 'dark');
    } catch {
      // Keep the selected theme for this page if browser storage is unavailable.
    }
  }, [isLightMode]);

  return [isLightMode, () => setIsLightMode((current) => !current)];
};

export default useWorkspaceTheme;