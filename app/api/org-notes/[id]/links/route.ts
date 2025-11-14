import { NextResponse } from 'next/server';
import { linkNoteToItem, unlinkNoteFromItem } from '@/lib/db-organization';
import type { ItemType } from '@/types/organization';

type RouteParams = Promise<{ id: string }>;

export async function POST(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validation
    if (!body.item_type || !body.item_id) {
      return NextResponse.json(
        { error: 'item_type and item_id are required' },
        { status: 400 }
      );
    }

    const validItemTypes: ItemType[] = ['task', 'chore', 'idea', 'project'];
    if (!validItemTypes.includes(body.item_type)) {
      return NextResponse.json(
        { error: 'Invalid item_type. Must be one of: task, chore, idea, project' },
        { status: 400 }
      );
    }

    linkNoteToItem(id, body.item_type as ItemType, body.item_id);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error linking note to item:', error);
    return NextResponse.json(
      { error: 'Failed to link note to item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validation
    if (!body.item_type || !body.item_id) {
      return NextResponse.json(
        { error: 'item_type and item_id are required' },
        { status: 400 }
      );
    }

    unlinkNoteFromItem(id, body.item_type as ItemType, body.item_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking note from item:', error);
    return NextResponse.json(
      { error: 'Failed to unlink note from item' },
      { status: 500 }
    );
  }
}
