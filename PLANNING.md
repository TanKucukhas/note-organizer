# Manual Note Organization Flow - Planning Document

## 1. CURRENT STRUCTURE SUMMARY

### Database (notes.db)
- **Location**: `/Users/tankucukhas/workspace/my-apple-notes/notes.db`
- **Size**: 371MB (single file, no line breaks in schema)
- **Type**: SQLite with WAL mode enabled
- **Foreign keys**: Enabled
- **Isolation**: NORMAL synchronous mode

### Current Database Tables
```
notes (PRIMARY)
├── note_id (PK), title, content, folder, account
├── created_raw, created_datetime, modified_raw, modified_datetime
├── status (pending/processing/analyzed/failed)
├── processed (boolean), primary_category
└── Timestamps: created_at, updated_at

extracted_links      → URLs from notes (link_type: youtube/github/social_media/documentation/other)
extracted_images    → From individual_notes/images/ directory (filename pattern: note_NNNN_img_N.ext)
extracted_tasks     → Task text, priority, completed flag, due_date
extracted_ideas     → Idea text, status (new/exploring/developing/shelved)
extracted_projects  → Project name, status (text)
extracted_analysis  → Summary, plain text sample
note_categories     → Category tags (many-to-many)
accounts            → Account lookup
folders             → Folder lookup
```

### Image Storage
- **Location**: `individual_notes/images/`
- **Naming**: `note_NNNN_img_N.ext` (e.g., note_0001_img_1.png)
- **Formats Supported**: PNG, JPEG, GIF, WebP, SVG, BMP, TIFF
- **Total**: 454 files, ~520MB
- **Served via**: `/api/images/[filename]` route with 1-year cache

### Current UI Components
```
Dashboard (/)
├── Stats Grid (total notes, links, images, tasks)
├── Categories section
├── Recent Notes (5 most recently modified)
└── Quick Action Cards (disabled placeholders for future features)

Note Detail (/notes/[id])
├── Header with metadata (folder, account, dates, category)
├── ImageGallery with lightbox
├── Content (HTML or plain text)
├── Links section
├── Tasks section (with completion checkbox)
├── Ideas section
├── Projects section
├── Analysis section
└── Metadata footer

Disabled Features:
- /review (Review Queue)
- /notes (All Notes)
- /tasks (Tasks Management)
- /projects (Projects)
- /ideas (Ideas)
- /bookmarks (Bookmarks)
```

### API Routes
- `GET /api/notes` - Fetch notes with filters (category, folder, account, status, search, date range, pagination, sorting)
- `GET /api/notes/[id]` - Fetch single note with all related data
- `GET /api/images/[filename]` - Serve images from disk with MIME type handling
- `GET /api/stats` - Database statistics

### Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Lucide React icons
- **Database**: better-sqlite3 (in-process, synchronous)
- **Build Tools**: TypeScript 5, ESLint 9
- **File Handling**: Node.js `fs/promises` for reading disk files

---

## 2. NEW ITEMS STRUCTURE (SEPARATE DATABASE)

You need to create NEW items (Tasks, Chores, Ideas, Projects) separate from extracting them from notes. This requires a parallel database.

### Why Separate Database
- Notes.db is imported, read-heavy, and massive (371MB)
- New organized items are user-created, should be independent
- Easier to backup/version separately
- Can delete/recreate notes.db without losing organized data

### Recommended New Database: `organization.db`
- **Location**: `organization.db` (in project root, same pattern as notes.db)
- **Size**: Much smaller, write-optimized
- **Tables**: tasks, chores, ideas, projects, file_attachments

---

## 3. RECOMMENDED DATABASE SCHEMA FOR ORGANIZATION.DB

