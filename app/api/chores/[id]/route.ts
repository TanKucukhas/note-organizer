import { NextResponse } from 'next/server';
import { deleteChore } from '@/lib/db-organization';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Chore ID is required' },
        { status: 400 }
      );
    }

    deleteChore(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chore:', error);
    return NextResponse.json(
      { error: 'Failed to delete chore' },
      { status: 500 }
    );
  }
}
