import Database from 'better-sqlite3';
import path from 'path';
import type {
  Note,
  ExtractedLink,
  ExtractedImage,
  ExtractedTask,
  ExtractedIdea,
  ExtractedProject,
  NoteCategory,
  Analysis,
  Account,
  Folder,
  NoteWithDetails,
  NoteFilters,
  DatabaseStats,
  TimelineDataPoint,
} from '@/types/note';

// Database path (notes.db is in the project root)
const DB_PATH = path.join(process.cwd(), 'notes.db');

// Create a singleton database connection
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, {
      readonly: false, // We'll be updating categorization
      fileMustExist: true,
    });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Performance optimizations
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
  }

  return db;
}

// Close database connection
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================================================
// NOTE QUERIES
// ============================================================================

export function getNoteById(noteId: string): NoteWithDetails | null {
  const db = getDatabase();

  const note = db
    .prepare<[string], Note>('SELECT * FROM notes WHERE note_id = ?')
    .get(noteId);

  if (!note) return null;

  // Fetch related data
  const links = db
    .prepare<[string], ExtractedLink>(
      'SELECT * FROM extracted_links WHERE note_id = ?'
    )
    .all(noteId);

  const images = db
    .prepare<[string], ExtractedImage>(
      'SELECT * FROM extracted_images WHERE note_id = ?'
    )
    .all(noteId);

  const tasks = db
    .prepare<[string], ExtractedTask>(
      'SELECT * FROM extracted_tasks WHERE note_id = ?'
    )
    .all(noteId);

  const ideas = db
    .prepare<[string], ExtractedIdea>(
      'SELECT * FROM extracted_ideas WHERE note_id = ?'
    )
    .all(noteId);

  const projects = db
    .prepare<[string], ExtractedProject>(
      'SELECT * FROM extracted_projects WHERE note_id = ?'
    )
    .all(noteId);

  const categories = db
    .prepare<[string], NoteCategory>(
      'SELECT * FROM note_categories WHERE note_id = ?'
    )
    .all(noteId);

  const analysis = db
    .prepare<[string], Analysis>(
      'SELECT * FROM analysis WHERE note_id = ?'
    )
    .get(noteId);

  return {
    ...note,
    links,
    images,
    tasks,
    ideas,
    projects,
    categories,
    analysis: analysis || null,
  };
}

export function getNotes(filters: NoteFilters = {}): Note[] {
  const db = getDatabase();

  let query = 'SELECT * FROM notes WHERE 1=1';
  const params: any[] = [];

  // Apply filters
  if (filters.category) {
    if (Array.isArray(filters.category)) {
      const placeholders = filters.category.map(() => '?').join(',');
      query += ` AND primary_category IN (${placeholders})`;
      params.push(...filters.category);
    } else {
      query += ' AND primary_category = ?';
      params.push(filters.category);
    }
  }

  if (filters.folder) {
    if (Array.isArray(filters.folder)) {
      const placeholders = filters.folder.map(() => '?').join(',');
      query += ` AND folder IN (${placeholders})`;
      params.push(...filters.folder);
    } else {
      query += ' AND folder = ?';
      params.push(filters.folder);
    }
  }

  if (filters.account) {
    if (Array.isArray(filters.account)) {
      const placeholders = filters.account.map(() => '?').join(',');
      query += ` AND account IN (${placeholders})`;
      params.push(...filters.account);
    } else {
      query += ' AND account = ?';
      params.push(filters.account);
    }
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      const placeholders = filters.status.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...filters.status);
    } else {
      query += ' AND status = ?';
      params.push(filters.status);
    }
  }

  if (filters.search) {
    query += ' AND (title LIKE ? OR plain_text LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.dateFrom) {
    query += ' AND created_datetime >= ?';
    params.push(filters.dateFrom.toISOString());
  }

  if (filters.dateTo) {
    query += ' AND created_datetime <= ?';
    params.push(filters.dateTo.toISOString());
  }

  // Subqueries for has* filters
  if (filters.hasLinks) {
    query += ' AND note_id IN (SELECT DISTINCT note_id FROM extracted_links)';
  }

  if (filters.hasImages) {
    query += ' AND note_id IN (SELECT DISTINCT note_id FROM extracted_images)';
  }

  if (filters.hasTasks) {
    query += ' AND note_id IN (SELECT DISTINCT note_id FROM extracted_tasks)';
  }

  // Sorting
  const sortBy = filters.sortBy || 'modified_datetime';
  const sortOrder = filters.sortOrder || 'desc';
  query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

  // Pagination
  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }
  }

  return db.prepare<any[], Note>(query).all(...params);
}

