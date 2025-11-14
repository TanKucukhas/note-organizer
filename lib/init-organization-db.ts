import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'organization.db');
const SCHEMA_PATH = path.join(__dirname, 'schema-organization.sql');

export function initializeOrganizationDatabase(): Database.Database {
  console.log('Initializing organization.db...');

  // Create or open database
  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Performance optimizations
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  // Read schema file
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');

  // Execute entire schema at once
  try {
    db.exec(schema);
  } catch (error) {
    console.error('Error executing schema:', error);
    throw error;
  }

  console.log('✓ organization.db initialized successfully');

  return db;
}

// Run if called directly
if (require.main === module) {
  initializeOrganizationDatabase();
}
