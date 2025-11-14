import { NextResponse } from 'next/server';
import { deleteGroup } from '@/lib/db-organization';

type RouteParams = Promise<{ id: string }>;

export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    deleteGroup(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
