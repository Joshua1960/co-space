import React, { useState, useCallback, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Textarea, DateInput } from "../ui/Input";
import { TagInput } from "../ui/TagInput";
import { useAppState } from "../../context/AppContext";
import type { Card } from "../../types";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string | null;
  editingCard: Card | null;
}

const COMMON_TAGS = [
  "bug",
  "feature",
  "enhancement",
  "documentation",
  "urgent",
  "blocked",
  "in-progress",
  "review",
];

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  columnId,
  editingCard,
}) => {
  const { dispatch } = useAppState();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<{ title?: string }>({});

  // Initialize form state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingCard) {
        setTitle(editingCard.title);
        setDescription(editingCard.description);
        setTags(editingCard.tags);
        setDueDate(editingCard.dueDate || "");
      } else {
        setTitle("");
        setDescription("");
        setTags([]);
        setDueDate("");
      }
      setErrors({});
    }
  }, [isOpen, editingCard]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const newErrors: { title?: string } = {};
      if (!title.trim()) {
        newErrors.title = "Title is required";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      if (editingCard) {
        // Update existing card
        dispatch({
          type: "UPDATE_CARD",
          payload: {
            cardId: editingCard.id,
            updates: {
              title: title.trim(),
              description: description.trim(),
              tags,
              dueDate: dueDate || null,
            },
          },
        });
      } else if (columnId) {
        // Create new card
        dispatch({
          type: "CREATE_CARD",
          payload: {
            columnId,
            title: title.trim(),
            description: description.trim(),
            tags,
            dueDate: dueDate || null,
          },
        });
      }

      onClose();
    },
    [
      title,
      description,
      tags,
      dueDate,
      editingCard,
      columnId,
      dispatch,
      onClose,
    ],
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingCard ? "Edit card" : "Create new card"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
          placeholder="What needs to be done?"
          error={errors.title}
          autoFocus
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          placeholder="Add more details/description..."
          rows={5}
          helperText="Markdown supported"
        />

        <TagInput
          label="Tags"
          value={tags}
          onChange={setTags}
          placeholder="Add tags..."
          suggestedTags={COMMON_TAGS}
          helperText="Press Enter or comma to add a tag"
        />

        <DateInput
          label="Due date (optional)"
          value={dueDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDueDate(e.target.value)
          }
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">
            {editingCard ? "Save changes" : "Create card"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
