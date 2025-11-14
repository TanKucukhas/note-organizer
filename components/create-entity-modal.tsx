'use client';

import { useState, useEffect } from 'react';

interface CreateEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (entity: any) => void;
  entityType: 'project-type' | 'group';
  title: string;
}

// Generate random color
function getRandomColor(): string {
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
    '#84CC16', '#06B6D4', '#6366F1', '#A855F7'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function CreateEntityModal({ isOpen, onClose, onCreated, entityType, title }: CreateEntityModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: getRandomColor(),
  });
  const [loading, setLoading] = useState(false);

  // Generate new random color when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, color: getRandomColor() }));
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const apiEndpoint = entityType === 'project-type' ? '/api/project-types' : '/api/groups';

  const handleClose = () => {
    setFormData({ name: '', icon: '', color: getRandomColor() });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.icon.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newEntity = await response.json();
        onCreated(newEntity);
        handleClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error(`Failed to create ${entityType}:`, error);
      alert(`Failed to create ${entityType}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Title <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal">(max 100)</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={entityType === 'project-type' ? 'e.g., Side Project' : 'e.g., Personal'}
              className="w-full px-3 py-2 rounded border bg-background"
              maxLength={100}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Emoji <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🚀"
                className="w-full px-3 py-2 rounded border bg-background text-center text-2xl"
                required
                maxLength={2}
                title="Use Ctrl+Cmd+Space (Mac) or Win+. (Windows) to open emoji picker"
              />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {navigator.platform.includes('Mac') ? '⌃⌘Space' : 'Win+.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={formData.color || '#3B82F6'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-full rounded border cursor-pointer"
              />
            </div>
          </div>

          {/* Preview - Only show when title and emoji are filled */}
          {formData.name.trim() && formData.icon.trim() && (
            <div>
              <label className="block text-sm font-medium mb-2">Preview</label>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: formData.color || '#3B82F6' }}
              >
                <span>{formData.icon}</span>
                <span>{formData.name}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.icon?.trim()}
              className="flex-1 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded border hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
