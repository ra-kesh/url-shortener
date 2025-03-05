import http from "k6/http";
import { check } from "k6";
import { generateRandomUrl } from "./src/util.js";

// const baseUrl = `https://url-shortener-y95b.onrender.com`;
const baseUrl = `http://localhost:3000`;

export let options = {
  scenarios: {
    shared_iterations_scenario: {
      executor: "shared-iterations",
      vus: 10,
      iterations: 10,
    },
  },
};

export default function () {
  let originalUrl = generateRandomUrl();
  let shortenRouteResponse = http.post(
    `${baseUrl}/shorten`,
    JSON.stringify({ original_url: originalUrl }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(shortenRouteResponse, {
    "status is 201": (r) => r.status === 201,
    "short_code is defined": (r) => r.json().short_code !== undefined,
  });

  let shortCode = shortenRouteResponse.json().short_code;
  // In load_test.js, modify the http.get call:
  let redirectRouteResponse = http.get(
    `${baseUrl}/redirect?code=${shortCode}`,
    { redirects: 0 } // Prevent following redirects
  );

  check(redirectRouteResponse, {
    "status is 302": (r) => r.status === 302,
    "location header is correct": (r) => r.headers.Location === originalUrl,
  });
}
