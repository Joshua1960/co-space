import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon, title, description, action, secondaryAction,
}) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
      style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
    >
      {icon}
    </div>
    <h3 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
      {title}
    </h3>
    <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--text-muted)' }}>
      {description}
    </p>
    {action && (
      <div className="flex items-center gap-3">
        <Button onClick={action.onClick} leftIcon={action.icon} size="sm">
          {action.label}
        </Button>
        {secondaryAction && (
          <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    )}
  </div>
);
