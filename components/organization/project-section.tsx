'use client';

import { useState, useEffect } from 'react';
import type { Project, CreateProjectInput } from '@/types/organization';

interface ProjectSectionProps {
  noteId: string;
}

export function ProjectSection({ noteId }: ProjectSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateProjectInput>({
    title: '',
    intro: '',
    description: '',
    source_note_id: noteId,
  });
  const [loading, setLoading] = useState(false);

  // Fetch existing projects
  useEffect(() => {
    fetchProjects();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([newProject, ...projects]);
        setFormData({ title: '', intro: '', description: '', source_note_id: noteId });
        setIsCreating(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
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
          <span className="text-2xl">📁</span>
          <div className="text-left">
            <h3 className="font-semibold text-lg">Projects</h3>
            <p className="text-sm text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-xl">{isExpanded ? '−' : '+'}</span>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Existing Projects */}
          {projects.length > 0 && (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 rounded border bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <h4 className="font-medium">{project.title}</h4>
                  {project.intro && (
                    <p className="text-sm text-muted-foreground mt-1">{project.intro}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(project.created_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Project Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-4 py-2 rounded border border-dashed border-muted-foreground/50 hover:border-muted-foreground hover:bg-accent transition-colors text-sm"
            >
              + Create New Project
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
                  placeholder="Project title"
                  className="w-full px-3 py-2 rounded border bg-background"
                  required
                  autoFocus
                />
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
                    setFormData({ title: '', intro: '', description: '', source_note_id: noteId });
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
