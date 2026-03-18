import { useState, useCallback } from 'react';
import type { Card, DropResult } from '../../types';
import type { DragEvent } from 'react';

interface DragState {
  isDragging: boolean;
  draggedTaskId: string | null;
  sourceColumnId: string | null;
  sourceIndex: number | null;
}

interface UseDragAndDropProps {
  onMoveTask: (result: DropResult & { taskId: string }) => void;
  tasks: Card[];
}

export function useDragAndDrop({ onMoveTask }: UseDragAndDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTaskId: null,
    sourceColumnId: null,
    sourceIndex: null,
  });

  const handleDragStart = useCallback(
    (e: React.DragEvent, taskId: string, columnId: string, index: number) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, columnId, index }));
      setDragState({ isDragging: true, draggedTaskId: taskId, sourceColumnId: columnId, sourceIndex: index });
      const element = e.currentTarget as HTMLElement;
      setTimeout(() => element.classList.add('dragging'), 0);
    },
    [],
  );

  const handleDragEnd = useCallback((e: DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('dragging');
    setDragState({ isDragging: false, draggedTaskId: null, sourceColumnId: null, sourceIndex: null });
    document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const columnElement = e.currentTarget as HTMLElement;
    columnElement.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    const columnElement = e.currentTarget as HTMLElement;
    const rect = columnElement.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      columnElement.classList.remove('drag-over');
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, targetColumnId: string, targetIndex: number) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('text/plain');
      if (!data) return;
      try {
        const { taskId, columnId: sourceColumnId, index: sourceIndex } = JSON.parse(data);
        if (sourceColumnId === targetColumnId && sourceIndex === targetIndex) return;
        let finalIndex = targetIndex;
        if (sourceColumnId === targetColumnId && targetIndex > sourceIndex) {
          finalIndex = targetIndex - 1;
        }
        onMoveTask({
          taskId,
          source: { columnId: sourceColumnId, index: sourceIndex },
          destination: { columnId: targetColumnId, index: Math.max(0, finalIndex) },
        });
      } catch (err) {
        console.error('Failed to parse drag data:', err);
      }
      document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    },
    [onMoveTask],
  );

  return { dragState, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop };
}
