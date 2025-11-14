import { NextRequest, NextResponse } from 'next/server';
import { getNotes, getNotesCount } from '@/lib/db';
import type { NoteFilters, Category } from '@/types/note';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build filters from query params
    const filters: NoteFilters = {};

    // Category filter
    const category = searchParams.get('category');
    if (category) {
      filters.category = category.split(',') as Category[];
    }

    // Folder filter
    const folder = searchParams.get('folder');
    if (folder) {
      filters.folder = folder.split(',');
    }

    // Account filter
    const account = searchParams.get('account');
    if (account) {
      filters.account = account.split(',');
    }

    // Status filter
    const status = searchParams.get('status');
    if (status) {
      filters.status = status.split(',') as NoteFilters['status'];
    }

    // Search
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // Date filters
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }

    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }

    // Boolean filters
    if (searchParams.get('hasLinks') === 'true') {
      filters.hasLinks = true;
    }

    if (searchParams.get('hasImages') === 'true') {
      filters.hasImages = true;
    }

    if (searchParams.get('hasTasks') === 'true') {
      filters.hasTasks = true;
    }

    // Pagination
    const limit = searchParams.get('limit');
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get('offset');
    if (offset) {
      filters.offset = parseInt(offset, 10);
    }

    // Sorting
    const sortBy = searchParams.get('sortBy');
    if (sortBy) {
      filters.sortBy = sortBy as NoteFilters['sortBy'];
    }

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder) {
      filters.sortOrder = sortOrder as NoteFilters['sortOrder'];
    }

    // Get notes and total count
    const notes = getNotes(filters);
    const totalCount = getNotesCount(filters);

    return NextResponse.json({
      notes,
      totalCount,
      page: filters.offset ? Math.floor(filters.offset / (filters.limit || 20)) + 1 : 1,
      pageSize: filters.limit || notes.length,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}
