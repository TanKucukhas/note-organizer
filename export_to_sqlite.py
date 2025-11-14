#!/usr/bin/env python3
"""
Export Apple Notes to SQLite Database
Converts individual JSON notes to a well-structured SQLite database
optimized for timeline queries and database application use.
"""

import sqlite3
import json
import os
import re
from datetime import datetime
from pathlib import Path
from html.parser import HTMLParser
from typing import Dict, List, Optional, Tuple
import sys


class HTMLToText(HTMLParser):
    """Convert HTML to plain text"""
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.skip_tags = {'script', 'style'}
        self.current_tag = None

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag

    def handle_endtag(self, tag):
        if tag in ['p', 'div', 'br', 'li', 'tr']:
            self.text_parts.append('\n')
        self.current_tag = None

    def handle_data(self, data):
        if self.current_tag not in self.skip_tags:
            text = data.strip()
            if text:
                self.text_parts.append(text)

    def get_text(self):
        return ' '.join(self.text_parts)


def html_to_text(html_content: str) -> str:
    """Convert HTML content to plain text"""
    if not html_content:
        return ""

    parser = HTMLToText()
    try:
        parser.feed(html_content)
        return parser.get_text()
    except Exception as e:
        print(f"Warning: HTML parsing error: {e}")
        # Fallback: simple tag stripping
        return re.sub(r'<[^>]+>', ' ', html_content).strip()


def parse_macos_date(date_str: str) -> Optional[datetime]:
    """
    Parse macOS date format to datetime object
    Example: "Saturday, November 8, 2025 at 21:59:06"
    """
    if not date_str:
        return None

    try:
        # Remove day of week if present
        date_str_clean = re.sub(r'^[A-Za-z]+,\s+', '', date_str)

        # Try parsing with "at" separator
        if ' at ' in date_str_clean:
            date_part, time_part = date_str_clean.split(' at ')

            # Parse date part (e.g., "November 8, 2025")
            date_formats = [
                '%B %d, %Y',  # November 8, 2025
                '%b %d, %Y',   # Nov 8, 2025
            ]

            parsed_date = None
            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(date_part, fmt)
                    break
                except ValueError:
                    continue

            if not parsed_date:
                return None

            # Parse time part (e.g., "21:59:06" or "9:59:06 PM")
            time_formats = [
                '%H:%M:%S',      # 24-hour
                '%I:%M:%S %p',   # 12-hour with AM/PM
            ]

            for fmt in time_formats:
                try:
                    time_obj = datetime.strptime(time_part, fmt)
                    return datetime.combine(
                        parsed_date.date(),
                        time_obj.time()
                    )
                except ValueError:
                    continue

        # Fallback: try standard formats
        fallback_formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
        ]

        for fmt in fallback_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue

        return None

    except Exception as e:
        print(f"Warning: Failed to parse date '{date_str}': {e}")
        return None


