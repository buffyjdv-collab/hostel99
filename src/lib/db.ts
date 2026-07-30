import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure we use the correct DATABASE_URL - prefer the Neon PostgreSQL URL
// over any system-level env var that might point to an old SQLite DB
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_zQ8nyKWVPoM2@ep-dry-lake-ayve30xa-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