```sql
-- TASKS TABLE
CREATE TABLE tasks (
  task_id TEXT PRIMARY KEY DEFAULT (uuid()),
  title TEXT NOT NULL,
  description TEXT,
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATE,
  priority INTEGER (0-3: none, low, medium, high),
  status TEXT DEFAULT 'active' (active/completed/archived),
  project_id TEXT REFERENCES projects(project_id) ON DELETE SET NULL,
  idea_id TEXT REFERENCES ideas(idea_id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id)
);

-- CHORES TABLE
CREATE TABLE chores (
  chore_id TEXT PRIMARY KEY DEFAULT (uuid()),
  title TEXT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT 0,
  recurrence_pattern TEXT (daily/weekly/monthly/yearly), -- optional if recurring
  date_last_completed DATE,
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' (active/completed/archived),
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chore_id)
);

-- IDEAS TABLE
CREATE TABLE ideas (
  idea_id TEXT PRIMARY KEY DEFAULT (uuid()),
  title TEXT NOT NULL,
  intro TEXT,
  description TEXT (markdown content),
  category TEXT (user-defined tags)
  status TEXT DEFAULT 'active' (active/developing/shelved/trashed),
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(idea_id)
);

-- PROJECTS TABLE (extends IDEAS with relational features)
CREATE TABLE projects (
  project_id TEXT PRIMARY KEY DEFAULT (uuid()),
  title TEXT NOT NULL,
  intro TEXT,
  description TEXT (markdown content),
  category TEXT (user-defined tags)
  status TEXT DEFAULT 'active' (active/in-progress/completed/shelved/trashed),
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_completed DATE,
  order_index INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id)
);

-- PROJECT_IDEAS JUNCTION (Projects can contain Ideas)
CREATE TABLE project_ideas (
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(idea_id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, idea_id)
);

-- PROJECT_TASKS JUNCTION (Projects can contain Tasks)
CREATE TABLE project_tasks (
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, task_id)
);

-- IDEA_TAGS TABLE (Many-to-many for flexible categorization)
CREATE TABLE idea_tags (
  idea_id TEXT NOT NULL REFERENCES ideas(idea_id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(idea_id, tag)
);

-- PROJECT_TAGS TABLE
CREATE TABLE project_tags (
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, tag)
);

-- FILE ATTACHMENTS TABLE (for all items)
CREATE TABLE file_attachments (
  attachment_id TEXT PRIMARY KEY DEFAULT (uuid()),
  task_id TEXT REFERENCES tasks(task_id) ON DELETE SET NULL,
  chore_id TEXT REFERENCES chores(chore_id) ON DELETE SET NULL,
  idea_id TEXT REFERENCES ideas(idea_id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(project_id) ON DELETE SET NULL,
  file_type TEXT (new/existing), -- 'new' = user uploaded, 'existing' = link to notes.db image
  filename TEXT NOT NULL, -- new upload filename or reference to notes.db image
  relative_path TEXT, -- path in uploads or link to /api/images/
  file_size INTEGER,
  mime_type TEXT,
  attachment_source TEXT, -- 'uploaded' or 'note_id' (if from notes.db)
  source_note_id TEXT, -- reference back to notes table if attached from note
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attachment_id),
  CHECK (
    (task_id IS NOT NULL AND chore_id IS NULL AND idea_id IS NULL AND project_id IS NULL) OR
    (task_id IS NULL AND chore_id IS NOT NULL AND idea_id IS NULL AND project_id IS NULL) OR
    (task_id IS NULL AND chore_id IS NULL AND idea_id IS NOT NULL AND project_id IS NULL) OR
    (task_id IS NULL AND chore_id IS NULL AND idea_id IS NULL AND project_id IS NOT NULL)
  )
);

-- SOURCE TRACKING TABLE (link extracted items to original notes)
CREATE TABLE item_sources (
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL (task/chore/idea/project),
  source_note_id TEXT NOT NULL REFERENCES notes(note_id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id, item_type),
  FOREIGN KEY (source_note_id) REFERENCES notes(note_id) ON DELETE CASCADE
);

-- INDEXES for performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_idea_id ON tasks(idea_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_date_created ON tasks(date_created DESC);

CREATE INDEX idx_chores_status ON chores(status);
CREATE INDEX idx_chores_date_created ON chores(date_created DESC);

CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_date_created ON ideas(date_created DESC);
CREATE INDEX idx_ideas_category ON ideas(category);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_date_created ON projects(date_created DESC);
CREATE INDEX idx_projects_category ON projects(category);

CREATE INDEX idx_file_attachments_task_id ON file_attachments(task_id);
CREATE INDEX idx_file_attachments_idea_id ON file_attachments(idea_id);
CREATE INDEX idx_file_attachments_project_id ON file_attachments(project_id);
CREATE INDEX idx_file_attachments_source_note ON file_attachments(source_note_id);

CREATE INDEX idx_item_sources_note_id ON item_sources(source_note_id);
```

