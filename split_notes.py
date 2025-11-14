#!/usr/bin/env python3
"""
Split large notes.json into manageable chunks for AI processing.
Each chunk contains a subset of notes with metadata for tracking.
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime


def clean_html(html_content):
    """Extract plain text from HTML content."""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', html_content)
    # Decode common HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&quot;', '"').replace('&#39;', "'")
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def create_chunks(input_file, output_dir, chunk_size=100):
    """
    Split notes.json into smaller chunk files.

    Args:
        input_file: Path to notes.json
        output_dir: Directory to store chunk files
        chunk_size: Number of notes per chunk

    Returns:
        List of chunk metadata
    """
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Load all notes
    print(f"Loading {input_file}...")
    with open(input_file, 'r') as f:
        notes = json.load(f)

    total_notes = len(notes)
    print(f"Total notes: {total_notes}")
    print(f"Creating chunks of {chunk_size} notes each...")

    chunks_metadata = []

    # Split into chunks
    for i in range(0, total_notes, chunk_size):
        chunk_num = i // chunk_size + 1
        chunk_notes = notes[i:i + chunk_size]

        # Add plain text preview to each note
        for note in chunk_notes:
            note['text_preview'] = clean_html(note['content'])[:500]
            note['processed'] = False
            note['status'] = 'pending'  # pending, analyzed, keep, delete, needs-review
            note['categories'] = []  # Will store: tasks, ideas, projects, links, notes

        # Create chunk file
        chunk_filename = f"chunk_{chunk_num:03d}.json"
        chunk_path = output_path / chunk_filename

        with open(chunk_path, 'w') as f:
            json.dump(chunk_notes, f, indent=2)

        # Track metadata
        chunk_meta = {
            'chunk_id': chunk_num,
            'filename': chunk_filename,
            'note_count': len(chunk_notes),
            'start_index': i,
            'end_index': i + len(chunk_notes) - 1,
            'created_at': datetime.now().isoformat()
        }
        chunks_metadata.append(chunk_meta)

        print(f"  Created {chunk_filename}: {len(chunk_notes)} notes")

    return chunks_metadata


def create_index(chunks_metadata, output_dir):
    """Create an index file tracking all chunks."""
    index_data = {
        'created_at': datetime.now().isoformat(),
        'total_chunks': len(chunks_metadata),
        'total_notes': sum(c['note_count'] for c in chunks_metadata),
        'chunks': chunks_metadata
    }

    index_path = Path(output_dir) / 'index.json'
    with open(index_path, 'w') as f:
        json.dump(index_data, f, indent=2)

    print(f"\nCreated index file: {index_path}")
    return index_data


def main():
    """Main execution function."""
    input_file = 'notes.json'
    output_dir = 'chunks'
    chunk_size = 100

    print("=" * 60)
    print("Notes Splitter - AI Processing Preparation")
    print("=" * 60)

    # Create chunks
    chunks_metadata = create_chunks(input_file, output_dir, chunk_size)

    # Create index
    index_data = create_index(chunks_metadata, output_dir)

    print("\n" + "=" * 60)
    print("Summary:")
    print("=" * 60)
    print(f"Total chunks created: {index_data['total_chunks']}")
    print(f"Total notes processed: {index_data['total_notes']}")
    print(f"Chunk size: {chunk_size} notes per file")
    print(f"Output directory: {output_dir}/")
    print("\nEach note now includes:")
    print("  - text_preview: First 500 chars of plain text")
    print("  - processed: Boolean flag")
    print("  - status: pending|analyzed|keep|delete|needs-review")
    print("  - categories: Array for tasks, ideas, projects, links, notes")
    print("\nReady for AI analysis!")


if __name__ == '__main__':
    main()
