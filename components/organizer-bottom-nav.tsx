'use client';

import { useEffect, useRef } from 'react';

interface OrganizerBottomNavProps {
  noteId: string;
  previousId: string | null;
  nextId: string | null;
  progress: {
    current: number;
    total: number;
  };
}

export function OrganizerBottomNav({ noteId, previousId, nextId, progress }: OrganizerBottomNavProps) {
  const navRef = useRef<HTMLDivElement>(null);
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

  const handleNext = () => {
    if (nextId) {
      window.location.href = `/organizer/notes/${nextId}`;
    }
  };

  const handlePrevious = () => {
    if (previousId) {
      window.location.href = `/organizer/notes/${previousId}`;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if nav is focused or no input is focused
      const isInputFocused = document.activeElement instanceof HTMLInputElement ||
                            document.activeElement instanceof HTMLTextAreaElement;

      if (isInputFocused) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case ' ':
          e.preventDefault();
          handleReviewed();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          handleTrash();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [noteId, previousId, nextId]);

  // Auto-focus nav on mount
  useEffect(() => {
    navRef.current?.focus();
  }, []);

  return (
    <div
      ref={navRef}
      tabIndex={0}
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-2xl outline-none"
    >
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Navigation Buttons */}
            <div className="flex gap-2">
              {/* Previous Button */}
              <button
                onClick={handlePrevious}
                disabled={!previousId}
                className="px-3 sm:px-4 py-3 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors shadow-md text-xs sm:text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">← </span>Prev
                <span className="text-[10px] block mt-0.5 normal-case opacity-75">←</span>
              </button>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={!nextId}
                className="px-3 sm:px-4 py-3 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors shadow-md text-xs sm:text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">→ </span>Next
                <span className="text-[10px] block mt-0.5 normal-case opacity-75">→</span>
              </button>
            </div>

            {/* Progress */}
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
            {/* Trash Button */}
            <button
              onClick={handleTrash}
              className="px-4 sm:px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-md text-xs sm:text-sm uppercase tracking-wide"
            >
              <span className="hidden sm:inline">🗑️ </span>Trash
              <span className="text-[10px] block mt-0.5 normal-case opacity-75">T</span>
            </button>

            {/* Reviewed Button */}
            <button
              onClick={handleReviewed}
              className="px-4 sm:px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-md text-xs sm:text-sm uppercase tracking-wide"
            >
              <span className="hidden sm:inline">✓ </span>Reviewed
              <span className="text-[10px] block mt-0.5 normal-case opacity-75">Space</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