---

## 4. FILE HANDLING APPROACH

### Image Storage Strategy

#### Option A (Recommended): Hybrid Approach
```
/uploads/
├── /tasks/
│   └── {task_id}/
│       ├── file1.png
│       ├── file2.pdf
│       └── ...
├── /ideas/
│   └── {idea_id}/
│       └── ...
├── /projects/
│   └── {project_id}/
│       └── ...
└── /chores/
    └── {chore_id}/
        └── ...

+ Store reference to existing images from notes.db:
  file_attachments.attachment_source = 'note_id'
  file_attachments.source_note_id = 'xyz123'
  file_attachments.relative_path = '/api/images/note_0001_img_1.png'
```

**Pros**:
- New uploads isolated and organized by item type
- Existing note images referenced (no duplication)
- Clear separation of concerns
- Easy to delete organized items without touching notes data

**Cons**:
- Two sources of truth for attachments

#### Option B: Database Blob Storage
Store new images as BLOB in organization.db
- **Pros**: Single database, atomic transactions
- **Cons**: Slower, harder to manage, not practical for large images

#### Option C: S3/Cloud Storage
- **Pros**: Scalable, cloud-backed
- **Cons**: Overkill for local app, adds complexity

### Recommended: Option A - Hybrid

**Upload Route**: `POST /api/uploads/[type]/[itemId]`
- Store files to disk in organized folders
- Return metadata to insert into file_attachments table
- Support multiple file uploads with drag-drop

**Existing Image Linking**: When reviewing notes with images
- Display existing note images in read-only view
- Checkbox option "Attach this image to task/idea/project"
- Creates entry in file_attachments table pointing to notes.db image

---

## 5. REVIEW FLOW UI RECOMMENDATIONS

### Review Queue Flow (`/review`)

#### Phase 1: Initialization
```
Layout:
┌──────────────────────────────────────────┐
│  Review Queue                   [Stats]  │
├──────────────────────────────────────────┤
│  Filtering Sidebar    │  Note Content    │
│  ├─ Unreviewed (N)    │                  │
│  ├─ Category filter   │                  │
│  ├─ Date range        │                  │
│  ├─ Folder filter     │                  │
│  └─ Search            │                  │
└──────────────────────────────────────────┘
```

#### Phase 2: Note Card (Reverse Chronological - Newest First)
```
Card Layout:
┌─────────────────────────────────────────────────┐
│ Title (truncated)                    Modified   │
│ [Images thumbnails if present]                  │
│ Content preview (first 200 chars)               │
│ Metadata: Folder | Account | Status             │
│ [Action buttons below]                           │
└─────────────────────────────────────────────────┘

Action Buttons:
├─ [View Full]        → expands inline or sidebar
├─ [Extract Tasks]    → task creation modal
├─ [Extract Ideas]    → idea creation modal
├─ [Create Project]   → project creation modal
├─ [Skip / Mark Done] → mark as processed
└─ [Archive Note]     → soft delete from view
```

#### Phase 3: Extraction Modals
Each item type gets its own creation modal:

