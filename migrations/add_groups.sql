-- Migration: Add Groups Support
-- Date: 2025-11-14

-- ============================================================================
-- Create GROUPS table
-- ============================================================================
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  icon TEXT,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default groups
INSERT OR IGNORE INTO groups (id, name, color, icon, is_default) VALUES
  ('family', 'Family', '#EC4899', '👨‍👩‍👧‍👦', 1),
  ('daywork', 'Daywork', '#3B82F6', '💼', 1),
  ('consultance', 'Consultance', '#8B5CF6', '🤝', 1),
  ('freelance', 'Freelance', '#10B981', '💻', 1),
  ('self-business', 'Self Business', '#F59E0B', '🚀', 1);

CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);

-- ============================================================================
-- Add group_id columns to existing tables
-- ============================================================================

-- Add group_id to tasks table
ALTER TABLE tasks ADD COLUMN group_id TEXT REFERENCES groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_group ON tasks(group_id);

-- Add group_id to chores table
ALTER TABLE chores ADD COLUMN group_id TEXT REFERENCES groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_chores_group ON chores(group_id);

-- Add group_id to ideas table
ALTER TABLE ideas ADD COLUMN group_id TEXT REFERENCES groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ideas_group ON ideas(group_id);

-- Add group_id to projects table
ALTER TABLE projects ADD COLUMN group_id TEXT REFERENCES groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_group ON projects(group_id);
