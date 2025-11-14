# Planning Documents - Manual Note Organization System

## Overview

Four comprehensive planning documents have been created to guide the implementation of a manual note organization flow. This system allows users to extract structured items (Tasks, Chores, Ideas, Projects) from their Apple Notes collection.

**Total Documentation**: 2,265 lines across 4 documents

---

## Documents Guide

### 1. QUICK_REFERENCE.md (Start Here!)
**Size**: 10KB | **Lines**: 386 | **Read Time**: 10 min

Quick lookup guide with:
- At-a-glance summaries
- Database schema overview
- Implementation checklist
- API endpoints list
- Code snippets
- Common patterns

**Read this first** for a high-level understanding.

---

### 2. RESEARCH_SUMMARY.md (Architecture Overview)
**Size**: 11KB | **Lines**: 324 | **Read Time**: 15 min

Executive summary covering:
- Current state analysis (notes.db structure)
- Problem statement
- Recommended architecture (two-database approach)
- Database schema concepts
- File handling strategy
- UI/UX flow overview
- Implementation phases
- Data flow examples
- Key technical decisions

**Read this second** to understand the overall approach.

---

### 3. PLANNING.md (Detailed Design)
**Size**: 24KB | **Lines**: 639 | **Read Time**: 30 min

Complete 10-section planning document:

1. **Current Structure Summary**
   - Database schema (12 tables)
   - Image storage (454 files)
   - UI components analysis
   - API routes overview
   - Tech stack inventory

2. **New Items Structure**
   - Why separate database
   - organization.db rationale

3. **Recommended Database Schema**
   - Complete SQL schema with 16 tables
   - Relationships and indexes
   - Field definitions

4. **File Handling Approach**
   - Three options analysis
   - Recommended hybrid approach
   - Upload structure
   - Image linking strategy

5. **Review Flow UI Recommendations**
   - Review queue layout
   - Note card design
   - Extraction modals
   - List views (tasks, ideas, projects, chores)
   - Reverse chronological ordering

6. **Implementation Roadmap**
   - 5 phases with detailed steps

7. **Key Technical Decisions**
   - Decision matrix

8. **Estimated File Uploads Structure**
   - Directory organization

9. **Migration Considerations**
   - From notes.db extraction to organization.db

10. **Summary Table**
    - Comparison of current vs new systems

**Read this third** for detailed specifications.

---

### 4. IMPLEMENTATION_GUIDE.md (Code Templates)
**Size**: 26KB | **Lines**: 916 | **Read Time**: 40 min

Code examples and templates covering:

1. **Types Definition**
   - Full TypeScript interfaces for all item types
   - Request types, filter types

2. **Database Utilities**
   - Connection pattern
   - Schema initialization
   - Complete CRUD operations (150+ lines of code)
   - File attachment operations
   - Tag operations

3. **API Route Example**
   - POST /api/tasks with validation
   - Query parameter filtering

4. **Upload Handler**
   - File upload endpoint
   - Multipart form handling
   - Directory creation and file writing

5. **Review Queue Component**
   - React component with state management
   - Note carousel logic
   - Progress tracking
   - Action buttons

6. **Testing Checklist**
   - 8-point verification list

7. **Next Steps**
   - 7-step implementation sequence

**Read this fourth** for implementation details with working code.

---

## Reading Paths

### Path 1: High-Level Overview (30 minutes)
1. QUICK_REFERENCE.md (10 min)
2. RESEARCH_SUMMARY.md (15 min)
3. Skim PLANNING.md sections 1-2 (5 min)

**Output**: Understanding of what needs to be built

---

### Path 2: Architecture Deep Dive (60 minutes)
1. QUICK_REFERENCE.md (10 min)
2. RESEARCH_SUMMARY.md (15 min)
3. PLANNING.md sections 2-4 (20 min)
4. IMPLEMENTATION_GUIDE.md sections 1-2 (15 min)

**Output**: Clear picture of database structure and API

---

### Path 3: Full Implementation Plan (90 minutes)
1. All documents in order
2. Focus on PLANNING.md section 6 (Implementation Roadmap)
3. Use IMPLEMENTATION_GUIDE.md as code reference
4. Check QUICK_REFERENCE.md implementation checklist

**Output**: Ready to start coding with templates

---

### Path 4: Developer Reference (As Needed)
- QUICK_REFERENCE.md - Quick lookup of endpoints, patterns, enums
- IMPLEMENTATION_GUIDE.md - Code templates and examples
- PLANNING.md section 3 - Database schema details
- PLANNING.md section 5 - UI/UX specifications

**Output**: Answers to specific implementation questions

---

## Key Takeaways

### Architecture Decision
```
notes.db (371MB)        organization.db (new)
├─ Apple Notes data     ├─ User-created items
├─ 12 tables            ├─ 16 tables
├─ Read-only            ├─ Read/Write
└─ Imported             └─ New organization
```

### Implementation Phases
1. **Phase 1**: Database setup (types + utilities)
2. **Phase 2**: API routes (CRUD operations)
3. **Phase 3**: UI components (pages + modals)
4. **Phase 4**: Integration (navigation + linking)
5. **Phase 5**: Polish (advanced features)