class NotesDatabase:
    """Manages SQLite database creation and data import"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self.stats = {
            'notes_imported': 0,
            'links_imported': 0,
            'images_imported': 0,
            'categories_imported': 0,
            'tasks_imported': 0,
            'ideas_imported': 0,
            'projects_imported': 0,
            'errors': []
        }

    def connect(self):
        """Connect to database and enable foreign keys"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.execute('PRAGMA foreign_keys = ON')
        self.cursor = self.conn.cursor()

    def create_schema(self):
        """Create database schema with all tables and indexes"""
        print("Creating database schema...")

        # Core notes table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS notes (
                note_id TEXT PRIMARY KEY,
                original_index INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                content_cleaned TEXT,
                plain_text TEXT,
                folder TEXT NOT NULL DEFAULT 'Notes',
                account TEXT NOT NULL,
                coredata_id TEXT UNIQUE,
                created_raw TEXT NOT NULL,
                created_datetime DATETIME,
                modified_raw TEXT NOT NULL,
                modified_datetime DATETIME,
                status TEXT DEFAULT 'pending',
                processed BOOLEAN DEFAULT 0,
                primary_category TEXT,
                content_length INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Extracted links table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS extracted_links (
                link_id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id TEXT NOT NULL,
                url TEXT NOT NULL,
                link_type TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE,
                UNIQUE(note_id, url)
            )
        ''')

        # Extracted images table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS extracted_images (
                image_id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                relative_path TEXT NOT NULL,
                image_format TEXT,
                size_bytes INTEGER,
                extraction_order INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE,
                UNIQUE(note_id, filename)
            )
        ''')

        # Analysis results table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis (
                analysis_id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id TEXT NOT NULL UNIQUE,
                summary TEXT,
                plain_text_sample TEXT,
                analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE
            )
        ''')

        # Extracted tasks table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS extracted_tasks (
                task_id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id TEXT NOT NULL,
                task_text TEXT NOT NULL,
                priority INTEGER,
                completed BOOLEAN DEFAULT 0,
                due_date DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE
            )
        ''')

        # Extracted ideas table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS extracted_ideas (
                idea_id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id TEXT NOT NULL,
                idea_text TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE
            )
        ''')

        # Extracted projects table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS extracted_projects (
                project_id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id TEXT NOT NULL,
                project_name TEXT NOT NULL,
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE
            )
        ''')

        # Categories table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS note_categories (
                category_id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id TEXT NOT NULL,
                category TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE,
                UNIQUE(note_id, category)
            )
        ''')

        # Accounts lookup table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS accounts (
                account_id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_name TEXT NOT NULL UNIQUE,
                note_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Folders lookup table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS folders (
                folder_id INTEGER PRIMARY KEY AUTOINCREMENT,
                folder_name TEXT NOT NULL,
                account_name TEXT NOT NULL,
                note_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(folder_name, account_name)
            )
        ''')

        self.conn.commit()
        print("✓ Schema created")

    def create_indexes(self):
        """Create indexes for optimized queries"""
        print("Creating indexes for timeline queries...")

        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder)",
            "CREATE INDEX IF NOT EXISTS idx_notes_account ON notes(account)",
            "CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status)",
            "CREATE INDEX IF NOT EXISTS idx_notes_primary_category ON notes(primary_category)",
            "CREATE INDEX IF NOT EXISTS idx_notes_created_datetime ON notes(created_datetime)",
            "CREATE INDEX IF NOT EXISTS idx_notes_modified_datetime ON notes(modified_datetime)",
            "CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)",
            "CREATE INDEX IF NOT EXISTS idx_links_note_id ON extracted_links(note_id)",
            "CREATE INDEX IF NOT EXISTS idx_links_type ON extracted_links(link_type)",
            "CREATE INDEX IF NOT EXISTS idx_images_note_id ON extracted_images(note_id)",
            "CREATE INDEX IF NOT EXISTS idx_analysis_note_id ON analysis(note_id)",
            "CREATE INDEX IF NOT EXISTS idx_tasks_note_id ON extracted_tasks(note_id)",
            "CREATE INDEX IF NOT EXISTS idx_ideas_note_id ON extracted_ideas(note_id)",
            "CREATE INDEX IF NOT EXISTS idx_projects_note_id ON extracted_projects(note_id)",
            "CREATE INDEX IF NOT EXISTS idx_categories_note_id ON note_categories(note_id)",
        ]

        for index_sql in indexes:
            self.cursor.execute(index_sql)

        self.conn.commit()
        print("✓ Indexes created")

    def import_note(self, note_data: Dict):
        """Import a single note with all its related data"""
        try:
            note_id = note_data.get('note_id')
            if not note_id:
                self.stats['errors'].append("Missing note_id in note data")
                return

            # Parse dates
            created_datetime = parse_macos_date(note_data.get('created', ''))
            modified_datetime = parse_macos_date(note_data.get('modified', ''))

            # Convert HTML to plain text
            content = note_data.get('content', '')
            plain_text = html_to_text(content)

            # Insert core note
            self.cursor.execute('''
                INSERT INTO notes (
                    note_id, original_index, title, content, content_cleaned,
                    plain_text, folder, account, coredata_id,
                    created_raw, created_datetime, modified_raw, modified_datetime,
                    status, processed, primary_category, content_length
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                note_id,
                note_data.get('original_index', 0),
                note_data.get('title', 'Untitled'),
                content,
                note_data.get('content_cleaned', content),
                plain_text,
                note_data.get('folder', 'Notes'),
                note_data.get('account', 'Unknown'),
                note_data.get('id', ''),
                note_data.get('created', ''),
                created_datetime,
                note_data.get('modified', ''),
                modified_datetime,
                note_data.get('status', 'pending'),
                1 if note_data.get('processed', False) else 0,
                note_data.get('primary_category', None),
                len(plain_text)
            ))

            self.stats['notes_imported'] += 1

            # Import extracted links
            extracted_data = note_data.get('extracted_data', {})
            links = extracted_data.get('links', [])

            # Also check analysis for categorized links
            analysis = note_data.get('analysis', {})
            links_categorized = analysis.get('links_categorized', {})

            for link in links:
                try:
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO extracted_links (note_id, url, link_type)
                        VALUES (?, ?, ?)
                    ''', (note_id, link, None))
                    self.stats['links_imported'] += 1
                except Exception as e:
                    self.stats['errors'].append(f"Link import error for {note_id}: {e}")

            # Import categorized links
            for link_type, link_list in links_categorized.items():
                for link in link_list:
                    try:
                        self.cursor.execute('''
                            INSERT OR IGNORE INTO extracted_links (note_id, url, link_type)
                            VALUES (?, ?, ?)
                        ''', (note_id, link, link_type))
                        self.stats['links_imported'] += 1
                    except Exception as e:
                        pass  # Might be duplicate

            # Import extracted images
            images = extracted_data.get('images', [])
            for idx, image in enumerate(images, 1):
                if isinstance(image, dict):
                    filename = image.get('filename', '')
                    relative_path = image.get('path', f"images/{filename}")
                    image_format = image.get('format', '')
                    size_bytes = image.get('size', 0)
                else:
                    # Simple string filename
                    filename = image
                    relative_path = f"images/{filename}"
                    image_format = ''
                    size_bytes = 0

                try:
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO extracted_images (
                            note_id, filename, relative_path, image_format,
                            size_bytes, extraction_order
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    ''', (note_id, filename, relative_path, image_format, size_bytes, idx))
                    self.stats['images_imported'] += 1
                except Exception as e:
                    self.stats['errors'].append(f"Image import error for {note_id}: {e}")

            # Import categories
            categories = note_data.get('categories', [])
            for category in categories:
                try:
                    self.cursor.execute('''
                        INSERT OR IGNORE INTO note_categories (note_id, category)
                        VALUES (?, ?)
                    ''', (note_id, category))
                    self.stats['categories_imported'] += 1
                except Exception as e:
                    pass  # Likely duplicate

            # Import analysis data if present
            if analysis:
                summary = analysis.get('summary', '')
                plain_text_sample = analysis.get('plain_text', '')[:1000]

                if summary or plain_text_sample:
                    try:
                        self.cursor.execute('''
                            INSERT OR IGNORE INTO analysis (
                                note_id, summary, plain_text_sample
                            ) VALUES (?, ?, ?)
                        ''', (note_id, summary, plain_text_sample))
                    except Exception as e:
                        self.stats['errors'].append(f"Analysis import error for {note_id}: {e}")

                # Import tasks
                tasks = analysis.get('tasks', [])
                for task in tasks:
                    try:
                        task_text = task if isinstance(task, str) else task.get('text', '')
                        self.cursor.execute('''
                            INSERT INTO extracted_tasks (note_id, task_text)
                            VALUES (?, ?)
                        ''', (note_id, task_text))
                        self.stats['tasks_imported'] += 1
                    except Exception as e:
                        self.stats['errors'].append(f"Task import error for {note_id}: {e}")

                # Import ideas
                ideas = analysis.get('ideas', [])
                for idea in ideas:
                    try:
                        idea_text = idea if isinstance(idea, str) else idea.get('text', '')
                        self.cursor.execute('''
                            INSERT INTO extracted_ideas (note_id, idea_text)
                            VALUES (?, ?)
                        ''', (note_id, idea_text))
                        self.stats['ideas_imported'] += 1
                    except Exception as e:
                        self.stats['errors'].append(f"Idea import error for {note_id}: {e}")

                # Import projects
                projects = analysis.get('projects', [])
                for project in projects:
                    try:
                        project_name = project if isinstance(project, str) else project.get('name', '')
                        self.cursor.execute('''
                            INSERT INTO extracted_projects (note_id, project_name)
                            VALUES (?, ?)
                        ''', (note_id, project_name))
                        self.stats['projects_imported'] += 1
                    except Exception as e:
                        self.stats['errors'].append(f"Project import error for {note_id}: {e}")

        except Exception as e:
            self.stats['errors'].append(f"Failed to import note {note_data.get('note_id', 'unknown')}: {e}")

    def populate_lookup_tables(self):
        """Populate accounts and folders lookup tables"""
        print("Populating lookup tables...")

        # Populate accounts
        self.cursor.execute('''
            INSERT OR IGNORE INTO accounts (account_name, note_count)
            SELECT account, COUNT(*) FROM notes GROUP BY account
        ''')

        # Populate folders
        self.cursor.execute('''
            INSERT OR IGNORE INTO folders (folder_name, account_name, note_count)
            SELECT folder, account, COUNT(*) FROM notes GROUP BY folder, account
        ''')

        self.conn.commit()
        print("✓ Lookup tables populated")

    def generate_statistics(self) -> Dict:
        """Generate database statistics"""
        print("Generating statistics...")

        stats = {}

        # Basic counts
        self.cursor.execute("SELECT COUNT(*) FROM notes")
        stats['total_notes'] = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT COUNT(*) FROM extracted_links")
        stats['total_links'] = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT COUNT(*) FROM extracted_images")
        stats['total_images'] = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT COUNT(*) FROM note_categories")
        stats['total_categories'] = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT COUNT(*) FROM extracted_tasks")
        stats['total_tasks'] = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT COUNT(*) FROM extracted_ideas")
        stats['total_ideas'] = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT COUNT(*) FROM extracted_projects")
        stats['total_projects'] = self.cursor.fetchone()[0]

        # Date ranges
        self.cursor.execute('''
            SELECT
                MIN(created_datetime) as earliest_created,
                MAX(created_datetime) as latest_created,
                MIN(modified_datetime) as earliest_modified,
                MAX(modified_datetime) as latest_modified
            FROM notes
            WHERE created_datetime IS NOT NULL
        ''')
        date_ranges = self.cursor.fetchone()
        stats['date_ranges'] = {
            'earliest_created': date_ranges[0],
            'latest_created': date_ranges[1],
            'earliest_modified': date_ranges[2],
            'latest_modified': date_ranges[3]
        }

        # Account breakdown
        self.cursor.execute('''
            SELECT account_name, note_count FROM accounts ORDER BY note_count DESC
        ''')
        stats['accounts'] = dict(self.cursor.fetchall())

        # Folder breakdown
        self.cursor.execute('''
            SELECT folder_name, note_count FROM folders ORDER BY note_count DESC LIMIT 20
        ''')
        stats['top_folders'] = dict(self.cursor.fetchall())

        # Category breakdown
        self.cursor.execute('''
            SELECT category, COUNT(*) as count
            FROM note_categories
            GROUP BY category
            ORDER BY count DESC
            LIMIT 20
        ''')
        stats['top_categories'] = dict(self.cursor.fetchall())

        # Primary category breakdown
        self.cursor.execute('''
            SELECT primary_category, COUNT(*) as count
            FROM notes
            WHERE primary_category IS NOT NULL
            GROUP BY primary_category
            ORDER BY count DESC
        ''')
        stats['primary_categories'] = dict(self.cursor.fetchall())

        return stats

    def close(self):
        """Commit and close database connection"""
        if self.conn:
            self.conn.commit()
            self.conn.close()


def main():
    """Main execution function"""
    print("=" * 60)
    print("Apple Notes to SQLite Database Export")
    print("=" * 60)
    print()

    # Configuration
    individual_notes_dir = Path("individual_notes")
    output_db = "notes.db"
    stats_output = "database_stats.json"

    # Check if individual notes directory exists
    if not individual_notes_dir.exists():
        print(f"Error: Directory '{individual_notes_dir}' not found")
        print("Please ensure you have exported individual notes first.")
        sys.exit(1)

    # Count JSON files
    json_files = list(individual_notes_dir.glob("note_*.json"))
    total_files = len(json_files)

    if total_files == 0:
        print(f"Error: No note_*.json files found in '{individual_notes_dir}'")
        sys.exit(1)

    print(f"Found {total_files} note files to import")
    print()

    # Initialize database
    db = NotesDatabase(output_db)
    db.connect()
    db.create_schema()

    # Import notes
    print(f"Importing notes from {individual_notes_dir}...")
    print()

    for idx, json_file in enumerate(json_files, 1):
        if idx % 100 == 0:
            print(f"  Progress: {idx}/{total_files} notes imported...")
            db.conn.commit()  # Periodic commits

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                note_data = json.load(f)
                db.import_note(note_data)
        except Exception as e:
            db.stats['errors'].append(f"Failed to read {json_file}: {e}")

    print(f"  Progress: {total_files}/{total_files} notes imported...")
    print()

    # Create indexes
    db.create_indexes()

    # Populate lookup tables
    db.populate_lookup_tables()

    # Generate statistics
    stats = db.generate_statistics()
    stats['import_stats'] = db.stats

    # Save statistics to file
    with open(stats_output, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, default=str)

    print()
    print("=" * 60)
    print("Import Summary")
    print("=" * 60)
    print(f"Notes imported:      {db.stats['notes_imported']}")
    print(f"Links imported:      {db.stats['links_imported']}")
    print(f"Images imported:     {db.stats['images_imported']}")
    print(f"Categories imported: {db.stats['categories_imported']}")
    print(f"Tasks imported:      {db.stats['tasks_imported']}")
    print(f"Ideas imported:      {db.stats['ideas_imported']}")
    print(f"Projects imported:   {db.stats['projects_imported']}")
    print()

    if db.stats['errors']:
        print(f"Errors encountered:  {len(db.stats['errors'])}")
        print("(See database_stats.json for details)")
        print()

    print("Date Range:")
    if stats['date_ranges']['earliest_created']:
        print(f"  Created:  {stats['date_ranges']['earliest_created']} to {stats['date_ranges']['latest_created']}")
        print(f"  Modified: {stats['date_ranges']['earliest_modified']} to {stats['date_ranges']['latest_modified']}")
    else:
        print("  (No parsed dates available)")
    print()

    print("Accounts:")
    for account, count in stats['accounts'].items():
        print(f"  {account}: {count} notes")
    print()

    print("=" * 60)
    print(f"✓ Database created: {output_db}")
    print(f"✓ Statistics saved: {stats_output}")
    print("=" * 60)

    # Close database
    db.close()

    # Get file size
    db_size = os.path.getsize(output_db) / (1024 * 1024)  # MB
    print(f"\nDatabase size: {db_size:.2f} MB")
    print("\nYour database is ready for use!")
    print("\nExample queries:")
    print(f"  sqlite3 {output_db} \"SELECT title, created_datetime FROM notes ORDER BY created_datetime DESC LIMIT 10\"")
    print(f"  sqlite3 {output_db} \"SELECT COUNT(*) FROM notes WHERE folder='Notes'\"")
    print()


if __name__ == "__main__":
    main()
