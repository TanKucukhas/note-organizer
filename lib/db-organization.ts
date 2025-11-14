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
  UpdateTaskInput,
  UpdateChoreInput,
  UpdateIdeaInput,
  UpdateProjectInput,
  UpdateNoteInput,
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
      project_id, idea_id, group_id, source_note_id, source_note_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    input.source_note_id || null,
    input.source_note_date || null
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

export function updateTask(input: UpdateTaskInput): Task {
  const db = getOrganizationDatabase();
  const { id, ...updates } = input;

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description || null);
  }
  if (updates.due_date !== undefined) {
    fields.push('due_date = ?');
    values.push(updates.due_date || null);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority || null);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.project_id !== undefined) {
    fields.push('project_id = ?');
    values.push(updates.project_id || null);
  }
  if (updates.idea_id !== undefined) {
    fields.push('idea_id = ?');
    values.push(updates.idea_id || null);
  }
  if (updates.group_id !== undefined) {
    fields.push('group_id = ?');
    values.push(updates.group_id || null);
  }

  if (fields.length === 0) {
    return getTaskById(id)!;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return getTaskById(id)!;
}

export function deleteTask(id: string): void {
  const db = getOrganizationDatabase();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
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
      next_due, group_id, source_note_id, source_note_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.title,
    input.description || null,
    input.is_recurring ? 1 : 0,
    input.recurrence_pattern || null,
    input.next_due || null,
    input.group_id || null,
    input.source_note_id || null,
    input.source_note_date || null
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

export function updateChore(input: UpdateChoreInput): Chore {
  const db = getOrganizationDatabase();
  const { id, ...updates } = input;

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description || null);
  }
  if (updates.is_recurring !== undefined) {
    fields.push('is_recurring = ?');
    values.push(updates.is_recurring ? 1 : 0);
  }
  if (updates.recurrence_pattern !== undefined) {
    fields.push('recurrence_pattern = ?');
    values.push(updates.recurrence_pattern || null);
  }
  if (updates.next_due !== undefined) {
    fields.push('next_due = ?');
    values.push(updates.next_due || null);
  }
  if (updates.group_id !== undefined) {
    fields.push('group_id = ?');
    values.push(updates.group_id || null);
  }

  if (fields.length === 0) {
    return getChoreById(id)!;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE chores SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return getChoreById(id)!;
}

export function deleteChore(id: string): void {
  const db = getOrganizationDatabase();
  db.prepare('DELETE FROM chores WHERE id = ?').run(id);
}

// ============================================================================
// IDEAS
// ============================================================================

