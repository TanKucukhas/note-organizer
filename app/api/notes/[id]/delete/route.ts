import { NextRequest, NextResponse } from 'next/server';
import { deleteNotePermanently } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;

    console.log('Deleting note permanently:', noteId);

    // Permanently delete the note from the database
    deleteNotePermanently(noteId);

    console.log('Note deleted successfully');

    // Revalidate all relevant paths to clear cache
    revalidatePath('/history');
    revalidatePath('/organizer/notes');
    revalidatePath(`/notes/${noteId}`);

    return NextResponse.json({
      success: true,
      message: 'Note permanently deleted',
      noteId
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
