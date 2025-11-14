'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Chore, Group, CreateChoreInput } from '@/types/organization';
import { CopyFormPromptButton } from '@/components/copy-form-prompt-button';
import { EnhancedPasteModal } from '@/components/enhanced-paste-modal';
import { useFocus } from '@/components/organization/focus-context';
import type { FormPromptConfig } from '@/lib/form-prompt-generator';

interface ChoreSectionProps {
  noteId: string;
  noteModifiedDate: string | null;
}

export function ChoreSection({ noteId, noteModifiedDate }: ChoreSectionProps) {
  const { focusedSection, setFocusedSection } = useFocus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [chores, setChores] = useState<Chore[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [formData, setFormData] = useState<CreateChoreInput>({
    title: '',
    description: '',
    source_note_id: noteId,
    source_note_date: noteModifiedDate || undefined,
    is_recurring: false,
  });
  const [loading, setLoading] = useState(false);

  const isFocused = focusedSection === 'chores';

  // Fetch existing chores and groups
  useEffect(() => {
    fetchChores();
    fetchGroups();
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

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newChore = await response.json();
        setChores([newChore, ...chores]);
        setFormData({
          title: '',
          description: '',
          source_note_id: noteId,
          source_note_date: noteModifiedDate || undefined,
          is_recurring: false,
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create chore:', error);
      alert('Failed to create chore');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete chore
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chore?')) return;

    try {
      const response = await fetch(`/api/chores/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChores(chores.filter(c => c.id !== id));
      } else {
        alert('Failed to delete chore');
      }
    } catch (error) {
      console.error('Error deleting chore:', error);
      alert('Failed to delete chore');
    }
  };

  // Form prompt configuration for AI
  const formPromptConfig: FormPromptConfig = useMemo(() => ({
    formType: 'Chore',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        maxLength: 100,
        required: true,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        maxLength: 500,
      },
      {
        name: 'isRecurring',
        label: 'Is Recurring',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
      },
      {
        name: 'recurrencePattern',
        label: 'Recurrence Pattern',
        type: 'select',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'custom', label: 'Custom' },
        ],
      },
    ],
  }), []);

  // Handle pasted AI response
  const handlePaste = (data: any) => {
    const updated: CreateChoreInput = {
      ...formData,
    };

    if (data.title) updated.title = data.title;
    if (data.description) updated.description = data.description;

    // Handle isRecurring boolean or string
    if (data.isRecurring !== undefined) {
      if (typeof data.isRecurring === 'boolean') {
        updated.is_recurring = data.isRecurring;
      } else if (typeof data.isRecurring === 'string') {
        updated.is_recurring = data.isRecurring.toLowerCase() === 'true' || data.isRecurring.toLowerCase() === 'yes';
      }
    }

    if (data.recurrencePattern) {
      updated.recurrence_pattern = data.recurrencePattern;
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
          <span className="text-2xl">🏠</span>
          <div className="text-left">
            <h3 className="font-semibold text-lg">Chores</h3>
            <p className="text-sm text-muted-foreground">
              {chores.length} chore{chores.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-xl">{isExpanded ? '−' : '+'}</span>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Existing Chores */}
          {chores.length > 0 && (
            <div className="space-y-2">
              {chores.map((chore) => {
                const choreGroup = chore.group_id ? groups.find(g => g.id === chore.group_id) : null;

                return (
                  <div
                    key={chore.id}
                    className="p-3 rounded border bg-secondary/50 hover:bg-secondary transition-colors relative group"
                  >
                    <button
                      onClick={() => handleDelete(chore.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-destructive"
                      title="Delete chore"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex items-start gap-2 pr-6">
                      <input
                        type="checkbox"
                        checked={chore.completed}
                        className="mt-1"
                        readOnly
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{chore.title}</h4>
                        {chore.description && (
                          <p className="text-sm text-muted-foreground mt-1">{chore.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {choreGroup && (
                            <span
                              className="text-xs px-2 py-0.5 rounded font-medium text-white"
                              style={{ backgroundColor: choreGroup.color || '#6B7280' }}
                            >
                              {choreGroup.icon} {choreGroup.name}
                            </span>
                          )}
                          {chore.is_recurring && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900">
                              🔄 Recurring
                            </span>
                          )}
                          {chore.recurrence_pattern && (
                            <span className="text-xs px-2 py-0.5 rounded bg-background">
                              {chore.recurrence_pattern}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create Form */}
          <div
            className={`space-y-3 transition-all ${isFocused ? 'ring-2 ring-blue-500 rounded-lg p-2' : ''}`}
            onClick={() => setFocusedSection('chores')}
          >
            {/* Form Header with Copy & Paste Buttons */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Add New Chore {isFocused && <span className="text-blue-600 text-xs ml-2">● Focused (Cmd+V to paste)</span>}
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
                  placeholder="Chore title"
                  className="w-full px-3 py-2 rounded border bg-background"
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description <span className="text-muted-foreground font-normal">(max 500)</span></label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Chore description"
                  rows={2}
                  className="w-full px-3 py-2 rounded border bg-background resize-none"
                  maxLength={500}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring || false}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_recurring" className="text-sm font-medium">
                  This is a recurring chore
                </label>
              </div>

              {formData.is_recurring && (
                <div>
                  <label className="block text-sm font-medium mb-1">Recurrence Pattern</label>
                  <select
                    value={formData.recurrence_pattern || ''}
                    onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                    className="w-full px-3 py-2 rounded border bg-background"
                  >
                    <option value="">Select pattern</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Group</label>
                <select
                  value={formData.group_id || ''}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded border bg-background"
                >
                  <option value="">None</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.icon} {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  className="flex-1 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Chore'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      title: '',
                      description: '',
                      source_note_id: noteId,
                      source_note_date: noteModifiedDate || undefined,
                      is_recurring: false,
                    });
                  }}
                  className="px-4 py-2 rounded border hover:bg-accent"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
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