### Core Item Types
- **Tasks**: title, due_date, priority, project/idea links
- **Chores**: title, recurring flag, completion tracking
- **Ideas**: title, markdown description, status, tags
- **Projects**: title, description, linked ideas/tasks

### File Handling
- New uploads → `/uploads/[type]/[itemId]/`
- Existing note images → Referenced via file_attachments table
- No duplication, clear separation

---

## Document Statistics

| Document | Size | Lines | Sections | Focus |
|----------|------|-------|----------|-------|
| QUICK_REFERENCE.md | 10KB | 386 | 15 | Quick lookup |
| RESEARCH_SUMMARY.md | 11KB | 324 | 10 | Overview |
| PLANNING.md | 24KB | 639 | 10 | Detailed design |
| IMPLEMENTATION_GUIDE.md | 26KB | 916 | 7 | Code templates |
| **TOTAL** | **71KB** | **2,265** | **42** | Complete plan |

---

## Quick Navigation

### Looking for...?

**Database schema SQL**
→ PLANNING.md section 3

**API endpoint list**
→ QUICK_REFERENCE.md (API Endpoints section)

**TypeScript type definitions**
→ IMPLEMENTATION_GUIDE.md section 1

**Database utility code**
→ IMPLEMENTATION_GUIDE.md section 2

**Review Queue UI layout**
→ PLANNING.md section 5 OR QUICK_REFERENCE.md (UI Layout Examples)

**Implementation steps**
→ QUICK_REFERENCE.md (Implementation Checklist)

**File handling details**
→ PLANNING.md section 4

**Code examples**
→ IMPLEMENTATION_GUIDE.md sections 3-5

**Current system analysis**
→ PLANNING.md section 1

---

## Next Steps

1. **Start with QUICK_REFERENCE.md** - Get oriented (10 min)

2. **Read RESEARCH_SUMMARY.md** - Understand the approach (15 min)

3. **Skim PLANNING.md** - See the complete design (30 min)

4. **Use IMPLEMENTATION_GUIDE.md** - Code as you build (reference as needed)

5. **Execute Phase 1** - Create types and database utilities

6. **Execute Phase 2** - Build API routes

7. **Execute Phase 3** - Build UI components

---

## Files Created During Research

The planning research examined:
- `/lib/db.ts` - Current database utilities (502 lines)
- `/types/note.ts` - Current types (195 lines)
- `/app/notes/[id]/page.tsx` - Note detail page (230 lines)
- `/app/page.tsx` - Dashboard page (164 lines)
- `/components/image-gallery.tsx` - Image gallery (152 lines)
- `/app/api/notes/route.ts` - Notes API (106 lines)
- `/app/api/images/[filename]/route.ts` - Images API (78 lines)
- Database schema (12 tables, 10 indexes)

---

## Assumptions Made

1. **Separate databases** is better than trying to extend notes.db
2. **UUID for IDs** is better than auto-increment for portability
3. **Disk-based file uploads** is simpler than DB blobs
4. **Markdown for descriptions** is better than plain text
5. **Junction tables for tags** is better than single category field
6. **Reverse chronological in review queue** matches user expectations
7. **No migration of extracted items** - users create fresh entries

---

## Potential Questions

**Q: Will notes.db grow even larger?**
A: No, organization.db is separate. notes.db stays at 371MB.

**Q: Do I need to migrate extracted_tasks/ideas/projects?**
A: No, they stay in notes.db. Create new items in organization.db.

**Q: Can I attach the same image to multiple items?**
A: Yes, file_attachments are separate records per item.

**Q: What if I delete an item - are files deleted?**
A: Implement cleanup in DELETE endpoint to remove /uploads/ files.

**Q: Can a task belong to multiple projects?**
A: No, single project_id. Create multiple tasks if needed.

**Q: Can ideas be in multiple projects?**
A: Yes, project_ideas junction table supports this.

**Q: Should I use organization.db on production?**
A: Yes, same pattern as notes.db. Separate databases by environment.

---

## Support Information

If you have questions while implementing:

1. **Architecture questions** → Refer to RESEARCH_SUMMARY.md + PLANNING.md section 7
2. **Code structure questions** → Refer to IMPLEMENTATION_GUIDE.md
3. **Schema questions** → Refer to PLANNING.md section 3
4. **API design questions** → Refer to QUICK_REFERENCE.md (API section)
5. **UI/UX questions** → Refer to PLANNING.md section 5

---

## Version Info

- **Created**: November 13, 2024
- **Based on**: App state as of 15:44 UTC
- **Tech Stack**: Next.js 16, React 19, Tailwind CSS 4, TypeScript 5
- **Database**: better-sqlite3 (synchronous)

---

## Final Checklist Before Starting

- [ ] Read QUICK_REFERENCE.md
- [ ] Understand RESEARCH_SUMMARY.md key points
- [ ] Review PLANNING.md section 3 (database schema)
- [ ] Have IMPLEMENTATION_GUIDE.md open as reference
- [ ] Create `types/organization.ts` from template
- [ ] Create `lib/organization-db.ts` from template
- [ ] Test database initialization
- [ ] Begin Phase 1 implementation

---

**Good luck with your implementation! All the planning is done - now it's coding time.**
