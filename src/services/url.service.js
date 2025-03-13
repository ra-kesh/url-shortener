import crypto from "node:crypto";
import prisma from "../config/db.js";

export class UrlService {
  static async checkConnection() {
    return await prisma.$queryRaw`SELECT 1`;
  }

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
        deletedAt: null,
      },
    });
  }

  static async findByShortCode(shortCode) {
    return await prisma.url.findUnique({
      where: {
        shortCode: shortCode,
        deletedAt: null,
      },
    });
  }

  static async create(
    originalUrl,
    userId = null,
    expiry_date = null,
    custom_code = null,
    password = null
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

    if (password) {
      urlData.password = password;
    }

    return await prisma.url.create({
      data: urlData,
    });
  }

  static async update(shortCode, updateData) {
    return await prisma.url.update({
      where: {
        shortCode: shortCode,
        deletedAt: null,
      },
      data: updateData,
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

  static async findUrlsbyUserId(userId, offset, limit, sortBy, sortOrder) {
    const urls = await prisma.url.findMany({
      skip: offset,
      take: limit,
      where: {
        userId: userId,
        deletedAt: null,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
    return urls;
  }

  static async countUrlsByUserId(userId) {
    const count = await prisma.url.count({
      where: {
        userId: userId,
        deletedAt: null,
      },
    });
    return count;
  }
}
