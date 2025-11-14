'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NoteHistoryActionsProps {
  noteId: string;
  noteTitle: string;
  status: 'analyzed' | 'failed';
}

export function NoteHistoryActions({ noteId, noteTitle, status }: NoteHistoryActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    if (!confirm(`Recover "${noteTitle}" back to the organizer queue?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/recover`, {
        method: 'POST',
      });

      if (response.ok) {
        // Use hard refresh to ensure cache is cleared
        window.location.href = '/organizer/notes';
      } else {
        const error = await response.json();
        alert(`Failed to recover note: ${error.error || 'Unknown error'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error recovering note:', error);
      alert('Failed to recover note');
      setLoading(false);
    }
  };

  const handleDeleteForever = async () => {
    if (!confirm(`⚠️ Permanently delete "${noteTitle}"?\n\nThis action cannot be undone!`)) {
      return;
    }

    // Double confirmation for delete
    if (!confirm('Are you absolutely sure? This will permanently delete the note from the database.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Use hard refresh to ensure cache is cleared
        window.location.href = '/history';
      } else {
        const error = await response.json();
        alert(`Failed to delete note: ${error.error || 'Unknown error'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={handleRecover}
        disabled={loading}
        className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{loading ? 'Recovering...' : 'Recover to Queue'}</span>
      </button>

      <button
        onClick={handleDeleteForever}
        disabled={loading}
        className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>{loading ? 'Deleting...' : 'Delete Forever'}</span>
      </button>
    </div>
  );
}
