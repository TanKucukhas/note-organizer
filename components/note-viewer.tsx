'use client';

import { useMemo } from 'react';
import type { Note } from '@/types/note';
import { NoteContentViewer } from './note-content-viewer';

interface NoteViewerProps {
  note: Note;
}

function formatDate(dateString: string): string {
  // Parse dates like "Tuesday, October 11, 2022 at 18:10:12"
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString; // Return original if parsing fails
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // If today, show time
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  // If yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // If within last week
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // If within this year, show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Otherwise show month, day, and year
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'Unprocessed',
        className: 'bg-yellow-500 text-white border-yellow-600 shadow-md font-semibold'
      };
    case 'failed':
      return {
        label: 'Trashed',
        className: 'bg-red-500 text-white border-red-600 shadow-md font-semibold'
      };
    case 'analyzed':
      return {
        label: 'Reviewed',
        className: 'bg-green-500 text-white border-green-600 shadow-md font-semibold'
      };
    default:
      return {
        label: status,
        className: 'bg-gray-500 text-white border-gray-600 shadow-md font-semibold'
      };
  }
}

export function NoteViewer({ note }: NoteViewerProps) {
  // Extract all links from the note content
  const links = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
    const matches = note.content.match(urlRegex) || [];
    // Remove duplicates
    return [...new Set(matches)];
  }, [note.content]);

  const createdDate = formatDate(note.created_raw);
  const modifiedDate = formatDate(note.modified_raw);
  const statusBadge = getStatusBadge(note.status);

  return (
    <div className="space-y-4">
      {/* Note Header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-2xl font-bold flex-1">{note.title}</h2>
          <span className={`px-4 py-1.5 rounded-full text-sm border-2 ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>{createdDate} • {modifiedDate}</p>
        </div>
      </div>

      {/* Note Content */}
      <NoteContentViewer
        content={note.content}
        noteTitle={note.title}
      />

      {/* Links Section - Moved to bottom */}
      {links.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🔗</span>
            <span>Links ({links.length})</span>
          </h3>
          <div className="space-y-2">
            {links.map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded bg-secondary/50 hover:bg-secondary transition-colors text-sm break-all"
              >
                <span className="text-blue-600 dark:text-blue-400 hover:underline">
                  {link}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
