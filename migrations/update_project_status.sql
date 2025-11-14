-- Update project status values
-- Change from: 'planning', 'active', 'on_hold', 'completed', 'trashed'
-- Change to: 'planning', 'in_progress', 'blocked', 'trashed'

-- First, update existing values to match new schema
UPDATE projects SET status = 'in_progress' WHERE status = 'active';
UPDATE projects SET status = 'blocked' WHERE status = 'on_hold';
UPDATE projects SET status = 'trashed' WHERE status = 'completed';

-- SQLite doesn't support ALTER TABLE to modify CHECK constraints directly
-- We need to recreate the table with the new constraint

-- Step 1: Create new table with updated constraint
CREATE TABLE IF NOT EXISTS projects_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  intro TEXT,
  description_md TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'in_progress', 'blocked', 'trashed')),
  category TEXT,
  project_type_id TEXT,
  group_id TEXT,
  source_note_id TEXT,
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_type_id) REFERENCES project_types(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
);

-- Step 2: Copy data from old table to new table
INSERT INTO projects_new
SELECT id, title, intro, description_md, created_date, status, category,
       project_type_id, group_id, source_note_id, order_index, updated_at
FROM projects;

-- Step 3: Drop old table
DROP TABLE projects;

-- Step 4: Rename new table
ALTER TABLE projects_new RENAME TO projects;

-- Step 5: Recreate indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_type ON projects(project_type_id);
CREATE INDEX idx_projects_group ON projects(group_id);
CREATE INDEX idx_projects_source ON projects(source_note_id);
