'use client';

import { useState } from 'react';
import { ProjectSection } from './organization/project-section';
import { IdeaSection } from './organization/idea-section';
import { TaskSection } from './organization/task-section';
import { ChoreSection } from './organization/chore-section';
import { NoteSection } from './organization/note-section';

interface OrganizationPanelProps {
  noteId: string;
  noteTitle: string;
}

export function OrganizationPanel({ noteId, noteTitle }: OrganizationPanelProps) {
  return (
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
        <ProjectSection noteId={noteId} />
        <IdeaSection noteId={noteId} />
        <TaskSection noteId={noteId} />
        <ChoreSection noteId={noteId} />
        <NoteSection noteId={noteId} />
      </div>
    </div>
  );
}
