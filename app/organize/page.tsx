import Link from 'next/link';
import {
  getOrganizationStats,
  getAllTasks,
  getAllChores,
  getAllIdeas,
  getAllProjects,
} from '@/lib/db-organization';

export default async function OrganizePage() {
  const stats = getOrganizationStats();
  const tasks = getAllTasks();
  const chores = getAllChores();
  const ideas = getAllIdeas();
  const projects = getAllProjects();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Organization Database</h1>
            <p className="text-muted-foreground mt-2">
              Test interface for organization.db
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Tasks"
            value={stats.total_tasks.toString()}
            subtitle={Object.entries(stats.tasks_by_status)
              .map(([status, count]) => `${status}: ${count}`)
              .join(', ') || 'No tasks yet'}
          />
          <StatsCard
            title="Chores"
            value={stats.total_chores.toString()}
            subtitle="Recurring and one-time"
          />
          <StatsCard
            title="Ideas"
            value={stats.total_ideas.toString()}
            subtitle={Object.entries(stats.ideas_by_status)
              .map(([status, count]) => `${status}: ${count}`)
              .join(', ') || 'No ideas yet'}
          />
          <StatsCard
            title="Projects"
            value={stats.total_projects.toString()}
            subtitle={Object.entries(stats.projects_by_status)
              .map(([status, count]) => `${status}: ${count}`)
              .join(', ') || 'No projects yet'}
          />
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">Review Progress</h3>
            <p className="text-3xl font-bold">{stats.notes_reviewed}</p>
            <p className="text-sm text-muted-foreground">Notes reviewed</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">File Attachments</h3>
            <p className="text-3xl font-bold">{stats.total_attachments}</p>
            <p className="text-sm text-muted-foreground">Files attached to items</p>
          </div>
        </div>

        {/* Tasks List */}
        {tasks.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Tasks ({tasks.length})</h2>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded bg-muted"
                >
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs">
                    {task.priority && (
                      <span className="px-2 py-1 rounded bg-destructive/10 text-destructive">
                        {task.priority}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chores List */}
        {chores.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Chores ({chores.length})</h2>
            <div className="space-y-2">
              {chores.map((chore) => (
                <div
                  key={chore.id}
                  className="flex items-center justify-between p-3 rounded bg-muted"
                >
                  <div>
                    <h3 className="font-medium">{chore.title}</h3>
                    {chore.description && (
                      <p className="text-sm text-muted-foreground">{chore.description}</p>
                    )}
                  </div>
                  {chore.is_recurring === 1 && (
                    <span className="text-xs px-2 py-1 rounded bg-accent text-accent-foreground">
                      Recurring
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ideas List */}
        {ideas.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Ideas ({ideas.length})</h2>
            <div className="space-y-2">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="p-3 rounded bg-muted"
                >
                  <h3 className="font-medium">{idea.title}</h3>
                  {idea.intro && (
                    <p className="text-sm text-muted-foreground mt-1">{idea.intro}</p>
                  )}
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary">
                      {idea.status}
                    </span>
                    {idea.category && (
                      <span className="px-2 py-1 rounded bg-secondary">
                        {idea.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects List */}
        {projects.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Projects ({projects.length})</h2>
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 rounded bg-muted"
                >
                  <h3 className="font-medium">{project.title}</h3>
                  {project.intro && (
                    <p className="text-sm text-muted-foreground mt-1">{project.intro}</p>
                  )}
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary">
                      {project.status}
                    </span>
                    {project.category && (
                      <span className="px-2 py-1 rounded bg-secondary">
                        {project.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && chores.length === 0 && ideas.length === 0 && projects.length === 0 && (
          <div className="rounded-lg border bg-card p-12 text-center">
            <h2 className="text-2xl font-semibold mb-2">Database is Empty</h2>
            <p className="text-muted-foreground mb-6">
              organization.db başarıyla oluşturuldu ama henüz veri yok.
            </p>
            <div className="text-sm text-left max-w-xl mx-auto space-y-2 bg-muted p-4 rounded">
              <p className="font-semibold">Test için veri eklemek isterseniz:</p>
              <p>1. API routes eklenecek</p>
              <p>2. Review queue'den notları extract edebilirsiniz</p>
              <p>3. Manuel olarak form üzerinden ekleyebilirsiniz</p>
            </div>
          </div>
        )}

        {/* Database Info */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Database Info</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Location:</span>
              <p className="font-mono">organization.db</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tables:</span>
              <p>11 tables (tasks, chores, ideas, projects, etc.)</p>
            </div>
            <div>
              <span className="text-muted-foreground">Schema Version:</span>
              <p>1.0.0</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="text-green-600">✓ Connected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{subtitle}</p>
    </div>
  );
}
