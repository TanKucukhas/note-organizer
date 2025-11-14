'use client';

import { useState } from 'react';
import { FocusProvider } from './organization/focus-context';
import { ProjectSection } from './organization/project-section';
import { IdeaSection } from './organization/idea-section';
import { TaskSection } from './organization/task-section';
import { ChoreSection } from './organization/chore-section';
import { NoteSection } from './organization/note-section';

interface OrganizationPanelProps {
  noteId: string;
  noteTitle: string;
  noteModifiedDate: string | null;
}

export function OrganizationPanel({ noteId, noteTitle, noteModifiedDate }: OrganizationPanelProps) {
  return (
    <FocusProvider>
      <div className="space-y-6">
        {/* Panel Header */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-2xl font-bold mb-2">Organize</h2>
          <p className="text-sm text-muted-foreground">
            Extract and organize information from this note
          </p>
        </div>

        {/* Organization Sections */}
        <div className="space-y-4">
          <ProjectSection noteId={noteId} noteModifiedDate={noteModifiedDate} />
          <IdeaSection noteId={noteId} noteModifiedDate={noteModifiedDate} />
          <TaskSection noteId={noteId} noteModifiedDate={noteModifiedDate} />
          <ChoreSection noteId={noteId} noteModifiedDate={noteModifiedDate} />
          <NoteSection noteId={noteId} noteModifiedDate={noteModifiedDate} />
        </div>
      </div>
    </FocusProvider>
  );
}
