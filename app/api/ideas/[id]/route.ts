import { NextResponse } from 'next/server';
import { getIdeaById, updateIdea, deleteIdea } from '@/lib/db-organization';
import type { UpdateIdeaInput } from '@/types/organization';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idea = getIdeaById(id);

    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(idea);
  } catch (error) {
    console.error('Error fetching idea:', error);
    return NextResponse.json(
      { error: 'Failed to fetch idea' },
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

    // Check if idea exists
    const existingIdea = getIdeaById(id);
    if (!existingIdea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    const updateInput: UpdateIdeaInput = { id, ...body };
    const updatedIdea = updateIdea(updateInput);

    return NextResponse.json(updatedIdea);
  } catch (error) {
    console.error('Error updating idea:', error);
    return NextResponse.json(
      { error: 'Failed to update idea' },
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

    // Check if idea exists
    const existingIdea = getIdeaById(id);
    if (!existingIdea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    deleteIdea(id);

    return NextResponse.json({ success: true, message: 'Idea deleted' });
  } catch (error) {
    console.error('Error deleting idea:', error);
    return NextResponse.json(
      { error: 'Failed to delete idea' },
      { status: 500 }
    );
  }
}
