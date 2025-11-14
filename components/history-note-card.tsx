'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HistoryNoteCardProps {
  noteId: string;
  title: string;
  updatedAt: string;
  status: 'analyzed' | 'failed';
}

export function HistoryNoteCard({ noteId, title, updatedAt, status }: HistoryNoteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRecover = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Recover "${title}" back to the organizer queue?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/recover`, {
        method: 'POST',
      });

      if (response.ok) {
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`⚠️ Permanently delete "${title}"?\n\nThis action cannot be undone!`)) {
      return;
    }

    if (!confirm('Are you absolutely sure? This will permanently delete the note from the database.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
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

  const statusLabel = status === 'analyzed' ? 'Reviewed' : 'Trashed';

  return (
    <div className={`relative rounded-lg border bg-card p-4 hover:bg-accent transition-colors ${status === 'failed' ? 'opacity-60' : ''}`}>
      <Link href={`/notes/${noteId}`} className="block">
        <h3 className="font-semibold mb-1 pr-10">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {statusLabel}: {new Date(updatedAt).toLocaleDateString()}
        </p>
      </Link>

      {/* Actions Menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          disabled={loading}
          className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-50"
          aria-label="Actions menu"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />

            {/* Menu items */}
            <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-card shadow-lg z-20">
              <div className="py-1">
                <button
                  onClick={handleRecover}
                  disabled={loading}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Recover to Queue</span>
                </button>

                <div className="border-t my-1" />

                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Forever</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
