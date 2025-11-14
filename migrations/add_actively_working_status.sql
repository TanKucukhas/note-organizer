-- Add 'actively_working' to project and idea statuses
-- New statuses: 'planning', 'in_progress', 'actively_working', 'blocked', 'on_hold', 'completed', 'trashed'

-- ============================================================================
-- UPDATE PROJECTS
-- ============================================================================

-- Step 1: Create new projects table with updated constraint
CREATE TABLE IF NOT EXISTS projects_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  intro TEXT,
  description_md TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'in_progress', 'actively_working', 'blocked', 'on_hold', 'completed', 'trashed')),
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

-- ============================================================================
-- UPDATE IDEAS
-- ============================================================================

-- Step 1: Create new ideas table with updated constraint
CREATE TABLE IF NOT EXISTS ideas_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  intro TEXT,
  description_md TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'in_progress', 'actively_working', 'blocked', 'on_hold', 'completed', 'trashed')),
  category TEXT,
  idea_type_id TEXT,
  group_id TEXT,
  source_note_id TEXT,
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idea_type_id) REFERENCES project_types(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
);

-- Step 2: Copy data from old table to new table
INSERT INTO ideas_new
SELECT id, title, intro, description_md, created_date, status, category,
       idea_type_id, group_id, source_note_id, order_index, updated_at
FROM ideas;

-- Step 3: Drop old table
DROP TABLE ideas;

-- Step 4: Rename new table
ALTER TABLE ideas_new RENAME TO ideas;

-- Step 5: Recreate indexes
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_type ON ideas(idea_type_id);
CREATE INDEX idx_ideas_group ON ideas(group_id);
CREATE INDEX idx_ideas_source ON ideas(source_note_id);
