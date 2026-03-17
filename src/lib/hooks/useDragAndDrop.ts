import { useState, useCallback } from "react";
import type { Card, DropResult } from "../types";

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

export function useDragAndDrop({ onMoveTask, tasks }: UseDragAndDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTaskId: null,
    sourceColumnId: null,
    sourceIndex: null,
  });

  const handleDragStart = useCallback(
    (e: React.DragEvent, taskId: string, columnId: string, index: number) => {
      // 1. Set the data for the drop event
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({ taskId, columnId, index }),
      );

      // 2. Set the drag state
      setDragState({
        isDragging: true,
        draggedTaskId: taskId,
        sourceColumnId: columnId,
        sourceIndex: index,
      });

      // 3. Visual feedback: Add class after a tick to allow the ghost image to form
      const element = e.currentTarget as HTMLElement;
      setTimeout(() => {
        element.classList.add("dragging");
      }, 0);
    },
    [],
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove("dragging");

    setDragState({
      isDragging: false,
      draggedTaskId: null,
      sourceColumnId: null,
      sourceIndex: null,
    });

    // Cleanup any lingering visual indicators
    document.querySelectorAll(".drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string, index?: number) => {
      e.preventDefault(); // Required to allow a drop
      e.dataTransfer.dropEffect = "move";

      // Highlight the target column
      const columnElement = e.currentTarget as HTMLElement;
      columnElement.classList.add("drag-over");
    },
    [],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const columnElement = e.currentTarget as HTMLElement;

    // Prevent flickering when hovering over child cards
    const rect = columnElement.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      columnElement.classList.remove("drag-over");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumnId: string, targetIndex: number) => {
      e.preventDefault();

      e.preventDefault();

      const data = e.dataTransfer.getData("text/plain");
      if (!data) return;

      try {
        const {
          taskId,
          columnId: sourceColumnId,
          index: sourceIndex,
        } = JSON.parse(data);

        // Skip if dropped in the exact same spot
        if (sourceColumnId === targetColumnId && sourceIndex === targetIndex) {
          return;
        }

        // Calculate the final index (adjusting if moving down within the same column)
        let finalIndex = targetIndex;
        if (sourceColumnId === targetColumnId && targetIndex > sourceIndex) {
          finalIndex = targetIndex - 1;
        }

        // Call the move function passed from BoardView
        onMoveTask({
          taskId,
          source: { columnId: sourceColumnId, index: sourceIndex },
          destination: {
            columnId: targetColumnId,
            index: Math.max(0, finalIndex),
          },
        });
      } catch (err) {
        console.error("Failed to parse drag data:", err);
      }

      // Cleanup
      document.querySelectorAll(".drag-over").forEach((el) => {
        el.classList.remove("drag-over");
      });
    },
    [onMoveTask],
  );

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