export function createIdea(input: CreateIdeaInput): Idea {
  const db = getOrganizationDatabase();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO ideas (
      id, title, intro, description_md, status, category, idea_type_id, group_id, source_note_id, source_note_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.title,
    input.intro || null,
    input.description_md || null,
    input.status || 'active',
    input.category || null,
    input.idea_type_id || null,
    input.group_id || null,
    input.source_note_id || null,
    input.source_note_date || null
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

export function updateIdea(input: UpdateIdeaInput): Idea {
  const db = getOrganizationDatabase();
  const { id, tags, ...updates } = input;

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.intro !== undefined) {
    fields.push('intro = ?');
    values.push(updates.intro || null);
  }
  if (updates.description_md !== undefined) {
    fields.push('description_md = ?');
    values.push(updates.description_md || null);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category || null);
  }
  if (updates.idea_type_id !== undefined) {
    fields.push('idea_type_id = ?');
    values.push(updates.idea_type_id || null);
  }
  if (updates.group_id !== undefined) {
    fields.push('group_id = ?');
    values.push(updates.group_id || null);
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    db.prepare(`UPDATE ideas SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  // Update tags if provided
  if (tags !== undefined) {
    db.prepare('DELETE FROM idea_tags WHERE idea_id = ?').run(id);
    if (tags.length > 0) {
      const tagStmt = db.prepare('INSERT INTO idea_tags (idea_id, tag) VALUES (?, ?)');
      for (const tag of tags) {
        tagStmt.run(id, tag);
      }
    }
  }

  return getIdeaById(id)!;
}

export function deleteIdea(id: string): void {
  const db = getOrganizationDatabase();
  // Delete related tags first (CASCADE should handle this, but being explicit)
  db.prepare('DELETE FROM idea_tags WHERE idea_id = ?').run(id);
  db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
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
      id, title, intro, description_md, status, category, project_type_id, group_id, source_note_id, source_note_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.title,
    input.intro || null,
    input.description_md || null,
    input.status || 'planning',
    input.category || null,
    null, // Keep project_type_id as null for now (legacy column)
    input.group_id || null,
    input.source_note_id || null,
    input.source_note_date || null
  );

  // Add project types if provided (many-to-many)
  if (input.project_type_ids && input.project_type_ids.length > 0) {
    const typeStmt = db.prepare('INSERT INTO project_project_types (project_id, project_type_id) VALUES (?, ?)');
    for (const typeId of input.project_type_ids) {
      typeStmt.run(id, typeId);
    }
  }

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

  // Fetch project types for each project (many-to-many)
  return projects.map(project => {
    const types = db.prepare<[string], { project_type_id: string }>(`
      SELECT project_type_id FROM project_project_types WHERE project_id = ?
    `).all(project.id);

    const projectTypes = types
      .map(t => getProjectTypeById(t.project_type_id))
      .filter(Boolean) as ProjectType[];

    return { ...project, project_types: projectTypes } as any;
  });
}

export function updateProject(input: UpdateProjectInput): Project {
  const db = getOrganizationDatabase();
  const { id, tags, project_type_ids, ...updates } = input;

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.intro !== undefined) {
    fields.push('intro = ?');
    values.push(updates.intro || null);
  }
  if (updates.description_md !== undefined) {
    fields.push('description_md = ?');
    values.push(updates.description_md || null);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category || null);
  }
  if (updates.group_id !== undefined) {
    fields.push('group_id = ?');
    values.push(updates.group_id || null);
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  // Update project types if provided (many-to-many)
  if (project_type_ids !== undefined) {
    db.prepare('DELETE FROM project_project_types WHERE project_id = ?').run(id);
    if (project_type_ids.length > 0) {
      const typeStmt = db.prepare('INSERT INTO project_project_types (project_id, project_type_id) VALUES (?, ?)');
      for (const typeId of project_type_ids) {
        typeStmt.run(id, typeId);
      }
    }
  }

  // Update tags if provided
  if (tags !== undefined) {
    db.prepare('DELETE FROM project_tags WHERE project_id = ?').run(id);
    if (tags.length > 0) {
      const tagStmt = db.prepare('INSERT INTO project_tags (project_id, tag) VALUES (?, ?)');
      for (const tag of tags) {
        tagStmt.run(id, tag);
      }
    }
  }

  return getProjectById(id)!;
}

export function deleteProject(id: string): void {
  const db = getOrganizationDatabase();
  // Delete related tags first (CASCADE should handle this, but being explicit)
  db.prepare('DELETE FROM project_tags WHERE project_id = ?').run(id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// ============================================================================
// NOTES
// ============================================================================

export function createNote(input: CreateNoteInput): Note {
  const db = getOrganizationDatabase();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO notes (
      id, title, content, note_type, category, source_note_id, source_note_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.title,
    input.content || null,
    input.note_type || 'normal',
    input.category || null,
    input.source_note_id || null,
    input.source_note_date || null
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

export function updateNote(input: UpdateNoteInput): Note {
  const db = getOrganizationDatabase();
  const { id, tags, linked_items, ...updates } = input;

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content || null);
  }
  if (updates.note_type !== undefined) {
    fields.push('note_type = ?');
    values.push(updates.note_type);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category || null);
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  // Update tags if provided
  if (tags !== undefined) {
    db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(id);
    if (tags.length > 0) {
      const tagStmt = db.prepare('INSERT INTO note_tags (note_id, tag) VALUES (?, ?)');
      for (const tag of tags) {
        tagStmt.run(id, tag);
      }
    }
  }

  // Update linked items if provided
  if (linked_items !== undefined) {
    db.prepare('DELETE FROM note_links WHERE note_id = ?').run(id);
    if (linked_items.length > 0) {
      const linkStmt = db.prepare(
        'INSERT INTO note_links (note_id, linked_item_type, linked_item_id) VALUES (?, ?, ?)'
      );
      for (const link of linked_items) {
        linkStmt.run(id, link.item_type, link.item_id);
      }
    }
  }

  return getNoteById(id)!;
}

export function deleteNote(id: string): void {
  const db = getOrganizationDatabase();
  // Delete related data first (CASCADE should handle this, but being explicit)
  db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(id);
  db.prepare('DELETE FROM note_links WHERE note_id = ?').run(id);
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
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
