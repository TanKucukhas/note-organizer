# Quick Reference - Manual Note Organization System

## Document Structure

Three comprehensive documents have been created:

1. **PLANNING.md** (10 sections, ~600 lines)
   - Current structure analysis
   - New database schema (SQL)
   - File handling approach
   - UI flow recommendations
   - Implementation roadmap
   - Key technical decisions

2. **IMPLEMENTATION_GUIDE.md** (7 sections, ~600 lines)
   - TypeScript type definitions
   - Database utility code
   - API route examples
   - Upload handler code
   - React component code (Review Queue)
   - Testing checklist

3. **RESEARCH_SUMMARY.md** (Brief overview)
   - Key findings
   - Architecture overview
   - Data flow examples
   - Next steps

---

## At a Glance

### Current Setup
```
notes.db (371MB)
├── 12 tables (imported Apple Notes data)
├── 454 images in /individual_notes/images/
├── Status: read-only, fixed schema
└── Served via existing API routes
```

### New Setup (Recommended)
```
organization.db (NEW)
├── 16 tables (user-created organized items)
├── Tasks, Chores, Ideas, Projects
├── File attachments (new uploads + references to notes.db images)
├── Status: read/write, extensible schema
└── Separate from notes.db completely
```

### File Handling
```
/uploads/
├── tasks/{task-id}/
├── ideas/{idea-id}/
├── projects/{project-id}/
└── chores/{chore-id}/

PLUS: References to /individual_notes/images/
```

---

## Database Schema Summary

### organization.db Tables

**Item Tables:**
- `tasks` - title, description, due_date, priority, status, project_id, idea_id
- `chores` - title, description, is_recurring, recurrence_pattern, date_last_completed
- `ideas` - title, intro, description, category, status
- `projects` - title, intro, description, category, status, date_completed

**Relationship Tables:**
- `project_ideas` - projects contain ideas (1-to-many)
- `project_tasks` - projects contain tasks (1-to-many)
- `idea_tags` - ideas have multiple tags (many-to-many)
- `project_tags` - projects have multiple tags (many-to-many)

**File & Tracking:**
- `file_attachments` - unified table for any item type (task/chore/idea/project)
- `item_sources` - optional: link back to source note

**Indexes:**
- status, created_at DESC, priority, due_date (for fast queries)

---

## Implementation Checklist

### Phase 1: Database (Week 1)
- [ ] Create `types/organization.ts`
- [ ] Create `lib/organization-db.ts`
- [ ] Initialize `organization.db` on app start
- [ ] Test database connection and schema creation

### Phase 2: API Routes (Week 1-2)
- [ ] `POST /api/tasks` - create
- [ ] `GET /api/tasks` - list with filters
- [ ] `GET /api/tasks/[id]` - get single
- [ ] `PUT /api/tasks/[id]` - update
- [ ] `DELETE /api/tasks/[id]` - delete
- [ ] Repeat for chores, ideas, projects
- [ ] `POST /api/uploads/[type]/[itemId]` - file upload
- [ ] Test all endpoints with Postman/curl

### Phase 3: UI Components (Week 2-3)
- [ ] `ReviewQueue` page component with note carousel
- [ ] `TaskModal` component
- [ ] `IdeaModal` component
- [ ] `ProjectModal` component
- [ ] `ChoreModal` component
- [ ] `FileUpload` component with drag-drop
- [ ] `TaskList` page component
- [ ] `IdeaList` page component
- [ ] `ProjectList` page component
- [ ] `ChoreList` page component

### Phase 4: Integration (Week 3)
- [ ] Enable dashboard links
- [ ] Add breadcrumb navigation
- [ ] Add search/filter to list views
- [ ] Update `ActionCard` disabled states

### Phase 5: Polish (Ongoing)
- [ ] Drag-drop reordering
- [ ] Markdown editor/preview
- [ ] Recurring chore tracking
- [ ] Project progress indicators
- [ ] Tag management UI
- [ ] Bulk operations

---

## API Endpoints to Create

### Tasks
- `GET /api/tasks` - filters: status, priority, project_id, search, sortBy, sortOrder, limit, offset
- `POST /api/tasks` - body: title, description, due_date, priority, project_id, idea_id
- `GET /api/tasks/[id]` - get single task
- `PUT /api/tasks/[id]` - body: partial task
- `DELETE /api/tasks/[id]` - delete task

### Chores
- Same pattern as tasks (GET, POST, GET/:id, PUT/:id, DELETE/:id)

### Ideas
- Same pattern as tasks
- Plus: `GET /api/ideas/[id]/tags` - get tags
- Plus: `POST /api/ideas/[id]/tags` - add tag

### Projects
- Same pattern as tasks
- Plus: `GET /api/projects/[id]/ideas` - get linked ideas
- Plus: `POST /api/projects/[id]/ideas` - add idea
- Plus: `DELETE /api/projects/[id]/ideas/[ideaId]` - remove idea
- Plus: same for tasks

### File Uploads
- `POST /api/uploads/[type]/[itemId]` - multipart/form-data, returns: [{filename, path, size, type}]
- `POST /api/attachments/link-note-image` - body: {item_type, item_id, note_id, image_filename}
- `DELETE /api/attachments/[attachmentId]` - delete attachment

