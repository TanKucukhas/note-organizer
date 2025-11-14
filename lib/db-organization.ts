import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';
import type {
  Task,
  Chore,
  Idea,
  Project,
  ProjectType,
  Group,
  Note,
  NoteLink,
  CreateTaskInput,
  CreateChoreInput,
  CreateIdeaInput,
  CreateProjectInput,
  CreateProjectTypeInput,
  CreateGroupInput,
  CreateNoteInput,
  OrganizationStats,
  ItemType,
} from '@/types/organization';

const DB_PATH = path.join(process.cwd(), 'organization.db');

let orgDb: Database.Database | null = null;

export function getOrganizationDatabase(): Database.Database {
  if (!orgDb) {
    orgDb = new Database(DB_PATH, {
      readonly: false,
      fileMustExist: true,
    });
    orgDb.pragma('foreign_keys = ON');
    orgDb.pragma('journal_mode = WAL');
  }
  return orgDb;
}

export function closeOrganizationDatabase(): void {
  if (orgDb) {
    orgDb.close();
    orgDb = null;
  }
}

// ============================================================================
// TASKS
// ============================================================================

export function createTask(input: CreateTaskInput): Task {
  const db = getOrganizationDatabase();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO tasks (
      id, title, description, due_date, priority, status,
      project_id, idea_id, group_id, source_note_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.title,
    input.description || null,
    input.due_date || null,
    input.priority || null,
    input.status || 'todo',
    input.project_id || null,
    input.idea_id || null,
    input.group_id || null,
    input.source_note_id || null
  );

  return getTaskById(id)!;
}

export function getTaskById(id: string): Task | null {
  const db = getOrganizationDatabase();
  return db.prepare<[string], Task>('SELECT * FROM tasks WHERE id = ?').get(id) || null;
}

export function getAllTasks(): Task[] {
  const db = getOrganizationDatabase();
  return db.prepare<[], Task>('SELECT * FROM tasks ORDER BY created_date DESC').all();
}

// ============================================================================
// CHORES
// ============================================================================

export function createChore(input: CreateChoreInput): Chore {
  const db = getOrganizationDatabase();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO chores (
      id, title, description, is_recurring, recurrence_pattern,
      next_due, group_id, source_note_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.title,
    input.description || null,
    input.is_recurring ? 1 : 0,
    input.recurrence_pattern || null,
    input.next_due || null,
    input.group_id || null,
    input.source_note_id || null
  );

  return getChoreById(id)!;
}

export function getChoreById(id: string): Chore | null {
  const db = getOrganizationDatabase();
  return db.prepare<[string], Chore>('SELECT * FROM chores WHERE id = ?').get(id) || null;
}

export function getAllChores(): Chore[] {
  const db = getOrganizationDatabase();
  return db.prepare<[], Chore>('SELECT * FROM chores ORDER BY created_date DESC').all();
}

// ============================================================================
// IDEAS
// ============================================================================

export function createIdea(input: CreateIdeaInput): Idea {
  const db = getOrganizationDatabase();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO ideas (
      id, title, intro, description_md, status, category, idea_type_id, group_id, source_note_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.title,
    input.intro || null,
    input.description_md || null,
    input.status || 'active',
    input.category || null,
    input.idea_type_id || null,
    input.group_id || null,
    input.source_note_id || null
  );

  // Add tags if provided
  if (input.tags && input.tags.length > 0) {
    const tagStmt = db.prepare('INSERT INTO idea_tags (idea_id, tag) VALUES (?, ?)');
    for (const tag of input.tags) {
      tagStmt.run(id, tag);
    }
  }

  return getIdeaById(id)!;
}

export function getIdeaById(id: string): Idea | null {
  const db = getOrganizationDatabase();
  return db.prepare<[string], Idea>('SELECT * FROM ideas WHERE id = ?').get(id) || null;
}

