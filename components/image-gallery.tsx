'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ExtractedImage } from '@/types/note';

interface ImageGalleryProps {
  images: ExtractedImage[];
  noteTitle?: string;
}

export function ImageGallery({ images, noteTitle }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Attached Images ({images.length})
        </h3>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.image_id}
            className="relative aspect-square rounded-lg overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all cursor-pointer"
            onClick={() => setSelectedImage(index)}
          >
            <img
              src={`/api/images/${image.filename}`}
              alt={`Image ${index + 1} from ${noteTitle || 'note'}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
              {image.filename}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox/Modal for Full Image View */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            {/* Close Button */}
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold"
              onClick={() => setSelectedImage(null)}
            >
              ✕ Close
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 text-2xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) =>
                      prev === null || prev === 0 ? images.length - 1 : prev - 1
                    );
                  }}
                >
                  ‹
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 text-2xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) =>
                      prev === null || prev === images.length - 1 ? 0 : prev + 1
                    );
                  }}
                >
                  ›
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={`/api/images/${images[selectedImage].filename}`}
              alt={`Image ${selectedImage + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 text-sm">
              <div className="flex justify-between items-center">
                <span>
                  {selectedImage + 1} / {images.length}
                </span>
                <span className="font-mono">{images[selectedImage].filename}</span>
                {images[selectedImage].size_bytes > 0 && (
                  <span>
                    {(images[selectedImage].size_bytes / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for note previews
export function ImageThumbnails({ images, maxDisplay = 3 }: { images: ExtractedImage[], maxDisplay?: number }) {
  if (!images || images.length === 0) {
    return null;
  }

  const displayImages = images.slice(0, maxDisplay);
  const remaining = images.length - maxDisplay;

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {displayImages.map((image) => (
        <div
          key={image.image_id}
          className="relative w-12 h-12 rounded overflow-hidden border"
        >
          <img
            src={`/api/images/${image.filename}`}
            alt={image.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">
          +{remaining} more
        </span>
      )}
    </div>
  );
}
