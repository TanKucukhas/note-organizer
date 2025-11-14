#!/usr/bin/env python3
"""
AI-powered note analyzer - Test single note analysis.
Categorizes content into: tasks, ideas, projects, links, and notes.
"""

import json
import re
from pathlib import Path


def clean_html_to_text(html_content):
    """Convert HTML to plain text for analysis."""
    # Remove script and style elements
    text = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html_content, flags=re.DOTALL)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '\n', html_content)
    # Decode HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&quot;', '"').replace('&#39;', "'").replace('&nbsp;', ' ')
    # Clean up whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r' +', ' ', text)
    return text.strip()


def analyze_tasks(text):
    """Extract tasks and action items from text."""
    tasks = []

    # Pattern 1: TODO, TO-DO, etc.
    todo_pattern = r'(?:TODO|TO-DO|To Do|to do|ToDo)[\s:]*([^\n]+)'
    matches = re.findall(todo_pattern, text, re.IGNORECASE)
    tasks.extend([m.strip() for m in matches if m.strip()])

    # Pattern 2: Checkbox items (- [ ], * [ ])
    checkbox_pattern = r'[-*]\s*\[\s*\]\s*([^\n]+)'
    matches = re.findall(checkbox_pattern, text)
    tasks.extend([m.strip() for m in matches if m.strip()])

    # Pattern 3: Action verbs at start of lines
    action_verbs = ['call', 'email', 'send', 'buy', 'create', 'build', 'fix', 'update',
                    'contact', 'schedule', 'book', 'order', 'cancel', 'transfer', 'decide']
    for verb in action_verbs:
        pattern = rf'^[-*•]?\s*{verb}\s+([^\n]+)'
        matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
        tasks.extend([f"{verb.capitalize()} {m.strip()}" for m in matches if m.strip()])

    # Pattern 4: Lines with "need to", "have to", "must"
    obligation_pattern = r'(?:need to|have to|must|should)\s+([^\n.!?]+)'
    matches = re.findall(obligation_pattern, text, re.IGNORECASE)
    tasks.extend([m.strip() for m in matches if m.strip() and len(m.strip()) > 10])

    return list(set(tasks))[:20]  # Limit to 20 unique tasks


def analyze_ideas(text):
    """Extract ideas and concepts from text."""
    ideas = []

    # Pattern 1: "Idea:" prefix
    idea_pattern = r'(?:Idea|IDEA|Concept)[\s:]*([^\n]+)'
    matches = re.findall(idea_pattern, text)
    ideas.extend([m.strip() for m in matches if m.strip()])

    # Pattern 2: Question marks (often indicate exploratory ideas)
    question_pattern = r'([^\n.!?]*\?)'
    matches = re.findall(question_pattern, text)
    ideas.extend([m.strip() for m in matches if len(m.strip()) > 20])

    # Pattern 3: Creative/planning language
    creative_pattern = r'(?:what if|imagine|could|might|consider|explore)\s+([^\n.!?]+)'
    matches = re.findall(creative_pattern, text, re.IGNORECASE)
    ideas.extend([m.strip() for m in matches if m.strip() and len(m.strip()) > 10])

    return list(set(ideas))[:15]  # Limit to 15 unique ideas


def analyze_projects(text):
    """Extract project references from text."""
    projects = []

    # Pattern 1: "Project:" prefix
    project_pattern = r'(?:Project|PROJECT)[\s:]*([^\n]+)'
    matches = re.findall(project_pattern, text)
    projects.extend([m.strip() for m in matches if m.strip()])

    # Pattern 2: Multi-step initiatives (numbered lists)
    numbered_list = r'(?:\d+[\.)]\s+[^\n]+\n?)+'
    matches = re.findall(numbered_list, text)
    if len(matches) > 2:  # If there are multiple numbered lists
        projects.append(f"Multi-step plan found ({len(matches)} items)")

    # Pattern 3: Business/product names (capitalized multi-word phrases)
    business_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b'
    matches = re.findall(business_pattern, text)
    # Filter for likely project names (appears multiple times)
    from collections import Counter
    counted = Counter(matches)
    projects.extend([name for name, count in counted.items() if count >= 2][:5])

    return list(set(projects))[:10]  # Limit to 10 unique projects


