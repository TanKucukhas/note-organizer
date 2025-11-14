import { NextResponse } from 'next/server';
import { deleteProjectType } from '@/lib/db-organization';

type RouteParams = Promise<{ id: string }>;

export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    deleteProjectType(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project type:', error);
    return NextResponse.json(
      { error: 'Failed to delete project type' },
      { status: 500 }
    );
  }
}
