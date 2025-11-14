import { NextRequest, NextResponse } from 'next/server';
import { updateNoteStatus } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;

    console.log('Recovering note:', noteId);

    // Update note status back to 'pending' to recover it
    updateNoteStatus(noteId, 'pending');

    console.log('Note status updated to pending');

    // Revalidate all relevant paths to clear cache
    revalidatePath('/history');
    revalidatePath('/organizer/notes');
    revalidatePath(`/notes/${noteId}`);

    return NextResponse.json({
      success: true,
      message: 'Note recovered successfully',
      noteId
    });
  } catch (error) {
    console.error('Error recovering note:', error);
    return NextResponse.json(
      { error: 'Failed to recover note' },
      { status: 500 }
    );
  }
}
