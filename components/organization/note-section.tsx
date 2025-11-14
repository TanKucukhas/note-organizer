'use client';

import { useState, useEffect } from 'react';
import type { Note, CreateNoteInput, NoteType } from '@/types/organization';

interface NoteSectionProps {
  noteId: string;
}

export function NoteSection({ noteId }: NoteSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateNoteInput>({
    title: '',
    content: '',
    note_type: 'normal',
    category: '',
    tags: [],
    source_note_id: noteId,
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch existing notes
  useEffect(() => {
    fetchNotes();
  }, []);

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
          source_note_id: noteId
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
                  className="p-3 rounded border bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-start gap-2">
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
            <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded border bg-accent">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title"
                  className="w-full px-3 py-2 rounded border bg-background"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Note content"
                  rows={4}
                  className="w-full px-3 py-2 rounded border bg-background resize-none"
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
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Personal, Work, Ideas"
                  className="w-full px-3 py-2 rounded border bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a tag"
                    className="flex-1 px-3 py-2 rounded border bg-background"
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
                      source_note_id: noteId
                    });
                    setTagInput('');
                  }}
                  className="px-4 py-2 rounded border hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
