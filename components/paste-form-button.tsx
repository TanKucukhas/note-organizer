'use client';

import { useState } from 'react';
import type { FormPromptConfig } from '@/lib/form-prompt-generator';
import { PasteAiResponseModal } from '@/components/paste-ai-response-modal';

interface PasteFormButtonProps {
  config: FormPromptConfig;
  onPaste: (data: any) => void;
  className?: string;
}

export function PasteFormButton({ config, onPaste, className = '' }: PasteFormButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded border hover:bg-accent transition-colors ${className}`}
        title="Paste AI response"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span>Paste AI Response</span>
      </button>

      <PasteAiResponseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={onPaste}
        config={config}
      />
    </>
  );
}
