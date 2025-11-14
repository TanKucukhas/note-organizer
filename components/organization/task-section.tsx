'use client';

import { useState, useEffect } from 'react';
import type { Task, CreateTaskInput, Project, Idea, Group } from '@/types/organization';

interface TaskSectionProps {
  noteId: string;
}

export function TaskSection({ noteId }: TaskSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    source_note_id: noteId,
    status: 'todo',
  });
  const [loading, setLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchIdeas();
    fetchGroups();
  }, []);

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
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks([newTask, ...tasks]);
        setFormData({
          title: '',
          description: '',
          source_note_id: noteId,
          status: 'todo',
        });
        setIsCreating(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.title;
  };

  const getIdeaName = (ideaId: string | null) => {
    if (!ideaId) return null;
    const idea = ideas.find(i => i.id === ideaId);
    return idea?.title;
  };

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return null;
    const group = groups.find(g => g.id === groupId);
    return group ? { name: group.name, icon: group.icon, color: group.color } : null;
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div className="text-left">
            <h3 className="font-semibold text-lg">Tasks</h3>
            <p className="text-sm text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-xl">{isExpanded ? '−' : '+'}</span>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Existing Tasks */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded border bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      className="mt-1"
                      readOnly
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getGroupName(task.group_id) && (
                          <span
                            className="text-xs px-2 py-0.5 rounded font-medium text-white"
                            style={{ backgroundColor: getGroupName(task.group_id)?.color || '#6B7280' }}
                          >
                            {getGroupName(task.group_id)?.icon} {getGroupName(task.group_id)?.name}
                          </span>
                        )}
                        {task.priority && (
                          <span className="text-xs px-2 py-0.5 rounded bg-background">
                            {task.priority}
                          </span>
                        )}
                        {task.status && (
                          <span className="text-xs px-2 py-0.5 rounded bg-background">
                            {task.status}
                          </span>
                        )}
                        {getProjectName(task.project_id) && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900">
                            📁 {getProjectName(task.project_id)}
                          </span>
                        )}
                        {getIdeaName(task.idea_id) && (
                          <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900">
                            💡 {getIdeaName(task.idea_id)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Task Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-4 py-2 rounded border border-dashed border-muted-foreground/50 hover:border-muted-foreground hover:bg-accent transition-colors text-sm"
            >
              + Add New Task
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
                  placeholder="Task title"
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
                  placeholder="Task description"
                  rows={2}
                  className="w-full px-3 py-2 rounded border bg-background resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={formData.priority || ''}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded border bg-background"
                  >
                    <option value="">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign to Project</label>
                <select
                  value={formData.project_id || ''}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value || undefined, idea_id: undefined })}
                  className="w-full px-3 py-2 rounded border bg-background"
                >
                  <option value="">None</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign to Idea</label>
                <select
                  value={formData.idea_id || ''}
                  onChange={(e) => setFormData({ ...formData, idea_id: e.target.value || undefined, project_id: undefined })}
                  className="w-full px-3 py-2 rounded border bg-background"
                  disabled={!!formData.project_id}
                >
                  <option value="">None</option>
                  {ideas.map(idea => (
                    <option key={idea.id} value={idea.id}>
                      {idea.title}
                    </option>
                  ))}
                </select>
                {formData.project_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Clear project assignment to assign to an idea
                  </p>
                )}
              </div>

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
                  {loading ? 'Adding...' : 'Add Task'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setFormData({
                      title: '',
                      description: '',
                      source_note_id: noteId,
                      status: 'todo',
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
