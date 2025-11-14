-- Migration: Add Source Note Date to All Tables
-- Date: 2025-11-14
-- Purpose: Store the source note's last modified date alongside source_note_id

-- ============================================================================
-- Add source_note_date column to all tables
-- ============================================================================

-- Add to tasks table
ALTER TABLE tasks ADD COLUMN source_note_date DATETIME;

-- Add to chores table
ALTER TABLE chores ADD COLUMN source_note_date DATETIME;

-- Add to ideas table
ALTER TABLE ideas ADD COLUMN source_note_date DATETIME;

-- Add to projects table
ALTER TABLE projects ADD COLUMN source_note_date DATETIME;

-- Add to notes table (organization notes)
ALTER TABLE notes ADD COLUMN source_note_date DATETIME;
