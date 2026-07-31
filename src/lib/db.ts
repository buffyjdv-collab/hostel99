import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const NEON_URL = 'postgresql://neondb_owner:npg_zQ8nyKWVPoM2@ep-dry-lake-ayve30xa-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'

// Ensure we use the correct Neon PostgreSQL URL
// Reject any SQLite or invalid URLs that might be in .env
function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL
  if (envUrl && envUrl.startsWith('postgresql://')) {
    return envUrl
  }
  // Fallback to Neon URL if env var is missing or points to SQLite
  return NEON_URL
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
