// Utility for generating AI prompts from form configurations

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'array';
  maxLength?: number;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

export interface FormPromptConfig {
  formType: string;
  fields: FormField[];
  additionalInstructions?: string;
}

/**
 * Generate a JSON schema example from form fields
 */
function generateJsonSchema(fields: FormField[]): string {
  const schema: Record<string, any> = {};

  fields.forEach(field => {
    switch (field.type) {
      case 'multiselect':
        schema[field.name] = [];
        break;
      case 'array':
        schema[field.name] = [];
        break;
      default:
        schema[field.name] = '...';
    }
  });

  return JSON.stringify(schema, null, 2);
}

/**
 * Generate constraints section for the prompt
 */
function generateConstraints(fields: FormField[]): string {
  const constraints: string[] = [];

  fields.forEach(field => {
    if (field.maxLength) {
      constraints.push(`   * "${field.name}": max ${field.maxLength} characters`);
    }
  });

  return constraints.length > 0 ? constraints.join('\n') : '';
}

/**
 * Generate options section for select/multiselect fields
 */
function generateOptions(fields: FormField[]): string {
  const sections: string[] = [];

  fields.forEach(field => {
    if ((field.type === 'select' || field.type === 'multiselect') && field.options && field.options.length > 0) {
      const optionsList = field.options.map(opt => `"${opt.label}"`).join(', ');
      sections.push(`For "${field.name}" use only these values when relevant:\n   * ${optionsList}`);

      if (field.type === 'multiselect') {
        sections.push(`If you need an extra ${field.label.toLowerCase()} not in that list, put it in "new${field.name.charAt(0).toUpperCase() + field.name.slice(1)}" as strings.`);
      }
    }
  });

  return sections.length > 0 ? sections.join('\n') : '';
}

/**
 * Generate the complete AI prompt from form configuration
 */
export function generateFormPrompt(config: FormPromptConfig, userContext: string = ''): string {
  const { formType, fields, additionalInstructions } = config;

  const jsonSchema = generateJsonSchema(fields);
  const constraints = generateConstraints(fields);
  const options = generateOptions(fields);

  let prompt = `You are helping me fill a web form. Follow these rules exactly:

1. Always answer ONLY with JSON inside a single fenced code block. Use this format exactly:
\`\`\`json
${jsonSchema}
\`\`\`

2. Do not add any text before or after the code block. No explanation, no commentary. Only the JSON code block.
`;

  if (constraints) {
    prompt += `\n3. Constraints:\n${constraints}\n`;
  }

  if (options) {
    prompt += `\n4. ${options}\n`;
  }

  if (additionalInstructions) {
    prompt += `\n${additionalInstructions}\n`;
  }

  prompt += `\nNow, based on this idea, fill the JSON:\n\n${userContext}`;

  return prompt;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Normalize AI response (handle different formats from different AI models)
 */
export function normalizeAiResponse(response: string): any {
  try {
    // Try to extract JSON from code block
    const codeBlockMatch = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }

    // Try direct JSON parse
    return JSON.parse(response);
  } catch (err) {
    console.error('Failed to parse AI response:', err);
    return null;
  }
}

/**
 * Fill form from normalized AI response
 */
export function fillFormFromAiResponse(
  response: any,
  fieldMapping: Record<string, (value: any) => void>
): void {
  if (!response) return;

  Object.entries(response).forEach(([key, value]) => {
    const setter = fieldMapping[key];
    if (setter && value !== undefined && value !== null) {
      setter(value);
    }
  });
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: any;
}

/**
 * Parse and validate AI response
 */
export function parseAndValidateAiResponse(
  response: string,
  config: FormPromptConfig
): ValidationResult {
  const errors: ValidationError[] = [];

  // Step 1: Strip markdown fences
  let cleanedResponse = response.trim();

  // Remove ```json and ``` fences
  const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    cleanedResponse = codeBlockMatch[1].trim();
  }

  // Step 2: Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(cleanedResponse);
  } catch (err) {
    return {
      valid: false,
      errors: [{
        field: '_parse',
        message: 'Invalid JSON. Make sure the AI output is exactly like the example, inside a single ```json code block.'
      }]
    };
  }

  // Step 3: Validate each field
  config.fields.forEach(field => {
    const value = parsed[field.name];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: field.name,
        message: `${field.label} is required`
      });
      return;
    }

    // Skip validation if value is not present and not required
    if (value === undefined || value === null) {
      return;
    }

    // Validate character limits for text fields
    if ((field.type === 'text' || field.type === 'textarea') && field.maxLength) {
      const textValue = String(value);
      if (textValue.length > field.maxLength) {
        errors.push({
          field: field.name,
          message: `${field.label} exceeds ${field.maxLength} characters (found ${textValue.length})`
        });
      }
    }

    // Validate arrays
    if (field.type === 'multiselect' || field.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push({
          field: field.name,
          message: `${field.label} must be an array`
        });
        return;
      }

      // For multiselect, validate options
      if (field.type === 'multiselect' && field.options) {
        const validValues = field.options.map(opt => opt.label);
        const invalidValues = value.filter((v: string) => !validValues.includes(v));

        if (invalidValues.length > 0) {
          // Move invalid values to new{FieldName} field
          const newFieldName = `new${field.name.charAt(0).toUpperCase()}${field.name.slice(1)}`;

          if (!parsed[newFieldName]) {
            parsed[newFieldName] = [];
          }

          parsed[newFieldName] = [...parsed[newFieldName], ...invalidValues];
          parsed[field.name] = value.filter((v: string) => validValues.includes(v));

          // This is a warning, not an error
          console.log(`Moved unknown ${field.label} to ${newFieldName}:`, invalidValues);
        }
      }
    }

    // Validate select (single value)
    if (field.type === 'select' && field.options && value) {
      const validValues = field.options.map(opt => opt.value);
      if (!validValues.includes(value)) {
        errors.push({
          field: field.name,
          message: `${field.label} has invalid value: "${value}". Must be one of: ${validValues.join(', ')}`
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    data: parsed
  };
}
