'use client';

import { useState, useEffect } from 'react';
import type { Idea, ProjectType, Group, CreateIdeaInput } from '@/types/organization';

interface IdeaSectionProps {
  noteId: string;
  noteModifiedDate: string | null;
}

export function IdeaSection({ noteId, noteModifiedDate }: IdeaSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateIdeaInput>({
    title: '',
    intro: '',
    description: '',
    source_note_id: noteId,
    source_note_date: noteModifiedDate || undefined,
  });
  const [loading, setLoading] = useState(false);

  // Fetch existing ideas, project types, and groups
  useEffect(() => {
    fetchIdeas();
    fetchProjectTypes();
    fetchGroups();
  }, []);

  const fetchProjectTypes = async () => {
    try {
      const response = await fetch('/api/project-types');
      if (response.ok) {
        const data = await response.json();
        setProjectTypes(data);
      }
    } catch (error) {
      console.error('Failed to fetch project types:', error);
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
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newIdea = await response.json();
        setIdeas([newIdea, ...ideas]);
        setFormData({ title: '', intro: '', description: '', source_note_id: noteId, source_note_date: noteModifiedDate || undefined });
        setIsCreating(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create idea:', error);
      alert('Failed to create idea');
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
          <span className="text-2xl">💡</span>
          <div className="text-left">
            <h3 className="font-semibold text-lg">Ideas</h3>
            <p className="text-sm text-muted-foreground">
              {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-xl">{isExpanded ? '−' : '+'}</span>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Existing Ideas */}
          {ideas.length > 0 && (
            <div className="space-y-2">
              {ideas.map((idea) => {
                const ideaWithType = idea as any;
                const ideaType = ideaWithType.idea_type;
                const ideaGroup = idea.group_id ? groups.find(g => g.id === idea.group_id) : null;

                return (
                  <div
                    key={idea.id}
                    className="p-3 rounded border bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium flex-1">{idea.title}</h4>
                          <div className="flex gap-1.5">
                            {ideaGroup && (
                              <span
                                className="px-2 py-1 text-xs rounded-full font-medium text-white"
                                style={{ backgroundColor: ideaGroup.color || '#6B7280' }}
                              >
                                {ideaGroup.icon} {ideaGroup.name}
                              </span>
                            )}
                            {ideaType && (
                              <span
                                className="px-2 py-1 text-xs rounded-full font-medium text-white"
                                style={{ backgroundColor: ideaType.color || '#6B7280' }}
                              >
                                {ideaType.icon} {ideaType.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {idea.intro && (
                          <p className="text-sm text-muted-foreground mt-1">{idea.intro}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(idea.created_date).toLocaleDateString()} • {idea.status}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create New Idea Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-4 py-2 rounded border border-dashed border-muted-foreground/50 hover:border-muted-foreground hover:bg-accent transition-colors text-sm"
            >
              + Create New Idea
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
                  placeholder="Idea title"
                  className="w-full px-3 py-2 rounded border bg-background"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Idea Type</label>
                <select
                  value={formData.idea_type_id || ''}
                  onChange={(e) => setFormData({ ...formData, idea_type_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded border bg-background"
                >
                  <option value="">Select a type (optional)</option>
                  {projectTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Group</label>
                <select
                  value={formData.group_id || ''}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded border bg-background"
                >
                  <option value="">Select a group (optional)</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.icon} {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Intro</label>
                <input
                  type="text"
                  value={formData.intro || ''}
                  onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                  placeholder="One-line introduction"
                  className="w-full px-3 py-2 rounded border bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full description (supports markdown)"
                  rows={3}
                  className="w-full px-3 py-2 rounded border bg-background resize-none"
                />
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
                    setFormData({ title: '', intro: '', description: '', source_note_id: noteId, source_note_date: noteModifiedDate || undefined });
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
