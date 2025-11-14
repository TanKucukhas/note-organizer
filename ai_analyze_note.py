#!/usr/bin/env python3
"""
AI-powered note analyzer using Claude API.
Accurately categorizes content into: tasks, ideas, projects, links, contacts, dates, and more.
"""

import json
import re
import os
from pathlib import Path
from datetime import datetime
import anthropic


def clean_html_to_text(html_content):
    """Convert HTML to plain text for analysis."""
    # Remove script and style elements
    text = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html_content, flags=re.DOTALL)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '\n', html_content)
    # Decode HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&quot;', '"').replace('&#39;', "'").replace('&nbsp;', ' ')
    text = text.replace('&gt;', '>').replace('&lt;', '<')
    # Clean up whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r' +', ' ', text)
    return text.strip()


def extract_dates(text):
    """Extract date references from text using patterns."""
    dates = []

    # Common date patterns
    patterns = [
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',  # 12/31/2024, 12-31-24
        r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b',  # Jan 1, 2024
        r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b',  # 1 Jan 2024
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        dates.extend(matches)

    return list(set(dates))


def extract_contacts(text):
    """Extract contact information (emails, phone numbers)."""
    contacts = {
        'emails': [],
        'phones': []
    }

    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    contacts['emails'] = list(set(re.findall(email_pattern, text)))

    # Phone pattern (US and international)
    phone_pattern = r'\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b'
    phones = re.findall(phone_pattern, text)
    contacts['phones'] = list(set([f"({p[0]}) {p[1]}-{p[2]}" for p in phones]))

    return contacts


def ai_analyze_note(note, api_key):
    """
    Use Claude API to intelligently analyze note content.

    Args:
        note: Note dictionary with content
        api_key: Anthropic API key

    Returns:
        Structured analysis results
    """
    client = anthropic.Anthropic(api_key=api_key)

    # Get plain text
    plain_text = clean_html_to_text(note['content'])

    # Truncate if too long (max ~100k chars for context)
    if len(plain_text) > 100000:
        plain_text = plain_text[:100000] + "\n\n[Content truncated...]"

    # Create analysis prompt
    prompt = f"""Analyze this note and extract structured information. Return your response as a valid JSON object.

Note Title: {note['title']}
Note Content:
{plain_text}

Please analyze and extract:
1. **tasks**: Action items, TODOs, things to do (be specific, complete sentences)
2. **ideas**: Creative concepts, thoughts, brainstorming items (actual ideas, not fragments)
3. **projects**: Multi-step initiatives, business ideas, named projects
4. **key_points**: Main informational points or facts worth noting
5. **categories**: What type of content is this? (e.g., "business", "personal", "technical", "creative")
6. **sentiment**: Overall tone (positive, negative, neutral, mixed)
7. **priority**: Is this high, medium, or low priority based on content?
8. **summary**: Brief 2-3 sentence summary of the note

Return ONLY a valid JSON object with these fields. Example format:
{{
  "tasks": ["Task 1", "Task 2"],
  "ideas": ["Idea 1", "Idea 2"],
  "projects": ["Project 1"],
  "key_points": ["Point 1", "Point 2"],
  "categories": ["category1", "category2"],
  "sentiment": "neutral",
  "priority": "medium",
  "summary": "Brief summary here."
}}"""

    try:
        # Call Claude API
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Extract response
        response_text = message.content[0].text

        # Try to parse JSON from response
        # Sometimes Claude wraps it in markdown code blocks
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]

        analysis = json.loads(response_text.strip())

        return analysis

    except Exception as e:
        print(f"Error calling Claude API: {e}")
        return {
            "tasks": [],
            "ideas": [],
            "projects": [],
            "key_points": [],
            "categories": ["uncategorized"],
            "sentiment": "neutral",
            "priority": "medium",
            "summary": "Error analyzing note.",
            "error": str(e)
        }


