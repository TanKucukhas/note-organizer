'use client';

import { useState, useEffect } from 'react';
import type { Task, Chore, Idea, Project, Note } from '@/types/organization';

type TabType = 'tasks' | 'chores' | 'ideas' | 'projects' | 'notes';

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [tasksRes, choresRes, ideasRes, projectsRes, notesRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/chores'),
        fetch('/api/ideas'),
        fetch('/api/projects'),
        fetch('/api/org-notes'),
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (choresRes.ok) setChores(await choresRes.json());
      if (ideasRes.ok) setIdeas(await ideasRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: TabType, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      return;
    }

    try {
      const endpoints: Record<TabType, string> = {
        tasks: `/api/tasks/${id}`,
        chores: `/api/chores/${id}`,
        ideas: `/api/ideas/${id}`,
        projects: `/api/projects/${id}`,
        notes: `/api/org-notes/${id}`,
      };

      const response = await fetch(endpoints[type], {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        switch (type) {
          case 'tasks':
            setTasks(tasks.filter(t => t.id !== id));
            break;
          case 'chores':
            setChores(chores.filter(c => c.id !== id));
            break;
          case 'ideas':
            setIdeas(ideas.filter(i => i.id !== id));
            break;
          case 'projects':
            setProjects(projects.filter(p => p.id !== id));
            break;
          case 'notes':
            setNotes(notes.filter(n => n.id !== id));
            break;
        }
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const tabs: { key: TabType; label: string; icon: string; count: number }[] = [
    { key: 'tasks', label: 'Tasks', icon: '✓', count: tasks.length },
    { key: 'chores', label: 'Chores', icon: '🏠', count: chores.length },
    { key: 'ideas', label: 'Ideas', icon: '💡', count: ideas.length },
    { key: 'projects', label: 'Projects', icon: '📁', count: projects.length },
    { key: 'notes', label: 'Notes', icon: '📝', count: notes.length },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Items</h1>
        <p className="text-muted-foreground">
          View, edit, and delete your organization items
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary font-medium'
                : 'border-transparent hover:text-foreground'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-secondary">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'tasks' && (
            <TasksTable tasks={tasks} onDelete={(id) => handleDelete('tasks', id)} />
          )}
          {activeTab === 'chores' && (
            <ChoresTable chores={chores} onDelete={(id) => handleDelete('chores', id)} />
          )}
          {activeTab === 'ideas' && (
            <IdeasTable ideas={ideas} onDelete={(id) => handleDelete('ideas', id)} />
          )}
          {activeTab === 'projects' && (
            <ProjectsTable projects={projects} onDelete={(id) => handleDelete('projects', id)} />
          )}
          {activeTab === 'notes' && (
            <NotesTable notes={notes} onDelete={(id) => handleDelete('notes', id)} />
          )}
        </div>
      )}
    </div>
  );
}

// Tasks Table Component
function TasksTable({ tasks, onDelete }: { tasks: Task[]; onDelete: (id: string) => void }) {
  if (tasks.length === 0) {
    return <EmptyState type="tasks" />;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Due Date</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-accent">
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {task.description.length > 100
                        ? `${task.description.substring(0, 100)}...`
                        : task.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs rounded bg-secondary">
                  {task.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {task.priority && (
                  <span className="px-2 py-1 text-xs rounded bg-secondary">
                    {task.priority}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(task.created_date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(task.id)}
                  className="px-3 py-1 text-sm rounded border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Chores Table Component
function ChoresTable({ chores, onDelete }: { chores: Chore[]; onDelete: (id: string) => void }) {
  if (chores.length === 0) {
    return <EmptyState type="chores" />;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Recurring</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Pattern</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {chores.map((chore) => (
            <tr key={chore.id} className="hover:bg-accent">
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium">{chore.title}</div>
                  {chore.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {chore.description.length > 100
                        ? `${chore.description.substring(0, 100)}...`
                        : chore.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {chore.is_recurring ? '🔄 Yes' : 'No'}
              </td>
              <td className="px-4 py-3 text-sm">
                {chore.recurrence_pattern || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(chore.created_date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(chore.id)}
                  className="px-3 py-1 text-sm rounded border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Ideas Table Component
function IdeasTable({ ideas, onDelete }: { ideas: Idea[]; onDelete: (id: string) => void }) {
  if (ideas.length === 0) {
    return <EmptyState type="ideas" />;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {ideas.map((idea) => (
            <tr key={idea.id} className="hover:bg-accent">
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium">{idea.title}</div>
                  {idea.intro && (
                    <div className="text-sm text-muted-foreground mt-1">{idea.intro}</div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs rounded bg-secondary">
                  {idea.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                {idea.category || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(idea.created_date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(idea.id)}
                  className="px-3 py-1 text-sm rounded border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Projects Table Component
function ProjectsTable({ projects, onDelete }: { projects: Project[]; onDelete: (id: string) => void }) {
  if (projects.length === 0) {
    return <EmptyState type="projects" />;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-accent">
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium">{project.title}</div>
                  {project.intro && (
                    <div className="text-sm text-muted-foreground mt-1">{project.intro}</div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs rounded bg-secondary">
                  {project.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                {project.category || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(project.created_date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(project.id)}
                  className="px-3 py-1 text-sm rounded border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Notes Table Component
function NotesTable({ notes, onDelete }: { notes: Note[]; onDelete: (id: string) => void }) {
  if (notes.length === 0) {
    return <EmptyState type="notes" />;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {notes.map((note) => (
            <tr key={note.id} className="hover:bg-accent">
              <td className="px-4 py-3">
                <div className="flex items-start gap-2">
                  {note.note_type === 'secret' && <span>🔒</span>}
                  <div>
                    <div className="font-medium">{note.title}</div>
                    {note.content && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {note.content.length > 100
                          ? `${note.content.substring(0, 100)}...`
                          : note.content}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs rounded bg-secondary">
                  {note.note_type}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                {note.category || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(note.created_date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(note.id)}
                  className="px-3 py-1 text-sm rounded border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Empty State Component
function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-12 border rounded-lg">
      <p className="text-muted-foreground">No {type} found</p>
      <p className="text-sm text-muted-foreground mt-2">
        Create {type} from the organizer page
      </p>
    </div>
  );
}
