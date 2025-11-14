'use client';

import { useState, useEffect } from 'react';
import type { Project, ProjectType, Group, CreateProjectInput } from '@/types/organization';
import { CreateEntityModal } from '@/components/create-entity-modal';

interface ProjectSectionProps {
  noteId: string;
  noteModifiedDate: string | null;
}

export function ProjectSection({ noteId, noteModifiedDate }: ProjectSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [formData, setFormData] = useState<CreateProjectInput>({
    title: '',
    intro: '',
    description: '',
    status: 'planning',
    project_type_ids: [],
    source_note_id: noteId,
    source_note_date: noteModifiedDate || undefined,
  });
  const [loading, setLoading] = useState(false);

  // Fetch existing projects, project types, and groups
  useEffect(() => {
    fetchProjects();
    fetchProjectTypes();
    fetchGroups();
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
        setFormData({ title: '', intro: '', description: '', status: 'planning', project_type_ids: [], source_note_id: noteId, source_note_date: noteModifiedDate || undefined });
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
              {projects.map((project) => {
                const projectWithTypes = project as any;
                const projectTypes = projectWithTypes.project_types || [];
                const projectGroup = project.group_id ? groups.find(g => g.id === project.group_id) : null;

                return (
                  <div
                    key={project.id}
                    className="p-3 rounded border bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium flex-1">{project.title}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {projectGroup && (
                          <span
                            className="px-2 py-1 text-xs rounded-full font-medium text-white"
                            style={{ backgroundColor: projectGroup.color || '#6B7280' }}
                          >
                            {projectGroup.icon} {projectGroup.name}
                          </span>
                        )}
                        {projectTypes.map((type: ProjectType) => (
                          <span
                            key={type.id}
                            className="px-2 py-1 text-xs rounded-full font-medium text-white"
                            style={{ backgroundColor: type.color || '#6B7280' }}
                          >
                            {type.icon} {type.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    {project.intro && (
                      <p className="text-sm text-muted-foreground mt-1">{project.intro}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <span>{new Date(project.created_date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded bg-secondary">
                        {project.status === 'planning' && '📋 Planning'}
                        {project.status === 'actively_working' && '⚡ Actively Working'}
                        {project.status === 'blocked' && '🚫 Blocked'}
                        {project.status === 'on_hold' && '⏸️ On Hold'}
                        {project.status === 'completed' && '✅ Completed'}
                        {project.status === 'trashed' && '🗑️ Trashed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create Form */}
          <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded border bg-accent">
            <div>
              <label className="block text-sm font-medium mb-1">
                Project Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Project title"
                className="w-full px-3 py-2 rounded border bg-background"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">One Line Intro</label>
              <textarea
                value={formData.intro || ''}
                onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                placeholder="Brief introduction (2 lines)"
                rows={2}
                className="w-full px-3 py-2 rounded border bg-background resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Project Types</label>
                <button
                  type="button"
                  onClick={() => setShowCreateTypeModal(true)}
                  className="text-xs px-2 py-1 rounded border border-dashed hover:bg-accent"
                >
                  + New Type
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {projectTypes.map((type) => {
                  const isSelected = formData.project_type_ids?.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        const current = formData.project_type_ids || [];
                        setFormData({
                          ...formData,
                          project_type_ids: isSelected
                            ? current.filter(id => id !== type.id)
                            : [...current, type.id]
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      style={isSelected ? { backgroundColor: type.color || '#6B7280' } : {}}
                    >
                      {type.icon} {type.name}
                    </button>
                  );
                })}
                {projectTypes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No project types available. Create one to get started.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status || 'planning'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded border bg-background"
              >
                <option value="planning">📋 Planning</option>
                <option value="actively_working">⚡ Actively Working</option>
                <option value="blocked">🚫 Blocked</option>
                <option value="on_hold">⏸️ On Hold</option>
                <option value="completed">✅ Completed</option>
                <option value="trashed">🗑️ Trashed</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Group</label>
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(true)}
                  className="text-xs px-2 py-1 rounded border border-dashed hover:bg-accent"
                >
                  + New Group
                </button>
              </div>
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
              <label className="block text-sm font-medium mb-1">Full Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Full description (supports markdown)"
                rows={4}
                className="w-full px-3 py-2 rounded border bg-background resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="flex-1 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ title: '', intro: '', description: '', status: 'planning', project_type_ids: [], source_note_id: noteId, source_note_date: noteModifiedDate || undefined });
                }}
                className="px-4 py-2 rounded border hover:bg-accent"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Type Creation Modal */}
      <CreateEntityModal
        isOpen={showCreateTypeModal}
        onClose={() => setShowCreateTypeModal(false)}
        onCreated={(newType) => {
          setProjectTypes([...projectTypes, newType]);
          setFormData({
            ...formData,
            project_type_ids: [...(formData.project_type_ids || []), newType.id]
          });
        }}
        entityType="project-type"
        title="Create Project Type"
      />

      {/* Group Creation Modal */}
      <CreateEntityModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreated={(newGroup) => {
          setGroups([...groups, newGroup]);
          setFormData({
            ...formData,
            group_id: newGroup.id
          });
        }}
        entityType="group"
        title="Create Group"
      />
    </div>
  );
}
