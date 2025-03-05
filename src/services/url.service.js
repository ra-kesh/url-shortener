import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Initialize Prisma client based on environment variables
let prisma;

// Debug environment variables
console.log('DEBUG - Environment Variables:');
console.log(`TURSO_DATABASE_URL: ${process.env.TURSO_DATABASE_URL ? 'Defined' : 'Undefined'}`);
console.log(`TURSO_AUTH_TOKEN: ${process.env.TURSO_AUTH_TOKEN ? 'Defined' : 'Undefined'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`Is this a test run: ${process.env.NODE_OPTIONS?.includes('--experimental-vm-modules') ? 'Yes' : 'No'}`);

// Force direct Prisma client for testing
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.NODE_OPTIONS?.includes('--experimental-vm-modules');
if (isTestEnvironment) {
  console.log('FORCED: Using direct Prisma client for testing environment');
  prisma = new PrismaClient();
} 
// Check if Turso environment variables are set and we're not in test mode
else if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // Use Turso adapter when environment variables are available
  console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
  console.log('TURSO_AUTH_TOKEN length:', process.env.TURSO_AUTH_TOKEN?.length);
  
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  const adapter = new PrismaLibSQL(libsql);
  prisma = new PrismaClient({ adapter });
  console.log("Using Turso database connection");
} else {
  // Use direct Prisma client with local SQLite database when env vars are not set
  prisma = new PrismaClient();
  console.log("Using local SQLite database connection");
}

export class UrlService {
  static generateShortCode() {
    return crypto.randomBytes(3).toString("hex");
  }

  static async findByOriginalUrl(originalUrl) {
    return await prisma.url.findUnique({
      where: {
        originalUrl: originalUrl,
      },
    });
  }

  static async findByShortCode(shortCode) {
    return await prisma.url.findUnique({
      where: {
        shortCode: shortCode,
      },
    });
  }

  static async create(originalUrl, userId = null) {
    const shortCode = this.generateShortCode();
    return await prisma.url.create({
      data: {
        originalUrl: originalUrl,
        shortCode: shortCode,
        userId: userId,
      },
    });
  }

  static async delete(shortCode) {
    return await prisma.url.delete({
      where: {
        shortCode: shortCode,
      },
    });
  }

  static async updateClickCount(shortCode) {
    return await prisma.url.update({
      where: {
        shortCode: shortCode,
      },
      data: {
        clickCount: {
          increment: 1,
        },
        lastClicked: new Date(),
      },
    });
  }

  static async findUserByApiKey(apiKey) {
    console.log('Finding user by API key:', apiKey);
    const user = await prisma.user.findUnique({
      where: {
        apiKey: apiKey,
      },
    });
    console.log('User lookup by API key result:', user ? 'User found' : 'No user found');
    console.log('User details:', JSON.stringify(user, null, 2));
    return user;
  }
}
