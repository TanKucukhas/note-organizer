# Apple Notes Organizer

A Next.js application to export, organize, and manage your Apple Notes. Transform your unstructured notes into organized projects, ideas, tasks, and chores with an intuitive web interface.

## Features

- **Note Viewer**: Browse through all your exported Apple Notes with status badges
  - 🔗 Automatic URL detection - plain text URLs in content become clickable links
  - 🖼️ Image gallery with zoom functionality
  - 📱 Responsive layout with proper link styling

- **Organization System**: Convert notes into structured data:
  - 📁 **Projects** - Long-term initiatives with intro, description, and tags
    - Status tracking: Planning, Actively Working, Blocked, On Hold, Completed, Trashed
    - Multiple project types per project (many-to-many relationship)
    - Group assignment for categorization
  - 💡 **Ideas** - Capture and categorize creative thoughts
    - Same status system as projects for consistency
    - Idea types and group support
    - Markdown descriptions
  - ✅ **Tasks** - Actionable items with due dates and priorities
    - Link to projects or ideas
    - Priority levels: low, medium, high
    - Status: todo, in_progress, done, cancelled
  - 🔄 **Chores** - Recurring tasks with schedules
    - Recurrence patterns
    - Next due date tracking
  - 📝 **Notes** - Quick reference notes that can link to multiple items (with secret note support 🔒)

- **Smart UI Design**:
  - Creation forms always visible (no "Create New" button required)
  - Accordions collapsed by default for cleaner interface
  - Status dropdown in forms for immediate categorization
  - Reusable modal for creating project types and groups on-the-fly

- **Status Management**: Track notes as Unprocessed, Reviewed, or Trashed
- **History Tracking**: View all reviewed and trashed notes
- **Global Navigation**: Easy access to Dashboard, Organization DB, Note Organizer, and History

## Prerequisites

- macOS with Apple Notes app
- Node.js 18+ and npm
- Python 3.x (for data processing)
- SQLite3

## Setup Guide

### Step 1: Export Apple Notes

Export your Apple Notes using the provided AppleScript:

```bash
# Run the AppleScript to export notes
osascript export-notes.applescript > raw_notes.json
```

**What this does:**
- Connects to your macOS Notes application
- Extracts all notes with metadata (title, content, folder, account, dates)
- Exports as JSON with basic escaping
- **Note**: This may take several minutes depending on the number of notes

### Step 2: Clean the JSON Data

The raw export contains control characters that need to be removed:

```bash
# Clean the JSON data
cat raw_notes.json | python3 clean_json.py > notes.json
```

**What this does:**
- Removes problematic ASCII control characters (0-31)
- Preserves legitimate whitespace (\n, \r, \t)
- Outputs valid, parseable JSON

### Step 3: Import to SQLite Database

Import the cleaned JSON data into a SQLite database:

```bash
# Create notes.db and import data
python3 export_to_sqlite.py
```

**What this does:**
- Creates `notes.db` with the notes table
- Parses and imports all notes from `notes.json`
- Extracts and saves images to `images/` directory
- Sets initial status as 'pending' for all notes
- Creates indexes for efficient querying

**Database Schema (notes.db):**
```sql
CREATE TABLE notes (
  note_id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  folder TEXT,
  account TEXT,
  created_raw TEXT,
  created_datetime TEXT,
  modified_raw TEXT,
  modified_datetime TEXT,
  status TEXT DEFAULT 'pending',
  category TEXT,
  images TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Step 4: Initialize Organization Database

Create the organization database for structured data:

```bash
# Create organization.db with schema
sqlite3 organization.db < lib/schema-organization.sql
```

**What this does:**
- Creates `organization.db` for storing organized items
- Sets up tables for projects, ideas, tasks, chores, and notes
- Creates junction tables for relationships
- Enables foreign key constraints and WAL mode

**Organization Database Tables:**
- `projects` - Long-term projects with markdown descriptions and status tracking
- `ideas` - Ideas with tags and status tracking
- `tasks` - Tasks with due dates, priorities, and project links
- `chores` - Recurring tasks with schedules
- `notes` - Reference notes with secret/normal types
- `project_types` - Project type categories (can be assigned to multiple projects)
- `groups` - Organization groups for categorizing items
- `project_project_types` - Many-to-many junction for projects and types
- `note_links` - Many-to-many relationships between notes and other items
- `file_attachments` - Polymorphic attachments for all item types
- `project_ideas`, `project_tasks` - Junction tables
- `idea_tags`, `project_tags`, `note_tags` - Tag tables

**Project & Idea Status Options:**
- 📋 Planning - Initial planning phase
- ⚡ Actively Working - Currently in active development
- 🚫 Blocked - Blocked by dependencies or issues
- ⏸️ On Hold - Temporarily paused
- ✅ Completed - Successfully finished
- 🗑️ Trashed - Discarded or cancelled

### Step 5: Install Dependencies & Run

```bash
# Install Node.js dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

