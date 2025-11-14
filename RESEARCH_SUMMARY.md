# Research Summary - Manual Note Organization Flow

## Overview
Complete research and planning document for building a manual note organization flow that allows users to extract structured items (Tasks, Chores, Ideas, Projects) from their Apple Notes collection.

---

## Key Findings

### Current State Analysis

#### Database (notes.db - 371MB)
- **12 tables** storing imported Apple Notes with AI-extracted data
- Tables: notes, extracted_links, extracted_images, extracted_tasks, extracted_ideas, extracted_projects, analysis, note_categories, accounts, folders, and metadata
- **Status tracking**: pending, processing, analyzed, failed
- **Image storage**: 454 images (~520MB) in `/individual_notes/images/` with pattern `note_NNNN_img_N.ext`
- **Read-heavy** design optimized for browsing imported data

#### UI Components
- **Dashboard** (`/`): Stats grid, categories, recent notes (5 items)
- **Note Detail** (`/notes/[id]`): Full content view with images, links, extracted items, analysis
- **ImageGallery**: Client component with lightbox, supports drag navigation
- **Disabled Features**: Review Queue, All Notes, Tasks, Projects, Ideas, Bookmarks (placeholders ready)

#### API Routes
- `GET /api/notes` - Query with 13 filter/sort options
- `GET /api/notes/[id]` - Single note with all related data
- `GET /api/images/[filename]` - Image serving with MIME type detection
- `GET /api/stats` - Database statistics

#### Tech Stack
- **Next.js 16** with React 19 (App Router)
- **Tailwind CSS 4** with Lucide icons
- **better-sqlite3** (synchronous, in-process)
- TypeScript 5, ESLint 9
- Node.js `fs/promises` for file I/O

### Problem Statement
Users need to **manually organize** content from imported notes into actionable items:
- **Tasks**: title, description, due_date (optional), priority (optional), status, project/idea links, attachments
- **Chores**: title, description, recurring flag, one-time/recurring, last completion date
- **Ideas**: title, intro, markdown description, status (active/developing/shelved), category tags, attachments
- **Projects**: same as ideas + linked ideas and tasks

**This requires NEW data structures separate from imported notes.db**

---

## Recommended Architecture

### Two-Database Approach

#### Database 1: notes.db (EXISTING - READ-ONLY)
- Purpose: Apple Notes archive
- Access: Browsing, searching, referencing
- Size: 371MB (fixed)
- Schema: 12 tables (imported)
- Images: `/individual_notes/images/` (454 files)

#### Database 2: organization.db (NEW - READ/WRITE)
- Purpose: User-created organized items
- Access: Full CRUD operations
- Size: ~1-10MB (estimated)
- Schema: 16 tables (extensible)
- Images: `/uploads/` + references to notes.db images
- Location: Project root, same pattern as notes.db

### Why Separate Databases?
1. **Data Isolation**: Organizing items is independent of imported notes
2. **Performance**: New DB is optimized for read/write balance vs notes.db's read-heavy usage
3. **Backup/Restore**: User data (organization.db) separate from immutable imports (notes.db)
4. **Scalability**: Can delete/recreate notes.db without affecting user's organized items
5. **Clean Schema**: Extensible design for future item types

---

## Database Schema (organization.db)

### Core Tables
```
tasks          → User-created action items
chores         → Recurring or one-time maintenance tasks
ideas          → Conceptual items with markdown descriptions
projects       → Complex initiatives with linked ideas/tasks
```

### Relationship Tables
```
project_ideas  → Projects contain ideas (1-to-many)
project_tasks  → Projects contain tasks (1-to-many)
idea_tags      → Ideas have multiple tags (many-to-many)
project_tags   → Projects have multiple tags (many-to-many)
```

### File Management
```
file_attachments → Unified table for attachments to any item type
                   - Supports 'new' uploads (to /uploads/)
                   - Supports 'existing' references (to /api/images/)
```

### Tracking
```
item_sources   → Links items back to source notes (optional tracking)
```

### Key Fields
- **IDs**: UUIDs (TEXT) instead of auto-increment for portability
- **Ordering**: order_index (INTEGER) for drag-drop reordering
- **Content**: description stored as markdown (TEXT) for richness
- **Status**: Enumerated text fields (active/completed/shelved/trashed)
- **Timestamps**: DATETIME ISO format, consistent with notes.db

---

## File Handling Strategy (Hybrid Approach - RECOMMENDED)

### New Uploads
```
/uploads/
├── tasks/{task-id}/*.png/*.pdf/*
├── ideas/{idea-id}/*.png/*.pdf/*
├── projects/{project-id}/*.png/*.pdf/*
└── chores/{chore-id}/*.txt/*
```
- User uploads stored in organized directories
- Randomized UUID filenames to avoid collisions
- Served via `POST /api/uploads/[type]/[itemId]`

### Existing Note Images
```
/individual_notes/images/note_NNNN_img_N.ext
```
- Referenced (not duplicated) via file_attachments table
- `file_attachments.source_note_id` = note_id
- `file_attachments.relative_path` = `/api/images/filename`
- Allows "attach existing image to task" without copying

### Hybrid Benefits
- New content is isolated and versioned
- Existing content avoids duplication
- Clear separation between user uploads and imported assets
- Easy to delete organized items without touching note images

---

## UI/UX Flow

### Review Queue (`/review`)
1. **Initialization**: Load unreviewed notes in **reverse chronological order** (newest first)
2. **Note Card**: Display title, thumbnails, preview, metadata
3. **Actions**: Extract Task, Extract Idea, Create Project, Mark Done, Skip, Archive
4. **Modals**: Each action opens type-specific creation form
5. **Attachments**: Can upload new files OR link existing note images

