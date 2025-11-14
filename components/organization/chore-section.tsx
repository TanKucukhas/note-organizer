'use client';

import { useState, useEffect } from 'react';
import type { Chore, Group, CreateChoreInput } from '@/types/organization';

interface ChoreSectionProps {
  noteId: string;
}

export function ChoreSection({ noteId }: ChoreSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [chores, setChores] = useState<Chore[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateChoreInput>({
    title: '',
    description: '',
    source_note_id: noteId,
    is_recurring: false,
  });
  const [loading, setLoading] = useState(false);

  // Fetch existing chores and groups
  useEffect(() => {
    fetchChores();
    fetchGroups();
  }, []);

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
          is_recurring: false,
        });
        setIsCreating(false);
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
                    className="p-3 rounded border bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start gap-2">
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

          {/* Add New Chore Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-4 py-2 rounded border border-dashed border-muted-foreground/50 hover:border-muted-foreground hover:bg-accent transition-colors text-sm"
            >
              + Add New Chore
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
                  placeholder="Chore title"
                  className="w-full px-3 py-2 rounded border bg-background"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Chore description"
                  rows={2}
                  className="w-full px-3 py-2 rounded border bg-background resize-none"
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
                    setIsCreating(false);
                    setFormData({
                      title: '',
                      description: '',
                      source_note_id: noteId,
                      is_recurring: false,
                    });
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
