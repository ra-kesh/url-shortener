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
    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    const userCount = await prisma.user.count();
    expect(userCount).toBe(1);

    const response = await request(app).post("/shorten").send({}).set({
      Authorization: "Bearer test-api-key",
      Accept: "application/json",
    });
    expect(response.status).toBe(400);
  });

  it("should delete a short code successfully", async () => {
    const originalUrl = generateRandomUrl();

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();

    const shortCode = shortenRouteResponse.body.short_code;
    const deleteRouteResponse = await request(app)
      .delete(`/delete?code=${shortCode}`)
      .set("Authorization", "Bearer test-api-key");
    expect(deleteRouteResponse.status).toBe(204);

    const redirectRouteResponse = await request(app).get(
      `/redirect?code=${shortCode}`
    );
    expect(redirectRouteResponse.status).toBe(404);
  });

  it("should return 401 for unauthorized delete request", async () => {
    const originalUrl = generateRandomUrl();

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();

    const shortCode = shortenRouteResponse.body.short_code;
    const deleteRouteResponse = await request(app)
      .delete(`/delete?code=${shortCode}`)
      .set("Authorization", "Bearer invalid-api-key");
    expect(deleteRouteResponse.status).toBe(401);
  });

  it("should not redirect for expired short code", async () => {
    const originalUrl = generateRandomUrl();

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({
        original_url: originalUrl,
        expiry_date: new Date().toISOString(),
      })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();
    const shortCode = shortenRouteResponse.body.short_code;
    const redirectRouteResponse = await request(app).get(
      `/redirect?code=${shortCode}`
    );
    expect(redirectRouteResponse.status).toBe(410);
    expect(redirectRouteResponse.text).toBe("URL has expired");
  });

  it("should create a url with custom code", async () => {
    const originalUrl = generateRandomUrl();
    const customCode = "customcode";

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl, custom_code: customCode })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBe(customCode);
  });

  it("should return 500 for invalid custom code", async () => {
    const originalUrl = generateRandomUrl();
    const customCode = "taken-code";

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();

    await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl, custom_code: customCode })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl, custom_code: customCode })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(500);
    expect(shortenRouteResponse.body.error).toBe(
      "Custom code is already taken"
    );
  });

  it("should batch shorten multiple URLs only for enterprise users", async () => {
    const originalUrls = [generateRandomUrl(), generateRandomUrl()];

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
        tier: "enterprise",
      },
    });
    expect(testUser).toBeDefined();
    expect(testUser.tier).toBe("enterprise");
    expect(testUser.apiKey).toBe("test-api-key");
    expect(testUser.email).toBe("test@example.com");

    const userCount = await prisma.user.count();
    expect(userCount).toBe(1);
    expect(testUser.name).toBe("Test User");
    expect(testUser.createdAt).toBeDefined();

    const shortenRouteResponse = await request(app)
      .post("/batch-shorten")
      .send({ urls: originalUrls.map((url) => ({ original_url: url })) })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

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
    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
        tier: "enterprise",
      },
    });
    expect(testUser).toBeDefined();
    expect(testUser.tier).toBe("enterprise");
    expect(testUser.apiKey).toBe("test-api-key");

    const shortenRouteResponse = await request(app)
      .post("/batch-shorten")
      .send({ urls: originalUrls.map((url) => ({ original_url: url })) })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

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

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
        tier: "enterprise",
      },
    });

    expect(testUser).toBeDefined();
    expect(testUser.tier).toBe("enterprise");
    expect(testUser.apiKey).toBe("test-api-key");

    const shortenRouteResponse = await request(app)
      .post("/batch-shorten")
      .send({ urls: urls })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });
    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.urls).toBeDefined();
    expect(shortenRouteResponse.body.urls.length).toBe(3);
    expect(shortenRouteResponse.body.urls[0].error).toBeDefined();
    expect(shortenRouteResponse.body.urls[1].error).toBeDefined();
    expect(shortenRouteResponse.body.urls[2].short_code).toBeDefined();
  });

  it("should return 403 for non-enterprise users trying to batch shorten", async () => {
    const originalUrls = [generateRandomUrl(), generateRandomUrl()];

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
        tier: "hobby",
      },
    });

    expect(testUser).toBeDefined();
    expect(testUser.tier).toBe("hobby");
    expect(testUser.apiKey).toBe("test-api-key");

    const shortenRouteResponse = await request(app)
      .post("/batch-shorten")
      .send({ urls: originalUrls.map((url) => ({ original_url: url })) })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(403);
  });
  it("should list urls for enterprise users", async () => {
    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
        tier: "enterprise",
      },
    });

    expect(testUser).toBeDefined();
    expect(testUser.apiKey).toBe("test-api-key");
    expect(testUser.tier).toBe("enterprise");

    await request(app)
      .post("/shorten")
      .send({ original_url: generateRandomUrl() })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    const urlsRouteResponse = await request(app).get("/urls").set({
      Authorization: "Bearer test-api-key",
      Accept: "application/json",
    });

    expect(urlsRouteResponse.status).toBe(200);
    expect(urlsRouteResponse.body.urls).toBeDefined();
    expect(urlsRouteResponse.body.urls.length).toBe(1);
  });
});