export function getNotesCount(filters: NoteFilters = {}): number {
  const db = getDatabase();

  let query = 'SELECT COUNT(*) as count FROM notes WHERE 1=1';
  const params: any[] = [];

  // Apply same filters as getNotes (without pagination and sorting)
  if (filters.category) {
    if (Array.isArray(filters.category)) {
      const placeholders = filters.category.map(() => '?').join(',');
      query += ` AND primary_category IN (${placeholders})`;
      params.push(...filters.category);
    } else {
      query += ' AND primary_category = ?';
      params.push(filters.category);
    }
  }

  if (filters.folder) {
    if (Array.isArray(filters.folder)) {
      const placeholders = filters.folder.map(() => '?').join(',');
      query += ` AND folder IN (${placeholders})`;
      params.push(...filters.folder);
    } else {
      query += ' AND folder = ?';
      params.push(filters.folder);
    }
  }

  if (filters.account) {
    if (Array.isArray(filters.account)) {
      const placeholders = filters.account.map(() => '?').join(',');
      query += ` AND account IN (${placeholders})`;
      params.push(...filters.account);
    } else {
      query += ' AND account = ?';
      params.push(filters.account);
    }
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      const placeholders = filters.status.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...filters.status);
    } else {
      query += ' AND status = ?';
      params.push(filters.status);
    }
  }

  if (filters.search) {
    query += ' AND (title LIKE ? OR plain_text LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.dateFrom) {
    query += ' AND created_datetime >= ?';
    params.push(filters.dateFrom.toISOString());
  }

  if (filters.dateTo) {
    query += ' AND created_datetime <= ?';
    params.push(filters.dateTo.toISOString());
  }

  if (filters.hasLinks) {
    query += ' AND note_id IN (SELECT DISTINCT note_id FROM extracted_links)';
  }

  if (filters.hasImages) {
    query += ' AND note_id IN (SELECT DISTINCT note_id FROM extracted_images)';
  }

  if (filters.hasTasks) {
    query += ' AND note_id IN (SELECT DISTINCT note_id FROM extracted_tasks)';
  }

  const result = db.prepare<any[], { count: number }>(query).get(...params);
  return result?.count || 0;
}

// ============================================================================
// UPDATE QUERIES
// ============================================================================

export function updateNoteCategory(
  noteId: string,
  category: Note['primary_category']
): void {
  const db = getDatabase();

  db.prepare<[Note['primary_category'], string]>(
    'UPDATE notes SET primary_category = ?, updated_at = CURRENT_TIMESTAMP WHERE note_id = ?'
  ).run(category, noteId);
}

export function updateNoteStatus(
  noteId: string,
  status: Note['status']
): void {
  const db = getDatabase();

  db.prepare<[Note['status'], string]>(
    'UPDATE notes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE note_id = ?'
  ).run(status, noteId);
}

export function markNoteProcessed(noteId: string): void {
  const db = getDatabase();

  db.prepare<[string]>(
    'UPDATE notes SET processed = 1, updated_at = CURRENT_TIMESTAMP WHERE note_id = ?'
  ).run(noteId);
}

// ============================================================================
// STATISTICS QUERIES
// ============================================================================

