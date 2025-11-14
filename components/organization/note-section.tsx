'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Note, CreateNoteInput, NoteType, Project, Chore, Task, Idea } from '@/types/organization';
import { CopyFormPromptButton } from '@/components/copy-form-prompt-button';
import { EnhancedPasteModal } from '@/components/enhanced-paste-modal';
import { useFocus } from '@/components/organization/focus-context';
import type { FormPromptConfig } from '@/lib/form-prompt-generator';

interface NoteSectionProps {
  noteId: string;
  noteModifiedDate: string | null;
}

export function NoteSection({ noteId, noteModifiedDate }: NoteSectionProps) {
  const { focusedSection, setFocusedSection } = useFocus();
  const [isExpanded, setIsExpanded] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [formData, setFormData] = useState<CreateNoteInput>({
    title: '',
    content: '',
    note_type: 'normal',
    category: '',
    tags: [],
    linked_items: [],
    source_note_id: noteId,
    source_note_date: noteModifiedDate || undefined,
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  const isFocused = focusedSection === 'notes';

  // Fetch existing notes and entities
  useEffect(() => {
    fetchNotes();
    fetchProjects();
    fetchChores();
    fetchTasks();
    fetchIdeas();
  }, []);

  // Keyboard shortcut for paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (isFocused) {
          e.preventDefault();
          setShowPasteModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/org-notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchChores = async () => {
    try {
      const response = await fetch('/api/chores');
      if (response.ok) {
        const data = await response.json();
        setChores(data);
      }
    } catch (error) {
      console.error('Failed to fetch chores:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchIdeas = async () => {
    try {
      const response = await fetch('/api/ideas');
      if (response.ok) {
        const data = await response.json();
        setIdeas(data);
      }
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/org-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setFormData({
          title: '',
          content: '',
          note_type: 'normal',
          category: '',
          tags: [],
          linked_items: [],
          source_note_id: noteId,
          source_note_date: noteModifiedDate || undefined
        });
        setTagInput('');
        setIsCreating(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleToggleLinkedItem = (itemType: 'project' | 'chore' | 'task' | 'idea', itemId: string) => {
    const linkedItems = formData.linked_items || [];
    const existingIndex = linkedItems.findIndex(
      item => item.item_type === itemType && item.item_id === itemId
    );

    if (existingIndex >= 0) {
      // Remove if exists
      setFormData({
        ...formData,
        linked_items: linkedItems.filter((_, index) => index !== existingIndex),
      });
    } else {
      // Add if doesn't exist
      setFormData({
        ...formData,
        linked_items: [...linkedItems, { item_type: itemType, item_id: itemId }],
      });
    }
  };

  const isLinked = (itemType: 'project' | 'chore' | 'task' | 'idea', itemId: string) => {
    return (formData.linked_items || []).some(
      item => item.item_type === itemType && item.item_id === itemId
    );
  };

  // Handle delete note
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/org-notes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(notes.filter(n => n.id !== id));
      } else {
        alert('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  // Form prompt configuration for AI
  const formPromptConfig: FormPromptConfig = useMemo(() => ({
    formType: 'Note',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        maxLength: 100,
        required: true,
      },
      {
        name: 'content',
        label: 'Content',
        type: 'textarea',
        maxLength: 2000,
      },
      {
        name: 'noteType',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'secret', label: 'Secret' },
        ],
      },
      {
        name: 'category',
        label: 'Category',
        type: 'text',
        maxLength: 50,
      },
      {
        name: 'tags',
        label: 'Tags',
        type: 'multiselect',
        options: [],
      },
    ],
  }), []);

  // Handle pasted AI response
  const handlePaste = (data: any) => {
    const updated: CreateNoteInput = {
      ...formData,
    };

    if (data.title) updated.title = data.title;
    if (data.content) updated.content = data.content;
    if (data.noteType) updated.note_type = data.noteType as NoteType;
    if (data.category) updated.category = data.category;

    // Handle tags array
    if (data.tags && Array.isArray(data.tags)) {
      updated.tags = data.tags;
    }

    setFormData(updated);
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div className="text-left">
            <h3 className="font-semibold text-lg">Notes</h3>
            <p className="text-sm text-muted-foreground">
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-xl">{isExpanded ? '−' : '+'}</span>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Existing Notes */}
          {notes.length > 0 && (
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded border bg-secondary/50 hover:bg-secondary transition-colors relative group"
                >
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-destructive"
                    title="Delete note"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-start gap-2 pr-6">
                    {note.note_type === 'secret' && (
                      <span className="text-lg" title="Secret note">🔒</span>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{note.title}</h4>
                      {note.content && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {note.content.length > 150
                            ? `${note.content.substring(0, 150)}...`
                            : note.content
                          }
                        </p>
                      )}
                      {note.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-accent">
                          {note.category}
                        </span>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(note.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Note Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-4 py-2 rounded border border-dashed border-muted-foreground/50 hover:border-muted-foreground hover:bg-accent transition-colors text-sm"
            >
              + Create New Note
            </button>
          )}

          {/* Create Form */}
          {isCreating && (
            <div
              className={`space-y-3 transition-all ${isFocused ? 'ring-2 ring-blue-500 rounded-lg p-2' : ''}`}
              onClick={() => setFocusedSection('notes')}
            >
              {/* Form Header with Copy & Paste Buttons */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Create New Note {isFocused && <span className="text-blue-600 text-xs ml-2">● Focused (Cmd+V to paste)</span>}
                </h4>
                <div className="flex gap-2">
                  <CopyFormPromptButton config={formPromptConfig} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPasteModal(true);
                    }}
                    className="text-sm px-3 py-1.5 rounded border bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Paste</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded border bg-accent">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal">(max 100)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title"
                  className="w-full px-3 py-2 rounded border bg-background"
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content <span className="text-muted-foreground font-normal">(max 2000)</span></label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Note content"
                  rows={4}
                  className="w-full px-3 py-2 rounded border bg-background resize-none"
                  maxLength={2000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, note_type: 'normal' })}
                    className={`flex-1 px-3 py-2 rounded border ${
                      formData.note_type === 'normal'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-accent'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, note_type: 'secret' })}
                    className={`flex-1 px-3 py-2 rounded border flex items-center justify-center gap-2 ${
                      formData.note_type === 'secret'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-accent'
                    }`}
                  >
                    <span>🔒</span>
                    Secret
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category <span className="text-muted-foreground font-normal">(max 50)</span></label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Personal, Work, Ideas"
                  className="w-full px-3 py-2 rounded border bg-background"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags <span className="text-muted-foreground font-normal">(max 50 per tag)</span></label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a tag"
                    className="flex-1 px-3 py-2 rounded border bg-background"
                    maxLength={50}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 rounded border hover:bg-accent"
                  >
                    Add
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-secondary"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Link to Projects, Chores, Tasks, Ideas */}
              <div>
                <label className="block text-sm font-medium mb-2">Link to Items</label>
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded p-3 bg-background/50">
                  {/* Projects */}
                  {projects.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">📁 Projects</h4>
                      <div className="space-y-1">
                        {projects.map((project) => (
                          <label key={project.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={isLinked('project', project.id)}
                              onChange={() => handleToggleLinkedItem('project', project.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{project.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chores */}
                  {chores.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">🏠 Chores</h4>
                      <div className="space-y-1">
                        {chores.map((chore) => (
                          <label key={chore.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={isLinked('chore', chore.id)}
                              onChange={() => handleToggleLinkedItem('chore', chore.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{chore.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {tasks.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">✓ Tasks</h4>
                      <div className="space-y-1">
                        {tasks.map((task) => (
                          <label key={task.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={isLinked('task', task.id)}
                              onChange={() => handleToggleLinkedItem('task', task.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{task.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ideas */}
                  {ideas.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">💡 Ideas</h4>
                      <div className="space-y-1">
                        {ideas.map((idea) => (
                          <label key={idea.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={isLinked('idea', idea.id)}
                              onChange={() => handleToggleLinkedItem('idea', idea.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{idea.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {projects.length === 0 && chores.length === 0 && tasks.length === 0 && ideas.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items available to link
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  className="flex-1 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setFormData({
                      title: '',
                      content: '',
                      note_type: 'normal',
                      category: '',
                      tags: [],
                      linked_items: [],
                      source_note_id: noteId,
                      source_note_date: noteModifiedDate || undefined
                    });
                    setTagInput('');
                  }}
                  className="px-4 py-2 rounded border hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Paste Modal */}
      <EnhancedPasteModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onApply={handlePaste}
        config={formPromptConfig}
        autoReadClipboard={true}
      />
    </div>
  );
}