def analyze_note_complete(note_file, api_key):
    """
    Complete analysis of a note using AI and pattern matching.

    Args:
        note_file: Path to note JSON file
        api_key: Anthropic API key

    Returns:
        Fully analyzed note
    """
    print(f"\nAnalyzing: {Path(note_file).name}")
    print("=" * 60)

    # Load note
    with open(note_file, 'r') as f:
        note = json.load(f)

    print(f"Title: {note['title']}")
    print(f"Folder: {note['folder']}")
    print(f"Modified: {note['modified']}")

    # Get plain text
    plain_text = clean_html_to_text(note['content'])

    print(f"\n📊 Calling Claude API for AI analysis...")

    # AI Analysis
    ai_analysis = ai_analyze_note(note, api_key)

    # Extract additional data with patterns
    dates = extract_dates(plain_text)
    contacts = extract_contacts(plain_text)

    # Combine all analysis
    complete_analysis = {
        **ai_analysis,
        'dates_found': dates,
        'contacts': contacts,
        'attachments': {
            'images': note['extracted_data']['images'],
            'image_count': note['extracted_data']['image_count']
        },
        'links_categorized': categorize_links(note['extracted_data']['links']),
        'link_count': note['extracted_data']['link_count'],
        'plain_text_preview': plain_text[:1000]
    }

    # Print results
    print(f"\n✅ Analysis Complete!")
    print("-" * 60)
    print(f"📋 Tasks: {len(complete_analysis['tasks'])}")
    print(f"💡 Ideas: {len(complete_analysis['ideas'])}")
    print(f"🎯 Projects: {len(complete_analysis['projects'])}")
    print(f"📝 Key Points: {len(complete_analysis['key_points'])}")
    print(f"🔗 Links: {complete_analysis['link_count']}")
    print(f"📅 Dates Found: {len(dates)}")
    print(f"👤 Contacts: {len(contacts['emails'])} emails, {len(contacts['phones'])} phones")
    print(f"🖼️  Images: {complete_analysis['attachments']['image_count']}")
    print(f"🏷️  Categories: {', '.join(complete_analysis['categories'])}")
    print(f"😊 Sentiment: {complete_analysis['sentiment']}")
    print(f"⚡ Priority: {complete_analysis['priority']}")
    print(f"\n📄 Summary: {complete_analysis['summary']}")

    # Update note
    note['ai_analysis'] = complete_analysis
    note['analyzed_at'] = datetime.now().isoformat()
    note['analyzed_by'] = 'claude-3-5-sonnet-20241022'
    note['status'] = 'analyzed'
    note['processed'] = True

    # Determine primary category
    note['primary_category'] = determine_primary_category(complete_analysis)

    # Save analyzed note
    output_file = Path(note_file).parent / f"ai_analyzed_{Path(note_file).name}"
    with open(output_file, 'w') as f:
        json.dump(note, f, indent=2)

    print(f"\n💾 Saved to: {output_file.name}")

    return note


def categorize_links(links):
    """Categorize links by type."""
    categorized = {
        'youtube': [],
        'github': [],
        'social_media': [],
        'documentation': [],
        'other': []
    }

    for link in links:
        if 'youtube.com' in link or 'youtu.be' in link:
            categorized['youtube'].append(link)
        elif 'github.com' in link:
            categorized['github'].append(link)
        elif any(site in link for site in ['instagram.com', 'facebook.com', 'twitter.com', 'tiktok.com', 'linkedin.com']):
            categorized['social_media'].append(link)
        elif any(word in link for word in ['docs.', 'documentation', 'wiki', 'readme']):
            categorized['documentation'].append(link)
        else:
            categorized['other'].append(link)

    return categorized


def determine_primary_category(analysis):
    """Determine primary category based on analysis."""
    scores = {
        'tasks': len(analysis['tasks']) * 2,
        'projects': len(analysis['projects']) * 3,
        'ideas': len(analysis['ideas']) * 1.5,
        'reference': len(analysis['key_points']),
        'links': analysis['link_count'] * 0.5
    }

    if not any(scores.values()):
        return 'note'

    return max(scores, key=scores.get)


def main():
    """Main execution function."""
    # Check for API key
    api_key = os.getenv('ANTHROPIC_API_KEY')

    if not api_key:
        print("=" * 60)
        print("⚠️  ANTHROPIC_API_KEY not found!")
        print("=" * 60)
        print("\nTo use AI analysis, you need to:")
        print("1. Get an API key from: https://console.anthropic.com/")
        print("2. Set it as an environment variable:")
        print("   export ANTHROPIC_API_KEY='your-key-here'")
        print("\nOr run with:")
        print("   ANTHROPIC_API_KEY='your-key' python3 ai_analyze_note.py")
        return

    print("=" * 60)
    print("🤖 AI-Powered Note Analyzer")
    print("Using: Claude 3.5 Sonnet")
    print("=" * 60)

    # Test with first note
    note_file = 'individual_notes/note_0001_www.karavan.net.json'

    result = analyze_note_complete(note_file, api_key)

    print("\n" + "=" * 60)
    print("✅ Test analysis complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
