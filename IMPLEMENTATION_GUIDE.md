# Implementation Guide - Code Examples

This document provides TypeScript/SQL code examples for implementing the manual note organization system.

---

## 1. TYPES DEFINITION (types/organization.ts)

```typescript
// Task type
export interface Task {
  task_id: string;
  title: string;
  description?: string;
  date_created: string;
  due_date?: string;
  priority: 0 | 1 | 2 | 3; // 0=none, 1=low, 2=medium, 3=high
  status: 'active' | 'completed' | 'archived';
  project_id?: string;
  idea_id?: string;
  order_index: number;
  updated_at: string;
  created_at: string;
}

// Chore type
export interface Chore {
  chore_id: string;
  title: string;
  description?: string;
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date_last_completed?: string;
  date_created: string;
  status: 'active' | 'completed' | 'archived';
  order_index: number;
  updated_at: string;
  created_at: string;
}

// Idea type
export interface Idea {
  idea_id: string;
  title: string;
  intro?: string;
  description?: string; // markdown
  category?: string;
  status: 'active' | 'developing' | 'shelved' | 'trashed';
  date_created: string;
  order_index: number;
  tags?: string[];
  updated_at: string;
  created_at: string;
}

// Project type
export interface Project {
  project_id: string;
  title: string;
  intro?: string;
  description?: string; // markdown
  category?: string;
  status: 'active' | 'in-progress' | 'completed' | 'shelved' | 'trashed';
  date_created: string;
  date_completed?: string;
  order_index: number;
  tags?: string[];
  ideas?: Idea[];
  tasks?: Task[];
  updated_at: string;
  created_at: string;
}

// File attachment type
export interface FileAttachment {
  attachment_id: string;
  task_id?: string;
  chore_id?: string;
  idea_id?: string;
  project_id?: string;
  file_type: 'new' | 'existing';
  filename: string;
  relative_path: string;
  file_size?: number;
  mime_type?: string;
  attachment_source: 'uploaded' | 'note_id';
  source_note_id?: string;
  created_at: string;
}

// Create request types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  due_date?: string;
  priority?: 0 | 1 | 2 | 3;
  project_id?: string;
  idea_id?: string;
}

export interface CreateIdeaRequest {
  title: string;
  intro?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface CreateProjectRequest {
  title: string;
  intro?: string;
  description?: string;
  category?: string;
  tags?: string[];
  idea_ids?: string[]; // IDs of ideas to add
  task_ids?: string[]; // IDs of tasks to add
}

// Filter types
export interface TaskFilters {
  status?: 'active' | 'completed' | 'archived';
  priority?: 0 | 1 | 2 | 3;
  project_id?: string;
  idea_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  sortBy?: 'due_date' | 'priority' | 'created_at' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface IdeaFilters {
  status?: 'active' | 'developing' | 'shelved' | 'trashed';
  category?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'created_at' | 'title' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProjectFilters {
  status?: 'active' | 'in-progress' | 'completed' | 'shelved' | 'trashed';
  category?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'created_at' | 'title' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

---

## 2. DATABASE UTILITIES (lib/organization-db.ts)

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import type {
  Task,
  Chore,
  Idea,
  Project,
  FileAttachment,
  CreateTaskRequest,
  CreateIdeaRequest,
  CreateProjectRequest,
  TaskFilters,
  IdeaFilters,
  ProjectFilters,
} from '@/types/organization';
import { randomUUID } from 'crypto';

const DB_PATH = path.join(process.cwd(), 'organization.db');

let db: Database.Database | null = null;

export function getOrganizationDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, {
      readonly: false,
      fileMustExist: false, // Will create if doesn't exist
    });

    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    // Initialize schema if new database
    initializeSchema();
  }

  return db;
}

export function closeOrganizationDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function initializeSchema(): void {
  const database = db!;

  // Check if tables exist
  const tableCount = database
    .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'")
    .get() as { count: number };

  if (tableCount.count > 0) {
    return; // Schema already initialized
  }

  // Create tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      task_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATE,
      priority INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      project_id TEXT REFERENCES projects(project_id) ON DELETE SET NULL,
      idea_id TEXT REFERENCES ideas(idea_id) ON DELETE SET NULL,
      order_index INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chores (
      chore_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      is_recurring BOOLEAN DEFAULT 0,
      recurrence_pattern TEXT,
      date_last_completed DATE,
      date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      order_index INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ideas (
      idea_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      intro TEXT,
      description TEXT,
      category TEXT,
      status TEXT DEFAULT 'active',
      date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
      order_index INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      project_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      intro TEXT,
      description TEXT,
      category TEXT,
      status TEXT DEFAULT 'active',
      date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_completed DATE,
      order_index INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_ideas (
      project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
      idea_id TEXT NOT NULL REFERENCES ideas(idea_id) ON DELETE CASCADE,
      order_index INTEGER DEFAULT 0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, idea_id)
    );

    CREATE TABLE IF NOT EXISTS project_tasks (
      project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
      task_id TEXT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
      order_index INTEGER DEFAULT 0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, task_id)
    );

    CREATE TABLE IF NOT EXISTS idea_tags (
      idea_id TEXT NOT NULL REFERENCES ideas(idea_id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(idea_id, tag)
    );

    CREATE TABLE IF NOT EXISTS project_tags (
      project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, tag)
    );

    CREATE TABLE IF NOT EXISTS file_attachments (
      attachment_id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(task_id) ON DELETE SET NULL,
      chore_id TEXT REFERENCES chores(chore_id) ON DELETE SET NULL,
      idea_id TEXT REFERENCES ideas(idea_id) ON DELETE SET NULL,
      project_id TEXT REFERENCES projects(project_id) ON DELETE SET NULL,
      file_type TEXT,
      filename TEXT NOT NULL,
      relative_path TEXT,
      file_size INTEGER,
      mime_type TEXT,
      attachment_source TEXT,
      source_note_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS item_sources (
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      source_note_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (item_id, item_type)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_idea_id ON tasks(idea_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_date_created ON tasks(date_created DESC);

    CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status);
    CREATE INDEX IF NOT EXISTS idx_chores_date_created ON chores(date_created DESC);

    CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
    CREATE INDEX IF NOT EXISTS idx_ideas_date_created ON ideas(date_created DESC);
    CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_date_created ON projects(date_created DESC);
    CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);

    CREATE INDEX IF NOT EXISTS idx_file_attachments_task_id ON file_attachments(task_id);
    CREATE INDEX IF NOT EXISTS idx_file_attachments_idea_id ON file_attachments(idea_id);
    CREATE INDEX IF NOT EXISTS idx_file_attachments_project_id ON file_attachments(project_id);
    CREATE INDEX IF NOT EXISTS idx_file_attachments_source_note ON file_attachments(source_note_id);

    CREATE INDEX IF NOT EXISTS idx_item_sources_note_id ON item_sources(source_note_id);
  `);
}

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export function createTask(request: CreateTaskRequest): Task {
  const db = getOrganizationDatabase();
  const task_id = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO tasks (
      task_id, title, description, due_date, priority, project_id, idea_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    task_id,
    request.title,
    request.description || null,
    request.due_date || null,
    request.priority || 0,
    request.project_id || null,
    request.idea_id || null
  );

  return getTaskById(task_id)!;
}

