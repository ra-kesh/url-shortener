import request from "supertest";
import app from "./app.js";
import { generateRandomUrl } from "./util.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Setup and teardown hooks
beforeAll(async () => {
  // Connect to the database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from the database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up the database before each test
  await prisma.url.deleteMany({});
});

describe("Url Shortener API Tests", () => {
  it("should shorten a url and redirect", async () => {
    let shortCode;
    const originalUrl = generateRandomUrl();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set("Accept", "application/json");

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();
    shortCode = shortenRouteResponse.body.short_code;

    const redirectRouteResponse = await request(app).get(
      `/redirect?code=${shortCode}`
    );

    expect(redirectRouteResponse.status).toBe(302);
    expect(redirectRouteResponse.headers.location).toBe(originalUrl);
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
