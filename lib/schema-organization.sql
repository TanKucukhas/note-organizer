-- organization.db Schema
-- Organize edilmiş Tasks, Chores, Ideas, Projects için

-- ============================================================================
-- TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATE,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done', 'cancelled')),
  project_id TEXT,
  idea_id TEXT,
  source_note_id TEXT,
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_idea ON tasks(idea_id);
CREATE INDEX idx_tasks_source ON tasks(source_note_id);

-- ============================================================================
-- CHORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS chores (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_recurring INTEGER DEFAULT 0,
  recurrence_pattern TEXT,
  last_completed DATETIME,
  next_due DATETIME,
  source_note_id TEXT,
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chores_recurring ON chores(is_recurring);
CREATE INDEX idx_chores_next_due ON chores(next_due);
CREATE INDEX idx_chores_source ON chores(source_note_id);

-- ============================================================================
-- IDEAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  intro TEXT,
  description_md TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'developing', 'shelved', 'trashed')),
  category TEXT,
  source_note_id TEXT,
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_source ON ideas(source_note_id);

-- ============================================================================
-- PROJECTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  intro TEXT,
  description_md TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK(status IN ('planning', 'active', 'on_hold', 'completed', 'trashed')),
  category TEXT,
  source_note_id TEXT,
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_source ON projects(source_note_id);

-- ============================================================================
-- RELATIONSHIPS
-- ============================================================================

-- Projects can have multiple ideas
CREATE TABLE IF NOT EXISTS project_ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  idea_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
  UNIQUE(project_id, idea_id)
);

CREATE INDEX idx_project_ideas_project ON project_ideas(project_id);
CREATE INDEX idx_project_ideas_idea ON project_ideas(idea_id);

-- Projects can have multiple tasks
CREATE TABLE IF NOT EXISTS project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(project_id, task_id)
);

CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_task ON project_tasks(task_id);

-- ============================================================================
-- TAGS
-- ============================================================================

-- Ideas can have multiple tags
CREATE TABLE IF NOT EXISTS idea_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
  UNIQUE(idea_id, tag)
);

CREATE INDEX idx_idea_tags_idea ON idea_tags(idea_id);
CREATE INDEX idx_idea_tags_tag ON idea_tags(tag);

-- Projects can have multiple tags
CREATE TABLE IF NOT EXISTS project_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, tag)
);

CREATE INDEX idx_project_tags_project ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag ON project_tags(tag);

-- ============================================================================
-- NOTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  note_type TEXT DEFAULT 'normal' CHECK(note_type IN ('normal', 'secret')),
  category TEXT,
  source_note_id TEXT,
  order_index INTEGER DEFAULT 0,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_type ON notes(note_type);
CREATE INDEX idx_notes_category ON notes(category);
CREATE INDEX idx_notes_source ON notes(source_note_id);

-- Notes can be linked to multiple items (projects, ideas, tasks, chores)
CREATE TABLE IF NOT EXISTS note_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id TEXT NOT NULL,
  linked_item_type TEXT NOT NULL CHECK(linked_item_type IN ('task', 'chore', 'idea', 'project')),
  linked_item_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  UNIQUE(note_id, linked_item_type, linked_item_id)
);

CREATE INDEX idx_note_links_note ON note_links(note_id);
CREATE INDEX idx_note_links_item ON note_links(linked_item_type, linked_item_id);

-- Notes can have multiple tags
CREATE TABLE IF NOT EXISTS note_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  UNIQUE(note_id, tag)
);

CREATE INDEX idx_note_tags_note ON note_tags(note_id);
CREATE INDEX idx_note_tags_tag ON note_tags(tag);

-- ============================================================================
-- FILE ATTACHMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS file_attachments (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL CHECK(item_type IN ('task', 'chore', 'idea', 'project', 'note')),
  item_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  is_from_note INTEGER DEFAULT 0,
  source_note_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_attachments_item ON file_attachments(item_type, item_id);
CREATE INDEX idx_file_attachments_source ON file_attachments(source_note_id);

-- ============================================================================
-- REVIEW TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS note_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id TEXT NOT NULL UNIQUE,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  items_extracted INTEGER DEFAULT 0,
  notes TEXT
);

CREATE INDEX idx_note_reviews_note ON note_reviews(note_id);
CREATE INDEX idx_note_reviews_date ON note_reviews(reviewed_at);

-- ============================================================================
-- METADATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert version
INSERT OR REPLACE INTO metadata (key, value) VALUES ('schema_version', '1.0.0');
INSERT OR REPLACE INTO metadata (key, value) VALUES ('created_at', datetime('now'));
