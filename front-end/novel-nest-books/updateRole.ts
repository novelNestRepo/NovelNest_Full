import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  await db.update(users).set({ role: 'owner' }).where(eq(users.email, 'youssef.ali9966@gmail.com'));
  console.log("Updated youssef.ali9966@gmail.com to owner.");
  process.exit(0);
}
main().catch(console.error);
