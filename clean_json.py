#!/usr/bin/env python3
"""Clean JSON output from AppleScript by removing problematic control characters."""
import sys
import re

def clean_control_chars(text):
    """Remove or replace control characters that break JSON parsing."""
    # Remove control characters except \n, \r, \t which are already escaped
    # This handles ASCII 0-31 except the ones we want to keep
    cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', ' ', text)
    return cleaned

if __name__ == "__main__":
    # Read from stdin
    input_text = sys.stdin.read()

    # Clean control characters
    cleaned = clean_control_chars(input_text)

    # Write to stdout
    sys.stdout.write(cleaned)
