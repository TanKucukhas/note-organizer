import { NextResponse } from 'next/server';
import { createGroup, getAllGroups } from '@/lib/db-organization';
import type { CreateGroupInput } from '@/types/organization';

export async function GET() {
  try {
    const groups = getAllGroups();
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateGroupInput = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const group = createGroup(body);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
