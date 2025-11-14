#!/usr/bin/env python3
"""
Split notes into individual JSON files, one per note.
Extract embedded images and attachments.
"""

import json
import os
import re
import base64
from pathlib import Path


def sanitize_filename(text, max_length=100):
    """Create a safe filename from text."""
    # Remove or replace invalid characters
    text = re.sub(r'[<>:"/\\|?*]', '_', text)
    # Remove control characters
    text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
    # Limit length
    text = text[:max_length].strip()
    # Remove leading/trailing dots and spaces
    text = text.strip('. ')
    # If empty, provide default
    return text if text else 'untitled'


def extract_images(html_content, note_id, output_dir):
    """
    Extract base64 encoded images from HTML content.
    Returns list of extracted image info and updated HTML.
    """
    images = []
    image_dir = output_dir / 'images'
    image_dir.mkdir(exist_ok=True)

    # Find all base64 encoded images
    pattern = r'<img[^>]*src="data:image\/([^;]+);base64,([^"]+)"[^>]*>'
    matches = re.finditer(pattern, html_content)

    for idx, match in enumerate(matches, 1):
        image_format = match.group(1)
        image_data = match.group(2)

        try:
            # Decode base64
            img_bytes = base64.b64decode(image_data)

            # Create filename
            img_filename = f"{note_id}_img_{idx}.{image_format}"
            img_path = image_dir / img_filename

            # Save image
            with open(img_path, 'wb') as f:
                f.write(img_bytes)

            images.append({
                'filename': img_filename,
                'format': image_format,
                'size_bytes': len(img_bytes),
                'relative_path': f'images/{img_filename}'
            })

            # Replace in HTML with reference
            html_content = html_content.replace(
                match.group(0),
                f'<img src="images/{img_filename}" data-original-format="{image_format}">'
            )
        except Exception as e:
            print(f"Warning: Could not extract image {idx} from note {note_id}: {e}")

    return images, html_content


def extract_links(html_content):
    """Extract all URLs from HTML content."""
    links = []

    # Find href links
    href_pattern = r'href="([^"]+)"'
    hrefs = re.findall(href_pattern, html_content)
    links.extend(hrefs)

    # Find plain text URLs
    url_pattern = r'https?://[^\s<>"\']+'
    text_urls = re.findall(url_pattern, html_content)
    links.extend(text_urls)

    # Remove duplicates and filter
    links = list(set(links))
    links = [l for l in links if l.startswith('http')]

    return links


def create_individual_notes(input_file, output_dir):
    """
    Create individual JSON file for each note.

    Args:
        input_file: Path to notes.json
        output_dir: Directory to store individual note files

    Returns:
        Statistics about the split
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Load all notes
    print(f"Loading {input_file}...")
    with open(input_file, 'r') as f:
        notes = json.load(f)

    total_notes = len(notes)
    print(f"Total notes: {total_notes}")
    print(f"Creating individual files in {output_dir}/...")

    stats = {
        'total_notes': total_notes,
        'notes_with_images': 0,
        'total_images': 0,
        'notes_with_links': 0,
        'total_links': 0,
        'files_created': []
    }

    for idx, note in enumerate(notes, 1):
        # Create note ID from index
        note_id = f"note_{idx:04d}"

        # Extract images
        images, updated_html = extract_images(note['content'], note_id, output_path)
        if images:
            stats['notes_with_images'] += 1
            stats['total_images'] += len(images)

        # Extract links
        links = extract_links(note['content'])
        if links:
            stats['notes_with_links'] += 1
            stats['total_links'] += len(links)

        # Create enhanced note object
        note_data = {
            'note_id': note_id,
            'original_index': idx - 1,
            'title': note['title'],
            'content': note['content'],
            'content_cleaned': updated_html if images else note['content'],
            'text_preview': note.get('text_preview', ''),
            'folder': note['folder'],
            'account': note['account'],
            'id': note['id'],
            'created': note['created'],
            'modified': note['modified'],
            'status': note.get('status', 'pending'),
            'processed': note.get('processed', False),
            'categories': note.get('categories', []),
            'extracted_data': {
                'images': images,
                'links': links,
                'image_count': len(images),
                'link_count': len(links)
            }
        }

        # Create filename from title
        safe_title = sanitize_filename(note['title'])
        filename = f"{note_id}_{safe_title}.json"
        file_path = output_path / filename

        # Write individual note file
        with open(file_path, 'w') as f:
            json.dump(note_data, f, indent=2)

        stats['files_created'].append({
            'note_id': note_id,
            'filename': filename,
            'title': note['title'],
            'has_images': len(images) > 0,
            'has_links': len(links) > 0
        })

        # Progress indicator
        if idx % 100 == 0:
            print(f"  Processed {idx}/{total_notes} notes...")

    return stats


def create_master_index(stats, output_dir):
    """Create a master index of all individual notes."""
    index_data = {
        'total_notes': stats['total_notes'],
        'notes_with_images': stats['notes_with_images'],
        'total_images_extracted': stats['total_images'],
        'notes_with_links': stats['notes_with_links'],
        'total_links_found': stats['total_links'],
        'notes': stats['files_created']
    }

    index_path = Path(output_dir) / 'master_index.json'
    with open(index_path, 'w') as f:
        json.dump(index_data, f, indent=2)

    print(f"\nCreated master index: {index_path}")
    return index_path


def main():
    """Main execution function."""
    input_file = 'notes.json'
    output_dir = 'individual_notes'

    print("=" * 60)
    print("Individual Notes Splitter")
    print("=" * 60)

    # Create individual notes
    stats = create_individual_notes(input_file, output_dir)

    # Create master index
    create_master_index(stats, output_dir)

    print("\n" + "=" * 60)
    print("Summary:")
    print("=" * 60)
    print(f"Total notes split: {stats['total_notes']}")
    print(f"Notes with images: {stats['notes_with_images']}")
    print(f"Total images extracted: {stats['total_images']}")
    print(f"Notes with links: {stats['notes_with_links']}")
    print(f"Total links found: {stats['total_links']}")
    print(f"\nOutput directory: {output_dir}/")
    print(f"  - {stats['total_notes']} JSON files (one per note)")
    if stats['total_images'] > 0:
        print(f"  - images/ folder with {stats['total_images']} extracted images")
    print(f"  - master_index.json (index of all notes)")
    print("\nEach note file contains:")
    print("  - Original metadata and content")
    print("  - Extracted images and links")
    print("  - Status tracking fields")
    print("  - Categories array for AI analysis")
    print("\nReady for individual AI processing!")


if __name__ == '__main__':
    main()
