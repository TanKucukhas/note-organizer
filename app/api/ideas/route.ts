import { NextResponse } from 'next/server';
import { createIdea, getAllIdeas } from '@/lib/db-organization';
import type { CreateIdeaInput } from '@/types/organization';

export async function GET() {
  try {
    const ideas = getAllIdeas();
    return NextResponse.json(ideas);
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateIdeaInput = await request.json();

    // Validation
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const idea = createIdea(body);
    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}
