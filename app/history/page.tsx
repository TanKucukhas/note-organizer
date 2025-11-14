import { getDatabase } from '@/lib/db';
import type { Note } from '@/types/note';
import { HistoryNoteCard } from '@/components/history-note-card';

function getReviewedNotes(): Note[] {
  const db = getDatabase();
  const notes = db
    .prepare<[], Note>('SELECT * FROM notes WHERE status = ? ORDER BY updated_at DESC')
    .all('analyzed');
  return notes;
}

function getTrashedNotes(): Note[] {
  const db = getDatabase();
  const notes = db
    .prepare<[], Note>('SELECT * FROM notes WHERE status = ? ORDER BY updated_at DESC')
    .all('failed');
  return notes;
}

export default function HistoryPage() {
  const reviewedNotes = getReviewedNotes();
  const trashedNotes = getTrashedNotes();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Review History</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">✓</span>
              <div>
                <h2 className="text-2xl font-bold">{reviewedNotes.length}</h2>
                <p className="text-sm text-muted-foreground">Reviewed Notes</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🗑️</span>
              <div>
                <h2 className="text-2xl font-bold">{trashedNotes.length}</h2>
                <p className="text-sm text-muted-foreground">Trashed Notes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviewed Notes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>✓</span>
            <span>Reviewed Notes</span>
          </h2>
          {reviewedNotes.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No reviewed notes yet. Start reviewing notes to see them here.
            </div>
          ) : (
            <div className="space-y-2">
              {reviewedNotes.map((note) => (
                <HistoryNoteCard
                  key={note.note_id}
                  noteId={note.note_id}
                  title={note.title}
                  updatedAt={note.updated_at}
                  status="analyzed"
                />
              ))}
            </div>
          )}
        </div>

        {/* Trashed Notes */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🗑️</span>
            <span>Trashed Notes</span>
          </h2>
          {trashedNotes.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No trashed notes.
            </div>
          ) : (
            <div className="space-y-2">
              {trashedNotes.map((note) => (
                <HistoryNoteCard
                  key={note.note_id}
                  noteId={note.note_id}
                  title={note.title}
                  updatedAt={note.updated_at}
                  status="failed"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
