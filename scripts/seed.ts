import { config } from 'dotenv';
import { seedDatabase } from '@/lib/db/seeds/data';
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import dbConnect from "@/lib/db/connect";

// Load environment variables
config({
  path: '.env.local',
});

const runSeed = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  console.log('⏳ Running database seeding...');

  const start = Date.now();

  // Connect to database
  const client = postgres(process.env.POSTGRES_URL!, { max: 1 });
  const db = drizzle(client);

  // Connect to MongoDB
  await dbConnect();

  try {
    await seedDatabase(db);
    const end = Date.now();
    console.log('✅ Database seeding completed in', end - start, 'ms');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed');
    console.error(error);
    process.exit(1);
  } finally {
    // Close the database connections
    await client.end();
    await mongoose.disconnect();
  }
};

runSeed();
