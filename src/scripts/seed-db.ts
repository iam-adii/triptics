import { supabase } from '../integrations/supabase/client';
import fs from 'fs';
import path from 'path';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Read the SQL file
    const sqlFile = path.join(__dirname, '../db/seed.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      
      // Use raw query execution
      const { error } = await supabase.auth.admin.executeRawQuery(statement);
      
      if (error) {
        throw error;
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase(); 