import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, AlertTriangle, ChevronDown, ChevronUp, Clock, Pencil, Check, X } from 'lucide-react';
import { useCollab, useAppState } from '../../context/AppContext';
import { formatRelativeDate, nameInitial } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

export const CollabBar: React.FC = () => {
  const collab = useCollab();
  const { renameUser } = useAppState();
  const { toast } = useToast();

  const [showConflicts, setShowConflicts] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(collab.currentUser.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditingName) setNameInput(collab.currentUser.name);
  }, [collab.currentUser.name, isEditingName]);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  const handleStartEdit = useCallback(() => {
    setNameInput(collab.currentUser.name);
    setIsEditingName(true);
  }, [collab.currentUser.name]);

  const handleSaveName = useCallback(() => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== collab.currentUser.name) {
      renameUser(trimmed);
      toast(`Name updated to "${trimmed}"`, 'success');
    }
    setIsEditingName(false);
  }, [nameInput, collab.currentUser.name, renameUser, toast]);

  const handleCancelEdit = useCallback(() => {
    setNameInput(collab.currentUser.name);
    setIsEditingName(false);
  }, [collab.currentUser.name]);

  const onlineUsers = collab.activeUsers.filter(
    (u) => u.name && new Date(u.lastSeen).getTime() > Date.now() - 15000,
  );

  const dropdownStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
  };

  return (
    <div className="flex items-center gap-2">
      {/* Connection status */}
      <div
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={collab.isConnected
          ? { background: 'var(--success-subtle)', color: 'var(--success-text)' }
          : { background: 'var(--bg-subtle)', color: 'var(--text-muted)' }
        }
      >
        {collab.isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
        {collab.isConnected ? 'Live' : 'Offline'}
      </div>

      {/* Active users */}
      <div className="relative">
        <button
          onClick={() => { setShowUsers(!showUsers); setShowConflicts(false); }}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div className="flex -space-x-1">
            {onlineUsers.slice(0, 4).map((user) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.color, borderColor: 'var(--bg-surface)' }}
                title={user.name}
              >
                {nameInitial(user.name)}
              </div>
            ))}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{onlineUsers.length}</span>
          {showUsers ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {showUsers && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUsers(false)} />
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl py-2 z-50" style={dropdownStyle}>
              <p className="text-xs font-semibold px-3 pb-2" style={{ color: 'var(--text-muted)' }}>Online now</p>

              {onlineUsers.map((user) => {
                const isYou = user.id === collab.currentUser.id;
                return (
                  <div key={user.id} className="flex items-center gap-2 px-3 py-1.5 group/row">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: user.color }}
                    >
                      {nameInitial(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isYou && isEditingName ? (
                        <div className="flex items-center gap-1">
                          <input
                            ref={nameInputRef}
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveName();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            maxLength={32}
                            className="flex-1 min-w-0 text-xs font-medium border rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1"
                            style={{
                              background: 'var(--bg-surface)',
                              borderColor: 'var(--border-strong)',
                              color: 'var(--text-primary)',
                            }}
                            aria-label="Edit your display name"
                          />
                          <button onClick={handleSaveName} className="p-0.5 shrink-0" style={{ color: 'var(--success-text)' }} aria-label="Save"><Check size={13} /></button>
                          <button onClick={handleCancelEdit} className="p-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} aria-label="Cancel"><X size={13} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {user.name}
                            {isYou && <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>(you)</span>}
                          </p>
                          {isYou && (
                            <button
                              onClick={handleStartEdit}
                              className="shrink-0 p-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity"
                              style={{ color: 'var(--text-muted)' }}
                              aria-label="Edit name" title="Edit name"
                            >
                              <Pencil size={11} />
                            </button>
                          )}
                        </div>
                      )}
                      {!isEditingName && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeDate(user.lastSeen)}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="mx-3 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hover your name to edit it</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Conflict log */}
      {collab.conflictLog.length > 0 && (
        <div className="relative">
          <button
            onClick={() => { setShowConflicts(!showConflicts); setShowUsers(false); }}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: 'var(--warning-text)' }}
          >
            <AlertTriangle size={12} />
            <span>{collab.conflictLog.length}</span>
            {showConflicts ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {showConflicts && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowConflicts(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl py-2 z-50 max-h-64 overflow-y-auto scrollbar-thin" style={dropdownStyle}>
                <div className="px-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Conflict Log</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Strategy: Last-Write-Wins</p>
                </div>
                {collab.conflictLog.map((entry) => (
                  <div key={entry.id} className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{entry.cardTitle}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeDate(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