describe("Url Shortner update api tests", () => {
  it("should update a url if short code is provided and user is owner", async () => {
    const originalUrl = generateRandomUrl();
    const newOriginalUrl = generateRandomUrl();

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();
    expect(testUser.apiKey).toBe("test-api-key");

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();
    const shortCode = shortenRouteResponse.body.short_code;
    expect(shortCode).toBeDefined();

    const updateRouteResponse = await request(app)
      .put("/update")
      .send({ short_code: shortCode, original_url: newOriginalUrl })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(updateRouteResponse.status).toBe(200);
    expect(updateRouteResponse.body.message).toBe("URL updated successfully");

    const url = await prisma.url.findUnique({
      where: {
        shortCode: shortCode,
      },
    });
    expect(url).toBeDefined();
    expect(url.originalUrl).toBe(newOriginalUrl);
  });

  it("should return 404 if short code is not found", async () => {
    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();
    expect(testUser.apiKey).toBe("test-api-key");

    const updateRouteResponse = await request(app)
      .put("/update")
      .send({ short_code: "nonexistent", original_url: "https://example.com" })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(updateRouteResponse.status).toBe(404);
  });

  it("should return 403 if user is not owner of the url", async () => {
    const originalUrl = generateRandomUrl();

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();
    expect(testUser.apiKey).toBe("test-api-key");

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();

    const shortCode = shortenRouteResponse.body.short_code;

    const updateRouteResponse = await request(app)
      .put("/update")
      .send({ short_code: shortCode, original_url: "https://example.com" })
      .set({
        Authorization: "Bearer invalid-api-key",
        Accept: "application/json",
      });

    expect(updateRouteResponse.status).toBe(401);
  });
});

describe("Url shortener passsword tests", () => {
  it("should require password for protected short code", async () => {
    const originalUrl = generateRandomUrl();

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl, password: "password" })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();
    const shortCode = shortenRouteResponse.body.short_code;
    const redirectRouteResponse = await request(app).get(
      `/redirect?code=${shortCode}`
    );
    expect(redirectRouteResponse.status).toBe(401);
    expect(redirectRouteResponse.text).toBe("Password required");
  });

  it("should not redirect for incorrect password", async () => {
    const originalUrl = generateRandomUrl();
    const password = "password";

    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        apiKey: "test-api-key",
      },
    });

    expect(testUser).toBeDefined();

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: originalUrl, password: password })
      .set({
        Authorization: "Bearer test-api-key",
        Accept: "application/json",
      });

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();
    const shortCode = shortenRouteResponse.body.short_code;
    const redirectRouteResponse = await request(app).get(
      `/redirect?code=${shortCode}&password=wrongpassword`
    );
    expect(redirectRouteResponse.status).toBe(403);
    expect(redirectRouteResponse.text).toBe("Invalid password");
  });
});
