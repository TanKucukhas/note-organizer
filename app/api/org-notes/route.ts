import { NextResponse } from 'next/server';
import { createNote, getAllNotes } from '@/lib/db-organization';
import type { CreateNoteInput } from '@/types/organization';

export async function GET() {
  try {
    const notes = getAllNotes();
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching organization notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateNoteInput = await request.json();

    // Validation
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const note = createNote(body);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating organization note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