---

## Key Code Snippets

### Create Task
```typescript
const task = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Task',
    due_date: '2024-11-20',
    priority: 2,
  }),
}).then(r => r.json());
```

### Upload Files
```typescript
const formData = new FormData();
formData.append('itemId', taskId);
files.forEach(f => formData.append('files', f));

const results = await fetch(`/api/uploads/tasks`, {
  method: 'POST',
  body: formData,
}).then(r => r.json());
```

### Link Existing Image
```typescript
await fetch('/api/attachments/link-note-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    item_type: 'task',
    item_id: taskId,
    note_id: sourceNoteId,
    image_filename: 'note_0001_img_1.png',
  }),
});
```

### Query Tasks with Filters
```typescript
const url = new URLSearchParams({
  status: 'active',
  priority: '3',
  sortBy: 'due_date',
  sortOrder: 'asc',
  limit: '20',
}).toString();

const tasks = await fetch(`/api/tasks?${url}`)
  .then(r => r.json());
```

---

## UI Layout Examples

### Review Queue
```
[Header: "Review Queue" - N/M notes]
[Progress bar]
├─ Left (2/3): Note preview
│  ├─ Title
│  ├─ Thumbnails
│  ├─ Content preview
│  └─ Metadata
└─ Right (1/3): Actions
   ├─ [Previous] [Next]
   ├─ [Extract Task]
   ├─ [Extract Idea]
   ├─ [Create Project]
   ├─ [Mark Done]
   └─ [Skip]
```

### Task List
```
[Header: "Tasks" - [Add Task] [Filter]]
├─ Due Today (N)
│  ├─ ☐ Task 1 [P2]
│  └─ ☐ Task 2 [P3]
├─ Upcoming (N)
│  ├─ ☐ Task 3 [P1] Nov 20
│  └─ ☐ Task 4 [P2] Dec 1
├─ No Date (N)
│  └─ ☐ Task 5 [P2]
└─ Completed [collapsed]
   └─ ✓ Task 6
```

---

## Database Connection Pattern

```typescript
// lib/organization-db.ts
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'organization.db');
let db: Database.Database | null = null;

export function getOrganizationDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { 
      readonly: false,
      fileMustExist: false // Creates if needed
    });
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    initializeSchema(); // Create tables if new
  }
  return db;
}

// In API routes and server-side code:
const db = getOrganizationDatabase();
const result = db.prepare('SELECT * FROM tasks').all();
```

---

## Testing Priorities

1. **Database**: Can create and query items
2. **API**: All CRUD endpoints work
3. **File Upload**: Files save to correct directories
4. **Review Queue**: Notes load and display correctly
5. **Modals**: Can create items from review page
6. **List Views**: Items appear after creation
7. **Relationships**: Projects can link ideas/tasks
8. **Filtering**: List views filter correctly

---

## Deployment Considerations

1. **Database Migration**: organization.db will be created on first run
2. **Backup**: Keep organization.db separate from notes.db in backups
3. **Uploads Folder**: Ensure `/uploads/` directory is in .gitignore
4. **File Cleanup**: Implement cleanup for deleted items' uploaded files
5. **Schema Versioning**: Track organization.db schema version if future migrations needed

---

## Common Patterns

### Status Enums
```typescript
Task: 'active' | 'completed' | 'archived'
Chore: 'active' | 'completed' | 'archived'
Idea: 'active' | 'developing' | 'shelved' | 'trashed'
Project: 'active' | 'in-progress' | 'completed' | 'shelved' | 'trashed'
```

### Priority Enums
```typescript
Task priority: 0 (none) | 1 (low) | 2 (medium) | 3 (high)
Recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly'
```

### Timestamp Format
```typescript
// All timestamps: ISO 8601 format
created_at: "2024-11-13T10:30:00.000Z"
modified_at: "2024-11-13T15:45:30.000Z"
```

---

## Helpful Resources

- **better-sqlite3 docs**: https://github.com/WiseLibs/better-sqlite3
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React 19**: https://react.dev/blog/2024/12/05/react-19

---

## Questions to Ask Yourself

1. Should items be deleted or marked trashed?
   - Answer: Both options available (status='trashed' or hard delete)

2. Can a task belong to multiple projects?
   - Answer: No (single project_id), but can create multiple tasks

3. Can ideas belong to multiple projects?
   - Answer: Yes (junction table project_ideas)

4. Should I migrate existing extracted items?
   - Answer: No, create fresh items. Extracted data is inspiration.

5. How do I handle files when deleting an item?
   - Answer: Implement cleanup in DELETE endpoints to remove uploaded files

---

## File Sizes & Limits

- **notes.db**: 371MB (read-only, fixed)
- **organization.db**: ~1-10MB (estimated for typical usage)
- **Images in /uploads/**: Recommend 50MB per item (sum of all files)
- **Individual files**: No hard limit, but user should manage disk space

---

## Next Actions

1. Open PLANNING.md for detailed architecture
2. Open IMPLEMENTATION_GUIDE.md for code templates
3. Start with Phase 1: Create types and database utilities
4. Test database creation and basic CRUD
5. Build Review Queue page once database is working
6. Add modals for creating items
7. Connect everything together

Good luck!
