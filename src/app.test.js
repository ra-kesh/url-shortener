import request from "supertest";
import app from "./app.js";
import { generateRandomUrl } from "./util.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.url.deleteMany({});
  await prisma.user.deleteMany({});
});

describe("Url Shortener API Tests", () => {
  it("should shorten a url and redirect", async () => {
    const originalUrl = generateRandomUrl();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set("Accept", "application/json");

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();
    const shortCode = shortenRouteResponse.body.short_code;

    const redirectRouteResponse = await request(app).get(
      `/redirect?code=${shortCode}`
    );

    expect(redirectRouteResponse.status).toBe(302);
    expect(redirectRouteResponse.headers.location).toBe(originalUrl);
  });

  it("should link short code to owner if api key is provided", async () => {
    const originalUrl = generateRandomUrl();

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    const userCount = await prisma.user.count();
    expect(userCount).toBe(1);

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(201);
    const shortCode = shortenRouteResponse.body.short_code;
    expect(shortCode).toBeDefined();

    const url = await prisma.url.findUnique({
      where: {
        shortCode: shortCode,
      },
    });

    expect(url).toBeDefined();
    expect(url).not.toBeNull();
    expect(url.userId).toBe(testUser.id);
  });

  it("should return 404 for non-existent short code", async () => {
    const response = await request(app).get("/redirect?code=nonexistent");
    expect(response.status).toBe(404);
  });

  it("should return 400 for missing original URL", async () => {
    const response = await request(app).post("/shorten").send({});
    expect(response.status).toBe(400);
  });

  it("should delete a short code successfully", async () => {
    const originalUrl = generateRandomUrl();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set("Accept", "application/json");

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();

    const shortCode = shortenRouteResponse.body.short_code;
    const deleteRouteResponse = await request(app).delete(
      `/delete?code=${shortCode}`
    );
    expect(deleteRouteResponse.status).toBe(204);

    const redirectRouteResponse = await request(app).get(
      `/redirect?code=${shortCode}`
    );
    expect(redirectRouteResponse.status).toBe(404);
  });

  it("should return 403 for unauthorized delete request", async () => {
    const originalUrl = generateRandomUrl();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set("Accept", "application/json");
    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();

    const shortCode = shortenRouteResponse.body.short_code;
    const deleteRouteResponse = await request(app)
      .delete(`/delete?code=${shortCode}`)
      .set("Authorization", "Bearer invalid-api-key");
    expect(deleteRouteResponse.status).toBe(403);
    expect(deleteRouteResponse.body.error).toBe(
      "You do not have permission to delete this URL"
    );
    expect(deleteRouteResponse.body).toBeDefined();
  });

  it("should not redirect for expired short code", async () => {
    const originalUrl = generateRandomUrl();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({
        original_url: originalUrl,
        expiry_date: new Date().toISOString(),
      })
      .set("Accept", "application/json");

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();
    const shortCode = shortenRouteResponse.body.short_code;
    const redirectRouteResponse = await request(app).get(
      `/redirect?code=${shortCode}`
    );
    expect(redirectRouteResponse.status).toBe(410);
    expect(redirectRouteResponse.text).toBe("URL has expired");
  });

  it("should batch shorten multiple URLs", async () => {
    const originalUrls = [generateRandomUrl(), generateRandomUrl()];

    const shortenRouteResponse = await request(app)
      .post("/batch-shorten")
      .send({ urls: originalUrls.map((url) => ({ original_url: url })) })
      .set("Accept", "application/json");

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.urls).toBeDefined();
    expect(shortenRouteResponse.body.urls.length).toBe(2);
    expect(shortenRouteResponse.body.urls[0].short_code).toBeDefined();
    expect(shortenRouteResponse.body.urls[1].short_code).toBeDefined();
    expect(shortenRouteResponse.body.urls[0].original_url).toBe(
      originalUrls[0]
    );
    expect(shortenRouteResponse.body.urls[1].original_url).toBe(
      originalUrls[1]
    );
    expect(shortenRouteResponse.body.urls[0].short_code).not.toBe(
      shortenRouteResponse.body.urls[1].short_code
    );
    expect(shortenRouteResponse.body.urls[0].short_code).not.toBe(
      originalUrls[0]
    );
    expect(shortenRouteResponse.body.urls[1].short_code).not.toBe(
      originalUrls[1]
    );

    const url1 = await prisma.url.findUnique({
      where: {
        shortCode: shortenRouteResponse.body.urls[0].short_code,
      },
    });
    expect(url1).toBeDefined();
    expect(url1.originalUrl).toBe(originalUrls[0]);
    expect(url1.shortCode).toBe(shortenRouteResponse.body.urls[0].short_code);

    const url2 = await prisma.url.findUnique({
      where: {
        shortCode: shortenRouteResponse.body.urls[1].short_code,
      },
    });
    expect(url2).toBeDefined();
    expect(url2.originalUrl).toBe(originalUrls[1]);
    expect(url2.shortCode).toBe(shortenRouteResponse.body.urls[1].short_code);
  });

  it("should handle invalid urls in batch shorten request", async () => {
    const originalUrls = [generateRandomUrl(), "invalid-url"];
    const shortenRouteResponse = await request(app)
      .post("/batch-shorten")
      .send({ urls: originalUrls.map((url) => ({ original_url: url })) })
      .set("Accept", "application/json");
    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.urls).toBeDefined();
    expect(shortenRouteResponse.body.urls.length).toBe(2);
    expect(shortenRouteResponse.body.urls[0].short_code).toBeDefined();
    expect(shortenRouteResponse.body.urls[1].error).toBeDefined();
  });

  it("should handle empty urls in batch shorten request", async () => {
    const urls = [
      { original_url: "" },
      { original_url: null },
      { original_url: "https://google.com" },
    ];
    const shortenRouteResponse = await request(app)
      .post("/batch-shorten")
      .send({ urls: urls })
      .set("Accept", "application/json");
    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.urls).toBeDefined();
    expect(shortenRouteResponse.body.urls.length).toBe(3);
    expect(shortenRouteResponse.body.urls[0].error).toBeDefined();
    expect(shortenRouteResponse.body.urls[1].error).toBeDefined();
    expect(shortenRouteResponse.body.urls[2].short_code).toBeDefined();
  });
});
