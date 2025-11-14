import { NextResponse } from 'next/server';
import { getChoreById, updateChore, deleteChore } from '@/lib/db-organization';
import type { UpdateChoreInput } from '@/types/organization';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chore = getChoreById(id);

    if (!chore) {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(chore);
  } catch (error) {
    console.error('Error fetching chore:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chore' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if chore exists
    const existingChore = getChoreById(id);
    if (!existingChore) {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      );
    }

    const updateInput: UpdateChoreInput = { id, ...body };
    const updatedChore = updateChore(updateInput);

    return NextResponse.json(updatedChore);
  } catch (error) {
    console.error('Error updating chore:', error);
    return NextResponse.json(
      { error: 'Failed to update chore' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if chore exists
    const existingChore = getChoreById(id);
    if (!existingChore) {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      );
    }

    deleteChore(id);

    return NextResponse.json({ success: true, message: 'Chore deleted' });
  } catch (error) {
    console.error('Error deleting chore:', error);
    return NextResponse.json(
      { error: 'Failed to delete chore' },
      { status: 500 }
    );
  }
}
