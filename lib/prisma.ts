import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import * as path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient;

if (!globalForPrisma.prisma) {
  const dbPath = path.join(process.cwd(), 'dev.db')
  const adapter = new PrismaLibSql({
    url: `file:${dbPath}`,
  })

  prismaInstance = new PrismaClient({ adapter })
  globalForPrisma.prisma = prismaInstance
} else {
  prismaInstance = globalForPrisma.prisma
}

export const prisma = prismaInstance
