import React, { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { useAppState } from '../../context/AppContext';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dispatch } = useAppState();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});
  
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      const newErrors: { title?: string } = {};
      if (!title.trim()) {
        newErrors.title = 'Title is required';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      dispatch({
        type: 'CREATE_BOARD',
        payload: {
          title: title.trim(),
          description: description.trim(),
        },
      });
      
      // Reset and close
      setTitle('');
      setDescription('');
      setErrors({});
      onClose();
    },
    [title, description, dispatch, onClose]
  );
  
  const handleClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setErrors({});
    onClose();
  }, [onClose]);
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create new board">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Board title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder="e.g., Product Roadmap Q1"
          error={errors.title}
          autoFocus
        />
        
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="What's this board about?"
          rows={3}
        />
        
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">Create board</Button>
        </div>
      </form>
    </Modal>
  );
};
