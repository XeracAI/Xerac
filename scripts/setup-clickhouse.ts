import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@clickhouse/client';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function setupClickhouse() {
  // Check if Clickhouse is enabled
  if (process.env.CLICKHOUSE_ENABLED !== 'true') {
    console.error('Clickhouse is not enabled. Set CLICKHOUSE_ENABLED=true in .env.local to proceed.');
    process.exit(1);
  }

  // Create Clickhouse client
  const client = createClient({
    host: process.env.CLICKHOUSE_HOSTS || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    request_timeout: parseInt(process.env.CLICKHOUSE_TIMEOUT || '100000'),
  });

  try {
    console.log('Connecting to Clickhouse...');

    // Test connection
    const pingResult = await client.ping();
    if (!pingResult.success) {
      throw new Error('Failed to connect to Clickhouse');
    }
    console.log('Successfully connected to Clickhouse');

    // Read schema file
    console.log('Reading schema file...');
    const schemaSQL = readFileSync(resolve(process.cwd(), 'lib/clickhouse-schema.sql'), 'utf8');

    // Split the schema into individual statements
    // This splits on semicolons but ignores those within comments
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    console.log('Creating schema...');
    for (const statement of statements) {
      try {
        await client.exec({
          query: statement,
          clickhouse_settings: {
            wait_end_of_query: 1
          }
        });

        // Extract table name from CREATE TABLE statement for logging
        const tableMatch = statement.match(/CREATE TABLE.*?IF NOT EXISTS\s+(\w+)/i);
        const viewMatch = statement.match(/CREATE.*?MATERIALIZED VIEW.*?IF NOT EXISTS\s+(\w+)/i);
        const name = tableMatch?.[1] || viewMatch?.[1] || 'unknown';

        console.log(`✓ Successfully executed: ${name}`);
      } catch (error) {
        console.error(`Error executing statement:\n${statement}\n\nError:`, error);
        throw error;
      }
    }

    console.log('\nSchema creation completed successfully!');

    // Verify tables were created
    const result = await client.query({
      query: `
        SELECT name, engine
        FROM system.tables
        WHERE database = currentDatabase()
        ORDER BY name;
      `,
      format: 'JSONEachRow'
    });

    const rows = await result.json();

    console.log('\nCreated tables and views:');
    for (const row of rows) {
      console.log(`- ${(row as { name: string; engine: string }).name} (${(row as { name: string; engine: string }).engine})`);
    }
  } catch (error) {
    console.error('Error setting up Clickhouse:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the setup
setupClickhouse().catch(console.error);
