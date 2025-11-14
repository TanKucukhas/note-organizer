import { NextResponse } from 'next/server';
import { createChore, getAllChores } from '@/lib/db-organization';
import type { CreateChoreInput } from '@/types/organization';

export async function GET() {
  try {
    const chores = getAllChores();
    return NextResponse.json(chores);
  } catch (error) {
    console.error('Error fetching chores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chores' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateChoreInput = await request.json();

    // Validation
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const chore = createChore(body);
    return NextResponse.json(chore, { status: 201 });
  } catch (error) {
    console.error('Error creating chore:', error);
    return NextResponse.json(
      { error: 'Failed to create chore' },
      { status: 500 }
    );
  }
}
