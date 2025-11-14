# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Apple Notes export utility that extracts notes from the macOS Notes application and exports them to JSON format. The project uses AppleScript to interface with the Notes app and Python for JSON data cleaning.

## Architecture

### Core Components

1. **export-notes.applescript**: AppleScript that interfaces directly with the macOS Notes application
   - Iterates through all accounts, folders, and notes
   - Extracts note metadata (title, content, creation/modification dates, folder, account)
   - Performs basic JSON escaping of strings
   - Outputs a single-line JSON array

2. **clean_json.py**: Python utility for post-processing the AppleScript output
   - Removes problematic control characters (ASCII 0-31) that break JSON parsing
   - Preserves legitimate whitespace characters (\n, \r, \t)
   - Reads from stdin and writes to stdout for pipeline usage

3. **notes.json**: The exported data file containing all Apple Notes
   - Single-line JSON array of note objects
   - Very large file (372MB+)
   - Each note contains: title, content (HTML), folder, account, id, created, modified timestamps

## Common Commands

### Export Notes from Apple Notes App

```bash
# Full export pipeline
osascript export-notes.applescript | python3 clean_json.py > notes.json

# Or in two steps:
osascript export-notes.applescript > raw_notes.json
cat raw_notes.json | python3 clean_json.py > notes.json
```

### Working with the Exported Data

```bash
# View note count
python3 -c "import json; data = json.load(open('notes.json')); print(f'{len(data)} notes')"

# Pretty print a sample note
python3 -c "import json; data = json.load(open('notes.json')); print(json.dumps(data[0], indent=2))"

# Search notes by title
python3 -c "import json; data = json.load(open('notes.json')); [print(n['title']) for n in data if 'search_term' in n['title'].lower()]"
```

### Validate JSON

```bash
# Check if JSON is valid
python3 -m json.tool notes.json > /dev/null && echo "Valid JSON" || echo "Invalid JSON"
```

## Data Structure

Each note object in notes.json has the following structure:

```json
{
  "title": "Note title",
  "content": "<div>HTML formatted content</div>",
  "folder": "Folder name",
  "account": "Account name (iCloud, On My Mac, etc.)",
  "id": "x-coredata://UUID/ICNote/p123",
  "created": "Monday, January 1, 2024 at 12:00:00 PM",
  "modified": "Tuesday, January 2, 2024 at 3:45:00 PM"
}
```

## Important Notes

### AppleScript JSON Escaping

The AppleScript handles JSON string escaping for:
- Backslashes (\\)
- Double quotes (\")
- Newlines (\n)
- Carriage returns (\r)
- Tabs (\t)
- Forward slashes (\/)

However, it cannot handle all control characters, which is why clean_json.py is necessary.

### Performance Considerations

- notes.json is extremely large (372MB+) and has no line breaks (single-line JSON)
- Loading the entire file into memory may be slow or cause issues on memory-constrained systems
- Consider streaming or chunking approaches for processing large datasets
- The export process can take several minutes depending on the number of notes

### Date Format

Dates are exported as human-readable strings in macOS format (e.g., "Monday, January 1, 2024 at 12:00:00 PM"). If you need to parse these dates, be aware they are locale-dependent and may need conversion to ISO format or Unix timestamps.

### Content Format

Note content is exported as HTML, not plain text. To extract plain text from content:
- Use an HTML parser (BeautifulSoup in Python, cheerio in Node.js, etc.)
- Strip HTML tags appropriately
- Be aware of embedded images (base64 encoded in data URIs)

## macOS-Specific Requirements

This project requires macOS with:
- Apple Notes application
- osascript (AppleScript interpreter)
- Python 3.x
- Proper permissions to access Notes data (System Preferences > Security & Privacy > Automation)