export function getTaskById(task_id: string): Task | null {
  const db = getOrganizationDatabase();
  return db.prepare('SELECT * FROM tasks WHERE task_id = ?').get(task_id) as Task | null;
}

export function getTasks(filters: TaskFilters = {}): Task[] {
  const db = getOrganizationDatabase();

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: any[] = [];

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.priority !== undefined) {
    query += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (filters.project_id) {
    query += ' AND project_id = ?';
    params.push(filters.project_id);
  }

  if (filters.idea_id) {
    query += ' AND idea_id = ?';
    params.push(filters.idea_id);
  }

  if (filters.due_date_from) {
    query += ' AND due_date >= ?';
    params.push(filters.due_date_from);
  }

  if (filters.due_date_to) {
    query += ' AND due_date <= ?';
    params.push(filters.due_date_to);
  }

  if (filters.search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  const sortBy = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder || 'desc';
  query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }
  }

  return db.prepare(query).all(...params) as Task[];
}

export function updateTask(task_id: string, updates: Partial<Task>): Task {
  const db = getOrganizationDatabase();

  const task = getTaskById(task_id);
  if (!task) {
    throw new Error(`Task not found: ${task_id}`);
  }

  const stmt = db.prepare(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      due_date = ?,
      priority = ?,
      status = ?,
      project_id = ?,
      idea_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE task_id = ?
  `);

  stmt.run(
    updates.title ?? task.title,
    updates.description ?? task.description,
    updates.due_date ?? task.due_date,
    updates.priority ?? task.priority,
    updates.status ?? task.status,
    updates.project_id ?? task.project_id,
    updates.idea_id ?? task.idea_id,
    task_id
  );

  return getTaskById(task_id)!;
}

export function deleteTask(task_id: string): void {
  const db = getOrganizationDatabase();
  db.prepare('DELETE FROM tasks WHERE task_id = ?').run(task_id);
}

// Similar functions for Chores, Ideas, Projects...
// (Abbreviated for brevity - follow same pattern)

// ============================================================================
// FILE ATTACHMENT OPERATIONS
// ============================================================================

export function attachFileToTask(
  task_id: string,
  filename: string,
  relativePath: string,
  mimeType?: string,
  fileSize?: number
): FileAttachment {
  const db = getOrganizationDatabase();
  const attachment_id = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO file_attachments (
      attachment_id, task_id, filename, relative_path, mime_type, file_size, 
      file_type, attachment_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    attachment_id,
    task_id,
    filename,
    relativePath,
    mimeType || null,
    fileSize || null,
    'new',
    'uploaded'
  );

  return getAttachmentById(attachment_id)!;
}

export function linkNoteImageToTask(
  task_id: string,
  source_note_id: string,
  filename: string
): FileAttachment {
  const db = getOrganizationDatabase();
  const attachment_id = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO file_attachments (
      attachment_id, task_id, filename, relative_path, 
      file_type, attachment_source, source_note_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    attachment_id,
    task_id,
    filename,
    `/api/images/${filename}`,
    'existing',
    'note_id',
    source_note_id
  );

  return getAttachmentById(attachment_id)!;
}

export function getAttachmentById(attachment_id: string): FileAttachment | null {
  const db = getOrganizationDatabase();
  return db
    .prepare('SELECT * FROM file_attachments WHERE attachment_id = ?')
    .get(attachment_id) as FileAttachment | null;
}

export function getTaskAttachments(task_id: string): FileAttachment[] {
  const db = getOrganizationDatabase();
  return db
    .prepare('SELECT * FROM file_attachments WHERE task_id = ? ORDER BY created_at DESC')
    .all(task_id) as FileAttachment[];
}

export function deleteAttachment(attachment_id: string): void {
  const db = getOrganizationDatabase();
  db.prepare('DELETE FROM file_attachments WHERE attachment_id = ?').run(attachment_id);
}

// ============================================================================
// IDEA TAG OPERATIONS
// ============================================================================

export function addIdeaTag(idea_id: string, tag: string): void {
  const db = getOrganizationDatabase();
  try {
    db.prepare('INSERT INTO idea_tags (idea_id, tag) VALUES (?, ?)')
      .run(idea_id, tag.toLowerCase());
  } catch (e) {
    // Tag already exists - that's fine
  }
}

export function getIdeaTags(idea_id: string): string[] {
  const db = getOrganizationDatabase();
  const results = db
    .prepare('SELECT tag FROM idea_tags WHERE idea_id = ? ORDER BY tag')
    .all(idea_id) as Array<{ tag: string }>;
  return results.map((r) => r.tag);
}

export function removeIdeaTag(idea_id: string, tag: string): void {
  const db = getOrganizationDatabase();
  db.prepare('DELETE FROM idea_tags WHERE idea_id = ? AND tag = ?')
    .run(idea_id, tag.toLowerCase());
}

// Similar for project tags...
```

---

## 3. API ROUTE EXAMPLE (app/api/tasks/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, getTaskById } from '@/lib/organization-db';
import type { CreateTaskRequest, TaskFilters } from '@/types/organization';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: TaskFilters = {
      status: (searchParams.get('status') as any) || undefined,
      priority: searchParams.get('priority') ? parseInt(searchParams.get('priority')!, 10) : undefined,
      project_id: searchParams.get('project_id') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
    };

    const tasks = getTasks(filters);

    return NextResponse.json({
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateTaskRequest;

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task = createTask(body);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
```

---

## 4. UPLOAD HANDLER (app/api/uploads/[type]/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { attachFileToTask } from '@/lib/organization-db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const formData = await request.formData();

    const itemId = formData.get('itemId') as string;
    const files = formData.getAll('files') as File[];

    if (!itemId || !files.length) {
      return NextResponse.json(
        { error: 'itemId and files are required' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'uploads', type, itemId);
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = [];

    for (const file of files) {
      const ext = path.extname(file.name);
      const filename = `${randomUUID()}${ext}`;
      const filepath = path.join(uploadDir, filename);

      const buffer = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(buffer));

      uploadedFiles.push({
        filename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        path: `/uploads/${type}/${itemId}/${filename}`,
      });
    }

    return NextResponse.json(uploadedFiles, { status: 201 });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
```

---

## 5. REVIEW QUEUE COMPONENT (app/review/page.tsx)

```typescript
'use client';

import { getNotes } from '@/lib/db';
import { useState, useEffect } from 'react';
import type { NoteWithDetails } from '@/types/note';
import Link from 'next/link';

export default function ReviewQueue() {
  const [notes, setNotes] = useState<NoteWithDetails[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch notes: unreviewed, sorted newest first
    const unreviewed = getNotes({
      sortBy: 'modified_datetime',
      sortOrder: 'desc',
      limit: 100, // Load 100 at a time for efficiency
    });

    setNotes(unreviewed);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading notes...</div>;

  const currentNote = notes[currentIndex];

  if (!currentNote) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Review Queue Complete!</h1>
          <p className="text-muted-foreground mb-6">
            You have reviewed all notes.
          </p>
          <Link href="/" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const progress = Math.round(((currentIndex + 1) / notes.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Review Queue</h1>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {notes.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded h-2">
            <div
              className="bg-primary h-2 rounded transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Note Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Meta */}
            <div className="border rounded-lg bg-card p-6">
              <h2 className="text-2xl font-bold mb-4">{currentNote.title || 'Untitled'}</h2>
              <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                <span>📁 {currentNote.folder}</span>
                <span>☁️ {currentNote.account}</span>
                {currentNote.modified_datetime && (
                  <span>
                    Modified:{' '}
                    {new Date(currentNote.modified_datetime).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Images */}
              {currentNote.images && currentNote.images.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium mb-3">
                    Attached Images ({currentNote.images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {currentNote.images.slice(0, 6).map((img) => (
                      <div
                        key={img.image_id}
                        className="aspect-square rounded border overflow-hidden"
                      >
                        <img
                          src={`/api/images/${img.filename}`}
                          alt={img.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              <div className="text-sm whitespace-pre-wrap text-muted-foreground line-clamp-6">
                {currentNote.plain_text || currentNote.content}
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-3">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              className="w-full px-4 py-2 border rounded bg-card hover:bg-accent transition-colors"
            >
              Previous
            </button>

            <button
              onClick={() => setCurrentIndex(Math.min(notes.length - 1, currentIndex + 1))}
              className="w-full px-4 py-2 border rounded bg-card hover:bg-accent transition-colors"
            >
              Next
            </button>

            <hr className="my-4" />

            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Extract Task
            </button>

            <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              Extract Idea
            </button>

            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
              Create Project
            </button>

            <hr className="my-4" />

            <button className="w-full px-4 py-2 border rounded bg-card hover:bg-accent transition-colors text-sm">
              Mark Done
            </button>

            <button className="w-full px-4 py-2 border rounded bg-card hover:bg-accent transition-colors text-sm text-muted-foreground">
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. NEXT STEPS

1. **Create `types/organization.ts`** with all the type definitions
2. **Create `lib/organization-db.ts`** with database operations
3. **Initialize `organization.db`** by running the schema creation
4. **Create `/app/review`** page with review queue UI
5. **Create modal components** for creating tasks, ideas, projects
6. **Create API routes** for CRUD operations on new items
7. **Create list pages** (`/tasks`, `/ideas`, `/projects`, `/chores`)
8. **Implement file upload** handling
9. **Add navigation links** in dashboard

---

## 7. TESTING CHECKLIST

- [ ] Database initialization works (check organization.db created)
- [ ] Can create task via API
- [ ] Can fetch tasks with filters
- [ ] Can update task status
- [ ] Can attach file to task
- [ ] Can link existing note image to task
- [ ] Review queue loads notes in reverse chronological order
- [ ] Can navigate between notes in review queue
- [ ] Task modal opens from review page
- [ ] Task creation from modal works
- [ ] Files upload to correct directory structure
- [ ] Ideas and projects have full feature parity with tasks

