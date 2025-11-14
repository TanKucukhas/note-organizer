import { NextResponse } from 'next/server';
import { createProjectType, getAllProjectTypes } from '@/lib/db-organization';
import type { CreateProjectTypeInput } from '@/types/organization';

export async function GET() {
  try {
    const projectTypes = getAllProjectTypes();
    return NextResponse.json(projectTypes);
  } catch (error) {
    console.error('Error fetching project types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project types' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateProjectTypeInput = await request.json();

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const projectType = createProjectType(body);
    return NextResponse.json(projectType, { status: 201 });
  } catch (error) {
    console.error('Error creating project type:', error);
    return NextResponse.json(
      { error: 'Failed to create project type' },
      { status: 500 }
    );
  }
}
