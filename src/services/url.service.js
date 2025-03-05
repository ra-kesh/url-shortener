import crypto from "node:crypto";
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

export class UrlService {
  static generateShortCode() {
    return crypto.randomBytes(3).toString("hex");
  }

  static extractApiKey(headers) {
    const apiKey = headers.authorization || headers["api-key"];
    return apiKey?.startsWith("Bearer ") ? apiKey.split(" ")[1] : apiKey;
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

  static async create(
    originalUrl,
    userId = null,
    expiry_date = null,
    custom_code = null
  ) {
    let shortCode;
    if (custom_code) {
      const isCustomCodeTaken = await this.findByShortCode(custom_code);
      if (isCustomCodeTaken) {
        throw new Error("Custom code is already taken");
      }

      shortCode = custom_code;
    } else {
      shortCode = this.generateShortCode();
    }

    const urlData = {
      originalUrl: originalUrl,
      shortCode: shortCode,
      userId: userId,
    };

    if (expiry_date) {
      urlData.expiresAt = new Date(expiry_date);
    }

    return await prisma.url.create({
      data: urlData,
    });
  }

  static async delete(shortCode) {
    return await prisma.url.update({
      where: {
        shortCode: shortCode,
      },
      data: {
        deletedAt: new Date(),
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
