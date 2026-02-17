import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Pages - Original App
import { App as OriginalApp } from './App';

// Pages - New Sprint 2/3 Pages
import DashboardPage from '../pages/DashboardPage';
import LessonPage from '../pages/LessonPage';
import ResultsPage from '../pages/ResultsPage';

/**
 * Main App Router with all routes
 *
 * Routes:
 * / - Home (Original Rima Generator)
 * /dashboard - Gamification Dashboard
 * /lesson/:pillar/:lesson - Lesson Player
 * /results - Results Page
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Home - Original App */}
          <Route
            path="/"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OriginalApp />
              </motion.div>
            }
          />

          {/* Dashboard - Gamification Hub */}
          <Route
            path="/dashboard"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardPage />
              </motion.div>
            }
          />

          {/* Lesson - Exercise Player */}
          <Route
            path="/lesson/:pillar/:lesson"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LessonPage />
              </motion.div>
            }
          />

          {/* Results - Analysis and Feedback */}
          <Route
            path="/results"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ResultsPage />
              </motion.div>
            }
          />

          {/* Fallback - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
