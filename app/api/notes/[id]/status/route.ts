import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Update the note status
    db.prepare(
      'UPDATE notes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE note_id = ?'
    ).run(status, id);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error updating note status:', error);
    return NextResponse.json(
      { error: 'Failed to update note status' },
      { status: 500 }
    );
  }
}
