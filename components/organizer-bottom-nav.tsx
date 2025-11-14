'use client';

interface OrganizerBottomNavProps {
  noteId: string;
  nextId: string | null;
  progress: {
    current: number;
    total: number;
  };
}

export function OrganizerBottomNav({ noteId, nextId, progress }: OrganizerBottomNavProps) {
  const handleTrash = async () => {
    await fetch(`/api/notes/${noteId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'failed' }),
    });
    if (nextId) {
      window.location.href = `/organizer/notes/${nextId}`;
    }
  };

  const handleReviewed = async () => {
    await fetch(`/api/notes/${noteId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'analyzed' }),
    });
    if (nextId) {
      window.location.href = `/organizer/notes/${nextId}`;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-2xl">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <p className="text-sm font-medium text-gray-700">
              {progress.current} / {progress.total}
            </p>
            <div className="hidden sm:block flex-1 max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleTrash}
              className="px-4 sm:px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-md text-xs sm:text-sm uppercase tracking-wide"
            >
              <span className="hidden sm:inline">🗑️ </span>Trash
            </button>

            {nextId && (
              <a
                href={`/organizer/notes/${nextId}`}
                className="px-4 sm:px-6 py-3 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors shadow-md text-xs sm:text-sm uppercase tracking-wide"
              >
                Skip <span className="hidden sm:inline">→</span>
              </a>
            )}

            <button
              onClick={handleReviewed}
              className="px-4 sm:px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-md text-xs sm:text-sm uppercase tracking-wide"
            >
              <span className="hidden sm:inline">✓ </span>Reviewed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
