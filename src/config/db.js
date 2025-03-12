import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

let prisma;

const isTestEnvironment =
  process.env.NODE_ENV === "test" ||
  process.env.NODE_OPTIONS?.includes("--experimental-vm-modules");

if (isTestEnvironment) {
  prisma = new PrismaClient();
} else if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const adapter = new PrismaLibSQL(libsql);
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

export default prisma;
