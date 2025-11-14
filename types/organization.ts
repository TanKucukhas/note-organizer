// Types for organization.db (organized items)

// ============================================================================
// TASKS
// ============================================================================
export interface Task {
  id: string;
  title: string;
  description: string | null;
  created_date: string;
  due_date: string | null;
  priority: TaskPriority | null;
  status: TaskStatus;
  project_id: string | null;
  idea_id: string | null;
  group_id: string | null;
  source_note_id: string | null;
  order_index: number;
  updated_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export interface TaskWithRelations extends Task {
  project?: Project;
  idea?: Idea;
  attachments?: FileAttachment[];
}

// ============================================================================
// CHORES
// ============================================================================
export interface Chore {
  id: string;
  title: string;
  description: string | null;
  created_date: string;
  is_recurring: number; // 0 or 1 (SQLite boolean)
  recurrence_pattern: string | null;
  last_completed: string | null;
  next_due: string | null;
  group_id: string | null;
  source_note_id: string | null;
  order_index: number;
  updated_at: string;
}

export interface ChoreWithAttachments extends Chore {
  attachments?: FileAttachment[];
}

// ============================================================================
// IDEAS
// ============================================================================
export interface Idea {
  id: string;
  title: string;
  intro: string | null;
  description_md: string | null;
  created_date: string;
  status: IdeaStatus;
  category: string | null;
  idea_type_id: string | null;
  group_id: string | null;
  source_note_id: string | null;
  order_index: number;
  updated_at: string;
}

export type IdeaStatus = 'active' | 'developing' | 'shelved' | 'trashed';

export interface IdeaWithDetails extends Idea {
  tags?: string[];
  attachments?: FileAttachment[];
  projects?: Project[]; // Projects this idea is attached to
  idea_type?: ProjectType;
}

// ============================================================================
// GROUPS
// ============================================================================
export interface Group {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  is_default: number;
  created_at: string;
}

export interface CreateGroupInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateGroupInput extends Partial<CreateGroupInput> {
  id: string;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================
export interface ProjectType {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  is_default: number;
  created_at: string;
}

export interface CreateProjectTypeInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectTypeInput extends Partial<CreateProjectTypeInput> {
  id: string;
}

// ============================================================================
// PROJECTS
// ============================================================================
export interface Project {
  id: string;
  title: string;
  intro: string | null;
  description_md: string | null;
  created_date: string;
  status: ProjectStatus;
  category: string | null;
  project_type_id: string | null;
  group_id: string | null;
  source_note_id: string | null;
  order_index: number;
  updated_at: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'trashed';

export interface ProjectWithDetails extends Project {
  tags?: string[];
  ideas?: Idea[];
  tasks?: Task[];
  attachments?: FileAttachment[];
  project_type?: ProjectType;
}

// ============================================================================
// NOTES
// ============================================================================
export interface Note {
  id: string;
  title: string;
  content: string | null;
  note_type: NoteType;
  category: string | null;
  source_note_id: string | null;
  order_index: number;
  created_date: string;
  updated_at: string;
}

export type NoteType = 'normal' | 'secret';

export interface NoteWithDetails extends Note {
  tags?: string[];
  links?: NoteLink[];
  attachments?: FileAttachment[];
}

export interface NoteLink {
  id: number;
  note_id: string;
  linked_item_type: ItemType;
  linked_item_id: string;
  created_at: string;
}

export interface NoteTag {
  id: number;
  note_id: string;
  tag: string;
  created_at: string;
}

// ============================================================================
// RELATIONSHIPS
// ============================================================================
export interface ProjectIdea {
  id: number;
  project_id: string;
  idea_id: string;
  created_at: string;
}

export interface ProjectTask {
  id: number;
  project_id: string;
  task_id: string;
  created_at: string;
}

// ============================================================================
// TAGS
// ============================================================================
export interface IdeaTag {
  id: number;
  idea_id: string;
  tag: string;
  created_at: string;
}

export interface ProjectTag {
  id: number;
  project_id: string;
  tag: string;
  created_at: string;
}

// ============================================================================
// FILE ATTACHMENTS
// ============================================================================
export interface FileAttachment {
  id: string;
  item_type: ItemType;
  item_id: string;
  filename: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  is_from_note: number; // 0 or 1 (SQLite boolean)
  source_note_id: string | null;
  created_at: string;
}

export type ItemType = 'task' | 'chore' | 'idea' | 'project' | 'note';

// ============================================================================
// REVIEW TRACKING
// ============================================================================
export interface NoteReview {
  id: number;
  note_id: string;
  reviewed_at: string;
  items_extracted: number;
  notes: string | null;
}

// ============================================================================
// CREATE/UPDATE INPUTS
// ============================================================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  project_id?: string;
  idea_id?: string;
  group_id?: string;
  source_note_id?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}

export interface CreateChoreInput {
  title: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  next_due?: string;
  group_id?: string;
  source_note_id?: string;
}

export interface UpdateChoreInput extends Partial<CreateChoreInput> {
  id: string;
}

export interface CreateIdeaInput {
  title: string;
  intro?: string;
  description_md?: string;
  status?: IdeaStatus;
  category?: string;
  idea_type_id?: string;
  group_id?: string;
  tags?: string[];
  source_note_id?: string;
}

export interface UpdateIdeaInput extends Partial<CreateIdeaInput> {
  id: string;
}

export interface CreateProjectInput {
  title: string;
  intro?: string;
  description_md?: string;
  status?: ProjectStatus;
  category?: string;
  project_type_id?: string;
  group_id?: string;
  tags?: string[];
  idea_ids?: string[];
  task_ids?: string[];
  source_note_id?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  note_type?: NoteType;
  category?: string;
  tags?: string[];
  linked_items?: Array<{
    item_type: ItemType;
    item_id: string;
  }>;
  source_note_id?: string;
}

export interface UpdateNoteInput extends Partial<CreateNoteInput> {
  id: string;
}

// ============================================================================
// FILTER/QUERY OPTIONS
// ============================================================================

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  project_id?: string;
  idea_id?: string;
  has_due_date?: boolean;
  overdue?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'due_date' | 'created_date' | 'priority' | 'order_index';
  sortOrder?: 'asc' | 'desc';
}

export interface ChoreFilters {
  is_recurring?: boolean;
  overdue?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'next_due' | 'created_date' | 'last_completed';
  sortOrder?: 'asc' | 'desc';
}

export interface IdeaFilters {
  status?: IdeaStatus | IdeaStatus[];
  category?: string | string[];
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'created_date' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectFilters {
  status?: ProjectStatus | ProjectStatus[];
  category?: string | string[];
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'created_date' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface NoteFilters {
  note_type?: NoteType | NoteType[];
  category?: string | string[];
  tags?: string[];
  linked_to_item?: {
    item_type: ItemType;
    item_id: string;
  };
  limit?: number;
  offset?: number;
  sortBy?: 'created_date' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface OrganizationStats {
  total_tasks: number;
  total_chores: number;
  total_ideas: number;
  total_projects: number;
  total_notes: number;
  tasks_by_status: Record<TaskStatus, number>;
  ideas_by_status: Record<IdeaStatus, number>;
  projects_by_status: Record<ProjectStatus, number>;
  notes_by_type: Record<NoteType, number>;
  notes_reviewed: number;
  total_attachments: number;
}
