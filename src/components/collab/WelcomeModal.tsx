import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ArrowRight } from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';


export const WelcomeModal: React.FC = () => {
  const { state, renameUser } = useAppState();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUser = state.collab.currentUser;
  const previewInitial = name.trim() ? name.trim()[0].toUpperCase() : '?';

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a name to continue.'); return; }
    if (trimmed.length < 2) { setError('Name must be at least 2 characters.'); return; }
    renameUser(trimmed);
    toast(`Welcome, ${trimmed}! 👋`, 'success');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-[var(--shadow-xl)]"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {/* Top band */}
        <div className="px-6 py-5 flex items-center gap-3" style={{ background: 'var(--brand)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <LayoutGrid size={18} style={{ color: 'var(--text-inverse)' }} />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--text-inverse)' }}>Welcome to CoSpace</h1>
            <p className="text-xs opacity-60" style={{ color: 'var(--text-inverse)' }}>Collaborative workspace</p>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Avatar preview */}
          <div className="flex justify-center mb-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: currentUser.color }}
            >
              {previewInitial}
            </div>
          </div>

          <p className="text-sm text-center mb-5" style={{ color: 'var(--text-secondary)' }}>
            Choose a display name so your teammates know it's you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Your display name"
                maxLength={32}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: error ? 'var(--danger)' : 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                aria-label="Display name"
              />
              {error && <p className="mt-1.5 text-xs" style={{ color: 'var(--danger-text)' }} role="alert">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand)', color: 'var(--text-inverse)' }}
            >
              Get started <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