### Extraction Modals
- **Task Modal**: title, description, due_date, priority, status, project, idea, attachments
- **Idea Modal**: title, intro, description (markdown), category, status, attachments, tags
- **Project Modal**: Same as idea + ability to add/link ideas and tasks inline
- **Chore Modal**: title, description, recurring toggle, recurrence pattern, attachments

### List Views
- **Tasks** (`/tasks`): Grouped by due date (Today, Upcoming, No Date), collapsible completed
- **Ideas** (`/ideas`): Grouped by status (Active, Developing, Shelved), searchable by tag
- **Projects** (`/projects`): With child count (5 tasks, 3 ideas), status indicators
- **Chores** (`/chores`): With recurrence pattern, last completion date

### Navigation
- Dashboard → links to Review Queue, Tasks, Ideas, Projects, Chores
- Breadcrumbs in list/detail pages
- Back button to dashboard
- Search/filter bars on all list views

---

## Implementation Phases

### Phase 1: Foundation (Core Database)
- Create `organization.db` with schema
- Define TypeScript types in `types/organization.ts`
- Create database utilities in `lib/organization-db.ts`
- Initialize database on first run

### Phase 2: API (CRUD Operations)
- Task routes: POST, GET (list/filtered), GET/:id, PUT/:id, DELETE/:id
- Repeat for Chores, Ideas, Projects
- File upload endpoint: `POST /api/uploads/[type]/[itemId]`
- File linking endpoint: `POST /api/attachments/link-note-image`

### Phase 3: UI (Components & Pages)
- Review Queue page (`/review`) - note carousel with extraction modals
- Task/Idea/Project/Chore creation modals
- List pages (`/tasks`, `/ideas`, `/projects`, `/chores`)
- Detail pages for editing items
- File upload component with drag-drop

### Phase 4: Integration
- Enable dashboard links to new features
- Add navigation breadcrumbs
- Search/filter across all list views
- Show source note link from organized items

### Phase 5: Polish (Advanced Features)
- Drag-drop reordering
- Markdown preview for descriptions
- Recurring chore tracking & completion history
- Project progress indicators (N completed / N total tasks)
- Tag management interface
- Bulk operations

---

## Key Technical Decisions

| Aspect | Choice | Why |
|--------|--------|-----|
| Separate DB | Yes (organization.db) | notes.db is 371MB, imported, read-heavy |
| File Storage | Disk-based `/uploads/` | Simpler than BLOB, efficient, manageable |
| Item IDs | UUID (TEXT) | Portable, mergeable, no collision risk |
| Content Format | Markdown (TEXT) | Searchable, editable, integrates with modern editors |
| Tagging | Junction table | Better querying than single category field |
| Ordering | Integer order_index | Allows reordering, flexible sorting |

---

## Data Flow Example: Creating a Task from a Note

```
1. User views note in Review Queue (/review)
2. User clicks "Extract Task" button
3. Modal opens pre-filled with note metadata (can edit)
4. User fills in: title, due_date, priority, etc.
5. User optionally:
   a. Uploads new files → stored to /uploads/tasks/{task-id}/
   b. Attaches existing note images → reference created in file_attachments
6. User clicks "Save Task"
   → POST /api/tasks with all data
   → task created in organization.db
   → file_attachments rows created
   → item_sources row created (optional tracking)
   → item_sources.source_note_id = original note's ID
7. Success message
8. Continue to next note in queue
```

---

## Reverse Chronological Ordering

The review queue shows notes **newest first** (modified_datetime DESC):

```sql
SELECT * FROM notes 
WHERE processed = 0 OR status != 'analyzed'
ORDER BY modified_datetime DESC
LIMIT 20
OFFSET {page * 20}
```

This ensures:
- Recently edited notes appear first
- User sees latest activity
- Can process recent items before older ones
- Natural progression through notes

---

## Migration Path from notes.db

The `extracted_tasks`, `extracted_ideas`, `extracted_projects` in notes.db are **NOT** directly migrated. Instead:

1. User reviews notes and **manually creates** new items in organization.db
2. Can use extracted data as **inspiration** but create fresh entries
3. Optionally tracks source via `item_sources` table
4. This maintains clean separation and allows refinement during extraction

---

## Files to Review

1. **PLANNING.md** - Complete 10-section planning document with:
   - Current structure summary
   - Database schema (SQL)
   - File handling approach
   - UI flow recommendations
   - Implementation roadmap
   - Technical decisions

2. **IMPLEMENTATION_GUIDE.md** - Code examples for:
   - TypeScript type definitions
   - Database utilities
   - API routes
   - Upload handlers
   - UI components (review queue, modals)
   - Testing checklist

3. **RESEARCH_SUMMARY.md** (this file) - Overview and key findings

---

## Immediate Next Steps

1. Review both PLANNING.md and IMPLEMENTATION_GUIDE.md
2. Create `types/organization.ts` with provided type definitions
3. Create `lib/organization-db.ts` with database utilities
4. Initialize `organization.db` (will be created on first database access)
5. Create `/app/review` page with note carousel and extraction modals
6. Build task creation modal and API endpoint
7. Test end-to-end: create task from note → verify in DB → show in task list

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Current Notes | Unknown (querying at runtime) |
| Current Images | 454 files (~520MB) |
| New Tables | 16 |
| New API Routes | ~15 (tasks, chores, ideas, projects, uploads) |
| New Pages | 6 (/review, /tasks, /ideas, /projects, /chores, /dashboard) |
| Implementation Phases | 5 |
| Estimated Duration | 2-3 weeks for phases 1-3, ongoing for phases 4-5 |

