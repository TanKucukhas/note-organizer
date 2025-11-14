import { getNoteById } from '@/lib/db';
import { NoteContentViewer } from '@/components/note-content-viewer';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = getNoteById(id);

  if (!note) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto p-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {note.title || 'Untitled Note'}
          </h1>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>📁 {note.folder}</span>
            <span>☁️ {note.account}</span>
            {note.created_datetime && (
              <span>
                Created: {new Date(note.created_datetime).toLocaleDateString()}
              </span>
            )}
            {note.modified_datetime && (
              <span>
                Modified: {new Date(note.modified_datetime).toLocaleDateString()}
              </span>
            )}
            {note.primary_category && (
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {note.primary_category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Note Content with Images */}
        <NoteContentViewer
          content={note.content}
          images={note.images}
          noteTitle={note.title}
        />

        {/* Links */}
        {note.links && note.links.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">
              Links ({note.links.length})
            </h2>
            <div className="space-y-2">
              {note.links.map((link) => (
                <div
                  key={link.link_id}
                  className="flex items-center gap-3 p-3 rounded bg-muted hover:bg-muted/80 transition-colors"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-primary hover:underline truncate"
                  >
                    {link.url}
                  </a>
                  {link.link_type && (
                    <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                      {link.link_type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        {note.tasks && note.tasks.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">
              Tasks ({note.tasks.length})
            </h2>
            <div className="space-y-2">
              {note.tasks.map((task) => (
                <div
                  key={task.task_id}
                  className="flex items-start gap-3 p-3 rounded bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={task.completed === 1}
                    readOnly
                    className="mt-1"
                  />
                  <span className="flex-1 text-sm">{task.task_text}</span>
                  {task.priority && (
                    <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                      Priority {task.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ideas */}
        {note.ideas && note.ideas.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">
              Ideas ({note.ideas.length})
            </h2>
            <div className="space-y-2">
              {note.ideas.map((idea) => (
                <div
                  key={idea.idea_id}
                  className="flex items-start gap-3 p-3 rounded bg-muted"
                >
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <p className="text-sm">{idea.idea_text}</p>
                    <span className="text-xs text-muted-foreground">
                      Status: {idea.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {note.projects && note.projects.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">
              Projects ({note.projects.length})
            </h2>
            <div className="space-y-2">
              {note.projects.map((project) => (
                <div
                  key={project.project_id}
                  className="flex items-start gap-3 p-3 rounded bg-muted"
                >
                  <span className="text-2xl">📊</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{project.project_name}</p>
                    {project.status && (
                      <span className="text-xs text-muted-foreground">
                        Status: {project.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis */}
        {note.analysis && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">AI Analysis</h2>
            {note.analysis.summary && (
              <p className="text-sm mb-4">{note.analysis.summary}</p>
            )}
            {note.analysis.plain_text_sample && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <p className="font-mono">{note.analysis.plain_text_sample}</p>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Metadata</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Note ID</dt>
              <dd className="font-mono">{note.note_id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{note.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Content Length</dt>
              <dd>{note.content_length?.toLocaleString()} characters</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Processed</dt>
              <dd>{note.processed ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
