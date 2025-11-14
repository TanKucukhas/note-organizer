'use client';

import { useState } from 'react';
import { FormPromptConfig, generateFormPrompt, copyToClipboard } from '@/lib/form-prompt-generator';

interface CopyFormPromptButtonProps {
  config: FormPromptConfig;
  userContext?: string;
  className?: string;
}

export function CopyFormPromptButton({ config, userContext = '', className = '' }: CopyFormPromptButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const prompt = generateFormPrompt(config, userContext);
    const success = await copyToClipboard(prompt);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded border hover:bg-accent transition-colors ${className}`}
      title="Copy AI prompt to clipboard"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy AI Prompt</span>
        </>
      )}
    </button>
  );
}
