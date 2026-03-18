import React from 'react';
import { classNames } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, width, height }) => (
  <div
    className={classNames('skeleton', className)}
    style={{ width, height }}
    aria-hidden="true"
  />
);

/** Skeleton for a board card on the dashboard */
export const BoardCardSkeleton: React.FC = () => (
  <div
    className="rounded-2xl p-5 space-y-3"
    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    aria-hidden="true"
  >
    <Skeleton className="h-5 w-3/4 rounded-lg" />
    <Skeleton className="h-3.5 w-full rounded" />
    <Skeleton className="h-3.5 w-2/3 rounded" />
    <div className="flex justify-between pt-1">
      <Skeleton className="h-3 w-24 rounded" />
      <Skeleton className="h-3 w-16 rounded" />
    </div>
  </div>
);

/** Skeleton for a kanban column */
export const ColumnSkeleton: React.FC = () => (
  <div
    className="shrink-0 w-72 rounded-2xl p-3 space-y-2"
    style={{ background: 'var(--bg-subtle)' }}
    aria-hidden="true"
  >
    <div className="flex items-center justify-between px-1 mb-3">
      <Skeleton className="h-4 w-28 rounded" />
      <Skeleton className="h-4 w-6 rounded" />
    </div>
    {[1, 2, 3].map((i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/** Skeleton for a kanban card */
export const CardSkeleton: React.FC = () => (
  <div
    className="rounded-xl p-4 space-y-2.5"
    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    aria-hidden="true"
  >
    <Skeleton className="h-4 w-5/6 rounded" />
    <Skeleton className="h-3 w-full rounded" />
    <Skeleton className="h-3 w-4/5 rounded" />
    <div className="flex gap-1.5 pt-1">
      <Skeleton className="h-5 w-12 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  </div>
);
