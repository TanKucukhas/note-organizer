// Core note type matching SQLite schema
export interface Note {
  note_id: string;
  original_index: number;
  title: string;
  content: string;
  content_cleaned: string | null;
  plain_text: string | null;
  folder: string;
  account: string;
  coredata_id: string | null;
  created_raw: string;
  created_datetime: string | null;
  modified_raw: string;
  modified_datetime: string | null;
  status: 'pending' | 'processing' | 'analyzed' | 'failed';
  processed: number; // SQLite boolean (0 or 1)
  primary_category: Category | null;
  content_length: number | null;
  created_at: string;
  updated_at: string;
}

// Category types
export type Category =
  | 'task'
  | 'project'
  | 'idea'
  | 'bookmark'
  | 'reference'
  | 'contact'
  | 'note';

// Extracted link
export interface ExtractedLink {
  link_id: number;
  note_id: string;
  url: string;
  link_type: LinkType | null;
  created_at: string;
}

export type LinkType =
  | 'youtube'
  | 'github'
  | 'social_media'
  | 'documentation'
  | 'other';

// Extracted image
export interface ExtractedImage {
  image_id: number;
  note_id: string;
  filename: string;
  relative_path: string;
  image_format: string | null;
  size_bytes: number | null;
  extraction_order: number | null;
  created_at: string;
}

// Analysis result
export interface Analysis {
  analysis_id: number;
  note_id: string;
  summary: string | null;
  plain_text_sample: string | null;
  analyzed_at: string;
}

// Extracted task
export interface ExtractedTask {
  task_id: number;
  note_id: string;
  task_text: string;
  priority: number | null;
  completed: number; // SQLite boolean (0 or 1)
  due_date: string | null;
  created_at: string;
}

// Extracted idea
export interface ExtractedIdea {
  idea_id: number;
  note_id: string;
  idea_text: string;
  status: 'new' | 'exploring' | 'developing' | 'shelved';
  created_at: string;
}

// Extracted project
export interface ExtractedProject {
  project_id: number;
  note_id: string;
  project_name: string;
  status: string | null;
  created_at: string;
}

// Note category
export interface NoteCategory {
  category_id: number;
  note_id: string;
  category: string;
  created_at: string;
}

// Account lookup
export interface Account {
  account_id: number;
  account_name: string;
  note_count: number;
  created_at: string;
}

// Folder lookup
export interface Folder {
  folder_id: number;
  folder_name: string;
  account_name: string;
  note_count: number;
  created_at: string;
}

// Enriched note with related data
export interface NoteWithDetails extends Note {
  links?: ExtractedLink[];
  images?: ExtractedImage[];
  tasks?: ExtractedTask[];
  ideas?: ExtractedIdea[];
  projects?: ExtractedProject[];
  categories?: NoteCategory[];
  analysis?: Analysis | null;
}

// AI categorization suggestion
export interface CategorizationSuggestion {
  note_id: string;
  suggested_category: Category;
  confidence: number; // 0-100
  reasoning: string;
  extracted_tasks: string[];
  extracted_ideas: string[];
  extracted_projects: string[];
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  priority?: 'high' | 'medium' | 'low';
  keywords?: string[];
}

// Filter options for querying notes
export interface NoteFilters {
  category?: Category | Category[];
  folder?: string | string[];
  account?: string | string[];
  status?: Note['status'] | Note['status'][];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasLinks?: boolean;
  hasImages?: boolean;
  hasTasks?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'created_datetime' | 'modified_datetime' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Database statistics
export interface DatabaseStats {
  total_notes: number;
  total_links: number;
  total_images: number;
  total_tasks: number;
  total_ideas: number;
  total_projects: number;
  total_categories: number;
  date_ranges: {
    earliest_created: string | null;
    latest_created: string | null;
    earliest_modified: string | null;
    latest_modified: string | null;
  };
  accounts: Record<string, number>;
  top_folders: Record<string, number>;
  top_categories: Record<string, number>;
  primary_categories: Record<string, number>;
}

// Timeline data point
export interface TimelineDataPoint {
  date: string;
  count: number;
  category?: Category;
}
