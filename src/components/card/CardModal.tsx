import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea, DateInput } from '../ui/Input';
import { TagInput } from '../ui/TagInput';
import { useAppState } from '../../context/AppContext';
import { useUndoRedo } from '../../lib/undoRedoContext';
import { useToast } from '../../context/ToastContext';
import type { Card } from '../../types';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string | null;
  editingCard: Card | null;
}

const COMMON_TAGS = ['bug', 'feature', 'enhancement', 'documentation', 'urgent', 'blocked', 'in-progress', 'review'];

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, columnId, editingCard }) => {
  const { publishEvent, state } = useAppState();
  const { dispatchUndoable } = useUndoRedo();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (editingCard) {
        setTitle(editingCard.title);
        setDescription(editingCard.description);
        setTags(editingCard.tags);
        setDueDate(editingCard.dueDate || '');
      } else {
        setTitle(''); setDescription(''); setTags([]); setDueDate('');
      }
      setErrors({});
    }
  }, [isOpen, editingCard]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setErrors({ title: 'Title is required' }); return; }

    if (editingCard) {
      const newVersion = editingCard.version + 1;
      dispatchUndoable({
        type: 'UPDATE_CARD',
        payload: {
          cardId: editingCard.id,
          updates: {
            title: title.trim(), description: description.trim(),
            tags, dueDate: dueDate || null,
            version: newVersion, lastEditedBy: state.collab.currentUser.name,
          },
        },
      });
      publishEvent('CARD_UPDATED', {
        cardId: editingCard.id,
        updates: { title: title.trim(), description: description.trim(), tags, dueDate: dueDate || null, version: newVersion },
        version: newVersion,
      });
      toast('Card updated', 'success');
    } else if (columnId) {
      dispatchUndoable({
        type: 'CREATE_CARD',
        payload: { columnId, title: title.trim(), description: description.trim(), tags, dueDate: dueDate || null },
      });
      toast(`Card "${title.trim()}" created`, 'success');
    }
    onClose();
  }, [title, description, tags, dueDate, editingCard, columnId, dispatchUndoable, publishEvent, state.collab.currentUser.name, toast, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCard ? 'Edit card' : 'Create new card'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{editingCard ? 'Save changes' : 'Create card'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" error={errors.title} autoFocus />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more details…" rows={4} helperText="Markdown supported" />
        <TagInput label="Tags" value={tags} onChange={setTags} placeholder="Add tags…" suggestedTags={COMMON_TAGS} helperText="Press Enter or comma to add" />
        <DateInput label="Due date (optional)" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </form>
    </Modal>
  );
};
