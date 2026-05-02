import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['warn', 'error'], // ← removed 'query' and 'info'
}).$extends(withAccelerate());

export default prisma;