## Application Structure

```
my-apple-notes/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── notes/        # Apple Notes API
│   │   ├── org-notes/    # Organization Notes API
│   │   ├── projects/     # Projects API
│   │   ├── ideas/        # Ideas API
│   │   ├── tasks/        # Tasks API
│   │   └── chores/       # Chores API
│   ├── notes/[id]/       # Note viewer page
│   ├── organizer/notes/  # Note organizer interface
│   ├── organize/         # Organization dashboard
│   └── history/          # Reviewed/trashed notes
├── components/            # React components
│   ├── organization/     # Organization sections
│   ├── app-header.tsx    # Global navigation
│   ├── note-viewer.tsx   # Note display
│   └── organizer-bottom-nav.tsx
├── lib/                   # Database utilities
│   ├── db.ts             # notes.db functions
│   ├── db-organization.ts # organization.db functions
│   └── schema-organization.sql
├── types/                 # TypeScript definitions
├── notes.db              # Imported Apple Notes (gitignored)
├── organization.db       # Organized items (gitignored)
├── notes.json            # Cleaned JSON export (gitignored)
└── images/               # Extracted images (gitignored)
```

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Export**: AppleScript + Python

## Workflow

1. **Export**: Export notes from Apple Notes using AppleScript
2. **Review**: Browse through notes in the Note Organizer
3. **Organize**: Extract structured data (projects, ideas, tasks, chores, notes)
4. **Action**: Mark notes as reviewed or trash them
5. **Track**: View organized items in the Organization DB

## Status Badges

- 🟡 **Unprocessed** - Not yet reviewed
- 🟢 **Reviewed** - Organized and processed
- 🔴 **Trashed** - Marked for deletion

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Notes

- Database files (*.db) are excluded from version control
- notes.json and images/ are excluded from git
- The application runs on port 3001 by default (if 3000 is in use)

## Database Migrations

The `migrations/` directory contains SQL migration files for updating the organization database schema:

```bash
# Apply migrations in order (if needed):
sqlite3 organization.db < migrations/project_types_many_to_many.sql
sqlite3 organization.db < migrations/update_project_status.sql
sqlite3 organization.db < migrations/add_completed_on_hold_statuses.sql
sqlite3 organization.db < migrations/update_idea_status.sql
sqlite3 organization.db < migrations/add_actively_working_status.sql
sqlite3 organization.db < migrations/remove_in_progress_status.sql
```

**Migration History:**
- `project_types_many_to_many.sql` - Support multiple project types per project
- `update_project_status.sql` - Update project status options
- `add_completed_on_hold_statuses.sql` - Add completed and on_hold statuses
- `update_idea_status.sql` - Sync idea statuses with projects
- `add_actively_working_status.sql` - Add actively_working status
- `remove_in_progress_status.sql` - Remove in_progress status (final: 6 statuses)

## Additional Scripts

```bash
# Split notes into individual files (optional)
python3 split_notes.py

# View database statistics
sqlite3 notes.db "SELECT status, COUNT(*) FROM notes GROUP BY status"
sqlite3 organization.db "SELECT status, COUNT(*) FROM projects GROUP BY status"
sqlite3 organization.db "SELECT status, COUNT(*) FROM ideas GROUP BY status"
```

## License

MIT