export function getDatabaseStats(): DatabaseStats {
  const db = getDatabase();

  const totalNotes = db
    .prepare<[], { count: number }>('SELECT COUNT(*) as count FROM notes')
    .get()?.count || 0;

  const totalLinks = db
    .prepare<[], { count: number }>(
      'SELECT COUNT(*) as count FROM extracted_links'
    )
    .get()?.count || 0;

  const totalImages = db
    .prepare<[], { count: number }>(
      'SELECT COUNT(*) as count FROM extracted_images'
    )
    .get()?.count || 0;

  const totalTasks = db
    .prepare<[], { count: number }>(
      'SELECT COUNT(*) as count FROM extracted_tasks'
    )
    .get()?.count || 0;

  const totalIdeas = db
    .prepare<[], { count: number }>(
      'SELECT COUNT(*) as count FROM extracted_ideas'
    )
    .get()?.count || 0;

  const totalProjects = db
    .prepare<[], { count: number }>(
      'SELECT COUNT(*) as count FROM extracted_projects'
    )
    .get()?.count || 0;

  const totalCategories = db
    .prepare<[], { count: number }>(
      'SELECT COUNT(*) as count FROM note_categories'
    )
    .get()?.count || 0;

  const dateRanges = db
    .prepare<
      [],
      {
        earliest_created: string | null;
        latest_created: string | null;
        earliest_modified: string | null;
        latest_modified: string | null;
      }
    >(
      `SELECT
        MIN(created_datetime) as earliest_created,
        MAX(created_datetime) as latest_created,
        MIN(modified_datetime) as earliest_modified,
        MAX(modified_datetime) as latest_modified
      FROM notes
      WHERE created_datetime IS NOT NULL`
    )
    .get() || {
    earliest_created: null,
    latest_created: null,
    earliest_modified: null,
    latest_modified: null,
  };

  const accountsData = db
    .prepare<[], { account_name: string; note_count: number }>(
      'SELECT account_name, note_count FROM accounts ORDER BY note_count DESC'
    )
    .all();

  const foldersData = db
    .prepare<[], { folder_name: string; note_count: number }>(
      'SELECT folder_name, note_count FROM folders ORDER BY note_count DESC LIMIT 20'
    )
    .all();

  const categoriesData = db
    .prepare<[], { category: string; count: number }>(
      `SELECT category, COUNT(*) as count
       FROM note_categories
       GROUP BY category
       ORDER BY count DESC
       LIMIT 20`
    )
    .all();

  const primaryCategoriesData = db
    .prepare<[], { primary_category: string; count: number }>(
      `SELECT primary_category, COUNT(*) as count
       FROM notes
       WHERE primary_category IS NOT NULL
       GROUP BY primary_category
       ORDER BY count DESC`
    )
    .all();

  return {
    total_notes: totalNotes,
    total_links: totalLinks,
    total_images: totalImages,
    total_tasks: totalTasks,
    total_ideas: totalIdeas,
    total_projects: totalProjects,
    total_categories: totalCategories,
    date_ranges: dateRanges,
    accounts: Object.fromEntries(
      accountsData.map((a) => [a.account_name, a.note_count])
    ),
    top_folders: Object.fromEntries(
      foldersData.map((f) => [f.folder_name, f.note_count])
    ),
    top_categories: Object.fromEntries(
      categoriesData.map((c) => [c.category, c.count])
    ),
    primary_categories: Object.fromEntries(
      primaryCategoriesData.map((p) => [p.primary_category, p.count])
    ),
  };
}

export function getAccounts(): Account[] {
  const db = getDatabase();
  return db
    .prepare<[], Account>('SELECT * FROM accounts ORDER BY note_count DESC')
    .all();
}

export function getFolders(): Folder[] {
  const db = getDatabase();
  return db
    .prepare<[], Folder>('SELECT * FROM folders ORDER BY note_count DESC')
    .all();
}

export function getTimelineData(
  groupBy: 'day' | 'month' | 'year' = 'month'
): TimelineDataPoint[] {
  const db = getDatabase();

  const dateFormat =
    groupBy === 'day'
      ? '%Y-%m-%d'
      : groupBy === 'month'
      ? '%Y-%m'
      : '%Y';

  const data = db
    .prepare<[], { date: string; count: number }>(
      `SELECT strftime('${dateFormat}', created_datetime) as date, COUNT(*) as count
       FROM notes
       WHERE created_datetime IS NOT NULL
       GROUP BY date
       ORDER BY date DESC`
    )
    .all();

  return data;
}
