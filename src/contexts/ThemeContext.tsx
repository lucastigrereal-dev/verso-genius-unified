import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfileService } from '../services/userProfileService';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profile = UserProfileService.getProfile();
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    profile.darkModeEnabled ? 'dark' : 'light',
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    UserProfileService.setDarkModeEnabled(newTheme === 'dark');
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    UserProfileService.setDarkModeEnabled(newTheme === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
