# Form AI Prompt Generator - Usage Guide

## Overview

This utility generates AI-friendly prompts for form filling. When a user copies the prompt, they can paste it into any AI assistant (ChatGPT, Claude, Gemini, Groq) along with their idea, and the AI will respond with properly formatted JSON.

## Architecture

### Core Files

1. **`lib/form-prompt-generator.ts`** - Core utility functions
   - `generateFormPrompt()` - Generates the AI prompt
   - `copyToClipboard()` - Copies text to clipboard
   - `normalizeAiResponse()` - Parses AI JSON responses (handles code blocks)
   - `fillFormFromAiResponse()` - Auto-fills form from JSON

2. **`components/copy-form-prompt-button.tsx`** - Reusable UI component
   - Displays copy icon
   - Shows "Copied!" confirmation
   - Handles clipboard operations

## Usage

### Step 1: Define Form Configuration

```typescript
import { useMemo } from 'react';
import type { FormPromptConfig } from '@/lib/form-prompt-generator';

// Inside your component
const formPromptConfig: FormPromptConfig = useMemo(() => ({
  formType: 'Project',  // Name of the entity
  fields: [
    {
      name: 'projectTitle',      // JSON key name
      label: 'Project Title',     // Human-readable label
      type: 'text',               // Field type
      maxLength: 100,             // Character limit
      required: true,             // Is required?
    },
    {
      name: 'oneLineIntro',
      label: 'One Line Intro',
      type: 'textarea',
      maxLength: 200,
    },
    {
      name: 'projectTypes',
      label: 'Project Types',
      type: 'multiselect',
      options: projectTypes.map(type => ({
        value: type.id,
        label: type.name
      })),
    },
    {
      name: 'fullDescription',
      label: 'Full Description',
      type: 'textarea',
      maxLength: 5000,
    },
  ],
}), [projectTypes]); // Dependencies
```

### Step 2: Add Button to UI

```typescript
import { CopyFormPromptButton } from '@/components/copy-form-prompt-button';

// In your JSX
<div className="flex items-center justify-between">
  <h4 className="text-sm font-medium text-muted-foreground">
    Create New Project
  </h4>
  <CopyFormPromptButton config={formPromptConfig} />
</div>
```

### Step 3: (Optional) Add Context

You can pass additional context that will be appended to the prompt:

```typescript
<CopyFormPromptButton
  config={formPromptConfig}
  userContext="Build a YouTube analytics tool"
/>
```

## Field Types

### `text` - Single-line text input
```typescript
{
  name: 'title',
  label: 'Title',
  type: 'text',
  maxLength: 100,
  required: true,
}
```

### `textarea` - Multi-line text input
```typescript
{
  name: 'description',
  label: 'Description',
  type: 'textarea',
  maxLength: 5000,
}
```

### `select` - Single select dropdown
```typescript
{
  name: 'priority',
  label: 'Priority',
  type: 'select',
  options: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ],
}
```

### `multiselect` - Multiple selection
```typescript
{
  name: 'tags',
  label: 'Tags',
  type: 'multiselect',
  options: tags.map(tag => ({ value: tag.id, label: tag.name })),
}
```

Multiselect automatically generates a `new{FieldName}` field for new values:
- `projectTypes` → `newProjectTypes`
- `tags` → `newTags`

### `array` - List of strings
```typescript
{
  name: 'linkedItems',
  label: 'Linked Items',
  type: 'array',
}
```

## Generated Prompt Example

For the Project form, the generated prompt looks like:

```
You are helping me fill a web form. Follow these rules exactly:

1. Always answer ONLY with JSON inside a single fenced code block. Use this format exactly:
```json
{
  "projectTitle": "...",
  "oneLineIntro": "...",
  "projectTypes": [],
  "newProjectTypes": [],
  "fullDescription": "..."
}
```

2. Do not add any text before or after the code block. No explanation, no commentary. Only the JSON code block.

3. Constraints:
   * "projectTitle": max 100 characters
   * "oneLineIntro": max 200 characters
   * "fullDescription": max 5000 characters

4. For "projectTypes" use only these values when relevant:
   * "Game", "Real Estate", "Fun", "Youtube Channel", "Self Productivity", "Self Improvement"
If you need an extra Project Types not in that list, put it in "newProjectTypes" as strings.

Now, based on this idea, fill the JSON:

[User's idea goes here]
```

## AI Response Handling

The utility can normalize responses from different AI models:

### ChatGPT/Groq Response
```json
{
  "projectTitle": "cresIQ Local-First Creator Studio",
  "oneLineIntro": "A local-first AI-powered YouTube creator studio",
  "projectTypes": ["Web Application", "Youtube Channel"],
  "newProjectTypes": ["Creator Tool"],
  "fullDescription": "..."
}
```

### Claude Response (with code block)
```
```json
{
  "projectTitle": "cresIQ - Local-First YouTube Creator Studio",
  ...
}
```
```

Both formats are automatically handled by `normalizeAiResponse()`.

## Adding to Other Forms

### Idea Form Example
```typescript
const ideaFormConfig: FormPromptConfig = useMemo(() => ({
  formType: 'Idea',
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      maxLength: 100,
      required: true,
    },
    {
      name: 'intro',
      label: 'Intro',
      type: 'text',
      maxLength: 200,
    },
    {
      name: 'ideaType',
      label: 'Idea Type',
      type: 'select',
      options: projectTypes.map(type => ({ value: type.id, label: type.name })),
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      maxLength: 5000,
    },
  ],
}), [projectTypes]);
```

### Task Form Example
```typescript
const taskFormConfig: FormPromptConfig = useMemo(() => ({
  formType: 'Task',
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      maxLength: 100,
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      maxLength: 500,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    {
      name: 'dueDate',
      label: 'Due Date',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
    },
  ],
}), []);
```

## Future Enhancements

1. **Auto-fill from AI response** - Paste AI JSON and auto-populate form
2. **Template library** - Save common prompts for reuse
3. **Multi-language support** - Generate prompts in different languages
4. **Validation rules** - Add regex patterns, min/max values
5. **Conditional fields** - Show/hide fields based on other values

## Best Practices

1. **Use useMemo** - Wrap config in `useMemo` to avoid re-renders
2. **Dynamic options** - Update config when select options change
3. **Clear labels** - Use descriptive JSON field names
4. **Consistent naming** - Follow camelCase convention
5. **Document constraints** - Always include maxLength for text fields
