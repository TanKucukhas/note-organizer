# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js web application that exports Apple Notes and transforms them into organized, structured data. It combines:

1. **Export Tools**: AppleScript and Python utilities to extract notes from macOS Notes app
2. **Web Application**: Next.js 16 interface for viewing and organizing notes
3. **Organization System**: SQLite-based system for converting notes into projects, ideas, tasks, chores, and reference notes
4. **Smart UI**: Intuitive interface with automatic URL detection, status tracking, and seamless creation workflows

## Architecture

### Export Layer

1. **export-notes.applescript**: AppleScript that interfaces directly with the macOS Notes application
   - Iterates through all accounts, folders, and notes
   - Extracts note metadata (title, content, creation/modification dates, folder, account)
   - Performs basic JSON escaping of strings
   - Outputs a single-line JSON array

2. **clean_json.py**: Python utility for post-processing the AppleScript output
   - Removes problematic control characters (ASCII 0-31) that break JSON parsing
   - Preserves legitimate whitespace characters (\n, \r, \t)
   - Reads from stdin and writes to stdout for pipeline usage

3. **export_to_sqlite.py**: Imports cleaned JSON into SQLite database
   - Creates `notes.db` with structured schema
   - Extracts and saves images to `images/` directory
   - Sets initial status as 'pending' for all notes

### Database Layer

1. **notes.db**: SQLite database for imported Apple Notes
   - Primary table: `notes` with columns for title, content, folder, account, timestamps, status, category
   - Status tracking: pending, reviewed, trashed
   - Indexes on status and source_note_id for efficient querying

2. **organization.db**: SQLite database for organized, structured data
   - **Core Tables**:
     - `projects` - Long-term initiatives with markdown descriptions
     - `ideas` - Creative thoughts and concepts
     - `tasks` - Actionable items with due dates and priorities
     - `chores` - Recurring tasks with schedules
     - `notes` - Reference notes (normal/secret types)
   - **Metadata Tables**:
     - `project_types` - Categorization for projects/ideas (many-to-many)
     - `groups` - Organizational groupings for all items
   - **Junction Tables**:
     - `project_project_types` - Many-to-many for project types
     - `project_ideas`, `project_tasks` - Relationship tables
     - `note_links` - Many-to-many links between notes and other items
   - **Tag Tables**: `project_tags`, `idea_tags`, `note_tags`
   - **Attachments**: `file_attachments` - Polymorphic file storage

### Web Application Layer

Built with Next.js 16 (App Router, Turbopack):

1. **API Routes** (`app/api/`):
   - `/api/notes` - Apple Notes CRUD operations
   - `/api/projects` - Project management
   - `/api/ideas` - Idea management
   - `/api/tasks` - Task management
   - `/api/chores` - Chore management
   - `/api/org-notes` - Organization notes
   - `/api/project-types` - Project type management
   - `/api/groups` - Group management

2. **Pages** (`app/`):
   - `/` - Dashboard/home
   - `/notes/[id]` - Individual note viewer with image gallery
   - `/organizer/notes/[id]` - Note organization interface
   - `/organize` - Organization database viewer
   - `/history` - Reviewed and trashed notes

3. **Components** (`components/`):
   - `app-header.tsx` - Global navigation
   - `note-viewer.tsx` - Note display with status badges
   - `note-content-viewer.tsx` - Content renderer with automatic URL linking
   - `organization/*.tsx` - Entity-specific sections (ProjectSection, IdeaSection, TaskSection, ChoreSection)
   - `create-entity-modal.tsx` - Reusable modal for creating types/groups on-the-fly

4. **Database Utilities** (`lib/`):
   - `db.ts` - Functions for notes.db operations
   - `db-organization.ts` - Functions for organization.db operations
   - `schema-organization.sql` - Base schema definition

5. **Type Definitions** (`types/`):
   - `organization.ts` - TypeScript interfaces for all entities, statuses, and relationships

## Common Commands

### Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Opens at http://localhost:3001

# Build for production
npm run build

# Start production server
npm start
```

### Export Notes from Apple Notes App

```bash
# Full export pipeline
osascript export-notes.applescript > raw_notes.json
cat raw_notes.json | python3 clean_json.py > notes.json

# Import to database
python3 export_to_sqlite.py
```

### Initialize Organization Database

```bash
# Create organization.db with schema
sqlite3 organization.db < lib/schema-organization.sql

