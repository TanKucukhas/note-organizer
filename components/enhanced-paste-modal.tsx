'use client';

import { useState, useEffect } from 'react';
import type { FormPromptConfig } from '@/lib/form-prompt-generator';
import { parseAndValidateAiResponse } from '@/lib/form-prompt-generator';

interface EnhancedPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: any) => void;
  config: FormPromptConfig;
  autoReadClipboard?: boolean;
}

interface FieldPreview {
  name: string;
  label: string;
  value: any;
  error?: string;
  maxLength?: number;
  type: string;
}

export function EnhancedPasteModal({
  isOpen,
  onClose,
  onApply,
  config,
  autoReadClipboard = true,
}: EnhancedPasteModalProps) {
  const [pasteInput, setPasteInput] = useState('');
  const [fieldPreviews, setFieldPreviews] = useState<FieldPreview[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [hasErrors, setHasErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-read clipboard when modal opens
  useEffect(() => {
    if (isOpen && autoReadClipboard) {
      readClipboard();
    } else if (!isOpen) {
      // Reset state when modal closes
      setPasteInput('');
      setFieldPreviews([]);
      setEditedValues({});
      setHasErrors(false);
    }
  }, [isOpen, autoReadClipboard]);

  const readClipboard = async () => {
    setIsLoading(true);
    try {
      const text = await navigator.clipboard.readText();
      setPasteInput(text);
      parseInput(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      // If clipboard read fails, user can paste manually
    } finally {
      setIsLoading(false);
    }
  };

  const parseInput = (input: string) => {
    if (!input.trim()) {
      setFieldPreviews([]);
      return;
    }

    const result = parseAndValidateAiResponse(input, config);

    if (!result.valid || !result.data) {
      // Show parsing errors
      setHasErrors(true);
      setFieldPreviews([]);
      return;
    }

    // Create field previews from parsed data
    const previews: FieldPreview[] = [];
    const initialValues: Record<string, any> = {};

    config.fields.forEach((field) => {
      const value = result.data![field.name];

      if (value !== undefined && value !== null && value !== '') {
        // Find if there's a validation error for this field
        const fieldError = result.errors.find(e => e.field === field.name);

        previews.push({
          name: field.name,
          label: field.label,
          value: value,
          error: fieldError?.message,
          maxLength: field.maxLength,
          type: field.type,
        });

        initialValues[field.name] = value;
      }
    });

    setFieldPreviews(previews);
    setEditedValues(initialValues);
    setHasErrors(result.errors.length > 0);
  };

  const handleFieldChange = (fieldName: string, newValue: any) => {
    setEditedValues({
      ...editedValues,
      [fieldName]: newValue,
    });

    // Re-validate this specific field
    const field = config.fields.find(f => f.name === fieldName);
    if (field && field.maxLength) {
      const valueLength = String(newValue).length;
      const updatedPreviews = fieldPreviews.map(preview => {
        if (preview.name === fieldName) {
          return {
            ...preview,
            value: newValue,
            error: valueLength > field.maxLength
              ? `Exceeds ${field.maxLength} characters (${valueLength})`
              : undefined,
          };
        }
        return preview;
      });
      setFieldPreviews(updatedPreviews);
      setHasErrors(updatedPreviews.some(p => p.error));
    }
  };

  const handleApply = () => {
    if (hasErrors) {
      alert('Please fix validation errors before applying');
      return;
    }

    onApply(editedValues);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Paste & Preview - {config.formType}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Reading clipboard...</p>
            </div>
          ) : fieldPreviews.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste your AI-generated JSON below or it will be read automatically from your clipboard.
              </p>
              <textarea
                value={pasteInput}
                onChange={(e) => {
                  setPasteInput(e.target.value);
                  parseInput(e.target.value);
                }}
                placeholder={`Paste AI response here...\n\nExample:\n{\n  "title": "My Title",\n  "description": "Description here"\n}`}
                rows={12}
                className="w-full px-3 py-2 rounded border bg-background font-mono text-sm resize-none"
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Preview & Edit Fields
                </p>
                <button
                  onClick={() => {
                    setFieldPreviews([]);
                    setPasteInput('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Re-paste
                </button>
              </div>

              {hasErrors && (
                <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    ⚠️ Please fix validation errors before applying
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {fieldPreviews.map((preview) => (
                  <div
                    key={preview.name}
                    className={`p-3 rounded border ${
                      preview.error
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-700'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <label className="block text-sm font-medium">
                        {preview.label}
                      </label>
                      {preview.maxLength && (
                        <span
                          className={`text-xs ${
                            String(editedValues[preview.name] || '').length > preview.maxLength
                              ? 'text-red-600 font-semibold'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {String(editedValues[preview.name] || '').length} / {preview.maxLength}
                        </span>
                      )}
                    </div>

                    {preview.type === 'textarea' ? (
                      <textarea
                        value={editedValues[preview.name] || ''}
                        onChange={(e) => handleFieldChange(preview.name, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded border bg-background resize-none text-sm"
                        maxLength={preview.maxLength}
                      />
                    ) : preview.type === 'multiselect' ? (
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(editedValues[preview.name]) &&
                          editedValues[preview.name].map((item: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              {item}
                              <button
                                onClick={() => {
                                  const newArray = [...editedValues[preview.name]];
                                  newArray.splice(idx, 1);
                                  handleFieldChange(preview.name, newArray);
                                }}
                                className="hover:text-red-600"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editedValues[preview.name] || ''}
                        onChange={(e) => handleFieldChange(preview.name, e.target.value)}
                        className="w-full px-3 py-2 rounded border bg-background text-sm"
                        maxLength={preview.maxLength}
                      />
                    )}

                    {preview.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        {preview.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          {fieldPreviews.length > 0 && (
            <button
              onClick={handleApply}
              disabled={hasErrors}
              className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Apply to Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
