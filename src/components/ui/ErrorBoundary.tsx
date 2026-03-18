import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  section?: string; // e.g. "Board", "Column"
}

interface State { hasError: boolean; error: Error | null; }

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center"
        style={{ background: 'var(--danger-subtle)', border: '1px solid var(--danger)', color: 'var(--danger-text)' }}
      >
        <AlertTriangle size={24} />
        <div>
          <p className="font-semibold text-sm">{this.props.section ?? 'Section'} failed to load</p>
          <p className="text-xs opacity-75 mt-0.5">{this.state.error?.message ?? 'Unknown error'}</p>
        </div>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--danger)', color: '#fff' }}
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }
}

/** Full-page error boundary used at the app root */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--bg-base)' }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center shadow-[var(--shadow-xl)]"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}
          >
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h2>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{this.state.error?.message}</p>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Try reloading. If the problem persists, clear your browser storage.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--brand)', color: 'var(--text-inverse)' }}
            >
              <RefreshCw size={14} /> Reload page
            </button>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
            >
              Clear data
            </button>
          </div>
        </div>
      </div>
    );
  }
}