# Apply migrations (if needed)
sqlite3 organization.db < migrations/project_types_many_to_many.sql
sqlite3 organization.db < migrations/update_project_status.sql
sqlite3 organization.db < migrations/add_completed_on_hold_statuses.sql
sqlite3 organization.db < migrations/update_idea_status.sql
sqlite3 organization.db < migrations/add_actively_working_status.sql
sqlite3 organization.db < migrations/remove_in_progress_status.sql
```

### Working with Databases

```bash
# View note statistics
sqlite3 notes.db "SELECT status, COUNT(*) FROM notes GROUP BY status"

# View project statistics
sqlite3 organization.db "SELECT status, COUNT(*) FROM projects GROUP BY status"

# View idea statistics
sqlite3 organization.db "SELECT status, COUNT(*) FROM ideas GROUP BY status"

# View all project types
sqlite3 organization.db "SELECT * FROM project_types"

# View all groups
sqlite3 organization.db "SELECT * FROM groups"
```

## Status System

### Project & Idea Statuses

Both projects and ideas use the same 6-status system for consistency:

- 📋 **planning** - Initial planning phase
- ⚡ **actively_working** - Currently in active development
- 🚫 **blocked** - Blocked by dependencies or issues
- ⏸️ **on_hold** - Temporarily paused
- ✅ **completed** - Successfully finished
- 🗑️ **trashed** - Discarded or cancelled

**Important**: The status field uses CHECK constraints in SQLite:
```sql
status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'actively_working', 'blocked', 'on_hold', 'completed', 'trashed'))
```

### Task Statuses

Tasks use a simpler 4-status workflow:
- **todo** - Not yet started
- **in_progress** - Currently being worked on
- **done** - Completed
- **cancelled** - Abandoned

### Note Statuses (notes.db)

Apple Notes tracking uses:
- **pending** - Not yet reviewed
- **reviewed** - Organized and processed
- **trashed** - Marked for deletion

## UI Design Patterns

### Always-Visible Forms

All entity creation forms (projects, ideas, tasks, chores) are **always visible** by default:
- No "Create New" button required
- Forms are embedded directly in accordion sections
- Accordions are **collapsed by default** to keep UI clean
- Users can expand to see existing items and the form simultaneously

**Code Pattern**:
```typescript
const [isExpanded, setIsExpanded] = useState(false); // Accordion collapsed by default
// No isCreating state - form is always rendered
```

### Reusable Creation Modal

The `CreateEntityModal` component provides on-the-fly creation of:
- Project types (for categorizing projects/ideas)
- Groups (for organizational grouping)

Triggered by "+ New Type" or "+ New Group" buttons within forms.

### Automatic URL Detection

The `note-content-viewer.tsx` component automatically converts plain text URLs in note content into clickable links:

```typescript
const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
// Uses TreeWalker to find text nodes
// Converts URLs to <a> elements with proper styling
```

This ensures URLs in notes become clickable without requiring manual formatting.

## Data Structures

### Apple Notes (notes.json)

Each note object has the following structure:

```json
{
  "title": "Note title",
  "content": "<div>HTML formatted content</div>",
  "folder": "Folder name",
  "account": "Account name (iCloud, On My Mac, etc.)",
  "id": "x-coredata://UUID/ICNote/p123",
  "created": "Monday, January 1, 2024 at 12:00:00 PM",
  "modified": "Tuesday, January 2, 2024 at 3:45:00 PM"
}
```

### Organization Database Entities

**Projects**:
```typescript
{
  id: string;
  title: string;
  intro: string | null;
  description_md: string | null;  // Supports markdown
  status: ProjectStatus;
  project_type_ids: string[];     // Many-to-many
  group_id: string | null;
  source_note_id: string | null;
  source_note_date: string | null;
}
```

**Ideas**:
```typescript
{
  id: string;
  title: string;
  intro: string | null;
  description_md: string | null;  // Supports markdown
  status: IdeaStatus;
  idea_type_id: string | null;    // References project_types
  group_id: string | null;
  tags: string[];
}
```

**Tasks**:
```typescript
{
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  project_id: string | null;      // Can link to project
  idea_id: string | null;         // Or link to idea
  group_id: string | null;
}
```

## Database Migrations

The project uses a migration-based approach for schema updates. All migrations are in `migrations/` and should be applied in order.

### Migration History

1. **project_types_many_to_many.sql** - Converts project types from one-to-many to many-to-many relationship
   - Creates `project_project_types` junction table
   - Migrates existing data
   - Removes old `project_type_id` column

2. **update_project_status.sql** - Adds initial project status options
   - Updates CHECK constraint to include: planning, in_progress, blocked, trashed

3. **add_completed_on_hold_statuses.sql** - Expands status options
   - Adds: completed, on_hold
   - Total: 6 statuses

4. **update_idea_status.sql** - Syncs idea statuses with projects
   - Ensures ideas have same status system as projects

5. **add_actively_working_status.sql** - Adds actively_working status
   - Temporary state: 7 statuses

6. **remove_in_progress_status.sql** - Final cleanup
   - Converts existing `in_progress` to `actively_working`
   - Removes `in_progress` from CHECK constraint
   - Final state: 6 statuses (planning, actively_working, blocked, on_hold, completed, trashed)

### Migration Strategy

When modifying CHECK constraints in SQLite:
1. Create new table with updated constraint
2. Copy data from old table
3. Drop old table
4. Rename new table
5. Recreate indexes and triggers

**Example**:
```sql
-- Create new table with updated constraint
CREATE TABLE projects_new (
  -- ... columns with new CHECK constraint
);

