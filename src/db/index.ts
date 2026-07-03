import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error("Falta la variable DATABASE_URL en el archivo .env");
}

// Conectamos a Neon usando el driver serverless
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });