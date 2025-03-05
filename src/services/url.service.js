import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

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
    const user = await prisma.user.findUnique({
      where: {
        apiKey: apiKey,
      },
    });
    return user;
  }
}
