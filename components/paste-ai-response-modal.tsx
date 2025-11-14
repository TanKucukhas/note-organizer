'use client';

import { useState } from 'react';
import type { FormPromptConfig, ValidationError } from '@/lib/form-prompt-generator';
import { parseAndValidateAiResponse } from '@/lib/form-prompt-generator';

interface PasteAiResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  config: FormPromptConfig;
}

export function PasteAiResponseModal({ isOpen, onClose, onSuccess, config }: PasteAiResponseModalProps) {
  const [input, setInput] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    // Parse and validate
    const result = parseAndValidateAiResponse(input, config);

    if (result.valid && result.data) {
      onSuccess(result.data);
      setInput('');
      setErrors([]);
      onClose();
    } else {
      setErrors(result.errors);
    }

    setLoading(false);
  };

  const handleClose = () => {
    setInput('');
    setErrors([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Paste AI Response</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Paste AI output here (JSON code block)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={'Paste the AI response here...\n\nExample:\n```json\n{\n  "projectTitle": "My Project",\n  "oneLineIntro": "A brief intro",\n  ...\n}\n```'}
              rows={12}
              className="w-full px-3 py-2 rounded border bg-background font-mono text-sm resize-none"
              autoFocus
            />
          </div>

          {errors.length > 0 && (
            <div className="p-3 rounded border border-red-300 bg-red-50">
              <p className="text-sm font-medium text-red-800 mb-2">Validation Errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx} className="text-sm text-red-700">
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded border hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Fill Form'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Tip: Copy the AI prompt, paste it to any AI (ChatGPT, Claude, Gemini, Groq), then paste the JSON response here.
          </p>
        </div>
      </div>
    </div>
  );
}
