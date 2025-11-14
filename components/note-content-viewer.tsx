'use client';

import { useState, useEffect } from 'react';
import { ImageGallery } from './image-gallery';
import type { ExtractedImage } from '@/types/note';

interface NoteContentViewerProps {
  content: string;
  images?: ExtractedImage[];
  noteTitle?: string;
}

export function NoteContentViewer({ content, images, noteTitle }: NoteContentViewerProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const hasImages = images && images.length > 0;

  // Add click handlers to images and make links open in new tabs
  useEffect(() => {
    const contentDiv = document.getElementById('note-content');
    if (!contentDiv) return;

    // Handle image clicks for zoom
    const handleImageClick = (e: Event) => {
      const target = e.target as HTMLImageElement;
      if (target.tagName === 'IMG' && target.src) {
        setZoomedImage(target.src);
      }
    };

    // Make all links in content open in new tab and clearly clickable
    const links = contentDiv.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.style.color = '#2563eb'; // blue-600
      link.style.textDecoration = 'underline';
      link.style.cursor = 'pointer';
      link.style.pointerEvents = 'auto';

      // Add hover effect
      link.addEventListener('mouseenter', () => {
        link.style.color = '#1d4ed8'; // blue-700
      });
      link.addEventListener('mouseleave', () => {
        link.style.color = '#2563eb'; // blue-600
      });
    });

    contentDiv.addEventListener('click', handleImageClick);
    return () => contentDiv.removeEventListener('click', handleImageClick);
  }, [content]);

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      {hasImages && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowGallery(!showGallery)}
            className="text-sm px-3 py-1.5 rounded border bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {showGallery ? 'Hide Gallery' : `Show Gallery (${images.length} images)`}
          </button>
        </div>
      )}

      {/* Gallery (optional) */}
      {showGallery && hasImages && (
        <ImageGallery images={images!} noteTitle={noteTitle} />
      )}

      {/* Content with embedded images */}
      <div className="rounded-lg border bg-card p-6 overflow-x-hidden">
        <h2 className="text-xl font-semibold mb-4">Content</h2>
        <div
          id="note-content"
          className="prose prose-sm max-w-none overflow-x-hidden break-words
            [&_img]:rounded-lg [&_img]:border [&_img]:shadow-sm [&_img]:my-4
            [&_img]:max-w-full [&_img]:h-auto [&_img]:object-contain
            [&_img]:cursor-zoom-in [&_img]:hover:opacity-90 [&_img]:transition-opacity
            [&_ul]:list-disc [&_ul]:ml-6
            [&_ol]:list-decimal [&_ol]:ml-6
            [&_li]:my-1
            [&_a]:break-all [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer
            [&_a]:hover:text-blue-700 [&_a]:transition-colors"
          style={{
            '--tw-prose-body': 'inherit',
          } as any}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-xl font-bold z-10"
            onClick={() => setZoomedImage(null)}
          >
            ✕ Close
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