export function getAllIdeas(): Idea[] {
  const db = getOrganizationDatabase();
  const ideas = db.prepare<[], Idea>('SELECT * FROM ideas ORDER BY created_date DESC').all();

  // Fetch idea type for each idea
  return ideas.map(idea => {
    if (idea.idea_type_id) {
      const ideaType = getProjectTypeById(idea.idea_type_id);
      return { ...idea, idea_type: ideaType || undefined } as any;
    }
    return idea;
  });
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export function createProjectType(input: CreateProjectTypeInput): ProjectType {
  const db = getOrganizationDatabase();
  const id = input.name.toLowerCase().replace(/\s+/g, '-');

  db.prepare(`
    INSERT INTO project_types (
      id, name, color, icon
    ) VALUES (?, ?, ?, ?)
  `).run(
    id,
    input.name,
    input.color || null,
    input.icon || null
  );

  return getProjectTypeById(id)!;
}

export function getProjectTypeById(id: string): ProjectType | null {
  const db = getOrganizationDatabase();
  return db.prepare<[string], ProjectType>('SELECT * FROM project_types WHERE id = ?').get(id) || null;
}

export function getAllProjectTypes(): ProjectType[] {
  const db = getOrganizationDatabase();
  return db.prepare<[], ProjectType>('SELECT * FROM project_types ORDER BY is_default DESC, name ASC').all();
}

export function deleteProjectType(id: string): void {
  const db = getOrganizationDatabase();
  // Only allow deletion of non-default types
  const projectType = getProjectTypeById(id);
  if (projectType && !projectType.is_default) {
    db.prepare('DELETE FROM project_types WHERE id = ?').run(id);
  }
}

// ============================================================================
// GROUPS
// ============================================================================

export function createGroup(input: CreateGroupInput): Group {
  const db = getOrganizationDatabase();
  const id = input.name.toLowerCase().replace(/\s+/g, '-');

  db.prepare(`
    INSERT INTO groups (
      id, name, color, icon
    ) VALUES (?, ?, ?, ?)
  `).run(
    id,
    input.name,
    input.color || null,
    input.icon || null
  );

  return getGroupById(id)!;
}

export function getGroupById(id: string): Group | null {
  const db = getOrganizationDatabase();
  return db.prepare<[string], Group>('SELECT * FROM groups WHERE id = ?').get(id) || null;
}

export function getAllGroups(): Group[] {
  const db = getOrganizationDatabase();
  return db.prepare<[], Group>('SELECT * FROM groups ORDER BY is_default DESC, name ASC').all();
}

export function deleteGroup(id: string): void {
  const db = getOrganizationDatabase();
  // Only allow deletion of non-default groups
  const group = getGroupById(id);
  if (group && !group.is_default) {
    db.prepare('DELETE FROM groups WHERE id = ?').run(id);
  }
}

// ============================================================================
// PROJECTS
// ============================================================================

export function createProject(input: CreateProjectInput): Project {
  const db = getOrganizationDatabase();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO projects (
      id, title, intro, description_md, status, category, project_type_id, group_id, source_note_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.title,
    input.intro || null,
    input.description_md || null,
    input.status || 'planning',
    input.category || null,
    input.project_type_id || null,
    input.group_id || null,
    input.source_note_id || null
  );

  // Add tags if provided
  if (input.tags && input.tags.length > 0) {
    const tagStmt = db.prepare('INSERT INTO project_tags (project_id, tag) VALUES (?, ?)');
    for (const tag of input.tags) {
      tagStmt.run(id, tag);
    }
  }

  return getProjectById(id)!;
}

export function getProjectById(id: string): Project | null {
  const db = getOrganizationDatabase();
  return db.prepare<[string], Project>('SELECT * FROM projects WHERE id = ?').get(id) || null;
}

export function getAllProjects(): Project[] {
  const db = getOrganizationDatabase();
  const projects = db.prepare<[], Project>('SELECT * FROM projects ORDER BY created_date DESC').all();

  // Fetch project type for each project
  return projects.map(project => {
    if (project.project_type_id) {
      const projectType = getProjectTypeById(project.project_type_id);
      return { ...project, project_type: projectType || undefined } as any;
    }
    return project;
  });
}

// ============================================================================
// NOTES
// ============================================================================

export function createNote(input: CreateNoteInput): Note {
  const db = getOrganizationDatabase();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO notes (
      id, title, content, note_type, category, source_note_id
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.title,
    input.content || null,
    input.note_type || 'normal',
    input.category || null,
    input.source_note_id || null
  );

  // Add tags if provided
  if (input.tags && input.tags.length > 0) {
    const tagStmt = db.prepare('INSERT INTO note_tags (note_id, tag) VALUES (?, ?)');
    for (const tag of input.tags) {
      tagStmt.run(id, tag);
    }
  }

  // Add links if provided
  if (input.linked_items && input.linked_items.length > 0) {
    const linkStmt = db.prepare(
      'INSERT INTO note_links (note_id, linked_item_type, linked_item_id) VALUES (?, ?, ?)'
    );
    for (const link of input.linked_items) {
      linkStmt.run(id, link.item_type, link.item_id);
    }
  }

  return getNoteById(id)!;
}

export function getNoteById(id: string): Note | null {
  const db = getOrganizationDatabase();
  return db.prepare<[string], Note>('SELECT * FROM notes WHERE id = ?').get(id) || null;
}

export function getAllNotes(): Note[] {
  const db = getOrganizationDatabase();
  return db.prepare<[], Note>('SELECT * FROM notes ORDER BY created_date DESC').all();
}

export function linkNoteToItem(noteId: string, itemType: ItemType, itemId: string): void {
  const db = getOrganizationDatabase();
  db.prepare(`
    INSERT OR IGNORE INTO note_links (note_id, linked_item_type, linked_item_id)
    VALUES (?, ?, ?)
  `).run(noteId, itemType, itemId);
}

export function unlinkNoteFromItem(noteId: string, itemType: ItemType, itemId: string): void {
  const db = getOrganizationDatabase();
  db.prepare(`
    DELETE FROM note_links
    WHERE note_id = ? AND linked_item_type = ? AND linked_item_id = ?
  `).run(noteId, itemType, itemId);
}

export function getNotesForItem(itemType: ItemType, itemId: string): Note[] {
  const db = getOrganizationDatabase();
  return db.prepare<[ItemType, string], Note>(`
    SELECT n.* FROM notes n
    INNER JOIN note_links nl ON n.id = nl.note_id
    WHERE nl.linked_item_type = ? AND nl.linked_item_id = ?
    ORDER BY n.created_date DESC
  `).all(itemType, itemId);
}

export function getLinksForNote(noteId: string): NoteLink[] {
  const db = getOrganizationDatabase();
  return db.prepare<[string], NoteLink>(`
    SELECT * FROM note_links WHERE note_id = ?
  `).all(noteId);
}

// ============================================================================
// STATISTICS
// ============================================================================

export function getOrganizationStats(): OrganizationStats {
  const db = getOrganizationDatabase();

  const totalTasks = db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM tasks').get()?.count || 0;
  const totalChores = db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM chores').get()?.count || 0;
  const totalIdeas = db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM ideas').get()?.count || 0;
  const totalProjects = db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM projects').get()?.count || 0;
  const totalNotes = db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM notes').get()?.count || 0;

  const tasksByStatus = db.prepare<[], { status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
  ).all();

  const ideasByStatus = db.prepare<[], { status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM ideas GROUP BY status'
  ).all();

  const projectsByStatus = db.prepare<[], { status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM projects GROUP BY status'
  ).all();

  const notesByType = db.prepare<[], { note_type: string; count: number }>(
    'SELECT note_type, COUNT(*) as count FROM notes GROUP BY note_type'
  ).all();

  const notesReviewed = db.prepare<[], { count: number }>(
    'SELECT COUNT(*) as count FROM note_reviews'
  ).get()?.count || 0;

  const totalAttachments = db.prepare<[], { count: number }>(
    'SELECT COUNT(*) as count FROM file_attachments'
  ).get()?.count || 0;

  return {
    total_tasks: totalTasks,
    total_chores: totalChores,
    total_ideas: totalIdeas,
    total_projects: totalProjects,
    total_notes: totalNotes,
    tasks_by_status: Object.fromEntries(tasksByStatus.map(r => [r.status, r.count])) as any,
    ideas_by_status: Object.fromEntries(ideasByStatus.map(r => [r.status, r.count])) as any,
    projects_by_status: Object.fromEntries(projectsByStatus.map(r => [r.status, r.count])) as any,
    notes_by_type: Object.fromEntries(notesByType.map(r => [r.note_type, r.count])) as any,
    notes_reviewed: notesReviewed,
    total_attachments: totalAttachments,
  };
}