def categorize_links(links):
    """Categorize links by type."""
    categorized = {
        'youtube': [],
        'social_media': [],
        'documentation': [],
        'other': []
    }

    for link in links:
        if 'youtube.com' in link or 'youtu.be' in link:
            categorized['youtube'].append(link)
        elif any(site in link for site in ['instagram.com', 'facebook.com', 'twitter.com', 'tiktok.com']):
            categorized['social_media'].append(link)
        elif any(site in link for site in ['github.com', 'docs.', 'documentation']):
            categorized['documentation'].append(link)
        else:
            categorized['other'].append(link)

    return categorized


def generate_summary(text, max_length=200):
    """Generate a brief summary of the note content."""
    # Get first meaningful sentences
    sentences = re.split(r'[.!?]\s+', text)
    summary = ""
    for sentence in sentences:
        if len(sentence.strip()) > 20:  # Skip very short sentences
            if len(summary + sentence) < max_length:
                summary += sentence + ". "
            else:
                break
    return summary.strip() or text[:max_length] + "..."


def analyze_note(note_file):
    """
    Analyze a single note file and extract structured data.

    Args:
        note_file: Path to the note JSON file

    Returns:
        Analysis results
    """
    print(f"Analyzing: {note_file}")
    print("=" * 60)

    # Load note
    with open(note_file, 'r') as f:
        note = json.load(f)

    # Extract plain text
    plain_text = clean_html_to_text(note['content'])

    print(f"\nNote: {note['title']}")
    print(f"Created: {note['created']}")
    print(f"Modified: {note['modified']}")
    print(f"Folder: {note['folder']}")

    # Perform analysis
    print("\n" + "-" * 60)
    print("ANALYSIS RESULTS:")
    print("-" * 60)

    # Tasks
    tasks = analyze_tasks(plain_text)
    print(f"\n📋 TASKS FOUND: {len(tasks)}")
    for i, task in enumerate(tasks, 1):
        print(f"  {i}. {task[:100]}")

    # Ideas
    ideas = analyze_ideas(plain_text)
    print(f"\n💡 IDEAS FOUND: {len(ideas)}")
    for i, idea in enumerate(ideas, 1):
        print(f"  {i}. {idea[:100]}")

    # Projects
    projects = analyze_projects(plain_text)
    print(f"\n🎯 PROJECTS FOUND: {len(projects)}")
    for i, project in enumerate(projects, 1):
        print(f"  {i}. {project[:100]}")

    # Links
    links = note['extracted_data']['links']
    categorized_links = categorize_links(links)
    print(f"\n🔗 LINKS FOUND: {len(links)}")
    for category, link_list in categorized_links.items():
        if link_list:
            print(f"  {category}: {len(link_list)} links")

    # Generate summary
    summary = generate_summary(plain_text)
    print(f"\n📝 SUMMARY:")
    print(f"  {summary}")

    # Update note with analysis
    note['analysis'] = {
        'tasks': tasks,
        'ideas': ideas,
        'projects': projects,
        'links_categorized': categorized_links,
        'summary': summary,
        'plain_text': plain_text[:1000]  # First 1000 chars for reference
    }

    # Determine primary category
    if len(tasks) > 3:
        note['primary_category'] = 'tasks'
    elif len(projects) > 2:
        note['primary_category'] = 'projects'
    elif len(ideas) > 3:
        note['primary_category'] = 'ideas'
    elif len(links) > 5:
        note['primary_category'] = 'links'
    else:
        note['primary_category'] = 'note'

    print(f"\n🏷️  PRIMARY CATEGORY: {note['primary_category'].upper()}")

    # Save analyzed note
    output_file = Path(note_file).parent / f"analyzed_{Path(note_file).name}"
    with open(output_file, 'w') as f:
        json.dump(note, f, indent=2)

    print(f"\n✅ Analysis saved to: {output_file}")

    return note


def main():
    """Main execution function."""
    # Test with first note
    note_file = 'individual_notes/note_0001_www.karavan.net.json'

    print("=" * 60)
    print("AI Note Analyzer - Test Run")
    print("=" * 60)

    result = analyze_note(note_file)

    print("\n" + "=" * 60)
    print("Test completed successfully!")
    print("=" * 60)


if __name__ == '__main__':
    main()
