import React, { Suspense, lazy, useMemo } from 'react';
import { AppProvider, useUI, useCollab } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Dashboard } from './pages/Dashboard';
import { WelcomeModal } from './components/collab/WelcomeModal';
import { AppErrorBoundary } from './components/ui/ErrorBoundary';

const BoardView = lazy(() =>
  import('./pages/BoardView').then((m) => ({ default: m.BoardView })),
);

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-10 h-10 rounded-full animate-spin"
        style={{ border: '3px solid var(--border)', borderTopColor: 'var(--brand)' }}
      />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
    </div>
  </div>
);

const AppRouter: React.FC = () => {
  const ui = useUI();
  const collab = useCollab();
  const needsName = !collab.currentUser.name;

  const content = useMemo(() => {
    if (ui.activeBoardId) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <BoardView />
        </Suspense>
      );
    }
    return <Dashboard />;
  }, [ui.activeBoardId]);

  return (
    <>
      {content}
      {needsName && <WelcomeModal />}
    </>
  );
};

function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppProvider>
            <AppRouter />
          </AppProvider>
        </ToastProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
