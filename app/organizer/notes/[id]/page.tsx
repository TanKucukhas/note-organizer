import { notFound } from 'next/navigation';
import { getDatabase } from '@/lib/db';
import { NoteViewer } from '@/components/note-viewer';
import { OrganizationPanel } from '@/components/organization-panel';
import { OrganizerBottomNav } from '@/components/organizer-bottom-nav';
import type { Note } from '@/types/note';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function getNoteById(id: string): Note | undefined {
  const db = getDatabase();
  const note = db.prepare('SELECT * FROM notes WHERE note_id = ?').get(id) as Note | undefined;
  return note;
}

function getAllNoteIds(): string[] {
  const db = getDatabase();
  // Only get pending notes (not reviewed or trashed)
  const notes = db.prepare(
    'SELECT note_id FROM notes WHERE status = ? ORDER BY created_datetime DESC'
  ).all('pending') as { note_id: string }[];
  return notes.map(n => n.note_id);
}

export default async function OrganizerNotePage({ params }: PageProps) {
  const { id } = await params;
  const note = getNoteById(id);

  if (!note) {
    notFound();
  }

  // Get all note IDs for navigation
  const allNoteIds = getAllNoteIds();
  const currentIndex = allNoteIds.indexOf(id);
  const previousId = currentIndex > 0 ? allNoteIds[currentIndex - 1] : null;
  const nextId = currentIndex < allNoteIds.length - 1 ? allNoteIds[currentIndex + 1] : null;
  const progress = {
    current: currentIndex + 1,
    total: allNoteIds.length,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Split Screen Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Note Viewer */}
          <div className="overflow-x-auto">
            <NoteViewer note={note} />
          </div>

          {/* Right Panel - Organization Panel */}
          <div className="overflow-x-auto">
            <OrganizationPanel
              noteId={note.note_id}
              noteTitle={note.title}
              noteModifiedDate={note.modified_datetime}
            />
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Sticky */}
      <OrganizerBottomNav
        noteId={note.note_id}
        previousId={previousId}
        nextId={nextId}
        progress={progress}
      />
    </div>
  );
}
