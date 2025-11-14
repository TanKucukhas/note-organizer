import Link from 'next/link';
import { getDatabaseStats, getNotes } from '@/lib/db';

export default async function Dashboard() {
  const stats = getDatabaseStats();
  const recentNotes = getNotes({ limit: 5, sortBy: 'modified_datetime', sortOrder: 'desc' });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Apple Notes Organizer</h1>
          <p className="text-muted-foreground">
            Organize and categorize your {stats.total_notes.toLocaleString()} notes with AI assistance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Notes" value={stats.total_notes.toLocaleString()} />
          <StatsCard title="Links" value={stats.total_links.toLocaleString()} />
          <StatsCard title="Images" value={stats.total_images.toLocaleString()} />
          <StatsCard title="Tasks" value={stats.total_tasks.toLocaleString()} />
        </div>

        {/* Categories */}
        {Object.keys(stats.primary_categories).length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Categories</h2>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(stats.primary_categories).map(([category, count]) => (
                <div key={category} className="flex justify-between p-3 rounded bg-muted">
                  <span className="font-medium capitalize">{category}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Notes */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Notes</h2>
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <Link
                key={note.note_id}
                href={`/notes/${note.note_id}`}
                className="block"
              >
                <div className="flex justify-between items-start p-3 rounded bg-muted hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-1">{note.title || 'Untitled'}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {note.plain_text || 'No content'}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{note.folder}</span>
                      {note.modified_datetime && (
                        <span>Modified: {new Date(note.modified_datetime).toLocaleDateString()}</span>
                      )}
                      {note.primary_category && (
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {note.primary_category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title="Organization Database"
            description="View organized tasks, chores, ideas, and projects"
            href="/organize"
          />
          <ActionCard
            title="Review Queue"
            description="Review and categorize notes with AI suggestions"
            href="/review"
            disabled
          />
          <ActionCard
            title="All Notes"
            description="Browse and search all your notes"
            href="/notes"
            disabled
          />
          <ActionCard
            title="Tasks"
            description="Manage extracted tasks and action items"
            href="/tasks"
            disabled
          />
          <ActionCard
            title="Projects"
            description="View and organize your projects"
            href="/projects"
            disabled
          />
          <ActionCard
            title="Ideas"
            description="Explore your ideas and brainstorming notes"
            href="/ideas"
            disabled
          />
          <ActionCard
            title="Bookmarks"
            description="Access saved links and resources"
            href="/bookmarks"
            disabled
          />
        </div>

        {/* Date Range */}
        {stats.date_ranges.earliest_created && (
          <div className="text-sm text-muted-foreground text-center">
            Notes from {new Date(stats.date_ranges.earliest_created).toLocaleDateString()} to{' '}
            {new Date(stats.date_ranges.latest_created!).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  disabled = false,
}: {
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}) {
  const content = (
    <div className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {disabled && (
        <span className="text-xs text-muted-foreground mt-2 block">Coming soon...</span>
      )}
    </div>
  );

  if (disabled) {
    return <div className="opacity-50 cursor-not-allowed">{content}</div>;
  }

  return <Link href={href}>{content}</Link>;
}