-- Migrate data
INSERT INTO projects_new SELECT * FROM projects;

-- Replace table
DROP TABLE projects;
ALTER TABLE projects_new RENAME TO projects;

-- Recreate indexes
CREATE INDEX idx_projects_status ON projects(status);
-- ... other indexes
```

## Important Notes

### TypeScript Types and Database Constraints

**Critical**: TypeScript types must match SQLite CHECK constraints exactly:

```typescript
// types/organization.ts
export type ProjectStatus = 'planning' | 'actively_working' | 'blocked' | 'on_hold' | 'completed' | 'trashed';
```

```sql
-- lib/schema-organization.sql
status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'actively_working', 'blocked', 'on_hold', 'completed', 'trashed'))
```

Mismatches will cause runtime errors when inserting data.

### Component State Management

Organization sections follow a consistent pattern:
- `useState(false)` for accordion (collapsed by default)
- No `isCreating` state (forms always visible)
- Form data includes `source_note_id` and `source_note_date` for traceability

**Example**:
```typescript
const [isExpanded, setIsExpanded] = useState(false);
const [formData, setFormData] = useState<CreateProjectInput>({
  title: '',
  status: 'planning',
  source_note_id: noteId,
  source_note_date: noteModifiedDate || undefined,
});
```

### Database File Management

Both database files are excluded from version control:
- `notes.db` - Can be large (depends on note count)
- `organization.db` - Contains user's organized data
- `notes.json` - Very large (372MB+)
- `images/` - Extracted images directory

### Performance Considerations

- **notes.json**: Extremely large, single-line JSON array
- **better-sqlite3**: Synchronous SQLite operations are fast for this use case
- **Image loading**: Images extracted to `images/` directory, served as static files
- **URL conversion**: Done client-side on mount to avoid server-side HTML manipulation

### AppleScript Export

The AppleScript handles JSON string escaping for:
- Backslashes, double quotes, newlines, carriage returns, tabs, forward slashes
- **Limitation**: Cannot handle all control characters (hence `clean_json.py`)

### Date Handling

- **Export dates**: Human-readable macOS format (locale-dependent)
- **Database dates**: SQLite DATETIME (ISO-8601 format)
- **Created/modified tracking**: Preserved from original Apple Notes

### Content Format

Note content is HTML from Apple Notes:
- May contain inline styles, div wrappers, embedded images
- Automatic URL detection converts plain text URLs to links
- Image extraction saves base64-encoded images as files

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Export Tools**: AppleScript (osascript) + Python 3.x

## macOS-Specific Requirements

- macOS with Apple Notes application
- osascript (AppleScript interpreter)
- Python 3.x
- SQLite3
- Proper permissions: System Preferences > Security & Privacy > Automation

## Development Workflow

1. **Export notes**: Run AppleScript → clean JSON → import to SQLite
2. **Start dev server**: `npm run dev` on port 3001
3. **Review notes**: Browse unprocessed notes in organizer
4. **Extract data**: Create projects, ideas, tasks, chores from notes
5. **Mark reviewed**: Update note status to prevent re-processing
6. **View organized**: Access structured data in Organization DB

## Key File Locations

- `/app/organizer/notes/[id]/page.tsx` - Note organization interface
- `/components/organization/` - Entity creation components
- `/lib/db-organization.ts` - Database operations
- `/types/organization.ts` - TypeScript definitions
- `/migrations/` - Database schema migrations
- `notes.db` - Imported Apple Notes (gitignored)
- `organization.db` - Organized data (gitignored)
