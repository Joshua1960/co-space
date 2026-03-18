import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { useAppState } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose }) => {
  const { dispatch } = useAppState();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (isOpen) { setTitle(''); setDescription(''); setErrors({}); }
  }, [isOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setErrors({ title: 'Board name is required' }); return; }
    dispatch({ type: 'CREATE_BOARD', payload: { title: title.trim(), description: description.trim() } });
    toast(`Board "${title.trim()}" created`, 'success');
    onClose();
  }, [title, description, dispatch, toast, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create new board"
      description="Boards help you organise work into columns and cards."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create board</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Board name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Product Roadmap"
          error={errors.title}
          autoFocus
        />
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this board for?"
          rows={3}
        />
      </form>
    </Modal>
  );
};
