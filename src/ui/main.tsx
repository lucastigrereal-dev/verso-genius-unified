import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppWithRouter } from './AppWithRouter';
import { ThemeProvider } from '../contexts/ThemeContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppWithRouter />
    </ThemeProvider>
  </React.StrictMode>
);
