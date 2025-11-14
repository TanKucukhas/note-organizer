-- Migration: Convert Project Types from One-to-Many to Many-to-Many
-- Date: 2025-11-14
-- Description: Creates junction table for projects to have multiple types

-- Step 1: Create new junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS project_project_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  project_type_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (project_type_id) REFERENCES project_types(id) ON DELETE CASCADE,
  UNIQUE(project_id, project_type_id)
);

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_project_types_project
  ON project_project_types(project_id);

CREATE INDEX IF NOT EXISTS idx_project_project_types_type
  ON project_project_types(project_type_id);

-- Step 3: Migrate existing data from projects.project_type_id to junction table
INSERT INTO project_project_types (project_id, project_type_id)
SELECT id, project_type_id
FROM projects
WHERE project_type_id IS NOT NULL;

-- Note: We're keeping the project_type_id column in projects table for now
-- as a safety measure. It can be removed in a future migration if desired.
