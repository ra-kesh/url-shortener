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

    console.log("Created test user:", {
      id: testUser.id,
      name: testUser.name,
      email: testUser.email,
      apiKey: testUser.apiKey,
    });

    const userCount = await prisma.user.count();
    console.log("User count after creation:", userCount);
    expect(userCount).toBe(1);

    // Verify we can find the user by API key directly
    const foundUser = await prisma.user.findUnique({
      where: { apiKey: "test-api-key" },
    });
    console.log(
      "User found by API key directly:",
      foundUser
        ? { id: foundUser.id, name: foundUser.name, apiKey: foundUser.apiKey }
        : "Not found"
    );

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    console.log("API response status:", shortenRouteResponse.status);
    console.log("API response body:", shortenRouteResponse.body);

    expect(shortenRouteResponse.status).toBe(201);
    const shortCode = shortenRouteResponse.body.short_code;
    expect(shortCode).toBeDefined();
    console.log("Extracted shortCode:", shortCode);

    const url = await prisma.url.findUnique({
      where: {
        shortCode: shortCode,
      },
    });

    console.log("URL retrieved from database:", url);

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
});
