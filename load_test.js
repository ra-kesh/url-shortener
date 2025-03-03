import http from "k6/http";
import { check } from "k6";
import { generateRandomUrl } from "./util";

export let options = {
  scenarios: {
    shared_iterations_scenario: {
      executor: "shared-iterations",
      vus: 200,
      iterations: 200,
      //   maxDuration: "30s",
    },
  },
};

export default function () {
  let originalUrl = generateRandomUrl();
  let shortenRouteResponse = http.post(
    "http://localhost:3000/shorten",
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
    `http://localhost:3000/redirect?code=${shortCode}`,
    { redirects: 0 } // Prevent following redirects
  );

  check(redirectRouteResponse, {
    "status is 302": (r) => r.status === 302,
    "location header is correct": (r) => r.headers.Location === originalUrl,
  });
}
