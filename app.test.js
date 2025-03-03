import request from "supertest";
import app from "./app";

describe("Url Shortener API Tests", () => {
  it("should shorten a url and redirect", async () => {
    let shortCode;
    const longUrl = "https://example.com";

    const shortenRouteResponse = await request(app)
      .post("/shorten")
      .send({ original_url: longUrl })
      .set("Accept", "application/json");

    expect(shortenRouteResponse.status).toBe(201);
    expect(shortenRouteResponse.body.short_code).toBeDefined();
    shortCode = shortenRouteResponse.body.short_code;

    const redirectRouteResponse = await request(app).get(
      `/redirect?code=${shortCode}`
    );

    expect(redirectRouteResponse.status).toBe(302);
    expect(redirectRouteResponse.headers.location).toBe(longUrl);
  });
});
