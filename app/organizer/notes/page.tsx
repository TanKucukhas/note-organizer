import { redirect } from 'next/navigation';
import { getDatabase } from '@/lib/db';

export default function OrganizerNotesPage() {
  const db = getDatabase();

  // Get the latest pending note (newest first)
  const latestNote = db
    .prepare('SELECT note_id FROM notes WHERE status = ? ORDER BY created_datetime DESC LIMIT 1')
    .get('pending') as { note_id: string } | undefined;

  if (latestNote) {
    redirect(`/organizer/notes/${latestNote.note_id}`);
  } else {
    // If no pending notes, redirect to history
    redirect('/history');
  }
}
