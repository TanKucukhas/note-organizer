'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Task, CreateTaskInput, Project, Idea, Group } from '@/types/organization';
import { CopyFormPromptButton } from '@/components/copy-form-prompt-button';
import { EnhancedPasteModal } from '@/components/enhanced-paste-modal';
import { useFocus } from '@/components/organization/focus-context';
import type { FormPromptConfig } from '@/lib/form-prompt-generator';

interface TaskSectionProps {
  noteId: string;
  noteModifiedDate: string | null;
}

export function TaskSection({ noteId, noteModifiedDate }: TaskSectionProps) {
  const { focusedSection, setFocusedSection } = useFocus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    source_note_id: noteId,
    source_note_date: noteModifiedDate || undefined,
    status: 'todo',
  });
  const [loading, setLoading] = useState(false);

  const isFocused = focusedSection === 'tasks';

  // Fetch data
  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchIdeas();
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
          source_note_date: noteModifiedDate || undefined,
          status: 'todo',
        });
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

  // Handle delete task
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== id));
      } else {
        alert('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  // Form prompt configuration for AI
  const formPromptConfig: FormPromptConfig = useMemo(() => ({
    formType: 'Task',
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
        name: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
      },
      {
        name: 'project',
        label: 'Assign to Project',
        type: 'select',
        options: projects.map(p => ({ value: p.id, label: p.title })),
      },
      {
        name: 'idea',
        label: 'Assign to Idea',
        type: 'select',
        options: ideas.map(i => ({ value: i.id, label: i.title })),
      },
    ],
  }), [projects, ideas]);

  // Handle pasted AI response
  const handlePaste = (data: any) => {
    const updated: CreateTaskInput = {
      ...formData,
    };

    if (data.title) updated.title = data.title;
    if (data.description) updated.description = data.description;
    if (data.priority) updated.priority = data.priority as any;

    // Handle project assignment (map title to ID)
    if (data.project) {
      const project = projects.find(p => p.title === data.project);
      if (project) {
        updated.project_id = project.id;
        updated.idea_id = undefined;
      }
    }

    // Handle idea assignment (map title to ID)
    if (data.idea && !data.project) {
      const idea = ideas.find(i => i.title === data.idea);
      if (idea) {
        updated.idea_id = idea.id;
        updated.project_id = undefined;
      }
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
                  className="p-3 rounded border bg-secondary/50 hover:bg-secondary transition-colors relative group"
                >
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-destructive"
                    title="Delete task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-start gap-2 pr-6">
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

          {/* Create Form */}
          <div
            className={`space-y-3 transition-all ${isFocused ? 'ring-2 ring-blue-500 rounded-lg p-2' : ''}`}
            onClick={() => setFocusedSection('tasks')}
          >
            {/* Form Header with Copy & Paste Buttons */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Add New Task {isFocused && <span className="text-blue-600 text-xs ml-2">● Focused (Cmd+V to paste)</span>}
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
                  placeholder="Task title"
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
                  placeholder="Task description"
                  rows={2}
                  className="w-full px-3 py-2 rounded border bg-background resize-none"
                  maxLength={500}
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
                    setFormData({
                      title: '',
                      description: '',
                      source_note_id: noteId,
                      source_note_date: noteModifiedDate || undefined,
                      status: 'todo',
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
