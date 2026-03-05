import React, { Suspense, lazy, useMemo } from "react";
import { AppProvider, useUI } from "./context/AppContext";
import { Dashboard } from "./pages/Dashboard";

// Lazy load BoardView for code splitting
const BoardView = lazy(() =>
  import("./pages/BoardView").then((module) => ({ default: module.BoardView })),
);

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-stone-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  </div>
);

// Error boundary for lazy loading
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Something went wrong
            </h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main app router
const AppRouter: React.FC = () => {
  const ui = useUI();

  // Memoize the content based on active board
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

  return <ErrorBoundary>{content}</ErrorBoundary>;
};

// Root App component
function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