```
CREATE TASK MODAL
┌──────────────────────────────────┐
│ Create Task from Note            │
├──────────────────────────────────┤
│ Title *:     [text input]         │
│ Description: [textarea]           │
│ Due Date:    [date picker]        │
│ Priority:    [dropdown 0-3]       │
│ Status:      [dropdown]           │
│ Project:     [dropdown/search]    │
│ Idea:        [dropdown/search]    │
│ Attachments: [drag-drop zone]    │
│              [or link existing]   │
├──────────────────────────────────┤
│ [Cancel]  [Save Task]            │
└──────────────────────────────────┘

CREATE IDEA MODAL
┌──────────────────────────────────┐
│ Create Idea from Note            │
├──────────────────────────────────┤
│ Title *:     [text input]         │
│ Intro:       [textarea]           │
│ Description: [markdown editor]    │
│ Category:    [tags input]         │
│ Status:      [active/shelved]     │
│ Attachments: [drag-drop zone]    │
│              [or link existing]   │
├──────────────────────────────────┤
│ [Cancel]  [Save Idea]            │
└──────────────────────────────────┘

CREATE PROJECT MODAL (similar to idea + tasks)
┌──────────────────────────────────┐
│ Create Project from Note         │
├──────────────────────────────────┤
│ Title *:     [text input]         │
│ Intro:       [textarea]           │
│ Description: [markdown editor]    │
│ Category:    [tags input]         │
│ Status:      [active/completed]   │
│ Attachments: [drag-drop zone]    │
│              [or link existing]   │
│                                   │
│ Add Ideas to Project:             │
│ [Search existing ideas]           │
│ [Create new inline]               │
│                                   │
│ Add Tasks to Project:             │
│ [Search existing tasks]           │
│ [Create new inline]               │
├──────────────────────────────────┤
│ [Cancel]  [Save Project]         │
└──────────────────────────────────┘
```

#### Phase 4: Reverse Chronological Ordering
```typescript
// Query for review:
SELECT * FROM notes 
WHERE processed = 0 OR status != 'analyzed'
ORDER BY modified_datetime DESC  // Newest first
LIMIT 20
OFFSET {page * 20}
```

### List Views for New Items

#### Tasks List (`/tasks`)
```
┌──────────────────────────────────────┐
│ Tasks            [Add Task] [Filter] │
├──────────────────────────────────────┤
│ Due Today (N):                       │
│  ☐ Task 1 [P2]                       │
│  ☐ Task 2 [P3]                       │
│                                      │
│ Upcoming (N):                        │
│  ☐ Task 3 [P1] due Nov 20            │
│  ☐ Task 4 [P2] due Dec 1             │
│                                      │
│ No Due Date (N):                     │
│  ☐ Task 5 [P2]                       │
│  ☐ Task 6 [P3]                       │
│                                      │
│ Completed (N): [collapsed]           │
│  ✓ Task 7                            │
└──────────────────────────────────────┘
```

#### Ideas List (`/ideas`)
```
┌──────────────────────────────────────┐
│ Ideas           [Add Idea]  [Filter] │
├──────────────────────────────────────┤
│ Active (N):                          │
│  💡 Idea 1 - category: design        │
│  💡 Idea 2 - category: feature       │
│                                      │
│ Developing (N):                      │
│  💡 Idea 3 - category: product       │
│                                      │
│ Shelved (N): [collapsed]             │
│  💡 Idea 4 - category: future        │
└──────────────────────────────────────┘
```

#### Projects List (`/projects`)
```
┌──────────────────────────────────────┐
│ Projects       [Add Project] [Filter]│
├──────────────────────────────────────┤
│ Active (N):                          │
│  📦 Project 1                        │
│    └─ 5 tasks, 3 ideas               │
│  📦 Project 2                        │
│    └─ 8 tasks, 2 ideas               │
│                                      │
│ Completed (N): [collapsed]           │
│  ✓ Project 3                         │
└──────────────────────────────────────┘
```

#### Chores List (`/chores`)
```
┌──────────────────────────────────────┐
│ Chores         [Add Chore]  [Filter] │
├──────────────────────────────────────┤
│ Active (N):                          │
│  🧹 Chore 1 - weekly                 │
│     Last completed: 5 days ago       │
│  🧹 Chore 2 - daily                  │
│     Last completed: today            │
│                                      │
│ Completed (N): [collapsed]           │
│  ✓ Chore 3 - one-time                │
└──────────────────────────────────────┘
```

---

## 6. IMPLEMENTATION ROADMAP

### Phase 1: Database Setup
1. Create `organization.db` with schema from section 3
2. Create new types in `types/organization.ts`
3. Create new database utilities in `lib/organization-db.ts`
4. Add migration script to initialize tables

### Phase 2: API Routes
1. `POST /api/tasks` - create task
2. `GET /api/tasks` - list tasks with filters/sorting
3. `PUT /api/tasks/[id]` - update task
4. `DELETE /api/tasks/[id]` - delete task
5. Repeat for chores, ideas, projects
6. `POST /api/uploads/[type]/[itemId]` - file upload handler

