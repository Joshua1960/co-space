import React, { useState, useCallback, memo } from 'react';
import { Reply, Edit2, Trash2, Check, X, ChevronDown, ChevronRight, MessageCircle } from 'lucide-react';
import { useAppState, useCardComments, useCommentReplies } from '../../context/AppContext';
import { formatRelativeDate, nameInitial } from '../../lib/utils';
import type { Comment } from '../../types';

interface CommentNodeProps {
  comment: Comment;
  depth: number;
  currentUserName: string;
  currentUserColor: string;
  onPublishEvent: (type: string, payload: Record<string, unknown>) => void;
}

const MAX_DEPTH = 2;

const CommentNode: React.FC<CommentNodeProps> = memo(({ comment, depth, currentUserName, currentUserColor, onPublishEvent }) => {
  const { dispatch } = useAppState();
  const replies = useCommentReplies(comment.id);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.text);
  const [showReplies, setShowReplies] = useState(true);

  const isOwner = comment.author === currentUserName;
  const canReply = depth < MAX_DEPTH;

  const handleReply = useCallback(() => {
    if (!replyText.trim()) return;
    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    dispatch({ type: 'ADD_COMMENT', payload: { cardId: comment.cardId, parentId: comment.id, text: replyText.trim(), author: currentUserName, authorColor: currentUserColor, commentId } });
    onPublishEvent('COMMENT_ADDED', { cardId: comment.cardId, parentId: comment.id, text: replyText.trim(), author: currentUserName, authorColor: currentUserColor, commentId });
    setReplyText(''); setIsReplying(false); setShowReplies(true);
  }, [replyText, comment.cardId, comment.id, currentUserName, currentUserColor, dispatch, onPublishEvent]);

  const handleEdit = useCallback(() => {
    if (!editText.trim() || editText === comment.text) { setIsEditing(false); return; }
    dispatch({ type: 'EDIT_COMMENT', payload: { commentId: comment.id, text: editText.trim() } });
    onPublishEvent('COMMENT_EDITED', { commentId: comment.id, text: editText.trim() });
    setIsEditing(false);
  }, [editText, comment.id, comment.text, dispatch, onPublishEvent]);

  const handleDelete = useCallback(() => {
    dispatch({ type: 'DELETE_COMMENT', payload: { commentId: comment.id } });
    onPublishEvent('COMMENT_DELETED', { commentId: comment.id });
  }, [comment.id, dispatch, onPublishEvent]);

  const indentClass = depth === 0 ? '' : 'ml-6 pl-4';
  const indentStyle = depth > 0 ? { borderLeft: '2px solid var(--border)' } : {};

  if (comment.isDeleted && replies.length === 0) return null;

  return (
    <div className={indentClass} style={indentStyle}>
      <div className={`group py-2 ${comment.isDeleted ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: comment.authorColor }}>
            {nameInitial(comment.author)}
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{comment.author}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeDate(comment.createdAt)}</span>
          {comment.editedAt && !comment.isDeleted && <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>(edited)</span>}
          {depth > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>L{depth}</span>
          )}
        </div>

        {isEditing ? (
          <div className="ml-8">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 resize-none"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              rows={3} autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleEdit(); if (e.key === 'Escape') { setIsEditing(false); setEditText(comment.text); } }}
            />
            <div className="flex gap-2 mt-1">
              <button onClick={handleEdit} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--success-text)' }}><Check size={12} /> Save</button>
              <button onClick={() => { setIsEditing(false); setEditText(comment.text); }} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}><X size={12} /> Cancel</button>
            </div>
          </div>
        ) : (
          <p className="ml-8 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: comment.isDeleted ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
            {comment.isDeleted ? <em>[deleted]</em> : comment.text}
          </p>
        )}

        {!comment.isDeleted && !isEditing && (
          <div className="ml-8 mt-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {canReply && (
              <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Reply size={11} /> Reply
              </button>
            )}
            {isOwner && (
              <>
                <button onClick={() => { setIsEditing(true); setEditText(comment.text); }} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Edit2 size={11} /> Edit
                </button>
                <button onClick={handleDelete} className="flex items-center gap-1 text-xs" style={{ color: 'var(--danger-text)' }}>
                  <Trash2 size={11} /> Delete
                </button>
              </>
            )}
          </div>
        )}

        {isReplying && (
          <div className="ml-8 mt-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.author}…`}
              className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 resize-none"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              rows={2} autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); if (e.key === 'Escape') { setIsReplying(false); setReplyText(''); } }}
            />
            <div className="flex gap-2 mt-1">
              <button onClick={handleReply} disabled={!replyText.trim()} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: 'var(--brand)', color: 'var(--text-inverse)' }}>
                <Check size={12} /> Reply
              </button>
              <button onClick={() => { setIsReplying(false); setReplyText(''); }} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {replies.length > 0 && (
        <div>
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-xs mb-1 ml-8 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {showReplies ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {showReplies && (
            <div className="space-y-0">
              {replies.map((reply) => (
                <CommentNode key={reply.id} comment={reply} depth={depth + 1} currentUserName={currentUserName} currentUserColor={currentUserColor} onPublishEvent={onPublishEvent} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CommentNode.displayName = 'CommentNode';

interface CommentThreadProps { cardId: string; }

export const CommentThread: React.FC<CommentThreadProps> = ({ cardId }) => {
  const { dispatch, state, publishEvent } = useAppState();
  const topLevelComments = useCardComments(cardId);
  const currentUser = state.collab.currentUser;
  const [newCommentText, setNewCommentText] = useState('');

  const handleAddComment = useCallback(() => {
    if (!newCommentText.trim()) return;
    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    dispatch({ type: 'ADD_COMMENT', payload: { cardId, parentId: null, text: newCommentText.trim(), author: currentUser.name, authorColor: currentUser.color, commentId } });
    publishEvent('COMMENT_ADDED', { cardId, parentId: null, text: newCommentText.trim(), author: currentUser.name, authorColor: currentUser.color, commentId });
    setNewCommentText('');
  }, [newCommentText, cardId, currentUser, dispatch, publishEvent]);

  const handlePublishEvent = useCallback((type: string, payload: Record<string, unknown>) => {
    publishEvent(type as Parameters<typeof publishEvent>[0], payload);
  }, [publishEvent]);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={15} style={{ color: 'var(--text-muted)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Comments ({topLevelComments.length})
        </h3>
      </div>

      {/* New comment */}
      <div className="mb-4 flex gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: currentUser.color }}>
          {nameInitial(currentUser.name)}
        </div>
        <div className="flex-1">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a comment… (Ctrl+Enter to submit)"
            className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 resize-none"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            rows={2}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment(); }}
          />
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              As <strong style={{ color: 'var(--text-secondary)' }}>{currentUser.name || 'Anonymous'}</strong>
            </span>
            <button
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
              className="text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand)', color: 'var(--text-inverse)' }}
            >
              Comment
            </button>
          </div>
        </div>
      </div>

      {topLevelComments.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-1 divide-y" style={{ borderColor: 'var(--border)' }}>
          {topLevelComments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} depth={0} currentUserName={currentUser.name} currentUserColor={currentUser.color} onPublishEvent={handlePublishEvent} />
          ))}
        </div>
      )}
    </div>
  );
};