### Phase 3: UI Components
1. Create `ReviewQueue` page component with note carousel
2. Create `TaskModal`, `IdeaModal`, `ProjectModal` components
3. Create `TaskList`, `IdeaList`, `ProjectList` page components
4. Create file upload component with drag-drop
5. Create markdown editor component for descriptions

### Phase 4: Navigation & Integration
1. Enable Review Queue link in dashboard
2. Enable Tasks/Ideas/Projects list links
3. Add breadcrumb navigation
4. Add search/filter across all list views

### Phase 5: Advanced Features
1. Drag-drop reordering of items
2. Markdown preview for descriptions
3. Recurring chore tracking
4. Project progress indicators
5. Tag management and filtering
6. Item linking (show which items created from which notes)

---

## 7. KEY TECHNICAL DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Separate DB** | Yes (organization.db) | notes.db is 371MB, imported, read-heavy; organize items should be independent |
| **File Upload** | Disk-based (`/uploads/`) | Simpler than DB blobs, efficient for images, easy to manage |
| **Image Linking** | Reference notes.db images | Avoid duplication, leverage existing storage |
| **Item IDs** | UUID (TEXT) | Better than auto-increment, portable, mergeable |
| **Ordering** | order_index INTEGER | Allows drag-drop reordering, flexible sorting |
| **Markdown** | Stored as TEXT | Simple, searchable, integrates with modern editors |
| **Tagging** | Junction table (not category TEXT) | Better querying, allows multiple tags per item |
| **Timestamps** | DATETIME (ISO format) | Consistent with notes.db schema |

---

## 8. ESTIMATED FILE UPLOADS STRUCTURE

```
uploads/
├── tasks/
│   ├── {uuid-task-1}/
│   │   ├── screenshot-2024-11-13.png
│   │   ├── document.pdf
│   │   └── wireframe.sketch
│   ├── {uuid-task-2}/
│   │   └── budget.xlsx
│
├── ideas/
│   ├── {uuid-idea-1}/
│   │   ├── concept-art.png
│   │   ├── reference-1.jpg
│   │   └── reference-2.jpg
│   
├── projects/
│   ├── {uuid-project-1}/
│   │   ├── kickoff-presentation.pptx
│   │   ├── timeline.png
│   │   └── mockups/
│   │       ├── home.png
│   │       └── dashboard.png
│
└── chores/
    └── {uuid-chore-1}/
        └── checklist.txt
```

---

## 9. MIGRATION CONSIDERATIONS

### From notes.db Extraction to New Organization.db
When reviewing notes, if you want to extract items from AI-analyzed notes:

```typescript
// Pseudo-code for extraction flow
const note = getNoteById(noteId) // from notes.db
const existingTasks = note.tasks // from extracted_tasks table

// User can:
// 1. Create NEW task from scratch (not from extracted)
// 2. Use extracted_tasks as INSPIRATION
// 3. Attach existing images from note to new task

const newTask = await createTask({
  title: userInput.title,
  description: userInput.description,
  due_date: userInput.dueDate,
  priority: userInput.priority,
  // Link back to source
  source_note_id: noteId
})

// Then optionally attach images
await attachImageToTask(task.task_id, {
  source_type: 'existing_note_image',
  source_image_id: image.image_id,
  note_id: noteId
})
```

---

## 10. SUMMARY TABLE

| Aspect | Current (notes.db) | New (organization.db) |
|--------|--------------------|-----------------------|
| **Purpose** | Import Apple Notes | User-organized items |
| **Size** | 371MB | ~1-10MB (estimated) |
| **Access Pattern** | Read-heavy | Read/Write balanced |
| **Data Origin** | Imported from Notes app | User-created via UI |
| **Item Types** | Notes with extracted data | Tasks, Chores, Ideas, Projects |
| **Images** | `/individual_notes/images/` | `/uploads/` + references to notes.db |
| **Schema** | 12 tables (fixed) | 16 tables (extensible) |
| **Relationships** | Foreign keys to notes | Complex (projects→ideas, projects→tasks) |
| **Backup Strategy** | Version control for schema | Separate backup for user data |

